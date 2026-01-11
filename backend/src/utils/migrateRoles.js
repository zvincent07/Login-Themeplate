const mongoose = require('mongoose');
const Role = require('../models/Role');
const User = require('../models/User');
const config = require('../config');
const logger = require('./logger');

/**
 * One-time migration script to:
 * 1. Find the role named 'admin' and update it to 'super admin' with description
 * 2. Ensure 'admin', 'employee', and 'user' roles exist (create if missing)
 * 3. Update users with old 'admin' role ID if needed
 */
const migrateRoles = async () => {
  try {
    // Connect to database
    await mongoose.connect(config.mongoURI);
    logger.info('Connected to database for role migration');

    // Step 1: Check if 'super admin' role exists, if not, rename 'admin' to 'super admin'
    const superAdminRole = await Role.findOne({ name: 'super admin' });
    const existingAdminRole = await Role.findOne({ name: 'admin' });
    
    if (!superAdminRole && existingAdminRole) {
        // Update 'admin' to 'super admin' (migration case)
        existingAdminRole.name = 'super admin';
        existingAdminRole.description = 'Full access to all system settings, billing, and user management.';
        await existingAdminRole.save();
      logger.info('Updated "admin" role to "super admin"');
      
      // Update all users with the old admin role
      await User.updateMany(
        { role: existingAdminRole._id },
        { roleName: 'super admin' }
      );
      logger.info('Updated user roleName from "admin" to "super admin"');
    } else if (superAdminRole) {
      logger.info('"super admin" role already exists, skipping migration');
    }

    // Step 2: Ensure all required roles exist (super admin, admin, employee, user)
    const requiredRoles = [
      { name: 'super admin', description: 'Full access to all system settings, billing, and user management.' },
      { name: 'admin', description: 'Can manage users and content, but cannot view billing or system logs.' },
      { name: 'employee', description: 'Employee account managed by admin' },
      { name: 'user', description: 'Public user account' },
    ];

    for (const roleData of requiredRoles) {
      // Check if role exists (case-insensitive)
      const existingRole = await Role.findOne({
        name: { $regex: new RegExp(`^${roleData.name}$`, 'i') },
      });
      if (!existingRole) {
        await Role.create(roleData);
        logger.info(`Created missing role: ${roleData.name}`);
      } else {
        // Update description if it's missing or if it's the old generic description
        const oldGenericDescriptions = [
          'Superuser with full system access',
          'Full system access',
          'Administrator with full system access'
        ];
        const needsUpdate = !existingRole.description || 
          (roleData.name === 'super admin' && oldGenericDescriptions.includes(existingRole.description)) ||
          (roleData.name === 'admin' && oldGenericDescriptions.includes(existingRole.description));
        
        if (needsUpdate && roleData.description) {
          existingRole.description = roleData.description;
          await existingRole.save();
          logger.info(`Updated description for role: ${roleData.name}`);
        }
      }
    }

    logger.info('Role migration completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Role migration error:', error);
    process.exit(1);
  }
};

// Run migration if called directly
if (require.main === module) {
  migrateRoles();
}

module.exports = migrateRoles;
