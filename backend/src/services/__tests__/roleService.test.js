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
const userRepository = require('../../repositories/userRepository');
const { requirePermission } = require('../../permissions');

jest.mock('../../repositories/roleRepository');
jest.mock('../../repositories/permissionRepository');
jest.mock('../../repositories/userRepository');
jest.mock('../../permissions');
jest.mock('../../utils/auditLogger', () => ({
  createAuditLog: jest.fn(),
}));

// Mock Mongoose models if needed for populate
jest.mock('../../models/Permission', () => ({
  populate: jest.fn().mockImplementation((doc) => doc),
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
      userRepository.countByRole.mockResolvedValue(0); // Mock user count
      userRepository.findByRole.mockResolvedValue([]); // Mock sample users

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
    it('should prevent updating Super Admin', async () => {
      const mockActor = { id: 'actor123', roleName: 'admin' };
      const systemRole = { _id: 'role123', name: 'Super Admin' };

      requirePermission.mockImplementation(() => {});
      roleRepository.findById.mockResolvedValue(systemRole);

      await expect(
        roleService.updateRole('role123', { name: 'newadmin' }, mockActor)
      ).rejects.toThrow('Cannot update system role');
    });

    it('should ALLOW updating Admin (Hybrid Model)', async () => {
      const mockActor = { id: 'actor123', roleName: 'super admin' };
      const adminRole = { _id: 'role123', name: 'admin', description: 'Old desc' };
      const updatedRole = { ...adminRole, description: 'New desc' };

      requirePermission.mockImplementation(() => {});
      roleRepository.findById.mockResolvedValue(adminRole);
      roleRepository.updateById.mockResolvedValue(updatedRole);
      userRepository.count.mockResolvedValue(0);

      const result = await roleService.updateRole('role123', { description: 'New desc' }, mockActor);
      
      expect(result.description).toBe('New desc');
    });
  });

  describe('deleteRole', () => {
    it('should prevent deleting Super Admin', async () => {
      const mockActor = { id: 'actor123' };
      const systemRole = { _id: 'role123', name: 'super admin' };

      requirePermission.mockImplementation(() => {});
      roleRepository.findById.mockResolvedValue(systemRole);

      await expect(
        roleService.deleteRole('role123', mockActor)
      ).rejects.toThrow('Cannot delete system role');
    });

    it('should ALLOW deleting Admin if no users (Hybrid Model)', async () => {
        const mockActor = { id: 'actor123' };
        const adminRole = { _id: 'role123', name: 'admin' };
  
        requirePermission.mockImplementation(() => {});
        roleRepository.findById.mockResolvedValue(adminRole);
        userRepository.countByRole.mockResolvedValue(0); // No users
        roleRepository.deleteById.mockResolvedValue({});
  
        await roleService.deleteRole('role123', mockActor);
        
        expect(roleRepository.deleteById).toHaveBeenCalledWith('role123');
      });

    it('should prevent deleting role with assigned users', async () => {
      const mockActor = { id: 'actor123' };
      const role = { _id: 'role123', name: 'custom' };

      requirePermission.mockImplementation(() => {});
      roleRepository.findById.mockResolvedValue(role);
      userRepository.countByRole.mockResolvedValue(5); // 5 users assigned

      await expect(
        roleService.deleteRole('role123', mockActor)
      ).rejects.toThrow('Cannot delete role');
    });
  });
});
