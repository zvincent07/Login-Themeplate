/**
 * USER REPOSITORY TESTS
 * 
 * Test database access layer
 * Mock Mongoose models
 * Test query building
 * Test whitelisting
 */

const userRepository = require('../userRepository');
const User = require('../../models/User');

jest.mock('../../models/User');

describe('UserRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('should find user by email (case-insensitive)', async () => {
      const mockUser = { _id: '123', email: 'test@example.com', toObject: () => ({ _id: '123', email: 'test@example.com' }) };
      
      User.findOne.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await userRepository.findByEmail('TEST@EXAMPLE.COM');

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(result).toEqual(mockUser.toObject());
    });

    it('should return null if user not found', async () => {
      User.findOne.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(null),
      });

      const result = await userRepository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findMany', () => {
    it('should whitelist filter fields', async () => {
      const mockUsers = [{ _id: '1', email: 'test@example.com' }];
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockUsers),
      };

      User.find.mockReturnValue(mockQuery);
      User.countDocuments.mockResolvedValue(1);

      await userRepository.findMany(
        { roleName: 'admin', maliciousField: 'hack' },
        { page: 1, limit: 10 }
      );

      // Verify maliciousField is not in query
      expect(User.find).toHaveBeenCalled();
      const queryCall = User.find.mock.calls[0][0];
      expect(queryCall.maliciousField).toBeUndefined();
      expect(queryCall.roleName).toBe('admin');
    });

    it('should handle search filter', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };

      User.find.mockReturnValue(mockQuery);
      User.countDocuments.mockResolvedValue(0);

      await userRepository.findMany({ search: 'test' }, { page: 1, limit: 10 });

      const queryCall = User.find.mock.calls[0][0];
      expect(queryCall.$or).toBeDefined();
      expect(queryCall.$or.length).toBe(3);
    });
  });

  describe('create', () => {
    it('should create user and return plain object', async () => {
      const mockUserData = { email: 'test@example.com', password: 'password123' };
      const mockUser = { _id: '123', ...mockUserData, toObject: () => ({ _id: '123', ...mockUserData }) };

      User.create.mockResolvedValue(mockUser);

      const result = await userRepository.create(mockUserData);

      expect(User.create).toHaveBeenCalledWith(mockUserData);
      expect(result).toEqual(mockUser.toObject());
    });
  });
});
