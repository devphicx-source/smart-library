const app = require('./src/app');
const connectDB = require('./src/config/db');
const { PORT } = require('./src/config/env');
const { startFeeReminderJob } = require('./src/jobs/feeReminder.job');
const { startDailyReportJob } = require('./src/jobs/dailyReport.job');
const cron = require('node-cron');

async function start() {
  // ── Connect to MongoDB ──
  await connectDB();

  // ── Start Cron Jobs ──
  startFeeReminderJob();
  startDailyReportJob();

  // ── Start Server ──
  app.listen(PORT, () => {
    console.log(`🚀 SLMS Server running on http://localhost:${PORT}`);
    console.log(`📋 Health: http://localhost:${PORT}/api/health`);

    // ── Self-Ping (keeps Render free tier alive) ──
    const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
    if (RENDER_URL) {
      cron.schedule('*/14 * * * *', async () => {
        try {
          const res = await fetch(`${RENDER_URL}/api/health`);
          const data = await res.json();
          console.log(`🏓 Self-ping OK — ${data.timestamp}`);
        } catch (err) {
          console.error('🏓 Self-ping failed:', err.message);
        }
      });
      console.log('🏓 Self-ping enabled (every 14 min)');
    }
  });
}

start().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
