/**
 * CENTRAL PERMISSION MAP (MANDATORY)
 * 
 * Rules:
 * - Permission strings MUST be typed
 * - NEVER hardcode permissions elsewhere
 * - Roles are implementation details
 * - Permissions are the contract
 */

// Default permissions for seeding - acts as a reference, not hardcoded enforcement (except God Mode)
const DEFAULT_ROLE_PERMISSIONS = {
  'super admin': [
    // God Mode - effectively has all permissions
    '*',
  ],
  admin: [
    'users:create',
    'users:read',
    'users:update',
    'users:delete',
    'users:manage',
    'users:restore',
    'users:view-sessions',
    'users:terminate-sessions',
    'employees:create',
    'employees:read',
    'employees:update',
    'employees:delete',
    'roles:create',
    'roles:read',
    'roles:update',
    'roles:delete',
    'roles:manage',
    'audit-logs:read',
    'dashboard:view',
    'billing:read',
    'billing:update',
  ],
  employee: [
    'employees:read',
  ],
  user: [
    // No special permissions - can only manage own profile
  ],
};

/**
 * Get default permissions for a role (for seeding)
 */
const getDefaultPermissionsForRole = (roleName) => {
  const normalizedRole = (roleName || '').toLowerCase().trim();
  return DEFAULT_ROLE_PERMISSIONS[normalizedRole] || [];
};

/**
 * Check if user has a specific permission
 * Implements Hybrid Model:
 * 1. Super Admin: God Mode (always true)
 * 2. Others: DB-driven permissions
 */
const hasPermission = (user, permission) => {
  if (!user) return false;
  
  // 1. God Mode for Super Admin
  const roleName = (user.role?.name || user.roleName || '').toLowerCase().trim();
  if (roleName === 'super admin') {
    return true;
  }
  
  // 2. DB-Driven Check
  // Assuming user.role.permissions is populated as an array of Permission objects (with name property)
  // or strings if it's a flat array.
  
  if (user.role && Array.isArray(user.role.permissions)) {
    // Check if permissions are objects or strings
    const userPermissions = user.role.permissions.map(p => 
      typeof p === 'object' ? p.name : p
    );
    return userPermissions.includes(permission);
  }

  // Fallback for legacy/incomplete objects (e.g. during login before populate)
  // This shouldn't happen often if auth middleware is correct
  return false;
};

/**
 * Require permission - throws error if user doesn't have permission
 */
const requirePermission = (user, permission, resourceName = 'resource') => {
  if (!hasPermission(user, permission)) {
    const error = new Error(`Permission denied: ${permission} required to access ${resourceName}`);
    error.statusCode = 403;
    error.code = 'PERMISSION_DENIED';
    throw error;
  }
};

/**
 * Check if user can access resource (ownership check)
 */
const canAccessResource = (user, resourceUserId, permission) => {
  // If user has the permission (includes Super Admin God Mode), they can access
  if (hasPermission(user, permission)) {
    return true;
  }
  
  // Users can always access their own resources
  if (user.id && resourceUserId && user.id.toString() === resourceUserId.toString()) {
    return true;
  }
  
  return false;
};

module.exports = {
  DEFAULT_ROLE_PERMISSIONS, // Exported for seeding
  getDefaultPermissionsForRole,
  hasPermission,
  requirePermission,
  canAccessResource,
};
