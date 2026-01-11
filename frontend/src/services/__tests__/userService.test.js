import { describe, it, expect, vi, beforeEach } from 'vitest';
import userService from '../userService';
import api from '../api';

// Mock the api module
vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get users with filters', async () => {
    const mockResponse = {
      success: true,
      data: [{ _id: '1', email: 'test@example.com' }],
      pagination: { pages: 1, total: 1 },
    };

    api.get.mockResolvedValue(mockResponse);

    const result = await userService.getUsers(1, 10, {
      search: 'test',
      role: 'user',
      status: 'active',
    });

    expect(api.get).toHaveBeenCalledWith(
      expect.stringContaining('page=1&limit=10&search=test&role=user&status=active')
    );
    expect(result).toEqual(mockResponse);
  });

  it('should create user', async () => {
    const mockUserData = {
      email: 'new@example.com',
      password: 'Password123!',
      firstName: 'New',
      lastName: 'User',
    };

    const mockResponse = { success: true, data: { _id: '1', ...mockUserData } };
    api.post.mockResolvedValue(mockResponse);

    const result = await userService.createUser(mockUserData);

    expect(api.post).toHaveBeenCalledWith(
      expect.stringContaining('/employees'),
      mockUserData
    );
    expect(result).toEqual(mockResponse);
  });

  it('should update user', async () => {
    const mockUpdateData = { email: 'updated@example.com' };
    const mockResponse = { success: true, data: { _id: '1', ...mockUpdateData } };
    api.put.mockResolvedValue(mockResponse);

    const result = await userService.updateUser('1', mockUpdateData);

    expect(api.put).toHaveBeenCalledWith(
      expect.stringContaining('/1'),
      mockUpdateData
    );
    expect(result).toEqual(mockResponse);
  });

  it('should delete user', async () => {
    const mockResponse = { success: true };
    api.delete.mockResolvedValue(mockResponse);

    const result = await userService.deleteUser('1');

    expect(api.delete).toHaveBeenCalledWith(expect.stringContaining('/1'));
    expect(result).toEqual(mockResponse);
  });
});
