/**
 * BANNED IP REPOSITORY
 * 
 * Rules:
 * - Repositories return plain objects only
 * - No business logic here
 * - Only database access
 */

const BannedIP = require('../models/BannedIP');

class BannedIPRepository {
  /**
   * Check if IP is banned
   */
  async isBanned(ip) {
    const banned = await BannedIP.findOne({
      ip,
      expiresAt: { $gt: new Date() },
    });
    return !!banned;
  }

  /**
   * Ban an IP address
   */
  async banIP(ip, reason, movementData = null, banDurationHours = 24) {
    const existing = await BannedIP.findOne({ ip });

    if (existing) {
      // Update existing ban
      existing.reason = reason;
      existing.bannedAt = new Date();
      existing.expiresAt = new Date(Date.now() + banDurationHours * 60 * 60 * 1000);
      existing.attempts += 1;
      if (movementData) {
        existing.movementData = movementData;
      }
      const updated = await existing.save();
      return updated.toObject();
    }

    // Create new ban
    const banned = await BannedIP.create({
      ip,
      reason,
      movementData,
      attempts: 1,
      expiresAt: new Date(Date.now() + banDurationHours * 60 * 60 * 1000),
    });

    return banned.toObject();
  }

  /**
   * Find banned IP by IP address
   */
  async findByIP(ip) {
    const banned = await BannedIP.findOne({ ip });
    return banned ? banned.toObject() : null;
  }

  /**
   * Find all banned IPs with filters
   */
  async findMany(filters, options = {}) {
    const {
      page = 1,
      limit = 50,
      sortBy = 'bannedAt',
      sortOrder = 'desc',
    } = options;

    const skip = (page - 1) * limit;

    const query = {};

    if (filters.ip) {
      query.ip = { $regex: filters.ip, $options: 'i' };
    }

    if (filters.reason) {
      query.reason = filters.reason;
    }

    if (filters.expired === false) {
      query.expiresAt = { $gt: new Date() };
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [bannedIPs, total] = await Promise.all([
      BannedIP.find(query).sort(sort).skip(skip).limit(limit).lean(),
      BannedIP.countDocuments(query),
    ]);

    return {
      bannedIPs,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Unban IP (delete ban)
   */
  async unbanIP(ip) {
    const result = await BannedIP.deleteOne({ ip });
    return { deletedCount: result.deletedCount };
  }

  /**
   * Delete expired bans
   */
  async deleteExpired() {
    const result = await BannedIP.deleteMany({
      expiresAt: { $lt: new Date() },
    });
    return { deletedCount: result.deletedCount };
  }
}

module.exports = new BannedIPRepository();
