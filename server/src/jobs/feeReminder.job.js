const cron = require('node-cron');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { sendFeeReminder } = require('../services/whatsapp.service');

/**
 * Fee Reminder Job — Runs daily at 9:00 AM IST (3:30 AM UTC).
 * Sends WhatsApp reminders for pending fees due within 3 days.
 */
function startFeeReminderJob() {
  // 3:30 AM UTC = 9:00 AM IST
  cron.schedule('30 3 * * *', async () => {
    console.log('⏰ Running fee reminder job...');

    try {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const pendingPayments = await Payment.find({
        status: 'pending',
        reminderSent: false,
        dueDate: { $lte: threeDaysFromNow },
      }).populate('user', 'name phone');

      console.log(`📨 Found ${pendingPayments.length} fee reminders to send`);

      for (const payment of pendingPayments) {
        if (!payment.user || !payment.user.phone) continue;

        await sendFeeReminder(
          payment.user.phone,
          payment.user.name,
          payment.amount,
          payment.dueDate.toISOString().slice(0, 10)
        );

        payment.reminderSent = true;
        await payment.save();
      }

      console.log('✅ Fee reminder job complete');
    } catch (err) {
      console.error('❌ Fee reminder job failed:', err);
    }
  });

  console.log('📅 Fee reminder cron scheduled (9:00 AM IST daily)');
}

module.exports = { startFeeReminderJob };
