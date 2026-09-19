'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const winston = require('winston');

const app = express();
const PORT = process.env.PORT || 3003;
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
const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    name:      { type: String, required: true },
    price:     { type: Number, required: true, min: 0 },
    quantity:  { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, index: true },
    userId:      { type: String, required: true, index: true },
    items:       { type: [orderItemSchema], validate: v => Array.isArray(v) && v.length > 0 },
    subtotal:    { type: Number, required: true, min: 0 },
    tax:         { type: Number, default: 0, min: 0 },
    shipping:    { type: Number, default: 0, min: 0 },
    total:       { type: Number, required: true, min: 0 },
    currency:    { type: String, default: 'INR' },
    status:      {
      type: String,
      enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'pending',
      index: true,
    },
    paymentMethod: { type: String, default: 'cod' },
    shippingAddress: {
      line1: String, line2: String, city: String,
      state: String, postal: String, country: String,
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

orderSchema.pre('validate', function (next) {
  if (!this.orderNumber) {
    this.orderNumber = 'SS-' + Date.now().toString(36).toUpperCase() + '-' + uuidv4().slice(0, 6).toUpperCase();
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);

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
    service: 'order-service',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// POST / — create order
app.post(
  '/',
  requireUser,
  [
    body('items').isArray({ min: 1 }).withMessage('items[] required'),
    body('items.*.productId').notEmpty(),
    body('items.*.name').notEmpty(),
    body('items.*.price').isFloat({ min: 0 }),
    body('items.*.quantity').isInt({ min: 1 }),
    body('currency').optional().isString().isLength({ min: 3, max: 3 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { items, currency = 'INR', paymentMethod = 'cod', shippingAddress = {}, notes = '' } = req.body;
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const tax = +(subtotal * 0.18).toFixed(2);       // 18% GST example
    const shipping = subtotal > 500 ? 0 : 49;         // free shipping above 500
    const total = +(subtotal + tax + shipping).toFixed(2);

    try {
      const order = await Order.create({
        userId: req.userId,
        items, subtotal, tax, shipping, total, currency,
        paymentMethod, shippingAddress, notes,
      });
      logger.info('Order created', { orderId: order._id, orderNumber: order.orderNumber, userId: req.userId });
      res.status(201).json({ order });
    } catch (err) {
      logger.error('Create order failed', { error: err.message });
      res.status(500).json({ error: 'Failed to create order' });
    }
  }
);

// GET /me — my orders
app.get('/me', requireUser, async (req, res) => {
  const orders = await Order.find({ userId: req.userId }).sort({ createdAt: -1 }).lean();
  res.json({ count: orders.length, orders });
});

// GET /:id — single order (must belong to user)
app.get('/:id', requireUser, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid order id' });
  }
  const order = await Order.findOne({ _id: req.params.id, userId: req.userId }).lean();
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ order });
});

// PATCH /:id/cancel
app.patch('/:id/cancel', requireUser, async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, userId: req.userId });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (!['pending', 'paid'].includes(order.status)) {
    return res.status(400).json({ error: `Cannot cancel order in status ${order.status}` });
  }
  order.status = 'cancelled';
  await order.save();
  res.json({ order });
});

// PATCH /:id/status (admin — trusted via gateway)
app.patch(
  '/:id/status',
  [body('status').isIn(['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'])],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ order });
  }
);

// GET / — admin list all
app.get('/', async (_req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 }).limit(500).lean();
  res.json({ count: orders.length, orders });
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
    app.listen(PORT, () => logger.info(`Order service listening on port ${PORT}`));
  } catch (err) {
    logger.error('Failed to start', { error: err.message });
    process.exit(1);
  }
}

if (require.main === module) start();

module.exports = app;
