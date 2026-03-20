const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const feeCtrl = require('../controllers/fee.controller');

// GET /api/fees/my — Student's own fees
router.get('/my', authenticate, authorize('student'), feeCtrl.getMyFees);

// GET /api/fees — Admin: all fees
router.get('/', authenticate, authorize('admin'), feeCtrl.getAllFees);

// POST /api/fees — Admin: create fee
router.post(
  '/',
  authenticate,
  authorize('admin'),
  [
    body('userId').isMongoId().withMessage('Valid user ID required'),
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be non-negative'),
    body('type').isIn(['monthly', 'daily', 'deposit']).withMessage('Invalid fee type'),
    body('dueDate').isISO8601().withMessage('Valid due date required'),
  ],
  validate,
  feeCtrl.createFee
);

// PATCH /api/fees/:id — Admin: update fee status
router.patch(
  '/:id',
  authenticate,
  authorize('admin'),
  [body('status').isIn(['pending', 'paid', 'overdue']).withMessage('Invalid status')],
  validate,
  feeCtrl.updateFee
);

module.exports = router;
