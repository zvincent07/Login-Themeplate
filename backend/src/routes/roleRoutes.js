/**
 * DEPRECATED ROUTES - Use /api/v1/roles instead
 * 
 * These routes are kept for backward compatibility.
 * New code should use the v1 routes with permission-based authorization.
 */

const express = require('express');
const router = express.Router();
const {
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  getAllPermissions,
  updateRolePermissions,
} = require('../controllers/roleController');
const { protect, authorize } = require('../middleware/auth');
const { validateMongoId } = require('../middleware/validator');

// All routes require authentication and admin authorization (deprecated - use requirePermission)
router.use(protect);
router.use(authorize('admin'));

// @route   GET /api/roles
// @desc    Get all roles
// @access  Private/Admin
router.get('/', getRoles);

// @route   GET /api/roles/:id
// @desc    Get single role
// @access  Private/Admin
router.get('/:id', validateMongoId, getRole);

// @route   POST /api/roles
// @desc    Create new role
// @access  Private/Admin
router.post('/', createRole);

// @route   PUT /api/roles/:id
// @desc    Update role
// @access  Private/Admin
router.put('/:id', validateMongoId, updateRole);

// @route   DELETE /api/roles/:id
// @desc    Delete role
// @access  Private/Admin
router.delete('/:id', validateMongoId, deleteRole);

// @route   GET /api/roles/permissions/all
// @desc    Get all permissions
// @access  Private/Admin
router.get('/permissions/all', getAllPermissions);

// @route   PUT /api/roles/:id/permissions
// @desc    Update role permissions
// @access  Private/Admin
router.put('/:id/permissions', validateMongoId, updateRolePermissions);

module.exports = router;
