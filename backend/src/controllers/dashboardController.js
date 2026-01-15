/**
 * DASHBOARD CONTROLLER (THIN)
 * 
 * Controllers MUST:
 * - Parse request
 * - Call service
 * - Return response
 */

const asyncHandler = require('../middleware/asyncHandler');
const dashboardService = require('../services/dashboardService');

// @desc    Get dashboard statistics
// @route   GET /api/v1/dashboard/stats
// @access  Private/Admin
exports.getStats = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getStats(req.user);

  res.status(200).json({
    success: true,
    data: stats,
  });
});
