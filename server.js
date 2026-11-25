require('dotenv').config();
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { connectDB, closeDB } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes');
const appEvents = require('./events/appEvents');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_ORIGIN || '*', methods: ['GET', 'POST'] }
});

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Secure Connect API is running' });
});
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);

appEvents.on('chat:message', (data) => {
  io.emit('chat:message', data);
});

io.use((socket, next) => {
  const token = socket.handshake.auth && socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication token required'));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
});

io.on('connection', (socket) => {
  console.log('[socket] connected:', socket.user.email);
  socket.emit('chat:ready', { message: 'Connected to Secure Connect chat' });
  socket.on('chat:message', (payload = {}) => {
    const message = typeof payload.message === 'string' ? payload.message.trim() : '';
    if (!message || message.length > 1000) {
      return socket.emit('chat:error', { message: 'Message must contain 1–1000 characters' });
    }
    const data = {
      username: socket.user.email,
      userId: socket.user.id,
      message,
      sentAt: new Date().toISOString()
    };
    appEvents.emit('chat:message', data);
  });
  socket.on('disconnect', (reason) => {
    console.log('[socket] disconnected:', socket.user.email, reason);
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});
app.use((error, req, res, next) => {
  console.error(error);
  if (error.code === 11000) {
    return res.status(409).json({ success: false, message: 'A record with this value already exists' });
  }
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const PORT = Number(process.env.PORT) || 5000;
async function start() {
  try {
    await connectDB();
    server.listen(PORT, () => console.log('Server listening at http://localhost:' + PORT));
  } catch (error) {
    console.error('Startup failed:', error.message);
    process.exit(1);
  }
}
async function shutdown() {
  server.close(async () => {
    await closeDB();
    process.exit(0);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();
