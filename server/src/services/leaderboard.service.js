const User = require('../models/User');
const StudySession = require('../models/StudySession');

/**
 * Get leaderboard sorted by:
 *   1. currentStreak (desc)
 *   2. totalStudyMinutes (desc)
 *
 * @param {number} limit - Max entries to return
 * @returns {Array} Leaderboard entries
 */
async function getLeaderboard(limit = 20) {
  const users = await User.find({ role: 'student', isActive: true })
    .select('name phone currentStreak longestStreak totalStudyMinutes')
    .sort({ currentStreak: -1, totalStudyMinutes: -1 })
    .limit(limit)
    .lean();

  return users.map((u, index) => ({
    rank: index + 1,
    userId: u._id,
    name: u.name,
    phone: u.phone,
    currentStreak: u.currentStreak,
    longestStreak: u.longestStreak,
    totalStudyMinutes: u.totalStudyMinutes,
    totalStudyHours: +(u.totalStudyMinutes / 60).toFixed(1),
  }));
}

/**
 * Get daily study stats for a given IST date.
 */
async function getDailyStats(istDate) {
  const sessions = await StudySession.aggregate([
    { $match: { istDate, status: { $in: ['active', 'on-break', 'completed', 'auto-closed'] } } },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        totalMinutes: { $sum: '$durationMinutes' },
        uniqueUsers: { $addToSet: '$user' },
      },
    },
  ]);

  if (!sessions.length) {
    return { totalSessions: 0, totalMinutes: 0, uniqueStudents: 0 };
  }

  const s = sessions[0];
  return {
    totalSessions: s.totalSessions,
    totalMinutes: s.totalMinutes,
    totalHours: +(s.totalMinutes / 60).toFixed(1),
    uniqueStudents: s.uniqueUsers.length,
  };
}

/**
 * Get weekly trend for a user (last 7 IST days).
 */
async function getWeeklyTrend(userId) {
  const { todayIST } = require('../utils/ist');
  const today = new Date(todayIST());
  const days = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  const sessions = await StudySession.aggregate([
    {
      $match: {
        user: userId,
        istDate: { $in: days },
        status: { $in: ['completed', 'auto-closed'] },
      },
    },
    {
      $group: {
        _id: '$istDate',
        totalMinutes: { $sum: '$durationMinutes' },
      },
    },
  ]);

  const map = {};
  sessions.forEach((s) => (map[s._id] = s.totalMinutes));

  return days.map((day) => ({
    date: day,
    minutes: map[day] || 0,
    hours: +((map[day] || 0) / 60).toFixed(1),
  }));
}

module.exports = { getLeaderboard, getDailyStats, getWeeklyTrend };
