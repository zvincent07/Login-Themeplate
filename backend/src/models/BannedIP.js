const mongoose = require('mongoose');

const bannedIPSchema = new mongoose.Schema(
  {
    ip: {
      type: String,
      required: [true, 'IP address is required'],
      unique: true,
    },
    reason: {
      type: String,
      required: true,
      enum: ['bot_detection', 'suspicious_activity', 'manual_ban', 'failed_admin_login'],
      default: 'bot_detection',
    },
    bannedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: function() {
        // Ban for 24 hours by default
        return new Date(Date.now() + 24 * 60 * 60 * 1000);
      },
    },
    movementData: {
      type: mongoose.Schema.Types.Mixed,
    },
    attempts: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups (ip already has unique index, so only add expiresAt)
bannedIPSchema.index({ expiresAt: 1 });

// Method to check if IP is banned
bannedIPSchema.statics.isBanned = async function(ip) {
  const banned = await this.findOne({
    ip,
    expiresAt: { $gt: new Date() },
  });
  return !!banned;
};

// Method to ban an IP
bannedIPSchema.statics.banIP = async function(ip, reason, movementData = null, banDurationHours = 24) {
  const existing = await this.findOne({ ip });
  
  if (existing) {
    // Update existing ban
    existing.reason = reason;
    existing.bannedAt = new Date();
    existing.expiresAt = new Date(Date.now() + banDurationHours * 60 * 60 * 1000);
    existing.attempts += 1;
    if (movementData) {
      existing.movementData = movementData;
    }
    return await existing.save();
  }
  
  // Create new ban
  return await this.create({
    ip,
    reason,
    movementData,
    attempts: 1,
    expiresAt: new Date(Date.now() + banDurationHours * 60 * 60 * 1000),
  });
};

module.exports = mongoose.model('BannedIP', bannedIPSchema);
