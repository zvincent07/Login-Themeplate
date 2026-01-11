const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');
const trackSession = require('./sessionTracker');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);

    // Get user from token
    req.user = await User.findById(decoded.id).select('-password').populate('role');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
      });
    }

    if (!req.user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'User account is inactive',
      });
    }

    // Track session (non-blocking, don't wait for it)
    // trackSession calls next() internally, so we don't need to call it again
    trackSession(req, res, next);
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route',
    });
  }
};

// Role-based authorization
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized',
      });
    }

    if (!roles.includes(req.user.roleName)) {
      return res.status(403).json({
        success: false,
        error: `User role '${req.user.roleName}' is not authorized to access this route`,
      });
    }

    next();
  };
};
