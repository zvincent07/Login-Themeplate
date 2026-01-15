/**
 * LOGIN ATTEMPT REPOSITORY
 * 
 * Rules:
 * - Repositories return plain objects only
 * - No business logic here
 * - Only database access
 */

const LoginAttempt = require('../models/LoginAttempt');

class LoginAttemptRepository {
  /**
   * Record failed login attempt
   */
  async recordFailedAttempt(ip, email, isAdminEmail = false) {
    const attempt = await LoginAttempt.findOne({ ip, email });

    if (attempt) {
      attempt.attempts += 1;
      attempt.lastAttempt = new Date();
      attempt.isAdminEmail = isAdminEmail;
      const updated = await attempt.save();
      return updated.toObject();
    }

    const newAttempt = await LoginAttempt.create({
      ip,
      email,
      attempts: 1,
      isAdminEmail,
    });

    return newAttempt.toObject();
  }

  /**
   * Get attempt count for IP and email
   */
  async getAttemptCount(ip, email) {
    const attempt = await LoginAttempt.findOne({ ip, email });
    return attempt ? attempt.attempts : 0;
  }

  /**
   * Reset attempts (delete record)
   */
  async resetAttempts(ip, email) {
    const result = await LoginAttempt.deleteOne({ ip, email });
    return { deletedCount: result.deletedCount };
  }

  /**
   * Find attempt by IP and email
   */
  async findByIPAndEmail(ip, email) {
    const attempt = await LoginAttempt.findOne({ ip, email });
    return attempt ? attempt.toObject() : null;
  }

  /**
   * Find all attempts with filters
   */
  async findMany(filters, options = {}) {
    const {
      page = 1,
      limit = 50,
      sortBy = 'lastAttempt',
      sortOrder = 'desc',
    } = options;

    const skip = (page - 1) * limit;

    const query = {};

    if (filters.ip) {
      query.ip = filters.ip;
    }

    if (filters.email) {
      query.email = { $regex: filters.email, $options: 'i' };
    }

    if (filters.isAdminEmail !== undefined) {
      query.isAdminEmail = filters.isAdminEmail;
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [attempts, total] = await Promise.all([
      LoginAttempt.find(query).sort(sort).skip(skip).limit(limit).lean(),
      LoginAttempt.countDocuments(query),
    ]);

    return {
      attempts,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }
}

module.exports = new LoginAttemptRepository();
