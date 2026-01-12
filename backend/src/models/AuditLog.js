const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    actorEmail: String,
    actorName: String,
    action: {
      type: String,
      required: true,
    },
    resourceType: {
      type: String,
      required: true,
      enum: ['user', 'role', 'session', 'auth', 'system'],
    },
    resourceId: {
      type: String,
      required: true,
    },
    resourceName: String,
    details: {
      type: mongoose.Schema.Types.Mixed,
    },
    ip: String,
    userAgent: String,
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ resourceType: 1, createdAt: -1 });
auditLogSchema.index({ actorEmail: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

