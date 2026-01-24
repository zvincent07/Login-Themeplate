const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// Adjust path to model
const AuditLog = require('./src/models/AuditLog');

const checkData = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/themeplate';
    console.log('Connecting to:', uri);
    await mongoose.connect(uri);
    console.log('Connected.');

    const count = await AuditLog.countDocuments({});
    console.log('Total AuditLogs:', count);

    // Check specifically for resourceType: 'all' or similar weirdness
    const weirdLogs = await AuditLog.countDocuments({ resourceType: 'all' });
    console.log('Logs with resourceType="all":', weirdLogs);

    if (count > 0) {
      const logs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(3).lean();
      console.log('Latest 3 logs:', JSON.stringify(logs, null, 2));
    } else {
        console.log('No logs found. This explains why the table is empty.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

checkData();
