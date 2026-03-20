const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM } = require('../config/env');

let twilioClient = null;

function getClient() {
  if (!twilioClient && TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
    const twilio = require('twilio');
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
}

/**
 * Send a WhatsApp message via Twilio.
 * @param {string} to - Phone in +91XXXXXXXXXX format
 * @param {string} body - Message text
 */
async function sendWhatsApp(to, body) {
  const client = getClient();
  if (!client) {
    console.warn('⚠️  Twilio not configured — skipping WhatsApp message to', to);
    return null;
  }

  try {
    const message = await client.messages.create({
      from: TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${to}`,
      body,
    });
    console.log(`📱 WhatsApp sent to ${to}: ${message.sid}`);
    return message;
  } catch (err) {
    console.error(`❌ WhatsApp error to ${to}:`, err.message);
    return null;
  }
}

/**
 * Send a fee reminder message.
 */
async function sendFeeReminder(phone, name, amount, dueDate) {
  const body =
    `📚 *SLMS Fee Reminder*\n\n` +
    `Hi ${name},\n` +
    `Your fee of ₹${amount} is due on ${dueDate}.\n` +
    `Please clear your dues to continue uninterrupted access.\n\n` +
    `Thank you! 🙏`;
  return sendWhatsApp(phone, body);
}

/**
 * Send daily summary to admin.
 */
async function sendDailyReport(phone, stats) {
  const body =
    `📊 *SLMS Daily Report*\n\n` +
    `📅 Date: ${stats.date}\n` +
    `👥 Unique Students: ${stats.uniqueStudents}\n` +
    `📖 Total Sessions: ${stats.totalSessions}\n` +
    `⏱️ Total Study Hours: ${stats.totalHours}\n\n` +
    `Keep it going! 💪`;
  return sendWhatsApp(phone, body);
}

module.exports = { sendWhatsApp, sendFeeReminder, sendDailyReport };
