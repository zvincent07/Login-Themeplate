const asyncHandler = require('../middleware/asyncHandler');
const Role = require('../models/Role');
const User = require('../models/User');
const Permission = require('../models/Permission');
const { createAuditLog } = require('../utils/auditLogger');

// @desc    Get all roles
// @route   GET /api/roles
// @access  Private/Admin
exports.getRoles = asyncHandler(async (req, res) => {
  const roles = await Role.find().sort({ name: 1 });

  // Get user count and sample users for each role (for avatar stack)
  const rolesWithUserCount = await Promise.all(
    roles.map(async (role) => {
      const userCount = await User.countDocuments({
        role: role._id,
        deletedAt: null,
      });
      
      // Get first 3 users for avatar stack display
      const sampleUsers = await User.find({
        role: role._id,
        deletedAt: null,
      })
        .select('firstName lastName email avatar')
        .limit(3)
        .lean();
      
      return {
        ...role.toObject(),
        userCount,
        users: sampleUsers, // Include sample users for avatar stack
      };
    })
  );

  res.status(200).json({
    success: true,
    count: rolesWithUserCount.length,
    data: rolesWithUserCount,
  });
});

// @desc    Get all permissions (auto-seeds if empty)
// @route   GET /api/roles/permissions/all
// @access  Private/Admin
exports.getAllPermissions = asyncHandler(async (req, res) => {
  let permissions = await Permission.find().sort({ resource: 1, action: 1 });

  // Auto-seed permissions if none exist
  if (permissions.length === 0) {
    const seedPermissions = [
      { name: 'users.create', description: 'Create users', resource: 'users', action: 'create' },
      { name: 'users.read', description: 'Read users', resource: 'users', action: 'read' },
      { name: 'users.update', description: 'Update users', resource: 'users', action: 'update' },
      { name: 'users.delete', description: 'Delete users', resource: 'users', action: 'delete' },
      { name: 'users.manage', description: 'Manage all users', resource: 'users', action: 'manage' },
      { name: 'employees.create', description: 'Create employees', resource: 'employees', action: 'create' },
      { name: 'employees.read', description: 'Read employees', resource: 'employees', action: 'read' },
      { name: 'employees.update', description: 'Update employees', resource: 'employees', action: 'update' },
      { name: 'employees.delete', description: 'Delete employees', resource: 'employees', action: 'delete' },
      { name: 'roles.create', description: 'Create roles', resource: 'roles', action: 'create' },
      { name: 'roles.read', description: 'Read roles', resource: 'roles', action: 'read' },
      { name: 'roles.update', description: 'Update roles', resource: 'roles', action: 'update' },
      { name: 'roles.delete', description: 'Delete roles', resource: 'roles', action: 'delete' },
      { name: 'roles.manage', description: 'Manage all roles', resource: 'roles', action: 'manage' },
      { name: 'billing.read', description: 'View billing information', resource: 'billing', action: 'read' },
      { name: 'billing.update', description: 'Update billing settings', resource: 'billing', action: 'update' },
      { name: 'system.read', description: 'View system logs', resource: 'system', action: 'read' },
      { name: 'system.manage', description: 'Manage system settings', resource: 'system', action: 'manage' },
    ];

    // Create permissions
    const createdPermissions = await Permission.insertMany(seedPermissions);
    permissions = createdPermissions.sort((a, b) => {
      if (a.resource !== b.resource) {
        return a.resource.localeCompare(b.resource);
      }
      const actionOrder = ['read', 'create', 'update', 'delete', 'manage'];
      return actionOrder.indexOf(a.action) - actionOrder.indexOf(b.action);
    });
  }

  res.status(200).json({
    success: true,
    count: permissions.length,
    data: permissions,
  });
});

// @desc    Update role permissions
// @route   PUT /api/roles/:id/permissions
// @access  Private/Admin
exports.updateRolePermissions = asyncHandler(async (req, res) => {
  const { permissionIds } = req.body;
  const role = await Role.findById(req.params.id);

  if (!role) {
    return res.status(404).json({
      success: false,
      error: 'Role not found',
    });
  }

  // Prevent updating system roles
  const systemRoles = ['admin', 'user', 'super admin', 'employee'];
  if (systemRoles.includes(role.name.toLowerCase())) {
    return res.status(400).json({
      success: false,
      error: `Cannot update permissions for system role "${role.name}"`,
    });
  }

  // Validate permission IDs
  if (!Array.isArray(permissionIds)) {
    return res.status(400).json({
      success: false,
      error: 'permissionIds must be an array',
    });
  }

  // Verify all permission IDs exist
  const validPermissions = await Permission.find({
    _id: { $in: permissionIds },
  });

  if (validPermissions.length !== permissionIds.length) {
    return res.status(400).json({
      success: false,
      error: 'One or more permission IDs are invalid',
    });
  }

  // Update role permissions
  role.permissions = permissionIds;
  await role.save();

  // Get updated role with populated permissions
  const updatedRole = await Role.findById(role._id).populate('permissions');

  res.status(200).json({
    success: true,
    message: 'Role permissions updated successfully',
    data: updatedRole,
  });
});

