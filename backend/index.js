const express = require('express');
const cors = require('cors');
const passport = require('passport');
const connectDB = require('./src/config/database');
const config = require('./src/config');
const routes = require('./src/routes');
const errorHandler = require('./src/middleware/errorHandler');
const notFound = require('./src/middleware/notFound');
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
    } catch (error) {
      console.error('Seeding failed:', error);
    }
  }, 2000);
}

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

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
  console.log(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
});

module.exports = app;

