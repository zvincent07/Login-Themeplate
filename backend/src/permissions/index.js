/**
 * CENTRAL PERMISSION MAP (MANDATORY)
 * 
 * Rules:
 * - Permission strings MUST be typed
 * - NEVER hardcode permissions elsewhere
 * - Roles are implementation details
 * - Permissions are the contract
 */

const ROLES = {
  'super admin': [
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
    'billing:read',
    'billing:update',
    'system:read',
    'system:manage',
    'audit-logs:read',
    'dashboard:view',
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
    'roles:read',
    'audit-logs:read',
    'dashboard:view',
  ],
  employee: [
    'employees:read',
  ],
  user: [
    // No special permissions - can only manage own profile
  ],
};

/**
 * Get permissions for a role
 */
const getPermissionsForRole = (roleName) => {
  const normalizedRole = (roleName || '').toLowerCase().trim();
  return ROLES[normalizedRole] || [];
};

/**
 * Check if user has a specific permission
 */
const hasPermission = (user, permission) => {
  if (!user || !permission) return false;
  
  const userRole = (user.roleName || '').toLowerCase().trim();
  const userPermissions = getPermissionsForRole(userRole);
  
  return userPermissions.includes(permission);
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
  // If user has the permission, they can access
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
  ROLES,
  getPermissionsForRole,
  hasPermission,
  requirePermission,
  canAccessResource,
};
