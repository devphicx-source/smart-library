const { getLeaderboard, getDailyStats, getWeeklyTrend } = require('../services/leaderboard.service');
const Desk = require('../models/Desk');
const StudySession = require('../models/StudySession');
const { todayIST } = require('../utils/ist');
const { success, error } = require('../utils/response');

/**
 * GET /api/leaderboard
 */
exports.getLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const leaderboard = await getLeaderboard(limit);
    return success(res, leaderboard);
  } catch (err) {
    return error(res, 'Failed to fetch leaderboard', 500);
  }
};

/**
 * GET /api/stats/daily — Today's stats (or specify ?date=YYYY-MM-DD)
 */
exports.getDailyStats = async (req, res) => {
  try {
    const istDate = req.query.date || todayIST();
    const stats = await getDailyStats(istDate);
    return success(res, { date: istDate, ...stats });
  } catch (err) {
    return error(res, 'Failed to fetch daily stats', 500);
  }
};

/**
 * GET /api/stats/weekly — User's 7-day trend
 */
exports.getWeeklyTrend = async (req, res) => {
  try {
    const trend = await getWeeklyTrend(req.user._id);
    return success(res, trend);
  } catch (err) {
    return error(res, 'Failed to fetch weekly trend', 500);
  }
};

/**
 * GET /api/admin/occupancy — Desk grid
 */
exports.getOccupancy = async (req, res) => {
  try {
    const desks = await Desk.find()
      .populate('currentUser', 'name phone')
      .sort({ deskNumber: 1 })
      .lean();

    const total = desks.length;
    const occupied = desks.filter((d) => d.isOccupied).length;

    return success(res, {
      total,
      occupied,
      available: total - occupied,
      occupancyRate: total ? +((occupied / total) * 100).toFixed(1) : 0,
      desks,
    });
  } catch (err) {
    return error(res, 'Failed to fetch occupancy', 500);
  }
};

/**
 * GET /api/admin/activity — Recent activity feed
 */
exports.getRecentActivity = async (req, res) => {
  try {
    const sessions = await StudySession.find()
      .populate('user', 'name')
      .populate('desk', 'deskNumber')
      .sort({ updatedAt: -1 })
      .limit(15)
      .lean();

    const activities = sessions.map((s) => {
      const userName = s.user?.name || 'Unknown';
      const deskNum = s.desk?.deskNumber || '?';
      const time = s.updatedAt;

      if (s.status === 'active') {
        return { type: 'checkin', text: `${userName} checked in at Desk #${deskNum}`, time, icon: '🟢' };
      } else if (s.status === 'completed') {
        return { type: 'checkout', text: `${userName} checked out (${s.durationMinutes}m)`, time, icon: '🔵' };
      } else {
        return { type: 'auto', text: `${userName}'s session auto-closed`, time, icon: '⚪' };
      }
    });

    return success(res, activities);
  } catch (err) {
    return error(res, 'Failed to fetch activity', 500);
  }
};

/**
 * GET /api/admin/students — All students with stats
 */
