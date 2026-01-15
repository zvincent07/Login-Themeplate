/**
 * ROLE SERVICE
 * 
 * Services MUST:
 * - Contain business rules
 * - Enforce permissions
 * - Coordinate repositories
 * - Enforce invariants
 */

const roleRepository = require('../repositories/roleRepository');
const permissionRepository = require('../repositories/permissionRepository');
const userRepository = require('../repositories/userRepository');
const { requirePermission } = require('../permissions');
const { createAuditLog } = require('../utils/auditLogger');

class RoleService {
  /**
   * Get all roles (enforces permissions)
   */
  async getRoles(actor) {
    requirePermission(actor, 'roles:read', 'roles list');

    const roles = await roleRepository.findAll();

    // Get user count and sample users for each role
    const rolesWithUserCount = await Promise.all(
      roles.map(async (role) => {
        // Use User model directly for role-based queries
        const userCount = await userRepository.countByRole(role._id);

        // Get first 3 users for avatar stack display
        const sampleUsers = await userRepository.findByRole(role._id, {
          limit: 3,
          select: 'firstName lastName email avatar',
        });

        return {
          ...role,
          userCount,
          users: sampleUsers || [],
        };
      })
    );

    return rolesWithUserCount;
  }

  /**
   * Get all permissions (enforces permissions, auto-seeds if empty)
   */
  async getAllPermissions(actor) {
    requirePermission(actor, 'roles:read', 'permissions list');

    let permissions = await permissionRepository.findAll();

    // Auto-seed permissions if none exist
    if (permissions.length === 0) {
      const seedPermissions = [
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

      permissions = await permissionRepository.createMany(seedPermissions);
    }

    // Sort permissions
    permissions.sort((a, b) => {
      if (a.resource !== b.resource) {
        return a.resource.localeCompare(b.resource);
      }
      const actionOrder = ['read', 'create', 'update', 'delete', 'manage'];
      return actionOrder.indexOf(a.action) - actionOrder.indexOf(b.action);
    });

    return permissions;
  }

  /**
   * Update role permissions (enforces permissions and business rules)
   */
  async updateRolePermissions(roleId, permissionIds, actor) {
    requirePermission(actor, 'roles:update', 'role permissions');

    const role = await roleRepository.findById(roleId);
    if (!role) {
      const error = new Error('Role not found');
      error.statusCode = 404;
      throw error;
    }

    // Business rule: Prevent updating system roles
    const systemRoles = ['admin', 'user', 'super admin', 'employee'];
    if (systemRoles.includes(role.name.toLowerCase())) {
      const error = new Error(`Cannot update permissions for system role "${role.name}"`);
      error.statusCode = 400;
      throw error;
    }

    // Validate permission IDs
    if (!Array.isArray(permissionIds)) {
      const error = new Error('permissionIds must be an array');
      error.statusCode = 400;
      throw error;
    }

    // Verify all permission IDs exist
    const validPermissions = await permissionRepository.findByIds(permissionIds);
    if (validPermissions.length !== permissionIds.length) {
      const error = new Error('One or more permission IDs are invalid');
      error.statusCode = 400;
      throw error;
    }

    // Update role permissions
    const updatedRole = await roleRepository.updateById(roleId, {
      permissions: permissionIds,
    });

    // Populate permissions
    const Permission = require('../models/Permission');
    const roleWithPermissions = await Permission.populate(updatedRole, 'permissions');

    return roleWithPermissions;
  }

  /**
   * Get single role (enforces permissions)
   */
  async getRoleById(roleId, actor) {
    requirePermission(actor, 'roles:read', 'role details');

    const role = await roleRepository.findById(roleId);
    if (!role) {
      const error = new Error('Role not found');
      error.statusCode = 404;
      throw error;
    }

    // Get user count
    const userCount = await userRepository.countByRole(role._id);

    // Populate permissions
    const Permission = require('../models/Permission');
    const roleWithPermissions = await Permission.populate(role, 'permissions');

    return {
      ...roleWithPermissions,
      userCount,
    };
  }

  /**
   * Create role (enforces permissions and business rules)
   */
  async createRole(roleData, actor) {
    requirePermission(actor, 'roles:create', 'role creation');

    const { name, description } = roleData;

    if (!name || !name.trim()) {
      const error = new Error('Role name is required');
      error.statusCode = 400;
      throw error;
    }

    const normalizedName = name.trim();

    // Check if role already exists
    const existingRole = await roleRepository.findByName(normalizedName);
    if (existingRole) {
      const error = new Error(`Role with name "${normalizedName}" already exists`);
      error.statusCode = 400;
      throw error;
    }

    // Create role
    const role = await roleRepository.create({
      name: normalizedName,
      description: description?.trim() || '',
    });

    // Audit log
    createAuditLog({
      req: { user: actor },
      action: 'ROLE_CREATED',
      resourceType: 'role',
      resourceId: role._id.toString(),
      resourceName: role.name,
      details: {
        description: role.description,
      },
    });

    return role;
  }

  /**
   * Update role (enforces permissions and business rules)
   */
  async updateRole(roleId, updateData, actor) {
    requirePermission(actor, 'roles:update', 'role update');

    const role = await roleRepository.findById(roleId);
    if (!role) {
      const error = new Error('Role not found');
      error.statusCode = 404;
      throw error;
    }

    // Business rule: Prevent updating system roles
    const systemRoles = ['admin', 'user'];
    if (systemRoles.includes(role.name.toLowerCase())) {
      const error = new Error(`Cannot update system role "${role.name}"`);
      error.statusCode = 400;
      throw error;
    }

    const { name, description } = updateData;
    const updateFields = {};

    // If name is being updated, check for duplicates
    if (name && name.trim() !== role.name) {
      const normalizedName = name.trim();

      const existingRole = await roleRepository.findByName(normalizedName);
      if (existingRole && existingRole._id.toString() !== roleId) {
        const error = new Error(`Role with name "${normalizedName}" already exists`);
        error.statusCode = 400;
        throw error;
      }

      updateFields.name = normalizedName;

      // Update roleName for all users with this role
      await userRepository.updateRoleNameForRole(roleId, normalizedName);
    }

    // Update description if provided
    if (description !== undefined) {
      updateFields.description = description?.trim() || '';
    }

    const updatedRole = await roleRepository.updateById(roleId, updateFields);

    // Get user count
    const userCount = await userRepository.count({
      roleName: updatedRole.name,
      deletedAt: null,
    });

    // Audit log
    createAuditLog({
      req: { user: actor },
      action: 'ROLE_UPDATED',
      resourceType: 'role',
      resourceId: updatedRole._id.toString(),
      resourceName: updatedRole.name,
      details: {
        updatedFields: Object.keys(updateFields),
      },
    });

    return {
      ...updatedRole,
      userCount,
    };
  }

  /**
   * Delete role (enforces permissions and business rules)
   */
  async deleteRole(roleId, actor) {
    requirePermission(actor, 'roles:delete', 'role deletion');

    const role = await roleRepository.findById(roleId);
    if (!role) {
      const error = new Error('Role not found');
      error.statusCode = 404;
      throw error;
    }

    // Business rule: Prevent deleting system roles
    const systemRoles = ['admin', 'user', 'super admin'];
    if (systemRoles.includes(role.name.toLowerCase())) {
      const error = new Error(`Cannot delete system role "${role.name}"`);
      error.statusCode = 400;
      throw error;
    }

    // Business rule: Check if any users are assigned to this role
    const userCount = await userRepository.countByRole(role._id);

    if (userCount > 0) {
      const error = new Error(
        `Cannot delete role. ${userCount} user(s) are assigned to this role. Please reassign users before deleting.`
      );
      error.statusCode = 400;
      throw error;
    }

    await roleRepository.deleteById(roleId);

    // Audit log
    createAuditLog({
      req: { user: actor },
      action: 'ROLE_DELETED',
      resourceType: 'role',
      resourceId: role._id.toString(),
      resourceName: role.name,
      details: {
        description: role.description,
      },
    });

    return {};
  }
}

module.exports = new RoleService();
