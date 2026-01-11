const asyncHandler = require('../middleware/asyncHandler');
const User = require('../models/User');
const Role = require('../models/Role');
const Session = require('../models/Session');
const { generateOTP, getOTPExpiry } = require('../utils/generateOTP');
const { sendOTPEmail } = require('../services/emailService');
const crypto = require('crypto');

// @desc    Create User (Admin only) - Supports Admin, Employee, and User roles
// @route   POST /api/users/employees
// @access  Private/Admin
exports.createEmployee = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, roleName = 'employee' } = req.body;

  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    return res.status(400).json({
      success: false,
      error: 'User already exists',
    });
  }

  // Get role (case-insensitive search)
  const role = await Role.findOne({
    name: { $regex: new RegExp(`^${roleName}$`, 'i') },
  });

  if (!role) {
    return res.status(500).json({
      success: false,
      error: `${roleName} role not found. Please seed the database.`,
    });
  }

  // Auto-generate password for Admin and Employee roles
  let userPassword = password;
  let shouldSendOTP = false;

  if (roleName === 'admin' || roleName === 'employee') {
    // Generate secure random password
    userPassword = crypto.randomBytes(12).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
    shouldSendOTP = true;
  } else if (!password) {
    // User role requires password
    return res.status(400).json({
      success: false,
      error: 'Password is required for user role',
    });
  }

  // Generate OTP for Admin and Employee
  let otpCode = null;
  let otpExpiresAt = null;
  
  if (shouldSendOTP) {
    otpCode = generateOTP();
    otpExpiresAt = getOTPExpiry();
  }

  // Create user
  const userData = {
    email,
    password: userPassword,
    firstName,
    lastName,
    role: role._id,
    roleName,
    provider: 'local',
    createdBy: req.user.id,
    isEmailVerified: false,
  };

  if (shouldSendOTP) {
    userData.otp = {
      code: otpCode,
      expiresAt: otpExpiresAt,
    };
  }

  const newUser = await User.create(userData);

  // Send OTP email for Admin and Employee (include password and userId)
  if (shouldSendOTP) {
    try {
      await sendOTPEmail(email, otpCode, firstName, userPassword, newUser._id.toString());
    } catch (error) {
      // If email fails, delete the user and return error
      await User.findByIdAndDelete(newUser._id);
      return res.status(500).json({
        success: false,
        error: 'Failed to send verification email. Please try again.',
      });
    }
  }

  res.status(201).json({
    success: true,
    message: shouldSendOTP 
      ? 'User created successfully! Verification email with OTP has been sent.'
      : 'User created successfully!',
    data: {
      user: {
        id: newUser._id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        roleName: newUser.roleName,
        isEmailVerified: false,
        requiresVerification: shouldSendOTP,
      },
    },
  });
});

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const search = req.query.search || '';
  const roleFilter = req.query.role || '';
  const statusFilter = req.query.status || '';
  const providerFilter = req.query.provider || '';
  const sortBy = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.sortOrder || 'desc';

  // Build query for filtering
  const query = {};

  // Search filter (email, firstName, lastName)
  if (search) {
    query.$or = [
      { email: { $regex: search, $options: 'i' } },
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
    ];
  }

  // Role filter
  if (roleFilter && roleFilter !== 'all') {
    query.roleName = roleFilter;
  }

  // Status filter
  if (statusFilter && statusFilter !== 'all') {
    if (statusFilter === 'active') {
      query.isActive = true;
      query.deletedAt = null; // Only show non-deleted active users
    } else if (statusFilter === 'inactive') {
      query.isActive = false;
      query.deletedAt = null; // Only show non-deleted inactive users
    } else if (statusFilter === 'verified') {
      query.isEmailVerified = true;
      query.deletedAt = null; // Only show non-deleted verified users
    } else if (statusFilter === 'unverified') {
      query.isEmailVerified = false;
      query.deletedAt = null; // Only show non-deleted unverified users
    } else if (statusFilter === 'deleted') {
      query.deletedAt = { $ne: null }; // Only show deleted users
    }
  } else {
    // By default, exclude deleted users unless explicitly filtering for them
    query.deletedAt = null;
  }

  // Provider filter
  if (providerFilter && providerFilter !== 'all') {
    query.provider = providerFilter;
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Get total count for pagination (with filters applied)
  const total = await User.countDocuments(query);

  const users = await User.find(query)
    .select('-password')
    .populate('role')
    .populate('createdBy', 'email firstName lastName')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    success: true,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    count: users.length,
    data: users,
  });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password')
    .populate('role')
    .populate('createdBy', 'email firstName lastName');

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found',
    });
  }

  // Users can only view their own profile unless they're admin
  if (req.user.roleName !== 'admin' && req.user.id !== req.params.id) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to view this user',
    });
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
exports.updateUser = asyncHandler(async (req, res) => {
  let user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found',
    });
  }

  // Users can only update their own profile unless they're admin
  if (req.user.roleName !== 'admin' && req.user.id !== req.params.id) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to update this user',
    });
  }

  // Admins can update role, but regular users cannot
  const updateData = { ...req.body };
  if (req.user.roleName !== 'admin') {
    delete updateData.role;
    delete updateData.roleName;
    delete updateData.isActive;
  }

  // Prevent admins from editing/deactivating their own account
  if (req.user.roleName === 'admin' && req.user.id === req.params.id) {
    // Completely prevent editing own account through admin panel
    // This prevents accidental self-modification that could lock the admin out
    return res.status(400).json({
      success: false,
      error: 'You cannot edit your own account.',
    });
  }

  // Handle password update - need to hash it before saving
  // If password is provided, mark it as modified so the pre-save hook will hash it
  if (updateData.password) {
    user.password = updateData.password;
    delete updateData.password; // Remove from updateData, we'll set it directly
  }

  // Update other fields
  Object.keys(updateData).forEach((key) => {
    user[key] = updateData[key];
  });

  // Save the user (this will trigger the password hashing hook if password was changed)
  await user.save();

  // Return updated user without password
  user = await User.findById(req.params.id)
    .select('-password')
    .populate('role');

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found',
    });
  }

  // Prevent deleting yourself
  if (req.user.id === req.params.id) {
    return res.status(400).json({
      success: false,
      error: 'Cannot delete your own account',
    });
  }

  // Soft delete: set deletedAt timestamp
  user.deletedAt = new Date();
  await user.save();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Restore deleted user (Admin only)
