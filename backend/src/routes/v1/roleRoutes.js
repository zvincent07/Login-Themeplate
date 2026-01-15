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
} = require('../../controllers/roleController');
const { protect, requirePermission } = require('../../middleware/auth');
const { validateMongoId } = require('../../middleware/validator');
const { rejectUnknownFields } = require('../../middleware/validateInput');

// All routes require authentication
router.use(protect);

// Define allowed fields
const createRoleFields = ['name', 'description'];
const updateRoleFields = ['name', 'description'];
const updatePermissionsFields = ['permissionIds'];

// Routes with permission-based authorization
router.get('/', requirePermission('roles:read'), getRoles);
router.get('/permissions/all', requirePermission('roles:read'), getAllPermissions);
router.get('/:id', requirePermission('roles:read'), validateMongoId, getRole);
router.post(
  '/',
  requirePermission('roles:create'),
  rejectUnknownFields(createRoleFields),
  createRole
);
router.put(
  '/:id',
  requirePermission('roles:update'),
  validateMongoId,
  rejectUnknownFields(updateRoleFields),
  updateRole
);
router.delete('/:id', requirePermission('roles:delete'), validateMongoId, deleteRole);
router.put(
  '/:id/permissions',
  requirePermission('roles:update'),
  validateMongoId,
  rejectUnknownFields(updatePermissionsFields),
  updateRolePermissions
);

module.exports = router;
