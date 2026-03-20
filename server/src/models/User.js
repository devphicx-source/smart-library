const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      match: [/^\+91\d{10}$/, 'Phone must be in +91XXXXXXXXXX format'],
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
    },
    assignedDesk: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Desk',
      default: null,
    },

    // ── Streak fields ──
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActiveDate: {
      type: String, // YYYY-MM-DD in IST
      default: null,
    },
    streakFreezeAvailable: { type: Boolean, default: false },

    // ── Lifetime stats ──
    totalStudyMinutes: { type: Number, default: 0 },

    // ── Account status ──
    isActive: { type: Boolean, default: true },

    // ── OTP (for custom OTP flow) ──
    otp: { type: String, default: null },
    otpExpiresAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ──
userSchema.index({ phone: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ currentStreak: -1, totalStudyMinutes: -1 }); // Leaderboard query

// ── Hide sensitive fields in JSON ──
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.otp;
  delete obj.otpExpiresAt;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
