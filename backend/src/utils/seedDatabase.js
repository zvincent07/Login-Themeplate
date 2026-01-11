const User = require('../models/User');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const bcrypt = require('bcryptjs');
const logger = require('./logger');

const seedDatabase = async () => {
  try {
    // 1. Create Permissions
    const permissions = [
      { name: 'users.create', description: 'Create users', resource: 'users', action: 'create' },
      { name: 'users.read', description: 'Read users', resource: 'users', action: 'read' },
      { name: 'users.update', description: 'Update users', resource: 'users', action: 'update' },
      { name: 'users.delete', description: 'Delete users', resource: 'users', action: 'delete' },
      { name: 'users.manage', description: 'Manage all users', resource: 'users', action: 'manage' },
      { name: 'employees.create', description: 'Create employees', resource: 'employees', action: 'create' },
      { name: 'employees.read', description: 'Read employees', resource: 'employees', action: 'read' },
      { name: 'employees.update', description: 'Update employees', resource: 'employees', action: 'update' },
      { name: 'employees.delete', description: 'Delete employees', resource: 'employees', action: 'delete' },
      { name: 'roles.create', description: 'Create roles', resource: 'roles', action: 'create' },
      { name: 'roles.read', description: 'Read roles', resource: 'roles', action: 'read' },
      { name: 'roles.update', description: 'Update roles', resource: 'roles', action: 'update' },
      { name: 'roles.delete', description: 'Delete roles', resource: 'roles', action: 'delete' },
      { name: 'roles.manage', description: 'Manage all roles', resource: 'roles', action: 'manage' },
      { name: 'billing.read', description: 'View billing information', resource: 'billing', action: 'read' },
      { name: 'billing.update', description: 'Update billing settings', resource: 'billing', action: 'update' },
      { name: 'system.read', description: 'View system logs', resource: 'system', action: 'read' },
      { name: 'system.manage', description: 'Manage system settings', resource: 'system', action: 'manage' },
    ];

    const createdPermissions = [];
    for (const perm of permissions) {
      const existing = await Permission.findOne({ name: perm.name });
      if (!existing) {
        const newPerm = await Permission.create(perm);
        createdPermissions.push(newPerm);
      } else {
        createdPermissions.push(existing);
      }
    }

    // 2. Create Roles (super admin, admin, employee, user)
    const roles = [
      {
        name: 'super admin',
        description: 'Full access to all system settings, billing, and user management.',
        permissions: createdPermissions.map(p => p._id), // All permissions
      },
      {
        name: 'admin',
        description: 'Can manage users and content, but cannot view billing or system logs.',
        permissions: createdPermissions.map(p => p._id), // All permissions
      },
      {
        name: 'employee',
        description: 'Employee account managed by admin',
        permissions: createdPermissions
          .filter(p => p.resource === 'employees' && p.action === 'read')
          .map(p => p._id),
      },
      {
        name: 'user',
        description: 'Public user account',
        permissions: [], // No special permissions
      },
    ];

    const createdRoles = {};
    for (const role of roles) {
      // Check if role exists (case-insensitive)
      const existing = await Role.findOne({
        name: { $regex: new RegExp(`^${role.name}$`, 'i') },
      });
      if (!existing) {
        const newRole = await Role.create(role);
        createdRoles[role.name] = newRole;
      } else {
        // Update description if missing
        if (!existing.description && role.description) {
          existing.description = role.description;
          await existing.save();
        }
        createdRoles[role.name] = existing;
      }
    }

    // 3. Create first Admin user (if doesn't exist) - assign to 'super admin' role
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';

    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      // Use 'super admin' role (fallback to 'admin' if 'super admin' doesn't exist)
      const superAdminRole = createdRoles['super admin'] || createdRoles['admin'];
      
      const adminUser = await User.create({
        email: adminEmail,
        password: adminPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: superAdminRole._id,
        roleName: 'super admin',
        provider: 'local',
        isEmailVerified: true,
        isActive: true,
      });
      
      logger.info(`Admin user created with email: ${adminEmail} and role: super admin`);
    } else {
      // If admin user exists but has old 'admin' role, update to 'super admin'
      if (existingAdmin.roleName === 'admin' && createdRoles['super admin']) {
        existingAdmin.role = createdRoles['super admin']._id;
        existingAdmin.roleName = 'super admin';
        await existingAdmin.save();
        logger.info(`Updated existing admin user to 'super admin' role`);
      }
    }

    logger.info('Database seeding completed successfully');
  } catch (error) {
    logger.error('Database seeding error:', error);
    throw error;
  }
};

module.exports = seedDatabase;
