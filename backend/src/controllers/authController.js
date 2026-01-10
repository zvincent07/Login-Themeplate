const asyncHandler = require('../middleware/asyncHandler');
const User = require('../models/User');
const Role = require('../models/Role');
const { generateToken, generateResetToken } = require('../utils/generateToken');
const validatePasswordStrength = require('../utils/passwordValidator');
const { generateOTP, getOTPExpiry } = require('../utils/generateOTP');
const { sendOTPEmail, sendPasswordResetEmail } = require('../services/emailService');
const config = require('../config');
const crypto = require('crypto');

// @desc    Register User (Public - only for 'user' role)
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  // Validate password strength
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.isValid) {
    return res.status(400).json({
      success: false,
      error: 'Password does not meet requirements',
      details: passwordValidation.errors,
    });
  }

  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    return res.status(400).json({
      success: false,
      error: 'User already exists',
    });
  }

  // Get 'user' role
  const userRole = await Role.findOne({ name: 'user' });

  if (!userRole) {
    return res.status(500).json({
      success: false,
      error: 'User role not found. Please seed the database.',
    });
  }

  // Generate OTP
  const otpCode = generateOTP();
  const otpExpiresAt = getOTPExpiry();

  // Create user (not verified yet)
  const user = await User.create({
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
    await sendOTPEmail(email, otpCode, firstName);
  } catch (error) {
    // If email fails, delete the user and return error
    await User.findByIdAndDelete(user._id);
    return res.status(500).json({
      success: false,
      error: 'Failed to send verification email. Please try again.',
    });
  }

  res.status(201).json({
    success: true,
    message: 'Registration successful! Please check your email for the OTP code.',
    data: {
      userId: user._id,
      email: user.email,
      requiresVerification: true,
    },
  });
});

// @desc    Verify OTP and activate account
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = asyncHandler(async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    return res.status(400).json({
      success: false,
      error: 'User ID and OTP are required',
    });
  }

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found',
    });
  }

  if (user.isEmailVerified) {
    return res.status(400).json({
      success: false,
      error: 'Email already verified',
    });
  }

  // Check if OTP exists and matches
  if (!user.otp || !user.otp.code) {
    return res.status(400).json({
      success: false,
      error: 'OTP not found. Please request a new one.',
    });
  }

  // Check if OTP is expired
  if (new Date() > user.otp.expiresAt) {
    return res.status(400).json({
      success: false,
      error: 'OTP has expired. Please request a new one.',
    });
  }

  // Verify OTP
  if (user.otp.code !== otp) {
    return res.status(400).json({
      success: false,
      error: 'Invalid OTP code',
    });
  }

  // Verify email and clear OTP
  user.isEmailVerified = true;
  user.otp = undefined;
  await user.save();

  // Generate token
  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: 'Email verified successfully!',
    token,
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleName: user.roleName || 'user',
        isEmailVerified: true,
      },
    },
  });
});

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOTP = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'User ID is required',
    });
  }

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found',
    });
  }

  if (user.isEmailVerified) {
    return res.status(400).json({
      success: false,
      error: 'Email already verified',
    });
  }

  // Generate new OTP
  const otpCode = generateOTP();
  const otpExpiresAt = getOTPExpiry();

  // Update user with new OTP
  user.otp = {
    code: otpCode,
    expiresAt: otpExpiresAt,
  };
  await user.save();

  // Send OTP email
  try {
    await sendOTPEmail(user.email, otpCode, user.firstName);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to send OTP email. Please try again.',
    });
  }

  res.status(200).json({
    success: true,
    message: 'OTP code has been resent to your email.',
  });
});

// @desc    Login User
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
  const { email, password, rememberMe } = req.body;

  // Validate email & password
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Please provide email and password',
    });
  }

  // Note: Bot detection is handled by botDetection middleware
  // Movement data is analyzed there and IP is banned if bot-like behavior is detected

  // Check for user (include password field)
  // Populate role, but handle if role doesn't exist
  const user = await User.findOne({ email }).select('+password').populate({
    path: 'role',
    select: 'name',
  });

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials',
    });
  }

  // Check if user has a password (not social login)
  if (!user.password) {
    return res.status(401).json({
      success: false,
      error: 'This account uses social login. Please use Google to sign in.',
    });
  }

  // Verify password
  const isPasswordValid = await user.matchPassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials',
    });
  }

  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      error: 'Account is inactive. Please contact administrator.',
    });
  }

  // Check if email is verified
  if (!user.isEmailVerified) {
    return res.status(401).json({
      success: false,
      error: 'Please verify your email before logging in. Check your email for the OTP code.',
      requiresVerification: true,
      userId: user._id,
    });
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // Generate token with extended expiration if "remember me" is checked
  const tokenExpiration = rememberMe ? '30d' : config.jwtExpire;
  let token;
  try {
    token = generateToken(user._id, tokenExpiration);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to generate authentication token. Please try again.',
    });
  }

  // Safely get roleName - handle case where role might not be populated
  const roleName = user.roleName || (user.role?.name) || 'user';

  res.status(200).json({
    success: true,
    token,
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleName: roleName,
        avatar: user.avatar,
      },
    },
  });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate('role');

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found',
    });
  }

  // Safely get roleName - handle case where role might not be populated
  const roleName = user.roleName || (user.role?.name) || 'user';

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleName: roleName,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
      },
    },
  });
});

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
exports.googleCallback = asyncHandler(async (req, res) => {
  // This will be handled by passport strategy
  // The user will be attached to req.user by passport
  if (!req.user) {
    // Redirect to frontend login with error
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/login?error=authentication_failed`);
  }

  const token = generateToken(req.user._id);

  // Update last login
  req.user.lastLogin = new Date();
  await req.user.save({ validateBeforeSave: false });

  // Redirect to frontend with token in query parameter
  // Frontend will extract token and store it
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  res.redirect(`${frontendUrl}/?token=${token}`);
});

// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email is required',
    });
  }

  // Include password field to check if user has a password (OAuth users don't have passwords)
  const user = await User.findOne({ email }).select('+password');

  // Don't reveal if user exists or not (security best practice)
  if (!user) {
    return res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  }

  // Check if user has a password (OAuth users don't have passwords)
  if (!user.password) {
    return res.status(400).json({
      success: false,
      error: 'This account uses social login. Please use Google to sign in.',
    });
  }

  // Generate reset token
  const { resetToken, hashedToken } = generateResetToken();
  const resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Save hashed token to database
  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpire = resetPasswordExpire;
  await user.save({ validateBeforeSave: false });

  // Create reset URL
  const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;

  try {
    await sendPasswordResetEmail(user.email, resetUrl, user.firstName || 'User');
    res.status(200).json({
      success: true,
      message: 'Password reset email sent successfully',
    });
  } catch (error) {
    // If email fails, clear reset token
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(500).json({
      success: false,
      error: 'Failed to send password reset email. Please try again.',
    });
  }
});

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({
      success: false,
      error: 'Token and password are required',
    });
  }

  // Hash the token to compare with database
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Find user with valid reset token
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  }).select('+password');

  if (!user) {
    return res.status(400).json({
      success: false,
      error: 'Invalid or expired reset token',
    });
  }

  // Validate password strength
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.isValid) {
    return res.status(400).json({
      success: false,
      error: 'Password does not meet requirements',
      details: passwordValidation.errors,
    });
  }

  // Set new password
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  // Generate token for automatic login
  const authToken = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: 'Password reset successfully',
    token: authToken,
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleName: user.roleName || 'user',
      },
    },
  });
});
