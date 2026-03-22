/**
 * IST (Indian Standard Time) date utilities.
 * IST = UTC + 5:30
 * All streak and session logic MUST use these helpers.
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // +5:30 in milliseconds

/**
 * Get the current date-time in IST as a JS Date object.
 */
/**
 * Get the current date-time in IST as a JS Date object.
 */
function nowIST() {
  const utc = new Date();
  return new Date(utc.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
}

/**
 * Get today's IST date string in YYYY-MM-DD format.
 */
function todayIST() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

/**
 * Get yesterday's IST date string in YYYY-MM-DD format.
 */
function yesterdayIST() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

/**
 * Convert any UTC Date to its IST date string (YYYY-MM-DD).
 */
function utcToISTDate(utcDate) {
  return utcDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

/**
 * Get start of IST day as a UTC Date.
 * Useful for querying MongoDB with UTC timestamps.
 */
function startOfISTDay(istDateStr) {
  // istDateStr = "YYYY-MM-DD"
  const [y, m, d] = istDateStr.split('-').map(Number);
  // Midnight IST = previous day 18:30 UTC
  // We use UTC constructor to avoid local time interference
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0) - IST_OFFSET_MS);
}

/**
 * Get end of IST day as a UTC Date.
 */
function endOfISTDay(istDateStr) {
  const start = startOfISTDay(istDateStr);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1); // 23:59:59.999
}

module.exports = {
  IST_OFFSET_MS,
  todayIST,
  yesterdayIST,
  utcToISTDate,
  startOfISTDay,
  endOfISTDay,
};
