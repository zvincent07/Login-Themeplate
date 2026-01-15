/**
 * FRONTEND USER SERVICE TESTS
 * 
 * Test API service layer
 * Mock API calls
 * Test error handling
 */

import userService from '../userService';
import api from '../api';

jest.mock('../api');

describe('userService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUsers', () => {
    it('should fetch users with filters', async () => {
      const mockResponse = {
        success: true,
        data: [{ id: '1', email: 'test@example.com' }],
        pagination: { page: 1, limit: 10, total: 1 },
      };

      api.get.mockResolvedValue(mockResponse);

      const result = await userService.getUsers(1, 10, {
        search: 'test',
        role: 'admin',
      });

      expect(api.get).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });
  });

  describe('createUser', () => {
    it('should create user via API', async () => {
      const mockResponse = {
        success: true,
        data: { user: { id: '123', email: 'new@example.com' } },
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await userService.createUser({
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
      });

      expect(api.post).toHaveBeenCalledWith(
        expect.stringContaining('/employees'),
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteUser', () => {
    it('should delete user via API', async () => {
      const mockResponse = { success: true, data: {} };

      api.delete.mockResolvedValue(mockResponse);

      const result = await userService.deleteUser('user123');

      expect(api.delete).toHaveBeenCalledWith(
        expect.stringContaining('/users/user123')
      );
      expect(result).toEqual(mockResponse);
    });
  });
});
