const User = require('../models/User');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');

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
    ];

    const createdPermissions = [];
    for (const perm of permissions) {
      const existing = await Permission.findOne({ name: perm.name });
      if (!existing) {
        const newPerm = await Permission.create(perm);
        createdPermissions.push(newPerm);
        console.log(`Created permission: ${perm.name}`);
      } else {
        createdPermissions.push(existing);
      }
    }

    // 2. Create Roles
    const roles = [
      {
        name: 'admin',
        description: 'Superuser with full system access',
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
      const existing = await Role.findOne({ name: role.name });
      if (!existing) {
        const newRole = await Role.create(role);
        createdRoles[role.name] = newRole;
        console.log(`Created role: ${role.name}`);
      } else {
        createdRoles[role.name] = existing;
      }
    }

    // 3. Create first Admin user (if doesn't exist)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';

    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      const adminUser = await User.create({
        email: adminEmail,
        password: adminPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: createdRoles.admin._id,
        roleName: 'admin',
        provider: 'local',
        isEmailVerified: true,
        isActive: true,
      });

      console.log('========================================');
      console.log('✅ First Admin Account Created!');
      console.log('========================================');
      console.log(`Email: ${adminEmail}`);
      console.log(`Password: ${adminPassword}`);
      console.log('========================================');
      console.log('⚠️  IMPORTANT: Change this password after first login!');
      console.log('========================================');
    } else {
      console.log('Admin user already exists. Skipping admin creation.');
    }

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};

module.exports = seedDatabase;
