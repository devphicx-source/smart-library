const express = require('express');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const leaderboardCtrl = require('../controllers/leaderboard.controller');

// ── Leaderboard Router → mounted at /api/leaderboard ──
const leaderboardRouter = express.Router();
leaderboardRouter.get('/', authenticate, leaderboardCtrl.getLeaderboard);

// ── Stats Router → mounted at /api/stats ──
const statsRouter = express.Router();
statsRouter.get('/daily', authenticate, leaderboardCtrl.getDailyStats);
statsRouter.get('/weekly', authenticate, leaderboardCtrl.getWeeklyTrend);

// ── Admin Router → mounted at /api/admin ──
const adminRouter = express.Router();
adminRouter.get('/occupancy', authenticate, authorize('admin'), leaderboardCtrl.getOccupancy);
adminRouter.get('/activity', authenticate, authorize('admin'), leaderboardCtrl.getRecentActivity);
adminRouter.get('/students', authenticate, authorize('admin'), leaderboardCtrl.getAllStudents);
adminRouter.get('/analytics', authenticate, authorize('admin'), leaderboardCtrl.getAnalytics);
adminRouter.get('/notifications', authenticate, authorize('admin'), leaderboardCtrl.getNotifications);

module.exports = { leaderboardRouter, statsRouter, adminRouter };
