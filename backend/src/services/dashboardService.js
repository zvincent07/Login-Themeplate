/**
 * DASHBOARD SERVICE
 * 
 * Services MUST:
 * - Contain business rules
 * - Enforce permissions
 * - Coordinate repositories
 */

const userRepository = require('../repositories/userRepository');
const { requirePermission } = require('../permissions');
const os = require('os');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class DashboardService {
  /**
   * Get dashboard statistics (enforces permissions)
   */
  async getStats(actor) {
    requirePermission(actor, 'dashboard:view', 'dashboard statistics');

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 1. Daily Active Users (Last 24 hours)
    const activeUsersCount = await userRepository.count({
      lastLogin: { $gte: twentyFourHoursAgo },
      deletedAt: null,
    });

    // 2. Server CPU Load
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
            // Ignore parsing errors
          }
        });
      } catch (err) {
        logger.error('Error reading error log for stats:', err);
      }
    }

    // Calculate error rate percentage
    const estimatedRequests = Math.max(activeUsersCount * 50, 100);
    const errorRate = ((errorCount / estimatedRequests) * 100).toFixed(2);

    return {
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
      revenue: {
        amount: 24500,
        trend: 4.5,
      },
    };
  }
}

module.exports = new DashboardService();
