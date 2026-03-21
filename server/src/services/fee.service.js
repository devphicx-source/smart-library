const Payment = require('../models/Payment');

/**
 * Create initial fee for a new student
 */
exports.createInitialFee = async (userId) => {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  return await Payment.create({
    user: userId,
    amount: 500, // Default monthly fee
    type: 'monthly',
    status: 'pending',
    dueDate,
    billingStartDate: new Date(),
    billingEndDate: dueDate,
  });
};

/**
 * Generate next billing cycle fee
 */
exports.createNextBillingCycle = async (lastPayment) => {
  const nextStartDate = new Date(lastPayment.billingEndDate || lastPayment.dueDate);
  const nextEndDate = new Date(nextStartDate);
  nextEndDate.setDate(nextEndDate.getDate() + 30);
  
  const nextDueDate = new Date(nextEndDate);

  return await Payment.create({
    user: lastPayment.user,
    amount: lastPayment.amount,
    type: lastPayment.type,
    status: 'pending',
    dueDate: nextDueDate,
    billingStartDate: nextStartDate,
    billingEndDate: nextEndDate,
  });
};
