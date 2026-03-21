const StudySession = require('../models/StudySession');
const Desk = require('../models/Desk');
const User = require('../models/User');
const Payment = require('../models/Payment');
const { updateStreak } = require('../services/streak.service');
const { todayIST, utcToISTDate } = require('../utils/ist');
const { success, error } = require('../utils/response');

/**
 * POST /api/sessions/check-in
 */
exports.checkIn = async (req, res) => {
  try {
    const userId = req.user._id;
    const { deskId } = req.body;

    // ── Guard: already checked in? ──
    const active = await StudySession.findOne({ user: userId, status: { $in: ['active', 'on-break'] } });
    if (active) {
      return error(res, 'You already have an active session. Check out first.', 400);
    }

    // ── Access Control: Check Fee Status ──
    const now = new Date();
    const gracePeriodDays = 2; // 2 days grace
    
    const unpaidFee = await Payment.findOne({
      user: userId,
      status: { $in: ['pending', 'overdue'] },
      isActive: true
    }).sort({ dueDate: 1 });

    if (unpaidFee) {
      // Block if overdue OR (pending and past due date + grace)
      const isPastGrace = now > new Date(unpaidFee.dueDate.getTime() + gracePeriodDays * 24 * 60 * 60 * 1000);
      
      if (unpaidFee.status === 'overdue' || isPastGrace) {
         return error(res, `Access Restricted: Your fee of ₹${unpaidFee.amount} is overdue. Please pay to continue.`, 403);
      }
    }

    // ── Validate desk ──
    const desk = await Desk.findById(deskId);
    if (!desk) {
      return error(res, 'Desk not found', 404);
    }
    if (desk.isOccupied) {
      return error(res, 'Desk is already occupied', 400);
    }

    // ── Create session ──
    const istDate = utcToISTDate(now);

    const session = await StudySession.create({
      user: userId,
      desk: deskId,
      checkIn: now,
      istDate,
    });

    // ── Mark desk occupied ──
    desk.isOccupied = true;
    desk.currentUser = userId;
    await desk.save();

    // ── Update user streak ──
    const user = await User.findById(userId);
    updateStreak(user);
    user.assignedDesk = desk._id;
    await user.save();

    return success(res, {
      session,
      streak: {
        current: user.currentStreak,
        longest: user.longestStreak,
      },
    }, 'Checked in successfully', 201);
  } catch (err) {
    console.error('checkIn error:', err);
    return error(res, 'Check-in failed', 500);
  }
};

/**
 * POST /api/sessions/check-out
 */
exports.checkOut = async (req, res) => {
  try {
    const userId = req.user._id;

    const session = await StudySession.findOne({ user: userId, status: { $in: ['active', 'on-break'] } });
    if (!session) {
      return error(res, 'No active session found', 400);
    }

    // ── Calculate duration ──
    const now = new Date();
    
    // Subtract break durations
    let totalBreakMs = 0;
    if (session.breaks && session.breaks.length > 0) {
      session.breaks.forEach(b => {
        if (b.start && b.end) {
          totalBreakMs += (new Date(b.end) - new Date(b.start));
        } else if (b.start && !b.end) {
          // If checked out while on break, close the break now
          totalBreakMs += (now - new Date(b.start));
          b.end = now;
        }
      });
    }

    const durationMs = (now - session.checkIn) - totalBreakMs;
    const durationMinutes = Math.max(0, Math.round(durationMs / 60000));

    session.checkOut = now;
    session.durationMinutes = durationMinutes;
    session.status = 'completed';
    await session.save();

    // ── Free up desk ──
    const desk = await Desk.findById(session.desk);
    if (desk) {
      desk.isOccupied = false;
      desk.currentUser = null;
      await desk.save();
    }

    // ── Update user total study time ──
    const user = await User.findById(userId);
    user.totalStudyMinutes += durationMinutes;
    user.assignedDesk = null;
    await user.save();

    return success(res, {
      session,
      totalStudyMinutes: user.totalStudyMinutes,
    }, 'Checked out successfully');
  } catch (err) {
    console.error('checkOut error:', err);
    return error(res, 'Check-out failed', 500);
  }
};

/**
 * GET /api/sessions/active
 */
exports.getActiveSession = async (req, res) => {
  try {
    const session = await StudySession.findOne({
      user: req.user._id,
      status: { $in: ['active', 'on-break'] },
    }).populate('desk', 'deskNumber section');

    return success(res, session);
  } catch (err) {
    return error(res, 'Failed to fetch session', 500);
  }
};

/**
 * GET /api/sessions/history
 */
exports.getHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const sessions = await StudySession.find({
      user: req.user._id,
      status: { $in: ['completed', 'auto-closed'] },
    })
      .populate('desk', 'deskNumber section')
      .sort({ checkIn: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await StudySession.countDocuments({
      user: req.user._id,
      status: { $in: ['completed', 'auto-closed'] },
    });

    return success(res, { sessions, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    return error(res, 'Failed to fetch history', 500);
  }
};

/**
 * GET /api/sessions/desks — Available desks for check-in (student-accessible)
 */
exports.getDesks = async (req, res) => {
  try {
    const desks = await Desk.find()
      .select('deskNumber section isOccupied')
      .sort({ deskNumber: 1 })
      .lean();

    return success(res, { desks });
  } catch (err) {
    return error(res, 'Failed to fetch desks', 500);
  }
};

/**
 * POST /api/sessions/start-break
 */
exports.startBreak = async (req, res) => {
  try {
    const session = await StudySession.findOne({ user: req.user._id, status: 'active' });
    if (!session) return error(res, 'No active session found', 400);

    session.status = 'on-break';
    session.breaks.push({ start: new Date() });
    await session.save();

    return success(res, session, 'Break started');
  } catch (err) {
    return error(res, 'Failed to start break', 500);
  }
};

/**
 * POST /api/sessions/end-break
 */
exports.endBreak = async (req, res) => {
  try {
    const session = await StudySession.findOne({ user: req.user._id, status: 'on-break' });
    if (!session) return error(res, 'No break in progress', 400);

    const lastBreak = session.breaks[session.breaks.length - 1];
    if (lastBreak && !lastBreak.end) {
      lastBreak.end = new Date();
    }

    session.status = 'active';
    await session.save();

    return success(res, session, 'Session resumed');
  } catch (err) {
    return error(res, 'Failed to end break', 500);
  }
};
