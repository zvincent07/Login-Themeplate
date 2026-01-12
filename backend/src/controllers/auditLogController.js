const asyncHandler = require('../middleware/asyncHandler');
const AuditLog = require('../models/AuditLog');

// @desc    Get audit logs with filters and pagination
// @route   GET /api/audit-logs
// @access  Private/Admin
exports.getAuditLogs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;

  const {
    search = '',
    resourceType,
    action,
    actorEmail,
    from,
    to,
  } = req.query;

  const query = {};

  if (resourceType && resourceType !== 'all') {
    query.resourceType = resourceType;
  }

  if (action && action !== 'all') {
    query.action = action;
  }

  if (actorEmail) {
    query.actorEmail = { $regex: actorEmail, $options: 'i' };
  }

  if (search) {
    query.$or = [
      { actorEmail: { $regex: search, $options: 'i' } },
      { actorName: { $regex: search, $options: 'i' } },
      { resourceName: { $regex: search, $options: 'i' } },
      { action: { $regex: search, $options: 'i' } },
    ];
  }

  if (from || to) {
    query.createdAt = {};
    if (from) {
      query.createdAt.$gte = new Date(from);
    }
    if (to) {
      query.createdAt.$lte = new Date(to);
    }
  }

  const [total, logs] = await Promise.all([
    AuditLog.countDocuments(query),
    AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  res.status(200).json({
    success: true,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    data: logs,
  });
});

