const jwt = require('jsonwebtoken');
const config = require('../config');
const crypto = require('crypto');

// Generate JWT token
const generateToken = (id, expiresIn = null) => {
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
