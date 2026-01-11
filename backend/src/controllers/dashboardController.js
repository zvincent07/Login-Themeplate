const asyncHandler = require('../middleware/asyncHandler');
const User = require('../models/User');
const os = require('os');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private/Admin
exports.getStats = asyncHandler(async (req, res) => {
    // 1. Daily Active Users (Last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeUsersCount = await User.countDocuments({
        lastLogin: { $gte: twentyFourHoursAgo },
    });

    // 2. Server CPU Load
    // os.loadavg() returns [1, 5, 15] minute averages
    // We'll use the 1-minute average and normalize it by CPU core count to get a percentage estimate
    const cpus = os.cpus().length;
    const loadAvg = os.loadavg()[0];
    const cpuLoadPercent = Math.min(Math.round((loadAvg / cpus) * 100), 100);

    // 3. Recent Error Rate (Last 24 hours from error.log)
    let errorCount = 0;
    const errorLogPath = path.join(__dirname, '../../logs/error.log');

    if (fs.existsSync(errorLogPath)) {
        try {
            const data = fs.readFileSync(errorLogPath, 'utf8');
            const lines = data.split('\n').filter(line => line.trim() !== '');

            // Count errors in the last 24 hours
            // Assuming log format is JSON or has timestamp
            // Based on logger.js: winston.format.json() is used

            lines.forEach(line => {
                try {
                    const logEntry = JSON.parse(line);
                    if (logEntry.timestamp) {
                        const logTime = new Date(logEntry.timestamp);
                        if (logTime >= twentyFourHoursAgo) {
                            errorCount++;
                        }
                    }
                } catch (e) {
                    // If custom parsing fails, fallback or ignore
                }
            });
        } catch (err) {
            logger.error('Error reading error log for stats:', err);
        }
    }

    // Calculate error rate percentage (mocking total requests denominator for now as it's not tracked)
    // For a real system, you'd track total request count in a DB or Redis.
    // Here we'll just return the raw count and a simulated "rate" for display purposes
    // or derived relative to the "active users" as a proxy for activity.
    // Let's return the count and a "rate" assuming ~100 requests per active user per day?
    // This is an estimation.
    const estimatedRequests = Math.max(activeUsersCount * 50, 100); // Avoid divide by zero
    const errorRate = ((errorCount / estimatedRequests) * 100).toFixed(2);

    res.status(200).json({
        success: true,
        data: {
            activeUsers: {
                count: activeUsersCount,
                label: 'Daily Active Users',
            },
            cpuLoad: {
                value: cpuLoadPercent,
                label: 'Server CPU Load',
            },
            errorRate: {
                value: parseFloat(errorRate),
                count: errorCount,
                label: 'Recent Error Rate',
            },
            // Mocked revenue as requested
            revenue: {
                amount: 24500,
                trend: 4.5,
            }
        },
    });
});
