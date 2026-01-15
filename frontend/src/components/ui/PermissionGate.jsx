/**
 * PERMISSION GATE COMPONENT
 * 
 * Conditionally renders children based on user permissions
 * 
 * Usage:
 * <PermissionGate user={user} permission="users:create">
 *   <Button>Create User</Button>
 * </PermissionGate>
 * 
 * <PermissionGate user={user} permission="users:delete" fallback={<p>No permission</p>}>
 *   <Button>Delete</Button>
 * </PermissionGate>
 */

import { hasPermission } from '../../utils/permissions';

const PermissionGate = ({
  user,
  permission,
  children,
  fallback = null,
  requireAll = false, // If multiple permissions provided, require all or any
  permissions = [], // Array of permissions (alternative to single permission)
}) => {
  // Support both single permission and array of permissions
  const perms = permission ? [permission] : permissions;

  if (perms.length === 0) {
    // No permissions specified, show children
    return <>{children}</>;
  }

  // Check permissions
  const hasAccess = requireAll
    ? perms.every((perm) => hasPermission(user, perm))
    : perms.some((perm) => hasPermission(user, perm));

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

export default PermissionGate;
