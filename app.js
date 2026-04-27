require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const { errorHandler } = require('./src/middlewares/errorHandler.middleware');
const { error } = require('./src/utils/response.util');

// Import routes
const authRoutes = require('./src/routes/auth.routes');
const contentRoutes = require('./src/routes/content.routes');
const approvalRoutes = require('./src/routes/approval.routes');
const broadcastRoutes = require('./src/routes/broadcast.routes');

const app = express();

// ─── GLOBAL MIDDLEWARE ──────────────────────────────────────

// CORS — allow all origins
app.use(cors());

// Request logging
app.use(morgan('dev'));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── ROUTES ─────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/approval', approvalRoutes);
app.use('/api/analytics', broadcastRoutes);

// ─── HEALTH CHECK ───────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Content Broadcasting System is running.',
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

// ─── 404 HANDLER ────────────────────────────────────────────

app.use((req, res) => {
  return error(res, `Route ${req.method} ${req.originalUrl} not found.`, 404);
});

// ─── GLOBAL ERROR HANDLER (must be last) ────────────────────

app.use(errorHandler);

module.exports = app;
