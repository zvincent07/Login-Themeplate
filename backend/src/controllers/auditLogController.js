/**
 * AUDIT LOG CONTROLLER (THIN)
 * 
 * Controllers MUST:
 * - Parse request
 * - Call service
 * - Return response
 */

const asyncHandler = require('../middleware/asyncHandler');
const auditLogService = require('../services/auditLogService');

// @desc    Get audit logs with filters and pagination
// @route   GET /api/v1/audit-logs
// @access  Private/Admin
exports.getAuditLogs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);

  const filters = {
    resourceType: req.query.resourceType,
    action: req.query.action,
    actorEmail: req.query.actorEmail,
    from: req.query.from,
    to: req.query.to,
    search: req.query.search,
  };

  const result = await auditLogService.getAuditLogs(
    filters,
    { page, limit },
    req.user
  );

  res.status(200).json({
    success: true,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      pages: result.pages,
    },
    data: result.logs,
  });
});
