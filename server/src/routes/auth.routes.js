const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const authCtrl = require('../controllers/auth.controller');

// POST /api/auth/send-otp
router.post(
  '/send-otp',
  [body('phone').matches(/^\+91\d{10}$/).withMessage('Phone must be +91XXXXXXXXXX')],
  validate,
  authCtrl.sendOtp
);

// POST /api/auth/verify-otp
router.post(
  '/verify-otp',
  [
    body('phone').matches(/^\+91\d{10}$/).withMessage('Phone must be +91XXXXXXXXXX'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  ],
  validate,
  authCtrl.verifyOtp
);

// GET /api/auth/me
router.get('/me', authenticate, authCtrl.getMe);

// PATCH /api/auth/profile
router.patch('/profile', authenticate, authCtrl.updateProfile);

module.exports = router;
