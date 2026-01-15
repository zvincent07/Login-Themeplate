/**
 * API ROUTES WITH VERSIONING
 * 
 * API Versioning Rules:
 * - APIs must be versioned (v1, v2, etc.)
 * - No breaking changes without version bump
 * - Default to v1 for backward compatibility
 */

const express = require('express');
const router = express.Router();
const v1Routes = require('./v1');

// Mount versioned routes
router.use('/v1', v1Routes);

// Backward compatibility: Mount v1 routes at root (deprecated, will be removed in v2)
// TODO: Remove this in next major version
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const chatbotRoutes = require('./chatbotRoutes');
const roleRoutes = require('./roleRoutes');
const auditLogRoutes = require('./auditLogRoutes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/chatbot', chatbotRoutes);
router.use('/roles', roleRoutes);
router.use('/dashboard', require('./dashboardRoutes'));
router.use('/audit-logs', auditLogRoutes);

module.exports = router;
