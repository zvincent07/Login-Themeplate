const express = require('express');
const cors = require('cors');
const passport = require('passport');
const connectDB = require('./src/config/database');
const config = require('./src/config');
const routes = require('./src/routes');
const errorHandler = require('./src/middleware/errorHandler');
const notFound = require('./src/middleware/notFound');
const { apiLimiter } = require('./src/middleware/rateLimiter');
const logger = require('./src/utils/logger');
require('./src/config/passport');

// Connect to database
connectDB();

// Seed database on startup (only in development or if SEED_DB=true)
if (process.env.SEED_DB === 'true' || config.nodeEnv === 'development') {
  const seedDatabase = require('./src/utils/seedDatabase');
  // Wait a bit for DB connection, then seed
  setTimeout(async () => {
    try {
      await seedDatabase();
      logger.info('Database seeded successfully');
    } catch (error) {
      logger.error('Database seeding failed:', error);
    }
  }, 2000);
}

// Initialize Express app
const app = express();

// Trust proxy configuration
// In production behind reverse proxy (nginx, etc.), set to number of proxies (e.g., 1)
// In development, set to false to avoid rate limiter warnings
// For production: app.set('trust proxy', 1); // Trust first proxy
app.set('trust proxy', config.nodeEnv === 'production' ? 1 : false);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Routes
app.use('/api', routes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
  });
});

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  logger.info(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  // app.close(() => {
  //   process.exit(1);
  // });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

module.exports = app;

