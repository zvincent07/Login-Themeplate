/**
 * PERMISSION SYSTEM TESTS
 * 
 * Test permission utilities
 * Test permission map
 * Test access control
 */

const {
  DEFAULT_ROLE_PERMISSIONS,
  getDefaultPermissionsForRole,
  hasPermission,
  requirePermission,
  canAccessResource,
} = require('../index');

describe('Permission System', () => {
  describe('getDefaultPermissionsForRole', () => {
    it('should return default permissions for valid role', () => {
      const permissions = getDefaultPermissionsForRole('admin');
      expect(permissions).toBeInstanceOf(Array);
      expect(permissions.length).toBeGreaterThan(0);
    });

    it('should return empty array for invalid role', () => {
      const permissions = getDefaultPermissionsForRole('invalid');
      expect(permissions).toEqual([]);
    });

    it('should handle case-insensitive role names', () => {
      const permissions1 = getDefaultPermissionsForRole('admin');
      const permissions2 = getDefaultPermissionsForRole('ADMIN');
      expect(permissions1).toEqual(permissions2);
    });
  });

  describe('hasPermission', () => {
    // 1. Super Admin God Mode
    it('should return true for Super Admin regardless of permissions', () => {
      const user = { role: { name: 'Super Admin' } };
      expect(hasPermission(user, 'any:permission')).toBe(true);
    });

    it('should return true for Super Admin (case insensitive)', () => {
      const user = { role: { name: 'super admin' } };
      expect(hasPermission(user, 'any:permission')).toBe(true);
    });

    // 2. DB-Driven Check
    it('should return true if user has permission in DB role', () => {
      const user = { 
        role: { 
          name: 'admin',
          permissions: [
            { name: 'users:read' },
            { name: 'users:create' }
          ]
        } 
      };
      expect(hasPermission(user, 'users:read')).toBe(true);
    });

    it('should return false if user lacks permission in DB role', () => {
      const user = { 
        role: { 
          name: 'admin',
          permissions: [
            { name: 'users:read' }
          ]
        } 
      };
      expect(hasPermission(user, 'users:delete')).toBe(false);
    });

    it('should handle string permissions in DB role (legacy/simple)', () => {
      const user = { 
        role: { 
          name: 'admin',
          permissions: ['users:read']
        } 
      };
      expect(hasPermission(user, 'users:read')).toBe(true);
    });

    it('should return false if role is missing', () => {
      const user = { };
      expect(hasPermission(user, 'users:read')).toBe(false);
    });

    it('should return false for null user', () => {
      expect(hasPermission(null, 'users:read')).toBe(false);
    });
  });

  describe('requirePermission', () => {
    it('should not throw if user has permission', () => {
      const user = { role: { name: 'Super Admin' } };
      expect(() => requirePermission(user, 'users:read', 'test')).not.toThrow();
    });

    it('should throw error if user lacks permission', () => {
      const user = { role: { name: 'user', permissions: [] } };
      expect(() => requirePermission(user, 'users:read', 'test')).toThrow();
    });
  });

  describe('canAccessResource', () => {
    it('should allow access if user has permission', () => {
      const actor = { id: 'actor123', role: { name: 'Super Admin' } };
      expect(canAccessResource(actor, 'resource123', 'users:read')).toBe(true);
    });

    it('should allow access if user owns resource', () => {
      const actor = { id: 'user123', role: { name: 'user', permissions: [] } };
      expect(canAccessResource(actor, 'user123', 'users:read')).toBe(true);
    });

    it('should deny access if user lacks permission and does not own resource', () => {
      const actor = { id: 'user123', role: { name: 'user', permissions: [] } };
      expect(canAccessResource(actor, 'other123', 'users:read')).toBe(false);
    });
  });
});
