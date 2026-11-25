const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDB } = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const appEvents = require('../events/appEvents');

const router = express.Router();

function issueToken(user) {
  return jwt.sign(
    { email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { subject: user._id.toString(), expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
}

router.post('/signup', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'name, email and password are required' });
    }
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const users = getDB().collection('users');
    if (await users.findOne({ email: normalizedEmail })) {
      return res.status(409).json({ success: false, message: 'Email is already registered' });
    }
    const rounds = Math.min(14, Math.max(10, Number(process.env.BCRYPT_ROUNDS) || 12));
    const passwordHash = await bcrypt.hash(password, rounds);
    const user = {
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'user',
      createdAt: new Date()
    };
    const result = await users.insertOne(user);
    user._id = result.insertedId;
    appEvents.emit('user:registered', { email: user.email });
    const token = issueToken(user);
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) { next(error); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'email and password are required' });
    }
    const user = await getDB().collection('users').findOne({ email: String(email).trim().toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    res.json({
      success: true,
      message: 'Login successful',
      token: issueToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) { next(error); }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await getDB().collection('users').findOne(
      { email: req.user.email },
      { projection: { passwordHash: 0 } }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (error) { next(error); }
});

// RBAC demonstration: only an admin can list user accounts.
router.get('/users', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const users = await getDB().collection('users')
      .find({}, { projection: { passwordHash: 0 } }).toArray();
    res.json({ success: true, count: users.length, users });
  } catch (error) { next(error); }
});

module.exports = router;
