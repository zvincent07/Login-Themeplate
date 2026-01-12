const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditLogController');
const { protect, authorize } = require('../middleware/auth');

// All audit log routes require admin (or super admin) access
router.use(protect, authorize('admin'));

router.get('/', getAuditLogs);

module.exports = router;

