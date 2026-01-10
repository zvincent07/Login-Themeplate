const jwt = require('jsonwebtoken');
const config = require('../config');
const crypto = require('crypto');

// Generate JWT token
const generateToken = (id, expiresIn = null) => {
  if (!config.jwtSecret || config.jwtSecret === 'your-secret-key-change-in-production') {
    throw new Error('JWT_SECRET is not configured. Please set JWT_SECRET in your .env file.');
  }
  
  if (!id) {
    throw new Error('User ID is required to generate token.');
  }
  
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: expiresIn || config.jwtExpire,
  });
};

// Generate password reset token
const generateResetToken = () => {
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  return { resetToken, hashedToken };
};

module.exports = { generateToken, generateResetToken };
