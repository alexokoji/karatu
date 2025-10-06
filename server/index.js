const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const fs = require('fs');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGIN || '*',
    methods: ["GET", "POST"],
    credentials: true,
  }
});

// CORS configuration for Render
const allowedOrigins = (process.env.ALLOWED_ORIGIN || 'https://karatu.onrender.com,http://localhost:3000,http://localhost:5173,http://localhost:5174')
  .split(',')
  .map(s => s.trim());
app.use(cors({
  origin: function(origin, callback) {
    console.log('CORS request from origin:', origin);
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.log('CORS blocked origin:', origin, 'Allowed origins:', allowedOrigins);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
const DB_PATH = (name) => path.join(DATA_DIR, `${name}.json`);

function read(name, fallback) {
  try { return JSON.parse(fs.readFileSync(DB_PATH(name), 'utf8')); } catch { return fallback; }
}
function write(name, data) {
  fs.writeFileSync(DB_PATH(name), JSON.stringify(data, null, 2));
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
}
function auth(requiredRoles = []) {
  return (req, res, next) => {
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      if (requiredRoles.length && !requiredRoles.includes(payload.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      req.user = payload;
      next();
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }
}

function getPrisma() {
  try {
    if (!global.__prisma) global.__prisma = new PrismaClient();
    return global.__prisma;
  } catch { return null }
}

app.post('/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ error: 'Missing fields' });
  if (!['student','tutor','admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  const prisma = getPrisma();
  try {
    if (prisma) {
      const exists = await prisma.user.findUnique({ where: { email } });
      if (exists) return res.status(409).json({ error: 'Email already registered' });
      const hash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({ data: { name, email, passwordHash: hash, role } });
      const token = signToken(user);
      return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    }
  } catch (e) {
    // fallback to JSON
  }
  const users = read('users', []);
  if (users.find(u => u.email === email)) return res.status(409).json({ error: 'Email already registered' });
  const hash = await bcrypt.hash(password, 10);
  const user = { id: uuid(), name, email, passwordHash: hash, role };
  users.push(user);
  write('users', users);
  const token = signToken(user);
  return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const prisma = getPrisma();
  try {
    if (prisma) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
      const token = signToken(user);
      return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    }
  } catch (e) {}
  const users = read('users', []);
  const user = users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = signToken(user);
  return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});
// Public tutors list (minimal profile for discovery)
app.get('/tutors', (req, res) => {
  const users = read('users', []);
  const tutors = users
    .filter(u => u.role === 'tutor')
    .map(u => ({
      id: u.id,
      name: u.name,
      slug: String(u.name || 'tutor-user').toLowerCase().split(' ').join('-'),
      lang: 'Yoruba',
      role: 'Tutor',
      img: 'https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop'
    }));
  res.json(tutors);
});

app.get('/auth/me', auth(), (req, res) => {
  return res.json({ user: req.user });
});

// Courses
app.get('/courses', async (req, res) => {
  const prisma = getPrisma();
  try {
    if (prisma) {
      const courses = await prisma.course.findMany({ include: { tutor: true, lessons: true } });
      return res.json(courses.map(c => ({ ...c, tutorName: c.tutor?.name })));
    }
  } catch {}
  const courses = read('courses', []);
  res.json(courses);
});
app.post('/courses', auth(['tutor','admin']), async (req, res) => {
  const prisma = getPrisma();
  try {
    if (prisma) {
      const c = await prisma.course.create({ data: { ...req.body, id: uuid() } });
      return res.json(c);
    }
  } catch {}
  const courses = read('courses', []);
  const c = { id: uuid(), ...req.body };
  courses.push(c);
  write('courses', courses);
  res.json(c);
});
app.put('/courses/:id', auth(['tutor','admin']), async (req, res) => {
  const prisma = getPrisma();
  try {
    if (prisma) {
      const c = await prisma.course.update({ where: { id: req.params.id }, data: req.body });
      return res.json(c);
    }
  } catch {}
  const courses = read('courses', []);
  const idx = courses.findIndex(c => c.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Not found' });
  courses[idx] = { ...courses[idx], ...req.body };
  write('courses', courses);
  res.json(courses[idx]);
});
app.delete('/courses/:id', auth(['tutor','admin']), async (req, res) => {
  const prisma = getPrisma();
  try {
    if (prisma) {
      await prisma.course.delete({ where: { id: req.params.id } });
      return res.status(204).send();
    }
  } catch {}
  const courses = read('courses', []);
  const next = courses.filter(c => c.id !== req.params.id);
  write('courses', next);
  res.json({ ok: true });
});
app.get('/transactions', auth(['student','tutor','admin']), (req, res) => {
  const tx = read('transactions', []);
  if (req.user.role === 'admin') return res.json(tx);
  if (req.user.role === 'student') return res.json(tx.filter(t => t.userId === req.user.id || t.userName === req.user.name));
  if (req.user.role === 'tutor') return res.json(tx.filter(t => t.tutorId === req.user.id || t.tutorName === req.user.name));
  res.json([]);
});
app.post('/transactions', auth(['student','admin']), (req, res) => {
  const tx = read('transactions', []);
  const t = { id: uuid(), date: new Date().toISOString(), ...req.body };
  tx.unshift(t);
  write('transactions', tx);
  res.json(t);
});

// Tutor schedules (per user)
app.get('/schedules', auth(['tutor','admin']), async (req, res) => {
  const prisma = getPrisma();
  try {
    if (prisma) {
      const sched = await prisma.schedule.findUnique({ where: { tutorId: req.user.id } });
      return res.json(Array.isArray(sched?.plans) ? sched.plans : (sched?.plans || []));
    }
  } catch {}
  const all = read('schedules', {});
  const list = all[req.user.id] || [];
  res.json(list);
});
app.put('/schedules', auth(['tutor','admin']), async (req, res) => {
  const prisma = getPrisma();
  const plans = Array.isArray(req.body) ? req.body : [];
  try {
    if (prisma) {
      const sched = await prisma.schedule.upsert({
        where: { tutorId: req.user.id },
        update: { plans },
        create: { tutorId: req.user.id, plans }
      });
      return res.json(Array.isArray(sched?.plans) ? sched.plans : (sched?.plans || []));
    }
  } catch {}
  const all = read('schedules', {});
  all[req.user.id] = plans;
  write('schedules', all);
  res.json(all[req.user.id]);
});

// Public read-only schedules by tutorId for students to view on tutor profile
app.get('/schedules/:tutorId', async (req, res) => {
  const prisma = getPrisma();
  try {
    if (prisma) {
      const sched = await prisma.schedule.findUnique({ where: { tutorId: req.params.tutorId } });
      return res.json(Array.isArray(sched?.plans) ? sched.plans : (sched?.plans || []));
    }
  } catch {}
  const all = read('schedules', {});
  const list = all[req.params.tutorId] || [];
  res.json(list);
});

// Ratings
app.get('/ratings/:slug', async (req, res) => {
  const prisma = getPrisma();
  try {
    if (prisma) {
      const arr = await prisma.rating.findMany({ where: { tutorSlug: req.params.slug } });
      return res.json(arr.map(r => r.value));
    }
  } catch {}
  const all = read('ratings', {});
  res.json(all[req.params.slug] || []);
});
app.post('/ratings/:slug', auth(['student','admin']), async (req, res) => {
  const prisma = getPrisma();
  try {
    if (prisma) {
      await prisma.rating.create({ data: { tutorSlug: req.params.slug, value: Number(req.body.value) || 0, userId: req.user.id } });
      const arr = await prisma.rating.findMany({ where: { tutorSlug: req.params.slug } });
      return res.json(arr.map(r => r.value));
    }
  } catch {}
  const all = read('ratings', {});
  const list = all[req.params.slug] || [];
  list.push(Number(req.body.value) || 0);
  all[req.params.slug] = list;
  write('ratings', all);
  res.json(list);
});

// Private sessions (basic: store array, filter by role/name)
app.get('/private-sessions', auth(['student','tutor','admin']), (req, res) => {
  const list = read('privateSessions', []);
  if (req.user.role === 'admin') return res.json(list);
  if (req.user.role === 'student') return res.json(list.filter(s => s.studentId === req.user.id || s.studentName === req.user.name));
  if (req.user.role === 'tutor') return res.json(list.filter(s => s.tutorId === req.user.id || s.tutorName === req.user.name));
  res.json([]);
});
app.post('/private-sessions', auth(['student','admin']), (req, res) => {
  const list = read('privateSessions', []);
  const sess = { id: uuid(), date: new Date().toISOString(), status: 'Pending', paid: false, ...req.body };
  list.unshift(sess);
  write('privateSessions', list);
  res.json(sess);
});
app.get('/private-sessions/:id', auth(['student','tutor','admin']), (req, res) => {
  const list = read('privateSessions', []);
  const session = list.find(s => s.id === req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  
  // Check if user has access to this session
  if (req.user.role === 'student' && session.studentId !== req.user.id && session.studentName !== req.user.name) {
    return res.status(403).json({ error: 'Access denied' });
  }
  if (req.user.role === 'tutor' && session.tutorId !== req.user.id && session.tutorName !== req.user.name) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  res.json(session);
});

app.put('/private-sessions/:id', auth(['student','tutor','admin']), (req, res) => {
  const list = read('privateSessions', []);
  const idx = list.findIndex(s => s.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Not found' });
  
  const session = list[idx];
  
  // Check if user has access to this session
  if (req.user.role === 'student' && session.studentId !== req.user.id && session.studentName !== req.user.name) {
    return res.status(403).json({ error: 'Access denied' });
  }
  if (req.user.role === 'tutor' && session.tutorId !== req.user.id && session.tutorName !== req.user.name) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  list[idx] = { ...list[idx], ...req.body };
  write('privateSessions', list);
  res.json(list[idx]);
});

// Promotions requests
app.get('/promotions', auth(['admin']), (req, res) => {
  const reqs = read('promotionRequests', []);
  res.json(reqs);
});
app.post('/promotions', auth(['tutor','admin']), (req, res) => {
  const reqs = read('promotionRequests', []);
  if (!reqs.includes(req.body.slug)) reqs.push(req.body.slug);
  write('promotionRequests', reqs);
  res.json(reqs);
});
app.delete('/promotions/:slug', auth(['admin']), (req, res) => {
  const reqs = read('promotionRequests', []);
  const next = reqs.filter(s => s !== req.params.slug);
  write('promotionRequests', next);
  res.json(next);
});

// Session chat persistence (very simple by sessionId)
app.get('/chats/:sessionId', (req, res) => {
  const all = read('chats', {});
  res.json(all[req.params.sessionId] || []);
});
app.post('/chats/:sessionId', (req, res) => {
  const all = read('chats', {});
  const list = all[req.params.sessionId] || [];
  const msg = { id: uuid(), date: new Date().toISOString(), ...req.body };
  list.push(msg);
  all[req.params.sessionId] = list;
  write('chats', all);
  res.json(msg);
});

// Quizzes
app.get('/quizzes', (req, res) => {
  const quizzes = read('quizzes', []);
  res.json(quizzes);
});
app.post('/quizzes', auth(['tutor','admin']), (req, res) => {
  const quizzes = read('quizzes', []);
  const q = { id: uuid(), date: new Date().toISOString(), ...req.body };
  quizzes.unshift(q);
  write('quizzes', quizzes);
  res.json(q);
});

// WebSocket signaling for video calls - Simplified like Zoom
io.on('connection', (socket) => {
  console.log('🔗 User connected:', socket.id);
  
  // Join user's personal room for call notifications
  socket.on('join-user-room', (userId) => {
    console.log(`👤 User ${socket.id} joining personal room: ${userId}`);
    socket.join(`user-${userId}`);
  });
  
  // Handle call initiation (tutor -> student)
  socket.on('initiate-call', (callData) => {
    console.log(`📞 Call initiated from ${callData.tutorId} to ${callData.studentId}`);
    socket.to(`user-${callData.studentId}`).emit('incoming-call', callData);
  });
  
  // Handle call declined by student
  socket.on('call-declined', (data) => {
    console.log(`📞 Call declined by student ${data.studentId}`);
    socket.to(`user-${data.tutorId}`).emit('call-declined', data);
  });
  
  // Handle call ended
  socket.on('end-call', (data) => {
    console.log(`📞 Call ended for session ${data.sessionId}`);
    socket.to(`user-${data.studentId}`).emit('call-ended');
    socket.to(`user-${data.tutorId}`).emit('call-ended');
  });
  
  socket.on('join-session', (sessionId) => {
    console.log(`🚪 User ${socket.id} joining session: ${sessionId}`);
    socket.join(sessionId);
    
    // Notify other users in the session
    socket.to(sessionId).emit('user-joined', socket.id);
    
    // Send current participants to the new user
    const room = io.sockets.adapter.rooms.get(sessionId);
    if (room) {
      const participants = Array.from(room).filter(id => id !== socket.id);
      socket.emit('participants', participants);
    }
  });
  
  socket.on('offer', (data) => {
    console.log(`📤 Offer from ${socket.id} to session ${data.sessionId}`);
    socket.to(data.sessionId).emit('offer', data);
  });
  
  socket.on('answer', (data) => {
    console.log(`📥 Answer from ${socket.id} to session ${data.sessionId}`);
    socket.to(data.sessionId).emit('answer', data);
  });
  
  socket.on('ice-candidate', (data) => {
    console.log(`🧊 ICE candidate from ${socket.id} to session ${data.sessionId}`);
    socket.to(data.sessionId).emit('ice-candidate', data);
  });
  
  socket.on('disconnect', () => {
    console.log('👋 User disconnected:', socket.id);
    // Notify all rooms this user was in
    socket.rooms.forEach(room => {
      socket.to(room).emit('user-left', socket.id);
    });
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`API listening on :${PORT}`));
