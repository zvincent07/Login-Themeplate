/**
 * @deprecated Use permissions.js instead
 * These helpers are kept for backward compatibility during migration
 * Use hasPermission() from utils/permissions.js for feature checks
 * Use isAdmin() from utils/permissions.js for navigation/routing only
 */

// Re-export from permissions.js for backward compatibility
export { isAdmin, isSuperAdmin } from './permissions';
