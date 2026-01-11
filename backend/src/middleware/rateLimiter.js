const rateLimit = require('express-rate-limit');

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Custom key generator that handles trust proxy safely
const keyGenerator = (req) => {
  // Use the first IP in the chain if behind proxy, otherwise use direct connection IP
  const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
  return ip;
};

// General API rate limiter
// Skip rate limiting for auth routes since they have their own stricter limiters
// More lenient in development mode
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 100, // More lenient in development (1000 vs 100)
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: keyGenerator, // Custom key generator to handle trust proxy safely
  trustProxy: false, // Don't trust proxy in rate limiter - we handle it in Express
  skip: (req) => {
    // Skip rate limiting for auth routes (they have their own limiters)
    return req.path.startsWith('/api/auth/');
  },
});

// Strict rate limiter for authentication endpoints
// More lenient in development mode
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 50 : 5, // More lenient in development (50 vs 5)
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  keyGenerator: keyGenerator,
  trustProxy: false,
});

// Rate limiter for password reset
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    error: 'Too many password reset attempts, please try again after 1 hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyGenerator,
  trustProxy: false,
});

// Rate limiter for OTP requests
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 OTP requests per 15 minutes
  message: {
    success: false,
    error: 'Too many OTP requests, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyGenerator,
  trustProxy: false,
});

module.exports = {
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
  otpLimiter,
};
