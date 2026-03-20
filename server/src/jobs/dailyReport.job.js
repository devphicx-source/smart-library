const cron = require('node-cron');
const { todayIST } = require('../utils/ist');
const { getDailyStats } = require('../services/leaderboard.service');
const { sendDailyReport } = require('../services/whatsapp.service');
const { ADMIN_PHONE } = require('../config/env');

/**
 * Daily Report Job — Runs at 10:00 PM IST (4:30 PM UTC).
 * Sends admin a WhatsApp summary of the day's activity.
 */
function startDailyReportJob() {
  // 16:30 UTC = 10:00 PM IST
  cron.schedule('30 16 * * *', async () => {
    console.log('⏰ Running daily report job...');

    try {
      const date = todayIST();
      const stats = await getDailyStats(date);

      if (ADMIN_PHONE) {
        await sendDailyReport(ADMIN_PHONE, { date, ...stats });
        console.log('✅ Daily report sent to admin');
      } else {
        console.log('⚠️  No ADMIN_PHONE set — daily report:');
        console.log(JSON.stringify({ date, ...stats }, null, 2));
      }
    } catch (err) {
      console.error('❌ Daily report job failed:', err);
    }
  });

  console.log('📅 Daily report cron scheduled (10:00 PM IST daily)');
}

module.exports = { startDailyReportJob };
