/**
 * DEPRECATED ROUTES - Use /api/v1/audit-logs instead
 * 
 * These routes are kept for backward compatibility.
 * New code should use the v1 routes with permission-based authorization.
 */

const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditLogController');
const { protect, authorize } = require('../middleware/auth');

// All audit log routes require admin (or super admin) access (deprecated - use requirePermission)
router.use(protect, authorize('admin'));

router.get('/', getAuditLogs);

module.exports = router;

