const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

function splitEnvList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeOrigin(origin) {
  return String(origin || '').replace(/\/$/, '');
}

const configuredOrigins = [
  process.env.FRONTEND_URL,
  process.env.APP_URL,
  ...splitEnvList(process.env.CORS_ORIGIN),
  ...splitEnvList(process.env.CORS_ORIGINS),
  ...splitEnvList(process.env.FRONTEND_URLS),
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]
  .map(normalizeOrigin)
  .filter(Boolean);

const allowVercelPreviews = process.env.ALLOW_VERCEL_PREVIEWS !== 'false';
const allowNetlifyPreviews = process.env.ALLOW_NETLIFY_PREVIEWS === 'true';

function isAllowedOrigin(origin) {
  if (!origin) return true;

  const normalizedOrigin = normalizeOrigin(origin);

  if (configuredOrigins.includes(normalizedOrigin)) return true;

  try {
    const url = new URL(normalizedOrigin);

    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return true;

    if (allowVercelPreviews && url.protocol === 'https:' && url.hostname.endsWith('.vercel.app')) {
      return true;
    }

    if (allowNetlifyPreviews && url.protocol === 'https:' && url.hostname.endsWith('.netlify.app')) {
      return true;
    }
  } catch (error) {
    return false;
  }

  return false;
}

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    console.warn(`Blocked CORS request from origin: ${origin}`);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 204,
};

// CORS must run before all routes. This also supports Vercel preview URLs.
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Friendly API landing routes.
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Truck & Vehicle Business Management API is running.',
    health: '/api/health',
  });
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Truck & Vehicle Business Management API root.',
    health: '/api/health',
    auth: '/api/auth',
  });
});

// Health check.
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin || null,
  });
});

// Route used to verify browser CORS from Vercel/frontends.
app.get('/api/cors-check', (req, res) => {
  res.json({
    success: true,
    message: 'CORS is working for this origin.',
    origin: req.headers.origin || null,
    configuredOrigins,
    allowVercelPreviews,
  });
});

// Routes.
app.use('/api/auth', require('./routes/auth'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/drivers', require('./routes/drivers'));
app.use('/api/trips', require('./routes/trips'));
app.use('/api/income', require('./routes/income'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/owners', require('./routes/owners'));
app.use('/api/users', require('./routes/users'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/system', require('./routes/system'));

// Error handling middleware.
app.use((err, req, res, next) => {
  console.error('Error:', err);

  if (err.message && err.message.startsWith('CORS blocked')) {
    return res.status(403).json({
      success: false,
      message: err.message,
      hint: 'Add your frontend URL to FRONTEND_URL or CORS_ORIGINS, or keep ALLOW_VERCEL_PREVIEWS=true for Vercel preview URLs.',
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler.
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

module.exports = app;
