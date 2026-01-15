/**
 * AUTH CONTROLLER (THIN)
 * 
 * Controllers MUST:
 * - Parse request
 * - Call service
 * - Return response
 */

const asyncHandler = require('../middleware/asyncHandler');
const authService = require('../services/authService');
const { generateToken } = require('../utils/generateToken');
const config = require('../config');

// @desc    Register User (Public - only for 'user' role)
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  const result = await authService.register({
    email,
    password,
    firstName,
    lastName,
  });

  res.status(201).json({
    success: true,
    message: 'Registration successful! Please check your email for the OTP code.',
    data: result,
  });
});

// @desc    Verify OTP and activate account
// @route   POST /api/v1/auth/verify-otp
// @access  Public
exports.verifyOTP = asyncHandler(async (req, res) => {
  const { userId, otp } = req.body;

  const result = await authService.verifyOTP(userId, otp);

  res.status(200).json({
    success: true,
    message: 'Email verified successfully!',
    token: result.token,
    data: {
      user: result.user,
    },
  });
});

// @desc    Resend OTP
// @route   POST /api/v1/auth/resend-otp
// @access  Public
exports.resendOTP = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  await authService.resendOTP(userId);

  res.status(200).json({
    success: true,
    message: 'OTP code has been resent to your email.',
  });
});

// @desc    Login User
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
  const { email, password, rememberMe } = req.body;
  const ip = authService.getClientIP(req);
  const userAgent = req.headers['user-agent'] || '';

  const result = await authService.login(email, password, rememberMe, ip, userAgent);

  res.status(200).json({
    success: true,
    token: result.token,
    data: {
      user: result.user,
    },
  });
});

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
  const result = await authService.getMe(req.user.id);

  res.status(200).json({
    success: true,
    data: result,
  });
});

// @desc    Google OAuth callback
// @route   GET /api/v1/auth/google/callback
// @access  Public
exports.googleCallback = asyncHandler(async (req, res) => {
  if (!req.user) {
    // Redirect to frontend login with error
    const frontendUrl = config.frontendUrl || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/login?error=authentication_failed`);
  }

  const ip = authService.getClientIP(req);
  const userAgent = req.headers['user-agent'] || '';

  const token = await authService.handleGoogleCallback(req.user, ip, userAgent);

  // Redirect to frontend with token
  const frontendUrl = config.frontendUrl || 'http://localhost:3000';
  res.redirect(`${frontendUrl}/?token=${token}`);
});

// @desc    Logout user (client-side token removal)
// @route   POST /api/v1/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user, req);

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

// @desc    Forgot Password
// @route   POST /api/v1/auth/forgot-password
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  await authService.forgotPassword(email);

  res.status(200).json({
    success: true,
    message: 'If an account exists with this email, a password reset link has been sent.',
  });
});

// @desc    Reset Password
// @route   POST /api/v1/auth/reset-password
// @access  Public
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  const result = await authService.resetPassword(token, password);

  res.status(200).json({
    success: true,
    message: result.wasUnverified
      ? 'Password reset successfully. Your email has been verified.'
      : 'Password reset successfully',
    token: result.token,
    data: {
      user: result.user,
    },
  });
});
