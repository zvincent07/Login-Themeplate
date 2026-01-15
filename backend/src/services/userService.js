/**
 * USER SERVICE
 * 
 * Services MUST:
 * - Contain business rules
 * - Enforce permissions
 * - Enforce ownership
 * - Coordinate repositories
 * - Enforce invariants
 */

const userRepository = require('../repositories/userRepository');
const roleRepository = require('../repositories/roleRepository');
const sessionRepository = require('../repositories/sessionRepository');
const { requirePermission, canAccessResource } = require('../permissions');
const { generateOTP, getOTPExpiry } = require('../utils/generateOTP');
const { sendOTPEmail } = require('./emailService');
const crypto = require('crypto');
const { createAuditLog } = require('../utils/auditLogger');

class UserService {
  /**
   * Create user (business logic)
   */
  async createUser(userData, actor) {
    const { email, password, firstName, lastName, roleName = 'employee' } = userData;

    // Check if user exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      const error = new Error('User already exists');
      error.statusCode = 400;
      throw error;
    }

    // Get role
    const role = await roleRepository.findByName(roleName);
    if (!role) {
      const error = new Error(`${roleName} role not found. Please seed the database.`);
      error.statusCode = 500;
      throw error;
    }

    // Business rule: Auto-generate password for roles that require OTP verification
    // Check if role has employees:create permission (admin/employee roles)
    const { getPermissionsForRole } = require('../permissions');
    const rolePermissions = getPermissionsForRole(roleName);
    const roleHasEmployeePermission = rolePermissions.includes('employees:create');
    
    let userPassword = password;
    let shouldSendOTP = false;

    if (roleHasEmployeePermission) {
      // Admin and employee roles get auto-generated passwords
      userPassword = crypto.randomBytes(12).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
      shouldSendOTP = true;
    } else if (!password) {
      const error = new Error('Password is required for user role');
      error.statusCode = 400;
      throw error;
    }

    // Generate OTP if needed
    let otpCode = null;
    let otpExpiresAt = null;
    
    if (shouldSendOTP) {
      otpCode = generateOTP();
      otpExpiresAt = getOTPExpiry();
    }

    // Create user data
    const newUserData = {
      email,
      password: userPassword,
      firstName,
      lastName,
      role: role._id,
      roleName,
      provider: 'local',
      createdBy: actor.id,
      isEmailVerified: false,
    };

    if (shouldSendOTP) {
      newUserData.otp = {
        code: otpCode,
        expiresAt: otpExpiresAt,
      };
    }

    const newUser = await userRepository.create(newUserData);

    // Send OTP email if needed
    if (shouldSendOTP) {
      try {
        await sendOTPEmail(email, otpCode, firstName, userPassword, newUser._id.toString());
      } catch (error) {
        // Rollback: delete user if email fails
        await userRepository.softDelete(newUser._id);
        throw new Error('Failed to send verification email. Please try again.');
      }
    }

    // Audit log
    createAuditLog({
      req: { user: actor },
      action: 'USER_CREATED',
      resourceType: 'user',
      resourceId: newUser._id.toString(),
      resourceName: `${firstName || ''} ${lastName || ''}`.trim() || email,
      details: {
        createdBy: actor?.email,
        roleName,
        isEmailVerified: false,
      },
    });

