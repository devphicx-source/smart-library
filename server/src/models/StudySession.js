const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    desk: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Desk',
      required: true,
    },
    checkIn: {
      type: Date,
      required: true,
      default: Date.now,
    },
    checkOut: {
      type: Date,
      default: null,
    },
    durationMinutes: {
      type: Number,
      default: 0,
    },
    istDate: {
      type: String, // YYYY-MM-DD — the IST date when the session started
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'auto-closed'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ──
// Fast lookup: "does this user have a session today?" (streak logic)
studySessionSchema.index({ user: 1, istDate: 1 });
// Find active sessions for a user
studySessionSchema.index({ user: 1, status: 1 });
// Analytics: all sessions on a given date
studySessionSchema.index({ istDate: 1 });

module.exports = mongoose.model('StudySession', studySessionSchema);
