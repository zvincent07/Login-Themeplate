const User = require('../models/User');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const bcrypt = require('bcryptjs');
const logger = require('./logger');
const { DEFAULT_ROLE_PERMISSIONS } = require('../permissions');

const seedDatabase = async () => {
  try {
    // 1. Create Permissions
    const permissions = [
      { name: 'users:create', description: 'Create users', resource: 'users', action: 'create' },
      { name: 'users:read', description: 'Read users', resource: 'users', action: 'read' },
      { name: 'users:update', description: 'Update users', resource: 'users', action: 'update' },
      { name: 'users:delete', description: 'Delete users', resource: 'users', action: 'delete' },
      { name: 'users:manage', description: 'Manage all users', resource: 'users', action: 'manage' },
      { name: 'users:restore', description: 'Restore users', resource: 'users', action: 'restore' },
      { name: 'users:view-sessions', description: 'View user sessions', resource: 'users', action: 'view-sessions' },
      { name: 'users:terminate-sessions', description: 'Terminate user sessions', resource: 'users', action: 'terminate-sessions' },
      { name: 'employees:create', description: 'Create employees', resource: 'employees', action: 'create' },
      { name: 'employees:read', description: 'Read employees', resource: 'employees', action: 'read' },
      { name: 'employees:update', description: 'Update employees', resource: 'employees', action: 'update' },
      { name: 'employees:delete', description: 'Delete employees', resource: 'employees', action: 'delete' },
      { name: 'roles:create', description: 'Create roles', resource: 'roles', action: 'create' },
      { name: 'roles:read', description: 'Read roles', resource: 'roles', action: 'read' },
      { name: 'roles:update', description: 'Update roles', resource: 'roles', action: 'update' },
      { name: 'roles:delete', description: 'Delete roles', resource: 'roles', action: 'delete' },
      { name: 'roles:manage', description: 'Manage all roles', resource: 'roles', action: 'manage' },
      { name: 'billing:read', description: 'View billing information', resource: 'billing', action: 'read' },
      { name: 'billing:update', description: 'Update billing settings', resource: 'billing', action: 'update' },
      { name: 'system:read', description: 'View system logs', resource: 'system', action: 'read' },
      { name: 'system:manage', description: 'Manage system settings', resource: 'system', action: 'manage' },
      { name: 'audit-logs:read', description: 'View audit logs', resource: 'audit-logs', action: 'read' },
      { name: 'dashboard:view', description: 'View dashboard', resource: 'dashboard', action: 'view' },
    ];

    const createdPermissions = [];
    for (const perm of permissions) {
      // Check by resource and action to avoid unique constraint violation
      let existing = await Permission.findOne({ resource: perm.resource, action: perm.action });
      
      if (!existing) {
        // Fallback: check by name just in case
        existing = await Permission.findOne({ name: perm.name });
      }

      if (!existing) {
        const newPerm = await Permission.create(perm);
        createdPermissions.push(newPerm);
      } else {
        // Update name if it's different (migration from dot to colon)
        let updated = false;
        if (existing.name !== perm.name) {
          existing.name = perm.name;
          updated = true;
        }
        if (perm.description && existing.description !== perm.description) {
          existing.description = perm.description;
          updated = true;
        }
        
        if (updated) {
          await existing.save();
        }
        createdPermissions.push(existing);
      }
    }

    // 2. Create Roles (super admin, admin, employee, user)
    const rolesToSeed = [
      {
        name: 'super admin',
        description: 'Full access to all system settings, billing, and user management.',
      },
      {
        name: 'admin',
        description: 'Can manage users and content, but cannot view billing or system logs.',
      },
      {
        name: 'employee',
        description: 'Employee account managed by admin',
      },
      {
        name: 'user',
        description: 'Public user account',
      },
    ];

    const createdRoles = {};
    for (const roleDef of rolesToSeed) {
      // Determine permissions based on DEFAULT_ROLE_PERMISSIONS
      let rolePermIds = [];
      
      if (roleDef.name === 'super admin') {
        // Assign ALL permissions to Super Admin (for UI consistency, even if God Mode exists)
        rolePermIds = createdPermissions.map(p => p._id);
      } else {
        // Assign specific permissions
        const allowedPermNames = DEFAULT_ROLE_PERMISSIONS[roleDef.name] || [];
        rolePermIds = createdPermissions
          .filter(p => allowedPermNames.includes(p.name))
          .map(p => p._id);
      }

      const roleData = {
        ...roleDef,
        permissions: rolePermIds,
      };

      // Check if role exists (case-insensitive)
      const existing = await Role.findOne({
        name: { $regex: new RegExp(`^${roleDef.name}$`, 'i') },
      });

      if (!existing) {
        const newRole = await Role.create(roleData);
        createdRoles[roleDef.name] = newRole;
      } else {
        // Update permissions and description (Hybrid Model: ensure defaults are set)
        // Note: For existing roles, we might not want to overwrite permissions if user edited them.
        // But for "first run" or "seed", we typically ensure defaults.
        // User asked: "inserts the default 'Employee' permissions into the DB on the first run"
        // So maybe only if role doesn't exist?
        // But if I want to "Fix" existing DB, I should probably update permissions if they are empty.
        
        // Safety check: if admin role is missing critical permissions (like dashboard:view), add them
        if (roleDef.name === 'admin' && rolePermIds.length > 0) {
             const currentPermIds = existing.permissions.map(p => p.toString());
             let changed = false;
             
             for (const id of rolePermIds) {
                 if (!currentPermIds.includes(id.toString())) {
                     existing.permissions.push(id);
                     changed = true;
                 }
             }
             
             if (changed) {
                 await existing.save();
                 logger.info(`Updated existing 'admin' role with missing default permissions`);
             }
        } else if (existing.permissions.length === 0 && rolePermIds.length > 0) {
            existing.permissions = rolePermIds;
            await existing.save();
        }

        createdRoles[roleDef.name] = existing;
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
