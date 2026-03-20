/**
 * Seed script — populates the database with sample desks and an admin user.
 * Usage: node src/seed.js
 */
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Desk = require('./models/Desk');

async function seed() {
  await connectDB();

  // ── Create desks (if none exist) ──
  const deskCount = await Desk.countDocuments();
  if (deskCount === 0) {
    const desks = [];
    for (let i = 1; i <= 30; i++) {
      desks.push({
        deskNumber: i,
        section: i <= 10 ? 'A' : i <= 20 ? 'B' : 'C',
      });
    }
    await Desk.insertMany(desks);
    console.log('✅ Created 30 desks (Section A: 1-10, B: 11-20, C: 21-30)');
  } else {
    console.log(`ℹ️  Desks already exist (${deskCount})`);
  }

  // ── Create admin user (if none exists) ──
  const admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    await User.create({
      name: 'Admin',
      phone: '+919999999999',
      role: 'admin',
    });
    console.log('✅ Created admin user (+919999999999)');
  } else {
    console.log('ℹ️  Admin user already exists');
  }

  // ── Create sample students ──
  const studentCount = await User.countDocuments({ role: 'student' });
  if (studentCount === 0) {
    await User.insertMany([
      { name: 'Arjun Sharma', phone: '+919876543210' },
      { name: 'Priya Patel', phone: '+919876543211' },
      { name: 'Rahul Kumar', phone: '+919876543212' },
    ]);
    console.log('✅ Created 3 sample students');
  } else {
    console.log(`ℹ️  Students already exist (${studentCount})`);
  }

  console.log('\n🌱 Seed complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
