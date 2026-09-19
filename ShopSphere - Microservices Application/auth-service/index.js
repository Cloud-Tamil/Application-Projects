'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const winston = require('winston');

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/shopsphere';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// ---------- Logger ----------
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

// ---------- Middleware ----------
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '1mb' }));

// ---------- Mongoose Model ----------
const userSchema = new mongoose.Schema(
  {
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true, select: false },
    name:     { type: String, required: true, trim: true },
    role:     { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

const User = mongoose.model('User', userSchema);

// ---------- Helpers ----------
function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// ---------- Routes ----------
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'auth-service',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// POST /register
app.post(
  '/register',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
    body('name').trim().notEmpty().withMessage('Name required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password, name } = req.body;
    try {
      const existing = await User.findOne({ email });
      if (existing) return res.status(409).json({ error: 'Email already registered' });

      const user = await User.create({ email, password, name });
      const token = signToken(user);

      logger.info('User registered', { userId: user._id, email });
      res.status(201).json({
        message: 'Registration successful',
        token,
        user: { id: user._id, email: user.email, name: user.name, role: user.role },
      });
    } catch (err) {
      logger.error('Register failed', { error: err.message });
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

// POST /login
app.post(
  '/login',
  [
    body('email').isEmail(),
    body('password').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email }).select('+password');
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });

      const ok = await user.comparePassword(password);
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

      const token = signToken(user);
      logger.info('User logged in', { userId: user._id });
      res.json({
        message: 'Login successful',
        token,
        user: { id: user._id, email: user.email, name: user.name, role: user.role },
      });
    } catch (err) {
      logger.error('Login failed', { error: err.message });
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

// POST /verify
app.post('/verify', (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token required' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, decoded });
  } catch (err) {
    res.status(401).json({ valid: false, error: err.message });
  }
});

// GET /me (internal — trusts x-user-id from gateway)
app.get('/me', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  const user = await User.findById(userId).lean();
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

// ---------- 404 ----------
app.use((req, res) => res.status(404).json({ error: 'Route not found', path: req.originalUrl }));

// ---------- Bootstrap ----------
async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    logger.info('Connected to MongoDB');
    app.listen(PORT, () => logger.info(`Auth service listening on port ${PORT}`));
  } catch (err) {
    logger.error('Failed to start', { error: err.message });
    process.exit(1);
  }
}

if (require.main === module) start();

module.exports = app;
