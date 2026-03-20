const { todayIST, yesterdayIST } = require('../utils/ist');

/**
 * Update a user's streak based on their check-in.
 * Called during every check-in — idempotent for same IST day.
 *
 * @param {Object} user - Mongoose User document
 * @returns {Object} user - Updated (but NOT saved — caller must save)
 */
function updateStreak(user) {
  const today = todayIST();
  const yesterday = yesterdayIST();

  // Same day — no streak change (multi-session)
  if (user.lastActiveDate === today) {
    return user;
  }

  // Consecutive day — extend streak
  if (user.lastActiveDate === yesterday) {
    user.currentStreak += 1;
  }
  // Missed a day
  else if (user.lastActiveDate !== null) {
    // Check for streak freeze
    if (user.streakFreezeAvailable) {
      user.streakFreezeAvailable = false;
      // Streak preserved — don't reset
      user.currentStreak += 1;
    } else {
      user.currentStreak = 1; // Reset
    }
  }
  // First ever check-in
  else {
    user.currentStreak = 1;
  }

  // Update longest streak
  if (user.currentStreak > user.longestStreak) {
    user.longestStreak = user.currentStreak;
  }

  user.lastActiveDate = today;
  return user;
}

module.exports = { updateStreak };
