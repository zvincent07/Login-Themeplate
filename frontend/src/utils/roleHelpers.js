/**
 * Check if a user has admin privileges (super admin or admin)
 * @param {string} roleName - The role name to check
 * @returns {boolean} - True if user is admin or super admin
 */
export const isAdmin = (roleName) => {
  if (!roleName) return false;
  const role = roleName.toLowerCase();
  return role === 'admin' || role === 'super admin';
};

/**
 * Check if a user has super admin privileges
 * @param {string} roleName - The role name to check
 * @returns {boolean} - True if user is super admin
 */
export const isSuperAdmin = (roleName) => {
  if (!roleName) return false;
  return roleName.toLowerCase() === 'super admin';
};
