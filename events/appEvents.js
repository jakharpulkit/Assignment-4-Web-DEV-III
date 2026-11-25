const EventEmitter = require('events');

class AppEvents extends EventEmitter {}
const appEvents = new AppEvents();

appEvents.on('user:registered', ({ email }) => {
  console.log('[event] user registered:', email);
});
appEvents.on('note:created', ({ noteId, ownerId }) => {
  console.log('[event] note created:', noteId, 'by', ownerId);
});
appEvents.on('chat:message', ({ username, message }) => {
  console.log('[event] chat message from', username + ':', message);
});

module.exports = appEvents;
