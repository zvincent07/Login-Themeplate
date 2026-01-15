/**
 * AUDIT LOG REPOSITORY
 * 
 * Rules:
 * - Repositories return plain objects only
 * - No business logic here
 * - Only database access
 */

const AuditLog = require('../models/AuditLog');

class AuditLogRepository {
  /**
   * Create audit log entry
   */
  async create(auditLogData) {
    const auditLog = await AuditLog.create(auditLogData);
    return auditLog.toObject();
  }

  /**
   * Find audit logs with filters (whitelisted fields only)
   */
  async findMany(filters, options = {}) {
    const {
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const skip = (page - 1) * limit;

    // Whitelist allowed filter fields
    const query = {};

    if (filters.resourceType) {
      query.resourceType = filters.resourceType;
    }

    if (filters.actorEmail) {
      query.actorEmail = { $regex: filters.actorEmail, $options: 'i' };
    }

    if (filters.action) {
      query.action = { $regex: filters.action, $options: 'i' };
    }

    if (filters.resourceId) {
      query.resourceId = filters.resourceId;
    }

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        query.createdAt.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.createdAt.$lte = new Date(filters.endDate);
      }
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('actor', 'email firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Find audit log by ID
   */
  async findById(id) {
    const log = await AuditLog.findById(id).populate('actor', 'email firstName lastName');
    return log ? log.toObject() : null;
  }

  /**
   * Count audit logs with filters
   */
  async count(filters = {}) {
    const query = {};

    if (filters.resourceType) {
      query.resourceType = filters.resourceType;
    }

    if (filters.actorEmail) {
      query.actorEmail = { $regex: filters.actorEmail, $options: 'i' };
    }

    return AuditLog.countDocuments(query);
  }
}

module.exports = new AuditLogRepository();
