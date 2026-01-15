/**
 * USER REPOSITORY
 * 
 * Rules:
 * - Repositories return plain objects only
 * - No business logic here
 * - Only database access
 */

const User = require('../models/User');

class UserRepository {
  /**
   * Find user by ID
   */
  async findById(id, options = {}) {
    const { includePassword = false, populate = [] } = options;
    
    let query = User.findById(id);
    
    if (includePassword) {
      query = query.select('+password');
    }
    
    if (populate.includes('role')) {
      query = query.populate('role');
    }
    
    if (populate.includes('createdBy')) {
      query = query.populate('createdBy', 'email firstName lastName');
    }
    
    const user = await query;
    return user ? user.toObject() : null;
  }

  /**
   * Find user by email
   */
  async findByEmail(email, options = {}) {
    const { includePassword = false, populate = [] } = options;
    
    let query = User.findOne({ email: email.toLowerCase().trim() });
    
    if (includePassword) {
      query = query.select('+password');
    }
    
    if (populate.includes('role')) {
      query = query.populate('role');
    }
    
    const user = await query;
    return user ? user.toObject() : null;
  }

  /**
   * Find users with filters (whitelisted fields only)
   */
  async findMany(filters, options = {}) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      populate = [],
    } = options;

    const skip = (page - 1) * limit;
    
    // Whitelist allowed filter fields to prevent NoSQL injection
    const allowedFilters = [
      'email',
      'firstName',
      'lastName',
      'roleName',
      'isActive',
      'isEmailVerified',
      'provider',
      'deletedAt',
    ];
    
    const query = {};
    
    // Apply whitelisted filters
    if (filters.email) {
      query.email = { $regex: filters.email, $options: 'i' };
    }
    if (filters.firstName) {
      query.firstName = { $regex: filters.firstName, $options: 'i' };
    }
    if (filters.lastName) {
      query.lastName = { $regex: filters.lastName, $options: 'i' };
    }
    if (filters.roleName && filters.roleName !== 'all') {
      query.roleName = filters.roleName;
    }
    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }
    if (filters.isEmailVerified !== undefined) {
      query.isEmailVerified = filters.isEmailVerified;
    }
    if (filters.provider && filters.provider !== 'all') {
      query.provider = filters.provider;
    }
    if (filters.deletedAt !== undefined) {
      if (filters.deletedAt === null) {
        query.deletedAt = null;
      } else {
        query.deletedAt = filters.deletedAt;
      }
    }
    
    // Search filter (combines email, firstName, lastName)
    if (filters.search) {
      query.$or = [
        { email: { $regex: filters.search, $options: 'i' } },
        { firstName: { $regex: filters.search, $options: 'i' } },
        { lastName: { $regex: filters.search, $options: 'i' } },
      ];
    }

    let queryBuilder = User.find(query).select('-password');
    
    if (populate.includes('role')) {
      queryBuilder = queryBuilder.populate('role');
    }
    
    if (populate.includes('createdBy')) {
      queryBuilder = queryBuilder.populate('createdBy', 'email firstName lastName');
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    queryBuilder = queryBuilder.sort(sort);

    const [users, total] = await Promise.all([
      queryBuilder.skip(skip).limit(limit).lean(),
      User.countDocuments(query),
    ]);

    return {
      users: users.map(u => u),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Create user
   */
  async create(userData) {
    const user = await User.create(userData);
    return user.toObject();
  }

  /**
   * Update user by ID
   */
  async updateById(id, updateData) {
    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password').populate('role');
    
    return user ? user.toObject() : null;
  }

  /**
   * Soft delete user (set deletedAt)
   */
  async softDelete(id) {
    const user = await User.findByIdAndUpdate(
      id,
      { deletedAt: new Date() },
      { new: true }
    );
    
    return user ? user.toObject() : null;
  }

  /**
   * Restore user (clear deletedAt)
   */
  async restore(id) {
    const user = await User.findByIdAndUpdate(
      id,
      { deletedAt: null },
      { new: true }
    ).select('-password').populate('role').populate('createdBy', 'email firstName lastName');
    
    return user ? user.toObject() : null;
  }

  /**
   * Count users with filters
   */
  async count(filters = {}) {
    const query = {};
    
    if (filters.deletedAt !== undefined) {
      query.deletedAt = filters.deletedAt;
    }
    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }
    if (filters.isEmailVerified !== undefined) {
      query.isEmailVerified = filters.isEmailVerified;
    }
    if (filters.lastLogin) {
      query.lastLogin = filters.lastLogin;
    }
    
    return User.countDocuments(query);
  }

  /**
   * Find user by Google ID
   */
  async findByGoogleId(googleId) {
    const user = await User.findOne({ googleId }).populate('role');
    return user ? user.toObject() : null;
  }

  /**
   * Update last login
   */
  async updateLastLogin(id) {
    const user = await User.findByIdAndUpdate(
      id,
      { lastLogin: new Date() },
      { new: true }
    );
    return user ? user.toObject() : null;
  }

  /**
   * Find user by email with password (returns model instance for password matching)
   * NOTE: Returns Mongoose model instance, not plain object (needed for matchPassword)
   */
  async findByEmailWithPassword(email, options = {}) {
    const { populate = [] } = options;
    
    let query = User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    
    if (populate.includes('role')) {
      query = query.populate('role');
    }
    
    return await query;
  }

  /**
   * Find user by ID with password (returns model instance for password update)
   * NOTE: Returns Mongoose model instance, not plain object (needed for save hook)
   */
  async findByIdWithPassword(id) {
    return await User.findById(id).select('+password');
  }

  /**
   * Find user by reset token (returns plain object)
   */
  async findByResetToken(hashedToken) {
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+password');
    
    return user ? user.toObject() : null;
  }

  /**
   * Find user by reset token with password (returns model instance for save hook)
   * NOTE: Returns Mongoose model instance, not plain object (needed for save)
   */
  async findByResetTokenWithPassword(hashedToken) {
    return await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+password');
  }

  /**
   * Find users by role (for roleService)
   */
  async findByRole(roleId, options = {}) {
    const { limit = null, select = '' } = options;
    
    let query = User.find({
      role: roleId,
      deletedAt: null,
    });
    
    if (select) {
      query = query.select(select);
    }
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const users = await query.lean();
    return users;
  }

  /**
   * Count users by role
   */
  async countByRole(roleId) {
    return User.countDocuments({
      role: roleId,
      deletedAt: null,
    });
  }

  /**
   * Update roleName for all users with a specific role
   */
  async updateRoleNameForRole(roleId, newRoleName) {
    const result = await User.updateMany(
      { role: roleId },
      { roleName: newRoleName }
    );
    return { modifiedCount: result.modifiedCount };
  }
}

module.exports = new UserRepository();
