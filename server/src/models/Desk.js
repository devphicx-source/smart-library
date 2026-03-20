const mongoose = require('mongoose');

const deskSchema = new mongoose.Schema(
  {
    deskNumber: {
      type: Number,
      required: true,
      unique: true,
    },
    section: {
      type: String,
      default: 'General',
      trim: true,
    },
    isOccupied: {
      type: Boolean,
      default: false,
    },
    currentUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ──
deskSchema.index({ deskNumber: 1 }, { unique: true });
deskSchema.index({ isOccupied: 1 }); // Quick occupancy queries

module.exports = mongoose.model('Desk', deskSchema);
