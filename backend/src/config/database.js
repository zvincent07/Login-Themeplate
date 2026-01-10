const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/themeplate', {
      // Remove deprecated options for newer mongoose versions
    });
  } catch (error) {
    process.exit(1);
  }
};

module.exports = connectDB;

