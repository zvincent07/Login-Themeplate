const AuditLog = require('../models/AuditLog');

/**
 * Create an audit log entry.
 * This is intentionally fire-and-forget; callers should not await it
 * in hot paths where latency matters.
 */
const createAuditLog = async ({
  req,
  actor,
  action,
  resourceType,
  resourceId,
  resourceName,
  details,
  changes, // New: for tracking before/after diffs
}) => {
  try {
    const user = actor || req.user;

    const ip =
      req?.ip ||
      req?.connection?.remoteAddress ||
      req?.socket?.remoteAddress ||
      (req?.headers?.['x-forwarded-for'] || '').split(',')[0].trim() ||
      req?.headers?.['x-real-ip'] ||
      'unknown';

    const userAgent = req?.headers?.['user-agent'] || '';

    // Build details object with changes if provided
    const logDetails = {
      ...details,
      ...(changes && { changes }), // Include changes in details
    };

    await AuditLog.create({
      actor: user?._id || user?.id,
      actorEmail: user?.email,
      actorName:
        (user?.firstName || user?.lastName)
          ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
          : undefined,
      action,
      resourceType,
      resourceId,
      resourceName,
      details: logDetails,
      ip,
      userAgent,
    });
  } catch (err) {
    // Never throw from audit logging; just log in development
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Failed to create audit log:', err);
    }
  }
};

/**
 * Helper to create audit log with change tracking (before/after diff)
 */
const createAuditLogWithChanges = async ({
  req,
  actor,
  action,
  resourceType,
  resourceId,
  resourceName,
  before,
  after,
  details,
}) => {
  // Calculate changes/diffs
  const changes = {};
  if (before && after) {
    Object.keys(after).forEach((key) => {
      if (before[key] !== after[key]) {
        changes[key] = {
          old: before[key],
          new: after[key],
        };
      }
    });
  }

  return createAuditLog({
    req,
    actor,
    action,
    resourceType,
    resourceId,
    resourceName,
    details,
    changes: Object.keys(changes).length > 0 ? changes : undefined,
  });
};

module.exports = {
  createAuditLog,
  createAuditLogWithChanges,
};

