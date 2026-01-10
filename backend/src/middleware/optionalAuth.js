const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');

/**
 * Optional authentication middleware
 * Tries to authenticate but doesn't fail if token is missing or expired
 * Useful for endpoints like logout that should work even with expired tokens
 */
exports.optionalAuth = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    // No token - continue without user
    return next();
  }

  try {
    // Try to verify token (will fail if expired or invalid)
    const decoded = jwt.verify(token, config.jwtSecret);

    // Token is valid - get user
    const user = await User.findById(decoded.id).select('-password').populate('role');
    
    if (user && user.isActive) {
      req.user = user;
    }
  } catch (error) {
    // Token expired, invalid, or any other error - continue without user
    // This is fine for logout - we just want to allow the request to proceed
  }

  next();
};
