/**
 * USER SERVICE TESTS
 * 
 * Test services, not controllers
 * Mock repositories
 * Test permission enforcement
 * Test business rules
 */

const userService = require('../userService');
const userRepository = require('../../repositories/userRepository');
const roleRepository = require('../../repositories/roleRepository');
const { requirePermission, canAccessResource } = require('../../permissions');

// Mock permissions module with factory to support both functions
jest.mock('../../permissions', () => ({
  requirePermission: jest.fn(),
  canAccessResource: jest.fn(),
  getPermissionsForRole: jest.fn().mockReturnValue([]),
}));
jest.mock('../../utils/auditLogger', () => ({
  createAuditLog: jest.fn(),
  createAuditLogWithChanges: jest.fn(),
}));

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create user with auto-generated password for admin role', async () => {
      const mockRole = { _id: 'role123', name: 'admin' };
      const mockUser = { _id: 'user123', email: 'test@example.com', roleName: 'admin' };

      roleRepository.findByName.mockResolvedValue(mockRole);
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue(mockUser);

      const result = await userService.createUser(
        { email: 'test@example.com', firstName: 'Test', lastName: 'User', roleName: 'admin' },
        { id: 'actor123', email: 'admin@example.com' }
      );

      expect(result.user).toBeDefined();
      expect(result.requiresVerification).toBe(true);
      expect(userRepository.create).toHaveBeenCalled();
    });

    it('should throw error if user already exists', async () => {
      userRepository.findByEmail.mockResolvedValue({ _id: 'existing123' });

      await expect(
        userService.createUser(
          { email: 'existing@example.com', firstName: 'Test', lastName: 'User' },
          { id: 'actor123' }
        )
      ).rejects.toThrow('User already exists');
    });
  });

  describe('getUsers', () => {
    it('should enforce permission before returning users', async () => {
      const mockActor = { id: 'actor123', roleName: 'admin' };
      const mockResult = { users: [], total: 0, page: 1, limit: 10, pages: 0 };

      requirePermission.mockImplementation(() => {});
      userRepository.findMany.mockResolvedValue(mockResult);

      await userService.getUsers({}, { page: 1, limit: 10 }, mockActor);

      expect(requirePermission).toHaveBeenCalledWith(mockActor, 'users:read', 'users list');
      expect(userRepository.findMany).toHaveBeenCalled();
    });

    it('should throw error if user lacks permission', async () => {
      const mockActor = { id: 'actor123', roleName: 'user' };

      requirePermission.mockImplementation(() => {
        const error = new Error('Permission denied');
        error.statusCode = 403;
        throw error;
      });

      await expect(
        userService.getUsers({}, { page: 1, limit: 10 }, mockActor)
      ).rejects.toThrow('Permission denied');
    });
  });

  describe('getUserById', () => {
    it('should allow users to view their own profile', async () => {
      const mockActor = { id: 'user123', roleName: 'user' };
      const mockUser = { _id: 'user123', email: 'test@example.com' };

      canAccessResource.mockReturnValue(true);
      userRepository.findById.mockResolvedValue(mockUser);

      const result = await userService.getUserById('user123', mockActor);

      expect(result).toEqual(mockUser);
    });

    it('should throw error if user not found', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(
        userService.getUserById('nonexistent', { id: 'actor123' })
      ).rejects.toThrow('User not found');
    });
  });

  describe('updateUser', () => {
    it('should prevent admin from editing own account', async () => {
      const mockActor = { id: 'admin123', roleName: 'admin' };
      const mockUser = { _id: 'admin123', email: 'admin@example.com' };

      canAccessResource.mockReturnValue(true);
      userRepository.findById.mockResolvedValue(mockUser);

      await expect(
        userService.updateUser('admin123', { firstName: 'New' }, mockActor, null)
      ).rejects.toThrow('You cannot edit your own account');
    });
  });

  describe('deleteUser', () => {
    it('should prevent deleting yourself', async () => {
      const mockActor = { id: 'user123' };

      await expect(
        userService.deleteUser('user123', mockActor)
      ).rejects.toThrow('Cannot delete your own account');
    });
  });
});
