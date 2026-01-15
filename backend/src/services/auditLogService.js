/**
 * AUDIT LOG SERVICE
 * 
 * Services MUST:
 * - Contain business rules
 * - Enforce permissions
 * - Coordinate repositories
 */

const auditLogRepository = require('../repositories/auditLogRepository');
const { requirePermission } = require('../permissions');

class AuditLogService {
  /**
   * Get audit logs with filters (enforces permissions)
   */
  async getAuditLogs(filters, options, actor) {
    requirePermission(actor, 'audit-logs:read', 'audit logs');

    // Whitelist allowed filters
    const allowedFilters = {
      resourceType: filters.resourceType,
      actorEmail: filters.actorEmail,
      action: filters.action,
      resourceId: filters.resourceId,
      startDate: filters.from ? new Date(filters.from) : undefined,
      endDate: filters.to ? new Date(filters.to) : undefined,
    };

    // Remove undefined values
    Object.keys(allowedFilters).forEach(key => {
      if (allowedFilters[key] === undefined) {
        delete allowedFilters[key];
      }
    });

    const result = await auditLogRepository.findMany(allowedFilters, options);

    return result;
  }

  /**
   * Get audit log by ID (enforces permissions)
   */
  async getAuditLogById(logId, actor) {
    requirePermission(actor, 'audit-logs:read', 'audit log');

    const log = await auditLogRepository.findById(logId);
    if (!log) {
      const error = new Error('Audit log not found');
      error.statusCode = 404;
      throw error;
    }

    return log;
  }
}

module.exports = new AuditLogService();
