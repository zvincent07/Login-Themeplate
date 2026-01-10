const BannedIP = require('../models/BannedIP');

/**
 * Utility to unban an IP address
 * Usage: node -e "require('./src/utils/unbanIP').unbanIP('127.0.0.1')"
 */
const unbanIP = async (ip) => {
  try {
    const result = await BannedIP.deleteMany({ ip });
    return {
      success: true,
      message: `Unbanned IP: ${ip}`,
      deletedCount: result.deletedCount,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Unban all expired IPs
 */
const unbanExpired = async () => {
  try {
    const result = await BannedIP.deleteMany({
      expiresAt: { $lt: new Date() },
    });
    return {
      success: true,
      message: `Unbanned ${result.deletedCount} expired IP(s)`,
      deletedCount: result.deletedCount,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * List all banned IPs
 */
const listBanned = async () => {
  try {
    const banned = await BannedIP.find({
      expiresAt: { $gt: new Date() },
    }).sort({ bannedAt: -1 });
    
    return {
      success: true,
      banned: banned.map(b => ({
        ip: b.ip,
        reason: b.reason,
        bannedAt: b.bannedAt,
        expiresAt: b.expiresAt,
        attempts: b.attempts,
      })),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  unbanIP,
  unbanExpired,
  listBanned,
};

// If run directly, allow unbanning from command line
if (require.main === module) {
  const ip = process.argv[2];
  if (ip) {
    unbanIP(ip).then(result => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    });
  } else {
    console.log('Usage: node unbanIP.js <IP_ADDRESS>');
    console.log('Example: node unbanIP.js 127.0.0.1');
  }
}
