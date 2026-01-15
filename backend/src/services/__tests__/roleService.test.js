/**
 * ROLE SERVICE TESTS
 * 
 * Test role business logic
 * Mock repositories
 * Test permission enforcement
 * Test business rules (system roles protection)
 */

const roleService = require('../roleService');
const roleRepository = require('../../repositories/roleRepository');
const permissionRepository = require('../../repositories/permissionRepository');
const { requirePermission } = require('../../permissions');

jest.mock('../../repositories/roleRepository');
jest.mock('../../repositories/permissionRepository');
jest.mock('../../repositories/userRepository');
jest.mock('../../permissions');
jest.mock('../../utils/auditLogger', () => ({
  createAuditLog: jest.fn(),
}));

describe('RoleService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRoles', () => {
    it('should enforce permission before returning roles', async () => {
      const mockActor = { id: 'actor123', roleName: 'admin' };
      const mockRoles = [{ _id: 'role1', name: 'admin' }];

      requirePermission.mockImplementation(() => {});
      roleRepository.findAll.mockResolvedValue(mockRoles);

      await roleService.getRoles(mockActor);

      expect(requirePermission).toHaveBeenCalledWith(mockActor, 'roles:read', 'roles list');
    });
  });

  describe('createRole', () => {
    it('should create role with permission check', async () => {
      const mockActor = { id: 'actor123', roleName: 'admin' };
      const mockRole = { _id: 'role123', name: 'newrole', description: 'New role' };

      requirePermission.mockImplementation(() => {});
      roleRepository.findByName.mockResolvedValue(null);
      roleRepository.create.mockResolvedValue(mockRole);

      const result = await roleService.createRole(
        { name: 'newrole', description: 'New role' },
        mockActor
      );

      expect(result).toEqual(mockRole);
      expect(requirePermission).toHaveBeenCalledWith(mockActor, 'roles:create', 'role creation');
    });

    it('should throw error if role already exists', async () => {
      const mockActor = { id: 'actor123' };
      const existingRole = { _id: 'existing', name: 'existing' };

      requirePermission.mockImplementation(() => {});
      roleRepository.findByName.mockResolvedValue(existingRole);

      await expect(
        roleService.createRole({ name: 'existing' }, mockActor)
      ).rejects.toThrow('already exists');
    });
  });

  describe('updateRole', () => {
    it('should prevent updating system roles', async () => {
      const mockActor = { id: 'actor123', roleName: 'admin' };
      const systemRole = { _id: 'role123', name: 'admin' };

      requirePermission.mockImplementation(() => {});
      roleRepository.findById.mockResolvedValue(systemRole);

      await expect(
        roleService.updateRole('role123', { name: 'newadmin' }, mockActor)
      ).rejects.toThrow('Cannot update system role');
    });
  });

  describe('deleteRole', () => {
    it('should prevent deleting system roles', async () => {
      const mockActor = { id: 'actor123' };
      const systemRole = { _id: 'role123', name: 'admin' };

      requirePermission.mockImplementation(() => {});
      roleRepository.findById.mockResolvedValue(systemRole);

      await expect(
        roleService.deleteRole('role123', mockActor)
      ).rejects.toThrow('Cannot delete system role');
    });

    it('should prevent deleting role with assigned users', async () => {
      const mockActor = { id: 'actor123' };
      const role = { _id: 'role123', name: 'custom' };
      const User = require('../../models/User');

      requirePermission.mockImplementation(() => {});
      roleRepository.findById.mockResolvedValue(role);
      User.countDocuments.mockResolvedValue(5); // 5 users assigned

      await expect(
        roleService.deleteRole('role123', mockActor)
      ).rejects.toThrow('Cannot delete role');
    });
  });
});
