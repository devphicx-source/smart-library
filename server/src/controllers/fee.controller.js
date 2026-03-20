const Payment = require('../models/Payment');
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
    const { userId, amount, type, dueDate, notes } = req.body;

    const payment = await Payment.create({
      user: userId,
      amount,
      type,
      dueDate: new Date(dueDate),
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
