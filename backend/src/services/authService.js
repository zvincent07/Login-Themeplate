/**
 * AUTH SERVICE
 * 
 * Services MUST:
 * - Contain business rules
 * - Enforce permissions
 * - Coordinate repositories
 * - Enforce invariants
 */

const userRepository = require('../repositories/userRepository');
const roleRepository = require('../repositories/roleRepository');
const sessionRepository = require('../repositories/sessionRepository');
const bannedIPRepository = require('../repositories/bannedIPRepository');
const loginAttemptRepository = require('../repositories/loginAttemptRepository');
const { generateToken, generateResetToken } = require('../utils/generateToken');
const validatePasswordStrength = require('../utils/passwordValidator');
const { generateOTP, getOTPExpiry } = require('../utils/generateOTP');
const { sendOTPEmail, sendPasswordResetEmail } = require('./emailService');
const { getIPGeolocation, parseUserAgent } = require('../utils/ipGeolocation');
const { createAuditLog } = require('../utils/auditLogger');
const config = require('../config');
const crypto = require('crypto');

class AuthService {
  /**
   * Register user (public - only for 'user' role)
   */
  async register(userData) {
    const { email, password, firstName, lastName } = userData;

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      const error = new Error('Password does not meet requirements');
      error.statusCode = 400;
      error.details = passwordValidation.errors;
      throw error;
    }

    // Check if user exists
    const userExists = await userRepository.findByEmail(email);
    if (userExists) {
      const error = new Error('User already exists');
      error.statusCode = 400;
      throw error;
    }

    // Get 'user' role
    const userRole = await roleRepository.findByName('user');
    if (!userRole) {
      const error = new Error('User role not found. Please seed the database.');
      error.statusCode = 500;
      throw error;
    }

    // Generate OTP
    const otpCode = generateOTP();
    const otpExpiresAt = getOTPExpiry();

    // Create user (not verified yet)
    const user = await userRepository.create({
      email,
      password,
      firstName,
      lastName,
      role: userRole._id,
      roleName: 'user',
      provider: 'local',
      isEmailVerified: false,
      otp: {
        code: otpCode,
        expiresAt: otpExpiresAt,
      },
    });

    // Send OTP email
    try {
      await sendOTPEmail(email, otpCode, firstName, null, user._id.toString());
    } catch (error) {
      // Rollback: delete user if email fails
      await userRepository.softDelete(user._id);
      throw new Error('Failed to send verification email. Please try again.');
    }

