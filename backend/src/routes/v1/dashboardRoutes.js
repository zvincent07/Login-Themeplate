const express = require('express');
const router = express.Router();
const { getStats } = require('../../controllers/dashboardController');
const { protect, requirePermission } = require('../../middleware/auth');

router.get('/stats', protect, requirePermission('dashboard:view'), getStats);

module.exports = router;
