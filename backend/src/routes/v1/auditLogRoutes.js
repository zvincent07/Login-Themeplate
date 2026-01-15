const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../../controllers/auditLogController');
const { protect, requirePermission } = require('../../middleware/auth');

// All audit log routes require permission
router.use(protect);
router.use(requirePermission('audit-logs:read'));

router.get('/', getAuditLogs);

module.exports = router;
