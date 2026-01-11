const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
    },
    platform: {
      type: String, // e.g., "Windows", "macOS", "Linux", "iOS", "Android"
    },
    browser: {
      type: String, // e.g., "Chrome", "Firefox", "Safari", "Edge"
    },
    device: {
      type: String, // e.g., "Desktop", "Mobile", "Tablet"
    },
    location: {
      country: String,
      region: String,
      city: String,
      latitude: Number,
      longitude: Number,
      timezone: String,
      isp: String,
    },
    lastActive: {
      type: Date,
      default: Date.now,
      // Index is created via schema.index() below for TTL
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user sessions query
sessionSchema.index({ user: 1, isActive: 1, lastActive: -1 });

// TTL index to automatically delete expired sessions
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// TTL index to automatically delete inactive sessions older than 30 days
// This prevents database bloat from old session records
sessionSchema.index({ lastActive: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // 30 days

// Method to check if session is expired
sessionSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

module.exports = mongoose.model('Session', sessionSchema);
