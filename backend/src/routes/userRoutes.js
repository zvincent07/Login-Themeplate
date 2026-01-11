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
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const {
  validateCreateUser,
  validateUpdateUser,
  validateMongoId,
  validatePagination,
} = require('../middleware/validator');

// All routes require authentication
router.use(protect);

// Admin only routes
router.post('/employees', authorize('admin'), validateCreateUser, createEmployee);
router.get('/', authorize('admin'), validatePagination, getUsers);
router.get('/stats', authorize('admin'), getUserStats);
router.delete('/:id', authorize('admin'), validateMongoId, deleteUser);
router.post('/:id/restore', authorize('admin'), validateMongoId, restoreUser);

// User routes (users can view/update their own profile)
router.get('/:id', validateMongoId, getUser);
router.put('/:id', validateMongoId, validateUpdateUser, updateUser);

module.exports = router;
