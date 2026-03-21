const cron = require('node-cron');
const Payment = require('../models/Payment');
const { sendOverdueAlert } = require('../services/sms.service');

/**
 * Runs every hour to check for overdue payments
 */
const initOverdueCheckJob = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('[Job] Checking for Overdue Payments...');

    try {
      const now = new Date();

      // Find pending payments where dueDate has passed
      const overduePayments = await Payment.find({
        status: 'pending',
        dueDate: { $lt: now },
        isActive: true
      }).populate('user');

      for (const payment of overduePayments) {
        payment.status = 'overdue';
        await payment.save();

        if (payment.user && payment.user.phone) {
          await sendOverdueAlert(payment.user, payment.amount);
        }
      }

      if (overduePayments.length > 0) {
        console.log(`[Job] Updated ${overduePayments.length} payments to OVERDUE.`);
      }
    } catch (err) {
      console.error('[Job Error] Overdue Check failed:', err);
    }
  }, {
    timezone: "Asia/Kolkata"
  });
};

module.exports = initOverdueCheckJob;
