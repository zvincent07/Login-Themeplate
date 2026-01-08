const express = require('express');
const router = express.Router();
const {
  createEmployee,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Admin only routes
router.post('/employees', authorize('admin'), createEmployee);
router.get('/', authorize('admin'), getUsers);
router.delete('/:id', authorize('admin'), deleteUser);

// User routes (users can view/update their own profile)
router.get('/:id', getUser);
router.put('/:id', updateUser);

module.exports = router;