// @desc    Get single role
// @route   GET /api/roles/:id
// @access  Private/Admin
exports.getRole = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id).populate('permissions');

  if (!role) {
    return res.status(404).json({
      success: false,
      error: 'Role not found',
    });
  }

  // Get user count for this role
  const userCount = await User.countDocuments({
    role: role._id,
    deletedAt: null,
  });

  res.status(200).json({
    success: true,
    data: {
      ...role.toObject(),
      userCount,
    },
  });
});

// @desc    Create new role
// @route   POST /api/roles
// @access  Private/Admin
exports.createRole = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  // Validate required fields
  if (!name) {
    return res.status(400).json({
      success: false,
      error: 'Role name is required',
    });
  }

  // Normalize name (trim and lowercase for consistency, but store as provided)
  const normalizedName = name.trim();

  // Check if role already exists (case-insensitive)
  const existingRole = await Role.findOne({
    name: { $regex: new RegExp(`^${normalizedName}$`, 'i') },
  });

  if (existingRole) {
    return res.status(400).json({
      success: false,
      error: `Role with name "${normalizedName}" already exists`,
    });
  }

  // Create role
  const role = await Role.create({
    name: normalizedName,
    description: description?.trim() || '',
  });

  res.status(201).json({
    success: true,
    message: 'Role created successfully',
    data: role,
  });

  // Audit log (fire and forget)
  createAuditLog({
    req,
    action: 'ROLE_CREATED',
    resourceType: 'role',
    resourceId: role._id.toString(),
    resourceName: role.name,
    details: {
      description: role.description,
    },
  });
});

// @desc    Update role
// @route   PUT /api/roles/:id
// @access  Private/Admin
exports.updateRole = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  let role = await Role.findById(req.params.id);

  if (!role) {
    return res.status(404).json({
      success: false,
      error: 'Role not found',
    });
  }

  // Prevent updating system roles (admin, user) - allow super admin to be updated
  const systemRoles = ['admin', 'user'];
  if (systemRoles.includes(role.name.toLowerCase())) {
    return res.status(400).json({
      success: false,
      error: `Cannot update system role "${role.name}"`,
    });
  }

  // If name is being updated, check for duplicates
  if (name && name.trim() !== role.name) {
    const normalizedName = name.trim();
    
    // Check if another role with this name exists (case-insensitive)
    const existingRole = await Role.findOne({
      name: { $regex: new RegExp(`^${normalizedName}$`, 'i') },
      _id: { $ne: role._id },
    });

    if (existingRole) {
      return res.status(400).json({
        success: false,
        error: `Role with name "${normalizedName}" already exists`,
      });
    }

    role.name = normalizedName;

    // Update roleName for all users with this role
    await User.updateMany(
      { role: role._id },
      { roleName: normalizedName }
    );
  }

  // Update description if provided
  if (description !== undefined) {
    role.description = description?.trim() || '';
  }

  await role.save();

  // Get updated role with user count
  const userCount = await User.countDocuments({
    role: role._id,
    deletedAt: null,
  });

  res.status(200).json({
    success: true,
    message: 'Role updated successfully',
    data: {
      ...role.toObject(),
      userCount,
    },
  });

  // Audit log (fire and forget)
  createAuditLog({
    req,
    action: 'ROLE_UPDATED',
    resourceType: 'role',
    resourceId: role._id.toString(),
    resourceName: role.name,
    details: {
      updatedFields: Object.keys(req.body || {}),
    },
  });
});

// @desc    Delete role
// @route   DELETE /api/roles/:id
// @access  Private/Admin
exports.deleteRole = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);

  if (!role) {
    return res.status(404).json({
      success: false,
      error: 'Role not found',
    });
  }

  // Prevent deleting system roles
  const systemRoles = ['admin', 'user', 'super admin'];
  if (systemRoles.includes(role.name.toLowerCase())) {
    return res.status(400).json({
      success: false,
      error: `Cannot delete system role "${role.name}"`,
    });
  }

  // Check if any users are assigned to this role
  const userCount = await User.countDocuments({
    role: role._id,
    deletedAt: null,
  });

  if (userCount > 0) {
    return res.status(400).json({
      success: false,
      error: `Cannot delete role. ${userCount} user(s) are assigned to this role. Please reassign users before deleting.`,
    });
  }

  await Role.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Role deleted successfully',
    data: {},
  });

  // Audit log (fire and forget)
  createAuditLog({
    req,
    action: 'ROLE_DELETED',
    resourceType: 'role',
    resourceId: role._id.toString(),
    resourceName: role.name,
    details: {
      description: role.description,
    },
  });
});