    return {
      user: newUser,
      requiresVerification: shouldSendOTP,
    };
  }

  /**
   * Get users with filters (enforces permissions)
   */
  async getUsers(filters, options, actor) {
    // Enforce permission
    requirePermission(actor, 'users:read', 'users list');

    const result = await userRepository.findMany(filters, {
      ...options,
      populate: ['role', 'createdBy'],
    });

    return result;
  }

  /**
   * Get single user (enforces ownership/permissions)
   */
  async getUserById(userId, actor) {
    const user = await userRepository.findById(userId, {
      populate: ['role', 'createdBy'],
    });

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if actor can access this resource
    if (!canAccessResource(actor, userId, 'users:read')) {
      const error = new Error('Not authorized to view this user');
      error.statusCode = 403;
      throw error;
    }

    return user;
  }

  /**
   * Update user (enforces permissions and ownership)
   */
  async updateUser(userId, updateData, actor, req) {
    const user = await userRepository.findById(userId);

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if actor can update this resource
    const canUpdate = canAccessResource(actor, userId, 'users:update');
    if (!canUpdate) {
      const error = new Error('Not authorized to update this user');
      error.statusCode = 403;
      throw error;
    }

    // Business rule: Prevent admin from editing own account
    const isAdminLike = ['admin', 'super admin'].includes(
      (actor.roleName || '').toLowerCase()
    );
    if (isAdminLike && actor.id === userId) {
      const error = new Error('You cannot edit your own account.');
      error.statusCode = 400;
      throw error;
    }

    // Business rule: Only admins can update role/status
    if (!isAdminLike) {
      delete updateData.role;
      delete updateData.roleName;
      delete updateData.isActive;
    }

    // Capture before state for audit
    const beforeState = {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleName: user.roleName,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
    };

    // Handle password update
    if (updateData.password) {
      // Password will be hashed by mongoose pre-save hook
      // We need to update via model to trigger the hook
      const userModel = await userRepository.findByIdWithPassword(userId);
      if (!userModel) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
      }
      userModel.password = updateData.password;
      delete updateData.password;
      await userModel.save();
    }

    // Update other fields
    const updatedUser = await userRepository.updateById(userId, updateData);

    // Determine action type for audit
    const afterState = {
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      roleName: updatedUser.roleName,
      isActive: updatedUser.isActive,
      isEmailVerified: updatedUser.isEmailVerified,
    };

    let action = 'USER_UPDATED';
    if (beforeState.roleName !== afterState.roleName) {
      action = 'USER_PROMOTED';
    }

    // Audit log
    const { createAuditLogWithChanges } = require('../utils/auditLogger');
    createAuditLogWithChanges({
      req: req || {},
      actor,
      action,
      resourceType: 'user',
      resourceId: updatedUser._id.toString(),
      resourceName: `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim() || updatedUser.email,
      before: beforeState,
      after: afterState,
      details: {
        updatedFields: Object.keys(updateData),
      },
    });

    return updatedUser;
  }

  /**
   * Delete user (soft delete, enforces permissions)
   */
  async deleteUser(userId, actor) {
    // Prevent deleting yourself
    if (actor.id === userId) {
      const error = new Error('Cannot delete your own account');
      error.statusCode = 400;
      throw error;
    }

    // Enforce permission
    requirePermission(actor, 'users:delete', 'user deletion');

    const user = await userRepository.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    await userRepository.softDelete(userId);

    // Audit log
    createAuditLog({
      req: { user: actor },
      action: 'USER_DELETED',
      resourceType: 'user',
      resourceId: user._id.toString(),
      resourceName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      details: {
        reason: 'soft_delete',
      },
    });

    return {};
  }

  /**
   * Restore user (enforces permissions)
   */
  async restoreUser(userId, actor) {
    requirePermission(actor, 'users:restore', 'user restoration');

    const user = await userRepository.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    if (!user.deletedAt) {
      const error = new Error('User is not deleted');
      error.statusCode = 400;
      throw error;
    }

    const restoredUser = await userRepository.restore(userId);

    // Audit log
    createAuditLog({
      req: { user: actor },
      action: 'USER_RESTORED',
      resourceType: 'user',
      resourceId: restoredUser._id.toString(),
      resourceName: `${restoredUser.firstName || ''} ${restoredUser.lastName || ''}`.trim() || restoredUser.email,
      details: {
        restoredBy: actor?.email,
      },
    });

    return restoredUser;
  }

  /**
   * Get user statistics (enforces permissions)
   */
  async getUserStats(actor) {
    requirePermission(actor, 'dashboard:view', 'user statistics');

    const [total, active, unverified] = await Promise.all([
      userRepository.count({ deletedAt: null }),
      userRepository.count({ isActive: true, deletedAt: null }),
      userRepository.count({ isEmailVerified: false, deletedAt: null }),
    ]);

    return {
      total,
      active,
      unverified,
    };
  }

  /**
   * Get user sessions (enforces permissions)
   */
  async getUserSessions(userId, currentToken, actor) {
    // Check if actor can view sessions
    if (!canAccessResource(actor, userId, 'users:view-sessions')) {
      const error = new Error('Not authorized to view sessions');
      error.statusCode = 403;
      throw error;
    }

    const sessions = await sessionRepository.findActiveByUserId(userId, {
      excludeToken: currentToken,
    });

    return sessions;
  }

  /**
   * Terminate session (enforces permissions)
   */
  async terminateSession(userId, sessionId, actor) {
    requirePermission(actor, 'users:terminate-sessions', 'session termination');

    const session = await sessionRepository.terminateById(sessionId, userId);
    if (!session) {
      const error = new Error('Session not found');
      error.statusCode = 404;
      throw error;
    }

    return { message: 'Session terminated successfully' };
  }

  /**
   * Terminate all other sessions (enforces permissions)
   */
  async terminateAllOtherSessions(userId, currentToken, actor) {
    requirePermission(actor, 'users:terminate-sessions', 'session termination');

    const result = await sessionRepository.terminateAllExceptCurrent(userId, currentToken);
    
    return {
      message: `Terminated ${result.modifiedCount} session(s) successfully`,
      terminatedCount: result.modifiedCount,
    };
  }
}

module.exports = new UserService();
