/**
 * USER CONTROLLER (THIN)
 * 
 * Controllers MUST:
 * - Parse request
 * - Call service
 * - Return response
 * 
 * FORBIDDEN:
 * - Database logic
 * - Permission logic
 * - Business rules
 */

const asyncHandler = require('../middleware/asyncHandler');
const userService = require('../services/userService');

// @desc    Create User (Admin only)
// @route   POST /api/v1/users/employees
// @access  Private/Admin
exports.createEmployee = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, roleName = 'employee' } = req.body;
  
  const result = await userService.createUser(
    { email, password, firstName, lastName, roleName },
    req.user
  );

  res.status(201).json({
    success: true,
    message: result.requiresVerification
      ? 'User created successfully! Verification email with OTP has been sent.'
      : 'User created successfully!',
    data: {
      user: {
        id: result.user._id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        roleName: result.user.roleName,
        isEmailVerified: false,
        requiresVerification: result.requiresVerification,
      },
    },
  });
});

// @desc    Get all users (Admin only)
// @route   GET /api/v1/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';
  const roleFilter = req.query.role || '';
  const statusFilter = req.query.status || '';
  const providerFilter = req.query.provider || '';
  const sortBy = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.sortOrder || 'desc';

  // Build filters (whitelisted fields only)
  const filters = {};
  
  if (search) {
    filters.search = search;
  }
  
  if (roleFilter && roleFilter !== 'all') {
    filters.roleName = roleFilter;
  }
  
  if (statusFilter && statusFilter !== 'all') {
    if (statusFilter === 'active') {
      filters.isActive = true;
      filters.deletedAt = null;
    } else if (statusFilter === 'inactive') {
      filters.isActive = false;
      filters.deletedAt = null;
    } else if (statusFilter === 'verified') {
      filters.isEmailVerified = true;
      filters.deletedAt = null;
    } else if (statusFilter === 'unverified') {
      filters.isEmailVerified = false;
      filters.deletedAt = null;
    } else if (statusFilter === 'deleted') {
      filters.deletedAt = { $ne: null };
    }
  } else {
    filters.deletedAt = null;
  }
  
  if (providerFilter && providerFilter !== 'all') {
    filters.provider = providerFilter;
  }

  const result = await userService.getUsers(
    filters,
    { page, limit, sortBy, sortOrder },
    req.user
  );

  res.status(200).json({
    success: true,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      pages: result.pages,
    },
    count: result.users.length,
    data: result.users,
  });
});

// @desc    Get single user
// @route   GET /api/v1/users/:id
// @access  Private
exports.getUser = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id, req.user);

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Update user
// @route   PUT /api/v1/users/:id
// @access  Private
exports.updateUser = asyncHandler(async (req, res) => {
  const updatedUser = await userService.updateUser(
    req.params.id,
    req.body,
    req.user,
    req
  );

  res.status(200).json({
    success: true,
    data: updatedUser,
  });
});

// @desc    Delete user (Admin only)
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id, req.user);

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Restore deleted user (Admin only)
// @route   POST /api/v1/users/:id/restore
// @access  Private/Admin
exports.restoreUser = asyncHandler(async (req, res) => {
  const restoredUser = await userService.restoreUser(req.params.id, req.user);

  res.status(200).json({
    success: true,
    data: restoredUser,
  });
});

// @desc    Get user statistics (Admin only)
// @route   GET /api/v1/users/stats
// @access  Private/Admin
exports.getUserStats = asyncHandler(async (req, res) => {
  const stats = await userService.getUserStats(req.user);

  res.status(200).json({
    success: true,
    data: stats,
  });
});

// @desc    Get user sessions (Admin only)
// @route   GET /api/v1/users/:id/sessions
// @access  Private/Admin
exports.getUserSessions = asyncHandler(async (req, res) => {
  const currentToken = req.headers.authorization?.split(' ')[1];
  const sessions = await userService.getUserSessions(
    req.params.id,
    currentToken,
    req.user
  );

  res.status(200).json({
    success: true,
    data: sessions,
  });
});

// @desc    Terminate user session (Admin only)
// @route   DELETE /api/v1/users/:id/sessions/:sessionId
// @access  Private/Admin
exports.terminateSession = asyncHandler(async (req, res) => {
  const result = await userService.terminateSession(
    req.params.id,
    req.params.sessionId,
    req.user
  );

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

// @desc    Terminate all other user sessions except current (Admin only)
// @route   DELETE /api/v1/users/:id/sessions
// @access  Private/Admin
exports.terminateAllOtherSessions = asyncHandler(async (req, res) => {
  const currentToken = req.headers.authorization?.split(' ')[1];
  const result = await userService.terminateAllOtherSessions(
    req.params.id,
    currentToken,
    req.user
  );

  res.status(200).json({
    success: true,
    message: result.message,
    terminatedCount: result.terminatedCount,
  });
});
