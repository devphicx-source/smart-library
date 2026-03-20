const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');
const { success, error } = require('../utils/response');

/**
 * Generate a 6-digit OTP (demo-safe: in production, use Twilio Verify).
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * POST /api/auth/send-otp
 */
exports.sendOtp = async (req, res) => {
  try {
    const { phone, name } = req.body;

    let user = await User.findOne({ phone });

    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    if (user) {
      user.otp = otp;
      user.otpExpiresAt = otpExpiresAt;
      await user.save();
    } else {
      // Auto-register on first OTP request
      user = await User.create({
        name: name || 'New Student',
        phone,
        otp,
        otpExpiresAt,
      });
    }

    // In production: send OTP via Twilio/WhatsApp
    // For dev, we log it
    console.log(`🔑 OTP for ${phone}: ${otp}`);

    return success(res, { phone, isNew: !user }, 'OTP sent successfully');
  } catch (err) {
    console.error('sendOtp error:', err);
    return error(res, 'Failed to send OTP', 500);
  }
};

/**
 * POST /api/auth/verify-otp
 */
exports.verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const user = await User.findOne({ phone });
    if (!user) {
      return error(res, 'User not found', 404);
    }

    if (!user.otp || user.otp !== otp) {
      return error(res, 'Invalid OTP', 400);
    }

    if (user.otpExpiresAt < new Date()) {
      return error(res, 'OTP expired', 400);
    }

    // Clear OTP
    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return success(res, {
      token,
      user: user.toJSON(),
    }, 'Login successful');
  } catch (err) {
    console.error('verifyOtp error:', err);
    return error(res, 'OTP verification failed', 500);
  }
};

/**
 * GET /api/auth/me
 */
exports.getMe = async (req, res) => {
  try {
    return success(res, req.user);
  } catch (err) {
    return error(res, 'Failed to fetch profile', 500);
  }
};

/**
 * PATCH /api/auth/profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    if (name) req.user.name = name;
    await req.user.save();
    return success(res, req.user, 'Profile updated');
  } catch (err) {
    return error(res, 'Failed to update profile', 500);
  }
};
