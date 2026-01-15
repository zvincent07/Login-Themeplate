/**
 * PERMISSION SYSTEM TESTS
 * 
 * Test permission utilities
 * Test permission map
 * Test access control
 */

const {
  ROLES,
  getPermissionsForRole,
  hasPermission,
  requirePermission,
  canAccessResource,
} = require('../index');

describe('Permission System', () => {
  describe('getPermissionsForRole', () => {
    it('should return permissions for valid role', () => {
      const permissions = getPermissionsForRole('admin');
      expect(permissions).toBeInstanceOf(Array);
      expect(permissions.length).toBeGreaterThan(0);
    });

    it('should return empty array for invalid role', () => {
      const permissions = getPermissionsForRole('invalid');
      expect(permissions).toEqual([]);
    });

    it('should handle case-insensitive role names', () => {
      const permissions1 = getPermissionsForRole('admin');
      const permissions2 = getPermissionsForRole('ADMIN');
      expect(permissions1).toEqual(permissions2);
    });
  });

  describe('hasPermission', () => {
    it('should return true if user has permission', () => {
      const user = { roleName: 'admin' };
      expect(hasPermission(user, 'users:read')).toBe(true);
    });

    it('should return false if user lacks permission', () => {
      const user = { roleName: 'user' };
      expect(hasPermission(user, 'users:read')).toBe(false);
    });

    it('should return false for null user', () => {
      expect(hasPermission(null, 'users:read')).toBe(false);
    });
  });

  describe('requirePermission', () => {
    it('should not throw if user has permission', () => {
      const user = { roleName: 'admin' };
      expect(() => requirePermission(user, 'users:read', 'test')).not.toThrow();
    });

    it('should throw error if user lacks permission', () => {
      const user = { roleName: 'user' };
      expect(() => requirePermission(user, 'users:read', 'test')).toThrow();
    });
  });

  describe('canAccessResource', () => {
    it('should allow access if user has permission', () => {
      const actor = { id: 'actor123', roleName: 'admin' };
      expect(canAccessResource(actor, 'resource123', 'users:read')).toBe(true);
    });

    it('should allow access if user owns resource', () => {
      const actor = { id: 'user123', roleName: 'user' };
      expect(canAccessResource(actor, 'user123', 'users:read')).toBe(true);
    });

    it('should deny access if user lacks permission and does not own resource', () => {
      const actor = { id: 'user123', roleName: 'user' };
      expect(canAccessResource(actor, 'other123', 'users:read')).toBe(false);
    });
  });
});
