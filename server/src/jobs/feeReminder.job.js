const cron = require('node-cron');
const Payment = require('../models/Payment');
const { sendFeeReminder } = require('../services/sms.service');

/**
 * Runs every day at 09:00 AM IST
 */
const initFeeReminderJob = () => {
  // CRON: '0 9 * * *' (Minute Hour DayOfMonth Month DayOfWeek)
  // This runs at 9:00 AM UTC. For IST (UTC+5:30), 9:00 AM IST is 3:30 AM UTC.
  // Actually, if the server is in IST, '0 9 * * *' is fine.
  
  cron.schedule('0 9 * * *', async () => {
    console.log('[Job] Running Daily Fee Reminder...');

    try {
      const today = new Date();
      const threeDaysLater = new Date();
      threeDaysLater.setDate(today.getDate() + 3);

      // Find pending payments due in next 3 days
      const payments = await Payment.find({
        status: 'pending',
        dueDate: { $lte: threeDaysLater, $gte: today },
        isActive: true
      }).populate('user');

      for (const payment of payments) {
        if (payment.user && payment.user.phone) {
          await sendFeeReminder(payment.user, payment.amount, payment.dueDate);
          payment.reminderCount += 1;
          await payment.save();
        }
      }
      
      console.log(`[Job] Daily Reminder sent to ${payments.length} users.`);
    } catch (err) {
      console.error('[Job Error] Fee Reminder failed:', err);
    }
  }, {
    timezone: "Asia/Kolkata"
  });
};

module.exports = initFeeReminderJob;