exports.getAllStudents = async (req, res) => {
  try {
    const User = require('../models/User');
    const { search, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const filter = { role: 'student' };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const [students, total] = await Promise.all([
      User.find(filter)
        .select('name phone currentStreak longestStreak totalStudyMinutes isActive lastActiveDate createdAt')
        .sort({ currentStreak: -1, totalStudyMinutes: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      User.countDocuments(filter),
    ]);

    const formatted = students.map((s) => ({
      ...s,
      totalStudyHours: +(s.totalStudyMinutes / 60).toFixed(1),
    }));

    return success(res, { students: formatted, total, page: Number(page) });
  } catch (err) {
    return error(res, 'Failed to fetch students', 500);
  }
};

/**
 * GET /api/admin/analytics — 7-day analytics overview
 */
exports.getAnalytics = async (req, res) => {
  try {
    const User = require('../models/User');

    // Build 7-day date array
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      // Convert to IST date string
      const ist = new Date(d.getTime() + (5.5 * 60 * 60 * 1000));
      days.push(ist.toISOString().split('T')[0]);
    }

    // Aggregate sessions per day
    const dailyData = await StudySession.aggregate([
      { $match: { istDate: { $in: days } } },
      {
        $group: {
          _id: '$istDate',
          sessions: { $sum: 1 },
          uniqueStudents: { $addToSet: '$user' },
          totalMinutes: { $sum: '$durationMinutes' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const dailyMap = {};
    dailyData.forEach((d) => {
      dailyMap[d._id] = {
        sessions: d.sessions,
        students: d.uniqueStudents.length,
        hours: +(d.totalMinutes / 60).toFixed(1),
      };
    });

    const chart = days.map((date) => ({
      date,
      label: new Date(date + 'T00:00:00+05:30').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
      sessions: dailyMap[date]?.sessions || 0,
      students: dailyMap[date]?.students || 0,
      hours: dailyMap[date]?.hours || 0,
    }));

    // Summary stats
    const totalStudents = await User.countDocuments({ role: 'student' });
    const activeStudents = await User.countDocuments({ role: 'student', isActive: true });
    const avgStreak = await User.aggregate([
      { $match: { role: 'student' } },
      { $group: { _id: null, avg: { $avg: '$currentStreak' }, maxStreak: { $max: '$longestStreak' } } },
    ]);

    const peakDay = chart.reduce((max, d) => d.sessions > max.sessions ? d : max, chart[0]);

    return success(res, {
      chart,
      summary: {
        totalStudents,
        activeStudents,
        avgStreak: avgStreak[0]?.avg ? +avgStreak[0].avg.toFixed(1) : 0,
        maxStreak: avgStreak[0]?.maxStreak || 0,
        peakDay: peakDay?.label || '—',
        peakSessions: peakDay?.sessions || 0,
      },
    });
  } catch (err) {
    console.error('Analytics error:', err);
    return error(res, 'Failed to fetch analytics', 500);
  }
};

/**
 * GET /api/admin/notifications?since=ISO — Admin notifications
 */
exports.getNotifications = async (req, res) => {
  try {
    const User = require('../models/User');
    const Payment = require('../models/Payment');
    const since = req.query.since ? new Date(req.query.since) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const notifications = [];

    // 1. Recent check-ins (last 24h)
    const recentSessions = await StudySession.find({ createdAt: { $gte: since } })
      .populate('user', 'name')
      .populate('desk', 'deskNumber')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    recentSessions.forEach((s) => {
      const name = s.user?.name || 'Unknown';
      const desk = s.desk?.deskNumber || '?';
      if (s.status === 'active') {
        notifications.push({ type: 'checkin', icon: '🟢', text: `${name} checked in at Desk #${desk}`, time: s.createdAt });
      } else if (s.status === 'completed') {
        notifications.push({ type: 'checkout', icon: '🔵', text: `${name} checked out (${s.durationMinutes || 0}m)`, time: s.updatedAt });
      }
    });

    // 2. Overdue fees
    const overdueFees = await Payment.find({ status: 'overdue' })
      .populate('user', 'name')
      .sort({ dueDate: -1 })
      .limit(5)
      .lean();

    overdueFees.forEach((f) => {
      notifications.push({ type: 'overdue', icon: '🔴', text: `${f.user?.name || 'Student'}'s ₹${f.amount} fee is overdue`, time: f.dueDate });
    });

    // 3. Recently paid fees (last 24h)
    const paidFees = await Payment.find({ status: 'paid', paidDate: { $gte: since } })
      .populate('user', 'name')
      .sort({ paidDate: -1 })
      .limit(10)
      .lean();

    paidFees.forEach((f) => {
      notifications.push({
        type: 'payment',
        icon: '💰',
        text: `${f.user?.name || 'Student'} paid ₹${f.amount} fee`,
        time: f.paidDate,
      });
    });

    // 4. Pending fees due soon (within 3 days)
    const soon = new Date();
    soon.setDate(soon.getDate() + 3);
    const upcomingFees = await Payment.find({ status: 'pending', dueDate: { $lte: soon, $gte: new Date() } })
      .populate('user', 'name')
      .limit(5)
      .lean();

    upcomingFees.forEach((f) => {
      notifications.push({ type: 'fee_due', icon: '🟡', text: `${f.user?.name || 'Student'}'s ₹${f.amount} fee due soon`, time: f.dueDate });
    });

    // 4. New registrations (last 24h)
    const newUsers = await User.find({ role: 'student', createdAt: { $gte: since } })
      .select('name createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    newUsers.forEach((u) => {
      notifications.push({ type: 'new_user', icon: '🆕', text: `New student: ${u.name}`, time: u.createdAt });
    });

    // 5. Streak milestones (students with streak = 7, 30, or 100)
    const milestoneUsers = await User.find({ role: 'student', currentStreak: { $in: [7, 30, 100] } })
      .select('name currentStreak')
      .lean();

    milestoneUsers.forEach((u) => {
      notifications.push({ type: 'milestone', icon: '🏆', text: `${u.name} hit a ${u.currentStreak}-day streak!`, time: new Date() });
    });

    // Sort all by time, newest first
    notifications.sort((a, b) => new Date(b.time) - new Date(a.time));

    // Count unread (after `since`)
    const unreadCount = notifications.filter((n) => new Date(n.time) >= since).length;

    return success(res, { notifications: notifications.slice(0, 20), unreadCount });
  } catch (err) {
    console.error('Notifications error:', err);
    return error(res, 'Failed to fetch notifications', 500);
  }
};

/**
 * POST /api/admin/students — Admin create student
 */
exports.createStudent = async (req, res) => {
  try {
    const User = require('../models/User');
    const { name, phone } = req.body;

    if (!name || !phone) {
      return error(res, 'Name and phone are required', 400);
    }

    // Check if phone already exists
    const existing = await User.findOne({ phone });
    if (existing) {
      return error(res, 'A user with this phone number already exists', 400);
    }

    const student = await User.create({
      name,
      phone,
      role: 'student',
      isActive: true,
    });

    // ── Create initial fee ──
    const { createInitialFee } = require('../services/fee.service');
    await createInitialFee(student._id);

    return success(res, student, 'Student created successfully', 201);
  } catch (err) {
    console.error('Create student error:', err);
    return error(res, err.message || 'Failed to create student', 500);
  }
};
