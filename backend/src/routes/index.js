const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const chatbotRoutes = require('./chatbotRoutes');
const roleRoutes = require('./roleRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/chatbot', chatbotRoutes);
router.use('/roles', roleRoutes);
router.use('/dashboard', require('./dashboardRoutes'));

module.exports = router;
