/**
 * FRONTEND PERMISSION SYSTEM
 * 
 * Rules:
 * - Permission strings MUST match backend permissions
 * - NEVER hardcode permissions elsewhere
 * - Roles are implementation details
 * - Permissions are the contract
 * - Client checks are UX only (server enforces)
 */

/**
 * Central permission map (matches backend)
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
 * @param {string} roleName - The role name
 * @returns {string[]} - Array of permission strings
 */
export const getPermissionsForRole = (roleName) => {
  if (!roleName) return [];
  const normalizedRole = roleName.toLowerCase().trim();
  return ROLES[normalizedRole] || [];
};

/**
 * Check if user has a specific permission
 * @param {object} user - User object (must have roleName property)
 * @param {string} permission - Permission string to check
 * @returns {boolean} - True if user has permission
 */
export const hasPermission = (user, permission) => {
  if (!user || !permission) return false;
  
  const userRole = (user.roleName || '').toLowerCase().trim();
  const userPermissions = getPermissionsForRole(userRole);
  
  return userPermissions.includes(permission);
};

/**
 * Require permission - throws error if user doesn't have permission
 * Use this for client-side guards (UX only - server enforces)
 * @param {object} user - User object
 * @param {string} permission - Permission string required
 * @param {string} resourceName - Name of resource for error message
 * @throws {Error} - If user doesn't have permission
 */
export const requirePermission = (user, permission, resourceName = 'resource') => {
  if (!hasPermission(user, permission)) {
    const error = new Error(`Permission denied: ${permission} required to access ${resourceName}`);
    error.code = 'PERMISSION_DENIED';
    throw error;
  }
};

/**
 * Check if user can access resource (ownership check)
 * @param {object} user - User object
 * @param {string|number} resourceUserId - ID of resource owner
 * @param {string} permission - Permission string to check
 * @returns {boolean} - True if user can access
 */
export const canAccessResource = (user, resourceUserId, permission) => {
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

/**
 * Check if user is admin (for navigation/routing - use permissions for features)
 * @param {string} roleName - Role name to check
 * @returns {boolean} - True if admin or super admin
 */
export const isAdmin = (roleName) => {
  if (!roleName) return false;
  const role = roleName.toLowerCase();
  return role === 'admin' || role === 'super admin';
};

/**
 * Check if user is super admin
 * @param {string} roleName - Role name to check
 * @returns {boolean} - True if super admin
 */
export const isSuperAdmin = (roleName) => {
  if (!roleName) return false;
  return roleName.toLowerCase() === 'super admin';
};

export default {
  ROLES,
  getPermissionsForRole,
  hasPermission,
  requirePermission,
  canAccessResource,
  isAdmin,
  isSuperAdmin,
};
