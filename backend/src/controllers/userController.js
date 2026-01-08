const asyncHandler = require('../middleware/asyncHandler');
const User = require('../models/User');
const Role = require('../models/Role');

// @desc    Create Employee (Admin only)
// @route   POST /api/users/employees
// @access  Private/Admin
exports.createEmployee = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    return res.status(400).json({
      success: false,
      error: 'User already exists',
    });
  }

  // Get 'employee' role
  const employeeRole = await Role.findOne({ name: 'employee' });

  if (!employeeRole) {
    return res.status(500).json({
      success: false,
      error: 'Employee role not found. Please seed the database.',
    });
  }

  // Create employee
  const employee = await User.create({
    email,
    password,
    firstName,
    lastName,
    role: employeeRole._id,
    roleName: 'employee',
    provider: 'local',
    createdBy: req.user.id,
    isEmailVerified: false,
  });

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: employee._id,
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        roleName: employee.roleName,
      },
    },
  });
});

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res) => {
  const users = await User.find()
    .select('-password')
    .populate('role')
    .populate('createdBy', 'email firstName lastName')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
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

  user = await User.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  }).select('-password').populate('role');

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

  await user.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});
