const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const sessionCtrl = require('../controllers/session.controller');

// POST /api/sessions/check-in
router.post(
  '/check-in',
  authenticate,
  authorize('student'),
  [body('deskId').isMongoId().withMessage('Valid desk ID required')],
  validate,
  sessionCtrl.checkIn
);

// POST /api/sessions/check-out
router.post(
  '/check-out',
  authenticate,
  authorize('student'),
  sessionCtrl.checkOut
);

// POST /api/sessions/start-break
router.post('/start-break', authenticate, authorize('student'), sessionCtrl.startBreak);

// POST /api/sessions/end-break
router.post('/end-break', authenticate, authorize('student'), sessionCtrl.endBreak);

// GET /api/sessions/active
router.get('/active', authenticate, sessionCtrl.getActiveSession);

// GET /api/sessions/history
router.get('/history', authenticate, sessionCtrl.getHistory);

// GET /api/sessions/desks — desk availability (any authenticated user)
router.get('/desks', authenticate, sessionCtrl.getDesks);

module.exports = router;
