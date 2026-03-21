const mongoose = require('mongoose');
require('dotenv').config();

const Payment = require('./server/src/models/Payment');
const User = require('./server/src/models/User');

const DB_URI = 'mongodb+srv://admin:LMS1234@cluster0.v8wob.mongodb.net/slms?retryWrites=true&w=majority';

async function run() {
  await mongoose.connect(DB_URI);
  console.log('Connected to DB');

  const payments = await Payment.find({ status: 'paid' }).sort({ createdAt: -1 }).limit(10).lean();
  console.log('Recent paid payments:');
  payments.forEach(p => {
    console.log(`ID: ${p._id}, billingEndDate: ${p.billingEndDate}, dueDate: ${p.dueDate}`);
  });

  await mongoose.disconnect();
}

run();
