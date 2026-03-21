const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: 0,
    },
    type: {
      type: String,
      enum: ['monthly', 'daily', 'deposit'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'submitted', 'paid', 'overdue'],
      default: 'pending',
    },
    billingStartDate: {
      type: Date,
      default: null,
    },
    billingEndDate: {
      type: Date,
      default: null,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    paidDate: {
      type: Date,
      default: null,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'online'],
      default: 'cash',
    },
    transactionId: {
      type: String,
      trim: true,
    },
    reminderCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ──
paymentSchema.index({ user: 1, status: 1 });
paymentSchema.index({ dueDate: 1 });
paymentSchema.index({ status: 1, dueDate: 1 }); // Fee reminder cron query

module.exports = mongoose.model('Payment', paymentSchema);
