const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      required: [true, 'User must have a role'],
    },
    roleName: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    // OTP fields
    otp: {
      code: {
        type: String,
      },
      expiresAt: {
        type: Date,
      },
    },
    // Password reset fields
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpire: {
      type: Date,
    },
    // OAuth fields
    googleId: {
      type: String,
      sparse: true, // Allows multiple nulls, creates sparse index automatically
      unique: true, // Enforces uniqueness when value is present
    },
    provider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    avatar: {
      type: String,
    },
    // Admin/Employee specific fields
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    lastLogin: {
      type: Date,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance optimization
// Note: email index is automatically created by unique: true
// Note: googleId index is automatically created by unique: true + sparse: true
userSchema.index({ roleName: 1 });
userSchema.index({ isActive: 1, deletedAt: 1 }); // Compound index for active users query
userSchema.index({ isEmailVerified: 1, deletedAt: 1 }); // Compound index for verified users query
userSchema.index({ createdAt: -1 }); // For sorting by creation date
userSchema.index({ deletedAt: 1 }); // For soft delete queries
userSchema.index({ email: 1, deletedAt: 1 }); // Compound index for email search with soft delete
userSchema.index({ roleName: 1, isActive: 1, deletedAt: 1 }); // Compound index for role + status queries

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to get full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName || ''} ${this.lastName || ''}`.trim();
});

module.exports = mongoose.model('User', userSchema);
