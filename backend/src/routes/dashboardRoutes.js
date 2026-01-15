/**
 * DEPRECATED ROUTES - Use /api/v1/dashboard instead
 * 
 * These routes are kept for backward compatibility.
 * New code should use the v1 routes with permission-based authorization.
 */

const express = require('express');
const router = express.Router();
const { getStats } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

// Deprecated - use requirePermission('dashboard:view') instead
router.get('/stats', protect, authorize('admin'), getStats);

module.exports = router;
