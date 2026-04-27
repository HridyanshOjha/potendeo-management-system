require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const FeeStructure = require('./models/FeeStructure');

const connectDB = require('./config/db');

const seed = async () => {
  await connectDB();

  console.log('🌱 Starting database seed...');

  // Create admin if not exists
  const adminExists = await User.findOne({ role: 'admin' });
  if (!adminExists) {
    await User.create({
      name: 'Super Admin',
      email: 'admin@pdo.edu',
      password: 'Admin@123',
      role: 'admin',
      isActive: true,
    });
    console.log('✅ Admin created: admin@pdo.edu / Admin@123');
  } else {
    console.log('ℹ️  Admin already exists:', adminExists.email);
  }

  // Create default fee structure
  const feeExists = await FeeStructure.findOne({});
  if (!feeExists) {
    await FeeStructure.create({
      segments: [
        {
          segment: 'Class 1-5', order: 1,
          oneToOne: { min: 1500, max: 4000, recommended: 2500 },
          groupTuition: { min: 800, max: 2000, recommended: 1200 },
        },
        {
          segment: 'Class 6-8', order: 2,
          oneToOne: { min: 2000, max: 5000, recommended: 3000 },
          groupTuition: { min: 1000, max: 2500, recommended: 1500 },
        },
        {
          segment: 'Class 9-10', order: 3,
          oneToOne: { min: 2500, max: 6000, recommended: 4000 },
          groupTuition: { min: 1200, max: 3000, recommended: 2000 },
        },
        {
          segment: 'Class 11-12', order: 4,
          oneToOne: { min: 3000, max: 8000, recommended: 5000 },
          groupTuition: { min: 1500, max: 4000, recommended: 2500 },
        },
        {
          segment: 'Competitive Exams', order: 5,
          oneToOne: { min: 4000, max: 12000, recommended: 7000 },
          groupTuition: { min: 2000, max: 6000, recommended: 3500 },
        },
      ],
      currency: 'INR',
      isPublished: true,
    });
    console.log('✅ Default fee structure created');
  }

  console.log('\n🎉 Seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin Login: admin@pdo.edu | Admin@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  process.exit(0);
};

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
