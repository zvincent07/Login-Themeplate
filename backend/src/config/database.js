const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  const maxRetries = 5;
  let retries = 0;
  const retryDelay = 5000; // 5 seconds

  while (retries < maxRetries) {
    try {
      const conn = await mongoose.connect(
        process.env.MONGODB_URI || 'mongodb://localhost:27017/themeplate',
        {
          // Connection pool options
          maxPoolSize: 10,
          minPoolSize: 5,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        }
      );

      logger.info(`MongoDB Connected: ${conn.connection.host}`);
      
      // Handle connection events
      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected. Attempting to reconnect...');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected successfully');
      });

      return;
    } catch (error) {
      retries++;
      logger.error(`MongoDB connection attempt ${retries}/${maxRetries} failed:`, error.message);
      
      if (retries < maxRetries) {
        logger.info(`Retrying connection in ${retryDelay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        logger.error('Failed to connect to MongoDB after maximum retries.');
        // In development, don't exit - allow server to start and retry later
        // In production, exit to prevent serving requests without database
        if (process.env.NODE_ENV === 'production') {
          logger.error('Exiting in production mode due to database connection failure.');
          process.exit(1);
        } else {
          logger.warn('Server will continue running in development mode. Database operations will fail until connection is established.');
          // Set up automatic reconnection attempts
          setTimeout(() => {
            logger.info('Attempting to reconnect to MongoDB...');
            connectDB().catch(() => {
              // Silently fail - will retry again later
            });
          }, 30000); // Retry every 30 seconds
        }
      }
    }
  }
};

module.exports = connectDB;

