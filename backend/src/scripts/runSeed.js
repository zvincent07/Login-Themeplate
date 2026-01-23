require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const seedDatabase = require('../utils/seedDatabase');

const run = async () => {
  console.log('Starting manual seed...');
  await connectDB();
  console.log('Connected to DB, running seed...');
  await seedDatabase();
  console.log('Seeding completed successfully.');
  process.exit(0);
};

run().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
