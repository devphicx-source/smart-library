const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createInitialFee } = require('../services/fee.service');
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
    console.log(`📩 OTP Request for ${phone}, Name: ${name || 'NOT_PROVIDED'}`);

    let user = await User.findOne({ phone });

    // ── CASE: Login Attempt (No name provided) ──
    if (!name) {
      if (!user) {
        return error(res, 'No account found with this phone number. Please sign up first.', 404);
      }
    } 
    // ── CASE: Sign Up Attempt (Name provided) ──
    else {
      if (user) {
        return error(res, 'This phone number is already registered. Please login instead.', 400);
      }
      // Create the user for signup
      user = await User.create({
        name,
        phone,
        role: 'student',
        isActive: true,
      });
      // ── Create initial fee ──
      await createInitialFee(user._id);
    }

    // ── Send OTP ──
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    // In production: send OTP via Twilio/WhatsApp
    // For dev, we log it
    console.log(`🔑 OTP for ${phone}: ${otp}`);

    return success(res, { phone, isNew: !name }, 'OTP sent successfully');
  } catch (err) {
    console.error('sendOtp error:', err);
    return error(res, err.message || 'Failed to send OTP', 500);
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

/**
 * POST /api/auth/check-user
 * Check if user exists (for frontend validation before OTP)
 */
exports.checkUser = async (req, res) => {
  try {
    const { phone } = req.body;
    const user = await User.findOne({ phone });
    return success(res, { exists: !!user });
  } catch (err) {
    return error(res, 'Failed to check user', 500);
  }
};

/**
 * POST /api/auth/firebase-login
 * Verifies Firebase token and issues local JWT
 */
exports.firebaseLogin = async (req, res) => {
  try {
    const { idToken, name } = req.body;
    const admin = require('../config/firebase');

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const phone = decodedToken.phone_number;

    if (!phone) {
      return error(res, 'Phone number not found in token', 400);
    }

    let user = await User.findOne({ phone });

    // ── STRICT VALIDATION ──
    if (!name) { // Login Mode
      if (!user) {
        return error(res, 'No account found with this phone number. Please sign up first.', 404);
      }
    } else { // Sign Up Mode
      if (user) {
        return error(res, 'This phone number is already registered. Please login instead.', 400);
      }
      // Create new user
      user = await User.create({
        name,
        phone,
        role: 'student',
        isActive: true,
      });
      // ── Create initial fee ──
      await createInitialFee(user._id);
    }

    // Generate our JWT
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
    console.error('firebaseLogin error:', err);
    return error(res, 'Authentication failed', 401);
  }
};
