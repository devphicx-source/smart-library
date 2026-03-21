const Payment = require('../models/Payment');
const { createNextBillingCycle } = require('../services/fee.service');
const { sendPaymentConfirmation, sendFeeReminder } = require('../services/sms.service');
const { success, error } = require('../utils/response');

/**
 * GET /api/fees/my — Student: get own payments
 */
exports.getMyFees = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .sort({ dueDate: -1 })
      .lean();
    return success(res, payments);
  } catch (err) {
    return error(res, 'Failed to fetch fees', 500);
  }
};

/**
 * GET /api/fees — Admin: get all payments (filterable)
 */
exports.getAllFees = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const payments = await Payment.find(filter)
      .populate('user', 'name phone')
      .sort({ dueDate: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Payment.countDocuments(filter);

    return success(res, { payments, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    return error(res, 'Failed to fetch fees', 500);
  }
};

/**
 * POST /api/fees — Admin: create a new fee entry
 */
exports.createFee = async (req, res) => {
  try {
    const { userId, amount, type, dueDate, billingStartDate, billingEndDate, notes } = req.body;

    const start = billingStartDate ? new Date(billingStartDate) : new Date();
    // Default billingEndDate to dueDate if not provided
    const end = billingEndDate ? new Date(billingEndDate) : new Date(dueDate);

    const payment = await Payment.create({
      user: userId,
      amount,
      type,
      dueDate: new Date(dueDate),
      billingStartDate: start,
      billingEndDate: end,
      notes,
    });

    return success(res, payment, 'Fee created', 201);
  } catch (err) {
    console.error('createFee error:', err);
    return error(res, 'Failed to create fee', 500);
  }
};

/**
 * PATCH /api/fees/:id — Admin: mark as paid
 */
exports.updateFee = async (req, res) => {
  try {
    const { status } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return error(res, 'Payment not found', 404);
    }

    payment.status = status;
    if (status === 'paid') {
      payment.paidDate = new Date();
    }
    await payment.save();

    return success(res, payment, 'Fee updated');
  } catch (err) {
    return error(res, 'Failed to update fee', 500);
  }
};

/**
 * PATCH /api/fees/:id/pay — Student: pay own fee
 */
exports.payFee = async (req, res) => {
  try {
    const payment = await Payment.findOne({ _id: req.params.id })
      .populate('user', 'name phone');

    if (!payment) {
      return error(res, 'Payment not found', 404);
    }

    // Auth check: only own fee if student
    if (req.user.role === 'student' && payment.user._id.toString() !== req.user._id.toString()) {
      return error(res, 'Unauthorized', 403);
    }

    if (payment.status === 'paid') {
      return error(res, 'Fee is already paid', 400);
    }

    const { paymentMethod, transactionId } = req.body;

    payment.status = 'paid';
    payment.paidDate = new Date();
    payment.paymentMethod = paymentMethod || 'cash';
    payment.transactionId = transactionId;
    await payment.save();

    // ── AUTOMATION: Create next billing cycle ──
    const nextFee = await createNextBillingCycle(payment);

    // ── SMS: Confirmation ──
    await sendPaymentConfirmation(payment.user, payment.amount, nextFee.dueDate);

    return success(res, { payment, nextFee }, 'Payment successful');
  } catch (err) {
    console.error('payFee error:', err);
    return error(res, 'Failed to process payment', 500);
  }
};

/**
 * POST /api/fees/send-reminder — Admin: Manually trigger reminder
 */
exports.sendManualReminder = async (req, res) => {
  try {
    const { paymentId } = req.body;
    const payment = await Payment.findById(paymentId).populate('user');

    if (!payment) return error(res, 'Payment not found', 404);
    if (payment.status === 'paid') return error(res, 'Fee already paid', 400);

    await sendFeeReminder(payment.user, payment.amount, payment.dueDate);
    
    payment.reminderCount += 1;
    await payment.save();

    return success(res, null, 'Reminder sent');
  } catch (err) {
    return error(res, 'Failed to send reminder', 500);
  }
};

/**
 * PATCH /api/fees/:id/notify-payment — Student: notify admin after UPI payment
 */
exports.notifyPayment = async (req, res) => {
  try {
    const { transactionId, paymentMethod } = req.body;
    // req.user._id is the student
    const payment = await Payment.findOne({ _id: req.params.id, user: req.user._id });

    if (!payment) return error(res, 'Payment not found', 404);
    if (payment.status === 'paid') return error(res, 'Fee already paid', 400);

    payment.status = 'submitted';
    payment.submittedAt = new Date();
    payment.transactionId = transactionId || '';
    payment.paymentMethod = paymentMethod || 'upi';
    await payment.save();

    return success(res, payment, 'Admin notified. Please wait for verification.');
  } catch (err) {
    console.error('notifyPayment error:', err);
    return error(res, 'Failed to notify payment', 500);
  }
};
