const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const appEvents = require('../events/appEvents');

const router = express.Router();
router.use(authenticate);

function validId(id) {
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

router.post('/', async (req, res, next) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'title and content are required' });
    }
    const note = {
      title: String(title).trim(),
      content: String(content),
      ownerId: new ObjectId(req.user.id),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = await getDB().collection('notes').insertOne(note);
    note._id = result.insertedId;
    appEvents.emit('note:created', { noteId: note._id.toString(), ownerId: req.user.id });
    res.status(201).json({ success: true, message: 'Note created', note });
  } catch (error) { next(error); }
});

router.get('/', async (req, res, next) => {
  try {
    const notes = await getDB().collection('notes')
      .find({ ownerId: new ObjectId(req.user.id) }).sort({ createdAt: -1 }).toArray();
    res.json({ success: true, count: notes.length, notes });
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = validId(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'Invalid note id' });
    const note = await getDB().collection('notes').findOne({
      _id: id, ownerId: new ObjectId(req.user.id)
    });
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    res.json({ success: true, note });
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = validId(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'Invalid note id' });
    const updates = {};
    if (req.body.title !== undefined) updates.title = String(req.body.title).trim();
    if (req.body.content !== undefined) updates.content = String(req.body.content);
    if (!Object.keys(updates).length) {
      return res.status(400).json({ success: false, message: 'Provide title or content to update' });
    }
    updates.updatedAt = new Date();
    const result = await getDB().collection('notes').findOneAndUpdate(
      { _id: id, ownerId: new ObjectId(req.user.id) },
      { $set: updates },
      { returnDocument: 'after' }
    );
    if (!result) return res.status(404).json({ success: false, message: 'Note not found' });
    res.json({ success: true, message: 'Note updated', note: result });
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = validId(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'Invalid note id' });
    const result = await getDB().collection('notes').deleteOne({
      _id: id, ownerId: new ObjectId(req.user.id)
    });
    if (!result.deletedCount) return res.status(404).json({ success: false, message: 'Note not found' });
    res.json({ success: true, message: 'Note deleted' });
  } catch (error) { next(error); }
});

module.exports = router;
