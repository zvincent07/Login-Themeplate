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

    // Get user from token with deep population for permissions
    req.user = await User.findById(decoded.id)
      .select('-password')
      .populate({
        path: 'role',
        populate: {
          path: 'permissions',
          model: 'Permission'
        }
      });

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

// Permission-based authorization (preferred)
exports.requirePermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized',
      });
    }

    const { hasPermission } = require('../permissions');
    
    // User must have at least one of the required permissions
    const isAuthorized = permissions.some(permission => hasPermission(req.user, permission));

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: `Permission denied. Required: ${permissions.join(' or ')}`,
      });
    }

    next();
  };
};

// Role-based authorization (deprecated - use requirePermission instead)
// Kept for backward compatibility during migration
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized',
      });
    }

    const userRole = req.user.roleName?.toLowerCase();
    const allowedRoles = roles.map(r => r.toLowerCase());
    
    // 'admin' authorization also includes 'super admin'
    const isAuthorized = allowedRoles.includes(userRole) || 
      (allowedRoles.includes('admin') && userRole === 'super admin');

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: `User role '${req.user.roleName}' is not authorized to access this route`,
      });
    }

    next();
  };
};
