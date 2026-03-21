/**
 * sms.service.js
 * Service for sending fee-related SMS/notifications via Firebase or other SMS gateways.
 */

// Placeholder for Firebase/SMS gateway logic
// const admin = require('firebase-admin');

/**
 * Send a generic SMS
 */
async function sendSMS(phone, message) {
  try {
    console.log(`[SMS] Sending to ${phone}: ${message}`);
    // In production, use Firebase Admin SDK:
    // await admin.messaging().send({
    //   token: userToken,
    //   notification: { title: 'Fee Reminder', body: message },
    // });
    return true;
  } catch (err) {
    console.error(`[SMS Error] Failed to send to ${phone}:`, err);
    return false;
  }
}

/**
 * SMS: Fee Due Reminder
 */
exports.sendFeeReminder = async (user, amount, dueDate) => {
  const dateStr = new Date(dueDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Kolkata',
  });
  const msg = `Your library fee of ₹${amount} is due on ${dateStr}. Please pay on time.`;
  return await sendSMS(user.phone, msg);
};

/**
 * SMS: Overdue Alert
 */
exports.sendOverdueAlert = async (user, amount) => {
  const msg = `Your library fee of ₹${amount} is overdue. Please pay immediately to continue access.`;
  return await sendSMS(user.phone, msg);
};

/**
 * SMS: Payment Confirmation
 */
exports.sendPaymentConfirmation = async (user, amount, nextDueDate) => {
  const dateStr = nextDueDate
    ? new Date(nextDueDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        timeZone: 'Asia/Kolkata',
      })
    : '--';
  const msg = `Payment of ₹${amount} received. Your next due date is ${dateStr}. Thank you!`;
  return await sendSMS(user.phone, msg);
};
