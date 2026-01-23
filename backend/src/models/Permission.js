const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Permission name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    resource: {
      type: String,
      required: true,
      trim: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'create', 
        'read', 
        'update', 
        'delete', 
        'manage', 
        'restore', 
        'view-sessions', 
        'terminate-sessions', 
        'view'
      ],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for resource + action
permissionSchema.index({ resource: 1, action: 1 }, { unique: true });

module.exports = mongoose.model('Permission', permissionSchema);
