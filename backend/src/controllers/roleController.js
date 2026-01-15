/**
 * ROLE CONTROLLER (THIN)
 * 
 * Controllers MUST:
 * - Parse request
 * - Call service
 * - Return response
 */

const asyncHandler = require('../middleware/asyncHandler');
const roleService = require('../services/roleService');

// @desc    Get all roles
// @route   GET /api/v1/roles
// @access  Private/Admin
exports.getRoles = asyncHandler(async (req, res) => {
  const roles = await roleService.getRoles(req.user);

  res.status(200).json({
    success: true,
    count: roles.length,
    data: roles,
  });
});

// @desc    Get all permissions (auto-seeds if empty)
// @route   GET /api/v1/roles/permissions/all
// @access  Private/Admin
exports.getAllPermissions = asyncHandler(async (req, res) => {
  const permissions = await roleService.getAllPermissions(req.user);

  res.status(200).json({
    success: true,
    count: permissions.length,
    data: permissions,
  });
});

// @desc    Update role permissions
// @route   PUT /api/v1/roles/:id/permissions
// @access  Private/Admin
exports.updateRolePermissions = asyncHandler(async (req, res) => {
  const { permissionIds } = req.body;

  const updatedRole = await roleService.updateRolePermissions(
    req.params.id,
    permissionIds,
    req.user
  );

  res.status(200).json({
    success: true,
    message: 'Role permissions updated successfully',
    data: updatedRole,
  });
});

// @desc    Get single role
// @route   GET /api/v1/roles/:id
// @access  Private/Admin
exports.getRole = asyncHandler(async (req, res) => {
  const role = await roleService.getRoleById(req.params.id, req.user);

  res.status(200).json({
    success: true,
    data: role,
  });
});

// @desc    Create new role
// @route   POST /api/v1/roles
// @access  Private/Admin
exports.createRole = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const role = await roleService.createRole({ name, description }, req.user);

  res.status(201).json({
    success: true,
    message: 'Role created successfully',
    data: role,
  });
});

// @desc    Update role
// @route   PUT /api/v1/roles/:id
// @access  Private/Admin
exports.updateRole = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const updatedRole = await roleService.updateRole(
    req.params.id,
    { name, description },
    req.user
  );

  res.status(200).json({
    success: true,
    message: 'Role updated successfully',
    data: updatedRole,
  });
});

// @desc    Delete role
// @route   DELETE /api/v1/roles/:id
// @access  Private/Admin
exports.deleteRole = asyncHandler(async (req, res) => {
  await roleService.deleteRole(req.params.id, req.user);

  res.status(200).json({
    success: true,
    message: 'Role deleted successfully',
    data: {},
  });
});
