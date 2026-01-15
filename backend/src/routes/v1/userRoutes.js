const express = require('express');
const router = express.Router();
const {
  createEmployee,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  restoreUser,
  getUserStats,
  getUserSessions,
  terminateSession,
  terminateAllOtherSessions,
} = require('../../controllers/userController');
const { protect, requirePermission } = require('../../middleware/auth');
const {
  validateCreateUser,
  validateUpdateUser,
  validateMongoId,
  validatePagination,
} = require('../../middleware/validator');
const { rejectUnknownFields } = require('../../middleware/validateInput');

// All routes require authentication
router.use(protect);

// Define allowed fields for each endpoint
const createUserFields = ['email', 'password', 'firstName', 'lastName', 'roleName'];
const updateUserFields = ['firstName', 'lastName', 'email', 'password', 'role', 'roleName', 'isActive'];
const queryParams = ['page', 'limit', 'search', 'role', 'status', 'provider', 'sortBy', 'sortOrder'];

// Routes with permission-based authorization
router.post(
  '/employees',
  requirePermission('users:create'),
  rejectUnknownFields(createUserFields),
  validateCreateUser,
  createEmployee
);
router.get(
  '/',
  requirePermission('users:read'),
  validatePagination,
  getUsers
);
router.get('/stats', requirePermission('dashboard:view'), getUserStats);
router.get('/:id/sessions', requirePermission('users:view-sessions'), validateMongoId, getUserSessions);
router.delete('/:id/sessions', requirePermission('users:terminate-sessions'), validateMongoId, terminateAllOtherSessions);
router.delete('/:id/sessions/:sessionId', requirePermission('users:terminate-sessions'), validateMongoId, terminateSession);
router.delete('/:id', requirePermission('users:delete'), validateMongoId, deleteUser);
router.post('/:id/restore', requirePermission('users:restore'), validateMongoId, restoreUser);

// User routes (users can view/update their own profile)
router.get('/:id', validateMongoId, getUser);
router.put(
  '/:id',
  validateMongoId,
  rejectUnknownFields(updateUserFields),
  validateUpdateUser,
  updateUser
);

module.exports = router;
