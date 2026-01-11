const Session = require('../models/Session');
const { getIPGeolocation, parseUserAgent } = require('../utils/ipGeolocation');
const config = require('../config');

/**
 * Middleware to track user sessions
 * Creates or updates session on each authenticated request
 * This is a non-blocking middleware - it fires async operations and continues
 */
const trackSession = (req, res, next) => {
  // Only track sessions for authenticated users
  if (!req.user || !req.user.id) {
    return next();
  }

  // Get token from headers
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return next();
  }

  // Get client IP
  const ip =
    req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    'unknown';

  // Get user agent
  const userAgent = req.headers['user-agent'] || '';

  // Parse user agent
  const { platform, browser, device } = parseUserAgent(userAgent);

  // Get geolocation (async, don't wait for it)
  // Fire and forget - don't block the request
  getIPGeolocation(ip)
    .then((location) => {
      // Update or create session
      Session.findOneAndUpdate(
        { token, user: req.user.id, isActive: true },
        {
          $set: {
            ipAddress: ip,
            userAgent,
            platform,
            browser,
            device,
            location: {
              ...location,
              ipAddress: ip, // Store IP in location object too for easy access
            },
            lastActive: new Date(),
          },
          $setOnInsert: {
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        },
        { upsert: true, new: true }
      ).catch((err) => {
        // Silently fail - don't block request
      });
    })
    .catch((err) => {
      // If geolocation fails, still save session with IP but no location
      Session.findOneAndUpdate(
        { token, user: req.user.id, isActive: true },
        {
          $set: {
            ipAddress: ip,
            userAgent,
            platform,
            browser,
            device,
            lastActive: new Date(),
          },
          $setOnInsert: {
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        },
        { upsert: true, new: true }
      ).catch((err) => {
        // Silently fail - don't block request
      });
    });

  // Continue immediately without waiting for geolocation
  next();
};

module.exports = trackSession;
