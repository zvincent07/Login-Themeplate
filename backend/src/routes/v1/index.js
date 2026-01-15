/**
 * API VERSION 1 ROUTES
 * 
 * API Versioning Rules:
 * - APIs must be versioned (v1, v2, etc.)
 * - No breaking changes without version bump
 */

const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const chatbotRoutes = require('./chatbotRoutes');
const roleRoutes = require('./roleRoutes');
const auditLogRoutes = require('./auditLogRoutes');

// Mount v1 routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/chatbot', chatbotRoutes);
router.use('/roles', roleRoutes);
router.use('/dashboard', require('./dashboardRoutes'));
router.use('/audit-logs', auditLogRoutes);

module.exports = router;
