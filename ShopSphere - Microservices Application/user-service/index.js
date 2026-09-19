'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const { body, param, validationResult } = require('express-validator');
const winston = require('winston');

const app = express();
const PORT = process.env.PORT || 3002;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/shopsphere';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '1mb' }));

// ---------- Model ----------
const addressSchema = new mongoose.Schema(
  {
    label:   { type: String, default: 'Home' },
    line1:   { type: String, required: true },
    line2:   String,
    city:    { type: String, required: true },
    state:   String,
    postal:  { type: String, required: true },
    country: { type: String, required: true, default: 'IN' },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const profileSchema = new mongoose.Schema(
  {
    userId:    { type: String, required: true, unique: true, index: true },
    email:     { type: String, required: true },
    name:      { type: String, required: true },
    phone:     { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    addresses: [addressSchema],
    preferences: {
      newsletter: { type: Boolean, default: true },
      language:   { type: String, default: 'en' },
    },
  },
  { timestamps: true }
);

const Profile = mongoose.model('Profile', profileSchema);

// ---------- Middleware ----------
function requireUser(req, res, next) {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  req.userId = userId;
  next();
}

// ---------- Routes ----------
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'user-service',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// GET /me
app.get('/me', requireUser, async (req, res) => {
  let profile = await Profile.findOne({ userId: req.userId });
  if (!profile) {
    // Auto-create profile on first access
    profile = await Profile.create({
      userId: req.userId,
      email: req.headers['x-user-email'] || '',
      name: req.headers['x-user-email'] ? req.headers['x-user-email'].split('@')[0] : 'User',
    });
  }
  res.json({ profile });
});

// PUT /me
app.put(
  '/me',
  requireUser,
  [
    body('name').optional().trim().notEmpty(),
    body('phone').optional().isString(),
    body('avatarUrl').optional().isURL(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const allowed = ['name', 'phone', 'avatarUrl', 'preferences'];
    const update = {};
    for (const k of allowed) if (k in req.body) update[k] = req.body[k];

    const profile = await Profile.findOneAndUpdate(
      { userId: req.userId },
      { $set: update },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json({ profile });
  }
);

// GET /:userId (admin or self; we trust gateway)
app.get('/:userId', async (req, res) => {
  const profile = await Profile.findOne({ userId: req.params.userId }).lean();
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  res.json({ profile });
});

// POST /me/addresses
app.post(
  '/me/addresses',
  requireUser,
  [
    body('line1').trim().notEmpty(),
    body('city').trim().notEmpty(),
    body('postal').trim().notEmpty(),
    body('country').trim().notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const profile = await Profile.findOneAndUpdate(
      { userId: req.userId },
      { $setOnInsert: { email: req.headers['x-user-email'] || '', name: 'User' } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    if (req.body.isDefault) {
      profile.addresses.forEach((a) => (a.isDefault = false));
    }
    profile.addresses.push(req.body);
    await profile.save();
    res.status(201).json({ profile });
  }
);

// DELETE /me/addresses/:addressId
app.delete('/me/addresses/:addressId', requireUser, async (req, res) => {
  const profile = await Profile.findOne({ userId: req.userId });
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  profile.addresses = profile.addresses.filter(
    (a) => a._id.toString() !== req.params.addressId
  );
  await profile.save();
  res.json({ profile });
});

// GET / (admin — list all)
app.get('/', async (_req, res) => {
  const profiles = await Profile.find().lean();
  res.json({ count: profiles.length, profiles });
});

// ---------- 404 & Errors ----------
app.use((req, res) => res.status(404).json({ error: 'Route not found', path: req.originalUrl }));
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  logger.error('Unhandled error', { error: err.message });
  res.status(500).json({ error: 'Internal server error' });
});

// ---------- Bootstrap ----------
async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    logger.info('Connected to MongoDB');
    app.listen(PORT, () => logger.info(`User service listening on port ${PORT}`));
  } catch (err) {
    logger.error('Failed to start', { error: err.message });
    process.exit(1);
  }
}

if (require.main === module) start();

module.exports = app;