    return {
      userId: user._id,
      email: user.email,
      requiresVerification: true,
    };
  }

  /**
   * Verify OTP and activate account
   */
  async verifyOTP(userId, otp) {
    if (!userId || !otp) {
      const error = new Error('User ID and OTP are required');
      error.statusCode = 400;
      throw error;
    }

    const user = await userRepository.findById(userId, { includePassword: false });
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    if (user.isEmailVerified) {
      const error = new Error('Email already verified');
      error.statusCode = 400;
      throw error;
    }

    // Check if OTP exists and matches
    if (!user.otp || !user.otp.code) {
      const error = new Error('OTP not found. Please request a new one.');
      error.statusCode = 400;
      throw error;
    }

    // Check if OTP is expired
    if (new Date() > user.otp.expiresAt) {
      const error = new Error('OTP has expired. Please request a new one.');
      error.statusCode = 400;
      throw error;
    }

    // Verify OTP
    if (user.otp.code !== otp) {
      const error = new Error('Invalid OTP code');
      error.statusCode = 400;
      throw error;
    }

    // Verify email and clear OTP
    const updatedUser = await userRepository.updateById(userId, {
      isEmailVerified: true,
      otp: undefined,
    });

    // Generate token
    const token = generateToken(userId);

    return {
      token,
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        roleName: updatedUser.roleName || 'user',
        isEmailVerified: true,
      },
    };
  }

  /**
   * Resend OTP
   */
  async resendOTP(userId) {
    if (!userId) {
      const error = new Error('User ID is required');
      error.statusCode = 400;
      throw error;
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    if (user.isEmailVerified) {
      const error = new Error('Email already verified');
      error.statusCode = 400;
      throw error;
    }

    // Generate new OTP
    const otpCode = generateOTP();
    const otpExpiresAt = getOTPExpiry();

    // Update user with new OTP
    await userRepository.updateById(userId, {
      otp: {
        code: otpCode,
        expiresAt: otpExpiresAt,
      },
    });

    // Send OTP email
    try {
      await sendOTPEmail(user.email, otpCode, user.firstName, null, userId.toString());
    } catch (error) {
      throw new Error('Failed to send OTP email. Please try again.');
    }

    return {};
  }

  /**
   * Login user
   */
  async login(email, password, rememberMe, ip, userAgent) {
    if (!email || !password) {
      const error = new Error('Please provide email and password');
      error.statusCode = 400;
      throw error;
    }

    // Check if IP is banned
    const isBanned = await bannedIPRepository.isBanned(ip);
    if (isBanned) {
      const error = new Error('Your IP address has been temporarily banned due to suspicious activity. Please try again later.');
      error.statusCode = 403;
      throw error;
    }

    // Check if email is admin email
    const adminEmailPatterns = [/^admin@/i, /administrator@/i];
    const isAdminEmail = adminEmailPatterns.some(pattern => pattern.test(email));

    // Get user with password (need User model instance for password matching)
    const userModel = await userRepository.findByEmailWithPassword(email, {
      populate: ['role'],
    });

    if (!userModel) {
      // Record failed attempt
      const attempt = await loginAttemptRepository.recordFailedAttempt(ip, email, isAdminEmail);
      const attemptCount = attempt.attempts;
      const maxAttempts = isAdminEmail ? 5 : 10;
      const banReason = isAdminEmail ? 'failed_admin_login' : 'failed_login';
      const banDurationHours = isAdminEmail ? 1 : 0.5;

      // Audit log
      createAuditLog({
        req: { ip, headers: { 'user-agent': userAgent } },
        actor: null,
        action: 'LOGIN_FAILED',
        resourceType: 'auth',
        resourceId: email,
        resourceName: email,
        details: {
          reason: 'User not found',
          attemptCount,
          maxAttempts,
          isAdminEmail,
        },
      });

      if (attemptCount >= maxAttempts) {
        await bannedIPRepository.banIP(ip, banReason, null, banDurationHours);
        const error = new Error('Too many failed login attempts. Your IP has been temporarily banned. Please try again later.');
        error.statusCode = 403;
        throw error;
      }

      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      error.remainingAttempts = Math.max(0, maxAttempts - attemptCount);
      throw error;
    }

    // Check if user has a password (not social login)
    if (!userModel.password) {
      const error = new Error('This account uses social login. Please use Google to sign in.');
      error.statusCode = 401;
      throw error;
    }

    // Verify password
    const isPasswordValid = await userModel.matchPassword(password);

    if (!isPasswordValid) {
      // Record failed attempt
      const attempt = await loginAttemptRepository.recordFailedAttempt(ip, email, isAdminEmail);
      const attemptCount = attempt.attempts;
      const maxAttempts = isAdminEmail ? 5 : 10;
      const banReason = isAdminEmail ? 'failed_admin_login' : 'failed_login';
      const banDurationHours = isAdminEmail ? 1 : 0.5;

      // Audit log
      createAuditLog({
        req: { ip, headers: { 'user-agent': userAgent } },
        actor: userModel,
        action: 'LOGIN_FAILED',
        resourceType: 'auth',
        resourceId: userModel._id.toString(),
        resourceName: userModel.email,
        details: {
          reason: 'Invalid password',
          attemptCount,
          maxAttempts,
          isAdminEmail,
        },
      });

      if (attemptCount >= maxAttempts) {
        await bannedIPRepository.banIP(ip, banReason, null, banDurationHours);
        const error = new Error('Too many failed login attempts. Your IP has been temporarily banned. Please try again later.');
        error.statusCode = 403;
        throw error;
      }

      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      error.remainingAttempts = Math.max(0, maxAttempts - attemptCount);
      throw error;
    }

    // Reset failed attempts on successful login
    await loginAttemptRepository.resetAttempts(ip, email);

    if (!userModel.isActive) {
      const error = new Error('Account is inactive. Please contact administrator.');
      error.statusCode = 401;
      throw error;
    }

    // Check if email is verified
    if (!userModel.isEmailVerified) {
      const error = new Error('Please verify your email before logging in. Check your email for the OTP code.');
      error.statusCode = 401;
      error.requiresVerification = true;
      error.userId = userModel._id;
      throw error;
    }

    // Update last login
    await userRepository.updateLastLogin(userModel._id);

    // Generate token
    const tokenExpiration = rememberMe ? '30d' : config.jwtExpire;
    const token = generateToken(userModel._id, tokenExpiration);

    const roleName = userModel.roleName || (userModel.role?.name) || 'user';

    // Create session (async, don't wait)
    this.createSessionAsync(userModel._id, token, ip, userAgent, rememberMe);

    // Audit log
    createAuditLog({
      req: { ip, headers: { 'user-agent': userAgent } },
      actor: userModel,
      action: 'LOGIN_SUCCESS',
      resourceType: 'auth',
      resourceId: userModel._id.toString(),
      resourceName: userModel.email,
      details: {
        rememberMe: !!rememberMe,
        roleName,
      },
    });

    return {
      token,
      user: {
        id: userModel._id,
        email: userModel.email,
        firstName: userModel.firstName,
        lastName: userModel.lastName,
        roleName,
        avatar: userModel.avatar,
      },
    };
  }

  /**
   * Create session asynchronously (helper method)
   */
  async createSessionAsync(userId, token, ip, userAgent, rememberMe) {
    try {
      // Session capping: Limit to 20 active sessions per user
      const sessionCount = await sessionRepository.countActiveByUserId(userId);
      const MAX_SESSIONS = 20;

      if (sessionCount >= MAX_SESSIONS) {
        const oldSessions = await sessionRepository.findOldestActive(userId, sessionCount - MAX_SESSIONS + 1);
        const idsToDelete = oldSessions.map(s => s._id);
        await sessionRepository.deactivateMultiple(idsToDelete);
      }

      // Get geolocation
      const { platform, browser, device } = parseUserAgent(userAgent);
      let location = {};

      try {
        location = await getIPGeolocation(ip);
      } catch (err) {
        // Use default location if geolocation fails
      }

      // Create session
      await sessionRepository.create({
        user: userId,
        token,
        ipAddress: ip,
        userAgent,
        platform,
        browser,
        device,
        location: {
          ...location,
          ipAddress: ip,
        },
        expiresAt: new Date(Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000),
        isActive: true,
      });
    } catch (err) {
      // Silently fail - session tracking is not critical
      console.error('Session creation error:', err);
    }
  }

  /**
   * Get current user
   */
  async getMe(userId) {
    const user = await userRepository.findById(userId, {
      populate: ['role'],
    });

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const roleName = user.roleName || (user.role?.name) || 'user';

    return {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleName,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  /**
   * Google OAuth callback handler
   */
  async handleGoogleCallback(user, ip, userAgent) {
    if (!user) {
      // Return null instead of throwing - controller will handle redirect
      return null;
    }

    const token = generateToken(user._id);

    // Update last login
    await userRepository.updateLastLogin(user._id);

    // Create session (async)
    this.createSessionAsync(user._id, token, ip, userAgent, false);

    return token;
  }

  /**
   * Logout (client-side token removal, audit log only)
   */
  async logout(user, req) {
    if (user) {
      createAuditLog({
        req: req || {},
        actor: user,
        action: 'LOGOUT',
        resourceType: 'auth',
        resourceId: user.id.toString(),
        resourceName: user.email,
        details: {},
      });
    }

    return {};
  }

  /**
   * Forgot password
   */
  async forgotPassword(email) {
    if (!email) {
      const error = new Error('Email is required');
      error.statusCode = 400;
      throw error;
    }

    const user = await userRepository.findByEmail(email, { includePassword: true });
    
    // Don't reveal if user exists or not (security best practice)
    if (!user) {
      return {};
    }

    // Check if user has a password (OAuth users don't have passwords)
    if (!user.password) {
      const error = new Error('This account uses social login. Please use Google to sign in.');
      error.statusCode = 400;
      throw error;
    }

    // Generate reset token
    const { resetToken, hashedToken } = generateResetToken();
    const resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Update user with reset token
    await userRepository.updateById(user._id, {
      resetPasswordToken: hashedToken,
      resetPasswordExpire: resetPasswordExpire,
    });

    // Create reset URL
    const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;

    try {
      await sendPasswordResetEmail(user.email, resetUrl, user.firstName || 'User');
      
      // Audit log
      createAuditLog({
        req: {},
        actor: user,
        action: 'PASSWORD_RESET_REQUEST',
        resourceType: 'auth',
        resourceId: user._id.toString(),
        resourceName: user.email,
        details: {},
      });

      return {};
    } catch (error) {
      // Rollback: clear reset token if email fails
      await userRepository.updateById(user._id, {
        resetPasswordToken: undefined,
        resetPasswordExpire: undefined,
      });
      throw new Error('Failed to send password reset email. Please try again.');
    }
  }

  /**
   * Reset password
   */
  async resetPassword(token, password) {
    if (!token || !password) {
      const error = new Error('Token and password are required');
      error.statusCode = 400;
      throw error;
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      const error = new Error('Password does not meet requirements');
      error.statusCode = 400;
      error.details = passwordValidation.errors;
      throw error;
    }

    // Hash the token to compare with database
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token (need model instance for save hook)
    const userModel = await userRepository.findByResetTokenWithPassword(hashedToken);

    if (!userModel) {
      const error = new Error('Invalid or expired reset token');
      error.statusCode = 400;
      throw error;
    }

    // Set new password
    const wasUnverified = !userModel.isEmailVerified;
    userModel.password = password;
    userModel.resetPasswordToken = undefined;
    userModel.resetPasswordExpire = undefined;
    
    // If email is not verified, verify it now
    if (wasUnverified) {
      userModel.isEmailVerified = true;
      userModel.otp = undefined;
    }
    
    await userModel.save();
    const user = userModel.toObject();

    // Audit log
    createAuditLog({
      req: {},
      actor: user,
      action: 'PASSWORD_RESET_SUCCESS',
      resourceType: 'auth',
      resourceId: user._id.toString(),
      resourceName: user.email,
      details: {
        emailVerified: wasUnverified,
      },
    });

    // Generate token for automatic login
    const authToken = generateToken(user._id);

    return {
      token: authToken,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleName: user.roleName || 'user',
        isEmailVerified: user.isEmailVerified,
      },
      wasUnverified,
    };
  }

  /**
   * Get client IP from request
   */
  getClientIP(req) {
    return (
      req.ip ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
      req.headers['x-real-ip'] ||
      'unknown'
    );
  }
}

module.exports = new AuthService();
