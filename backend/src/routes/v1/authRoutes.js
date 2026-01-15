const express = require('express');
const router = express.Router();
const passport = require('passport');
const {
  register,
  login,
  getMe,
  googleCallback,
  logout,
  verifyOTP,
  resendOTP,
  forgotPassword,
  resetPassword,
} = require('../../controllers/authController');
const { protect } = require('../../middleware/auth');
const { optionalAuth } = require('../../middleware/optionalAuth');
const botDetection = require('../../middleware/botDetection');
const { authLimiter, passwordResetLimiter, otpLimiter } = require('../../middleware/rateLimiter');
const {
  validateRegister,
  validateLogin,
  validateOTP,
  validatePasswordReset,
  validateForgotPassword,
} = require('../../middleware/validator');
const { rejectUnknownFields } = require('../../middleware/validateInput');

// Define allowed fields for each endpoint
const registerFields = ['email', 'password', 'firstName', 'lastName'];
const loginFields = ['email', 'password', 'rememberMe'];
const otpFields = ['userId', 'otp'];
const resendOtpFields = ['userId'];
const forgotPasswordFields = ['email'];
const resetPasswordFields = ['token', 'password'];

// Public routes (with bot detection, rate limiting, and validation)
router.post(
  '/register',
  authLimiter,
  botDetection,
  rejectUnknownFields(registerFields),
  validateRegister,
  register
);
router.post(
  '/login',
  authLimiter,
  botDetection,
  rejectUnknownFields(loginFields),
  validateLogin,
  login
);
router.post(
  '/verify-otp',
  otpLimiter,
  rejectUnknownFields(otpFields),
  validateOTP,
  verifyOTP
);
router.post(
  '/resend-otp',
  otpLimiter,
  rejectUnknownFields(resendOtpFields),
  resendOTP
);
router.post(
  '/forgot-password',
  passwordResetLimiter,
  rejectUnknownFields(forgotPasswordFields),
  validateForgotPassword,
  forgotPassword
);
router.post(
  '/reset-password',
  passwordResetLimiter,
  rejectUnknownFields(resetPasswordFields),
  validatePasswordReset,
  resetPassword
);
// Logout works even with expired tokens
router.post('/logout', optionalAuth, logout);

// Google OAuth routes (only if configured)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get(
    '/google',
    passport.authenticate('google', {
      scope: ['profile', 'email'],
    })
  );

  router.get(
    '/google/callback',
    passport.authenticate('google', { session: false }),
    googleCallback
  );
} else {
  // Return error if Google OAuth is not configured
  router.get('/google', (req, res) => {
    res.status(503).json({
      success: false,
      error: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in environment variables.',
    });
  });
}

// Protected routes
router.get('/me', protect, getMe);

module.exports = router;
