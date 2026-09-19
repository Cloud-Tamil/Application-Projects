'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
const winston = require('winston');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

const SERVICES = {
  auth:  process.env.AUTH_SERVICE_URL  || 'http://auth-service:3001',
  user:  process.env.USER_SERVICE_URL  || 'http://user-service:3002',
  order: process.env.ORDER_SERVICE_URL || 'http://order-service:3003',
};

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
app.use(cors({ origin: '*', credentials: true }));
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// Auth middleware for protected routes
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ---------- Health & Info ----------
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'api-gateway', timestamp: new Date().toISOString() });
});

app.get('/', (_req, res) => {
  res.json({
    service: 'ShopSphere API Gateway',
    version: '1.0.0',
    endpoints: {
      auth:   '/api/auth/*',
      users:  '/api/users/*',
      orders: '/api/orders/*',
    },
  });
});

// ---------- Proxy Helpers ----------
function makeProxy(target, pathRewrite = {}) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite,
    onProxyReq: (proxyReq, req) => {
      if (req.user) {
        proxyReq.setHeader('x-user-id', req.user.sub || req.user.id || '');
        proxyReq.setHeader('x-user-email', req.user.email || '');
        proxyReq.setHeader('x-user-role', req.user.role || 'user');
      }
      proxyReq.setHeader('x-request-id', req.headers['x-request-id'] || crypto.randomUUID());
    },
    onError: (err, _req, res) => {
      logger.error('Proxy error', { error: err.message, target });
      res.status(502).json({ error: 'Upstream service unavailable' });
    },
  });
}

// ---------- Routes ----------
// Auth: /api/auth/* -> auth-service/*
app.use('/api/auth', makeProxy(SERVICES.auth, { '^/api/auth': '' }));

// Users: /api/users/* -> user-service/* (protected)
app.use('/api/users', authenticate, makeProxy(SERVICES.user, { '^/api/users': '' }));

// Orders: /api/orders/* -> order-service/* (protected)
app.use('/api/orders', authenticate, makeProxy(SERVICES.order, { '^/api/orders': '' }));

// ---------- 404 ----------
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

// ---------- Error handler ----------
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  logger.error('Unhandled error', { error: err.message });
  res.status(500).json({ error: 'Internal server error' });
});

// ---------- Start ----------
const server = app.listen(PORT, () => {
  logger.info(`API Gateway listening on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => process.exit(0));
});

module.exports = app;
