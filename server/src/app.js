const express = require('express');
const cors = require('cors');

// ── Routes ──
const authRoutes = require('./routes/auth.routes');
const sessionRoutes = require('./routes/session.routes');
const feeRoutes = require('./routes/fee.routes');
const { leaderboardRouter, statsRouter, adminRouter } = require('./routes/leaderboard.routes');

const app = express();

// ── Middleware ──
app.use(cors({ origin: ['http://localhost:3000', 'https://smart-library-three.vercel.app/'] }));
app.use(express.json());

// ── Health Check ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/stats', statsRouter);
app.use('/api/admin', adminRouter);

// ── 404 Handler ──
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Global Error Handler ──
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

module.exports = app;
