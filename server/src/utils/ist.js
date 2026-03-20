/**
 * IST (Indian Standard Time) date utilities.
 * IST = UTC + 5:30
 * All streak and session logic MUST use these helpers.
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // +5:30 in milliseconds

/**
 * Get the current date-time in IST as a JS Date object.
 */
function nowIST() {
  const utc = new Date();
  return new Date(utc.getTime() + IST_OFFSET_MS);
}

/**
 * Get today's IST date string in YYYY-MM-DD format.
 */
function todayIST() {
  return nowIST().toISOString().slice(0, 10);
}

/**
 * Get yesterday's IST date string in YYYY-MM-DD format.
 */
function yesterdayIST() {
  const ist = nowIST();
  ist.setDate(ist.getDate() - 1);
  return ist.toISOString().slice(0, 10);
}

/**
 * Convert any UTC Date to its IST date string (YYYY-MM-DD).
 */
function utcToISTDate(utcDate) {
  const ist = new Date(utcDate.getTime() + IST_OFFSET_MS);
  return ist.toISOString().slice(0, 10);
}

/**
 * Get start of IST day as a UTC Date.
 * Useful for querying MongoDB with UTC timestamps.
 */
function startOfISTDay(istDateStr) {
  // istDateStr = "YYYY-MM-DD"
  const [y, m, d] = istDateStr.split('-').map(Number);
  // Midnight IST = previous day 18:30 UTC
  return new Date(Date.UTC(y, m - 1, d) - IST_OFFSET_MS);
}

/**
 * Get end of IST day as a UTC Date.
 */
function endOfISTDay(istDateStr) {
  const start = startOfISTDay(istDateStr);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000);
}

module.exports = {
  IST_OFFSET_MS,
  nowIST,
  todayIST,
  yesterdayIST,
  utcToISTDate,
  startOfISTDay,
  endOfISTDay,
};