// @route   POST /api/users/:id/restore
// @access  Private/Admin
exports.restoreUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found',
    });
  }

  if (!user.deletedAt) {
    return res.status(400).json({
      success: false,
      error: 'User is not deleted',
    });
  }

  // Restore: clear deletedAt
  user.deletedAt = null;
  await user.save();

  // Return updated user without password
  const restoredUser = await User.findById(req.params.id)
    .select('-password')
    .populate('role')
    .populate('createdBy', 'email firstName lastName');

  res.status(200).json({
    success: true,
    data: restoredUser,
  });
});

// @desc    Get user statistics (Admin only)
// @route   GET /api/users/stats
// @access  Private/Admin
exports.getUserStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments({ deletedAt: null });
  const activeUsers = await User.countDocuments({ isActive: true, deletedAt: null });
  const unverifiedUsers = await User.countDocuments({ isEmailVerified: false, deletedAt: null });

  res.status(200).json({
    success: true,
    data: {
      total: totalUsers,
      active: activeUsers,
      unverified: unverifiedUsers,
    },
  });
});

// @desc    Get user sessions (Admin only)
// @route   GET /api/users/:id/sessions
// @access  Private/Admin
exports.getUserSessions = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const currentToken = req.headers.authorization?.split(' ')[1];

  // Build query for active sessions
  const query = {
    user: userId,
    isActive: true,
    expiresAt: { $gt: new Date() },
  };

  // Get all active sessions (no pagination - show all in scrollable list)
  const sessions = await Session.find(query)
    .sort({ lastActive: -1 })
    .select('-token'); // Don't expose tokens

  // Mark current session
  const sessionsWithCurrent = sessions.map((session) => {
    const sessionObj = session.toObject();
    sessionObj.isCurrent = false;
    return sessionObj;
  });

  // Mark the session matching current token as current
  if (sessionsWithCurrent.length > 0 && currentToken) {
    const currentSession = await Session.findOne({
      user: userId,
      token: currentToken,
      isActive: true,
    }).select('_id');
    
    if (currentSession) {
      sessionsWithCurrent.forEach((session) => {
        if (session._id.toString() === currentSession._id.toString()) {
          session.isCurrent = true;
        }
      });
    }
  }

  res.status(200).json({
    success: true,
    data: sessionsWithCurrent,
  });
});

// @desc    Terminate user session (Admin only)
// @route   DELETE /api/users/:id/sessions/:sessionId
// @access  Private/Admin
exports.terminateSession = asyncHandler(async (req, res) => {
  const { id: userId, sessionId } = req.params;

  const session = await Session.findOne({
    _id: sessionId,
    user: userId,
    isActive: true,
  });

  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'Session not found',
    });
  }

  // Deactivate session
  session.isActive = false;
  await session.save();

  res.status(200).json({
    success: true,
    message: 'Session terminated successfully',
  });
});

// @desc    Terminate all other user sessions except current (Admin only)
// @route   DELETE /api/users/:id/sessions
// @access  Private/Admin
exports.terminateAllOtherSessions = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const currentToken = req.headers.authorization?.split(' ')[1];

  if (!currentToken) {
    return res.status(400).json({
      success: false,
      error: 'Current session token is required',
    });
  }

  // Find the current session
  const currentSession = await Session.findOne({
    user: userId,
    token: currentToken,
    isActive: true,
  });

  if (!currentSession) {
    return res.status(404).json({
      success: false,
      error: 'Current session not found',
    });
  }

  // Deactivate all other sessions except the current one
  const result = await Session.updateMany(
    {
      user: userId,
      isActive: true,
      _id: { $ne: currentSession._id },
    },
    {
      $set: { isActive: false },
    }
  );

  res.status(200).json({
    success: true,
    message: `Terminated ${result.modifiedCount} session(s) successfully`,
    terminatedCount: result.modifiedCount,
  });
});
