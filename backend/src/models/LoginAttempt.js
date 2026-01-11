const mongoose = require('mongoose');

const loginAttemptSchema = new mongoose.Schema(
  {
    ip: {
      type: String,
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      index: true,
    },
    attempts: {
      type: Number,
      default: 1,
    },
    lastAttempt: {
      type: Date,
      default: Date.now,
    },
    isAdminEmail: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for faster lookups
loginAttemptSchema.index({ ip: 1, email: 1 });
loginAttemptSchema.index({ lastAttempt: 1 }, { expireAfterSeconds: 3600 }); // Auto-delete after 1 hour

// Method to increment attempts
loginAttemptSchema.statics.recordFailedAttempt = async function(ip, email, isAdminEmail = false) {
  const attempt = await this.findOne({ ip, email });
  
  if (attempt) {
    attempt.attempts += 1;
    attempt.lastAttempt = new Date();
    attempt.isAdminEmail = isAdminEmail;
    return await attempt.save();
  }
  
  return await this.create({
    ip,
    email,
    attempts: 1,
    isAdminEmail,
  });
};

// Method to get attempt count
loginAttemptSchema.statics.getAttemptCount = async function(ip, email) {
  const attempt = await this.findOne({ ip, email });
  return attempt ? attempt.attempts : 0;
};

// Method to reset attempts (on successful login)
loginAttemptSchema.statics.resetAttempts = async function(ip, email) {
  return await this.deleteOne({ ip, email });
};

module.exports = mongoose.model('LoginAttempt', loginAttemptSchema);
