import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUserManagement } from '../useUserManagement';
import userService from '../../services/userService';
import authService from '../../services/authService';

// Mock services
vi.mock('../../services/userService', () => ({
  default: {
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
    restoreUser: vi.fn(),
  },
}));

vi.mock('../../services/authService', () => ({
  default: {
    getStoredUser: vi.fn(),
  },
}));

describe('useUserManagement', () => {
  const mockUsers = [
    { _id: '1', email: 'user1@test.com', isActive: true },
    { _id: '2', email: 'user2@test.com', isActive: false },
  ];

  const mockStats = {
    total: 2,
    active: 1,
    unverified: 0,
  };

  const mockSetUsers = vi.fn();
  const mockSetStats = vi.fn();
  const mockFetchStats = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default form data', () => {
    const { result } = renderHook(() =>
      useUserManagement(null, mockUsers, mockSetUsers, mockStats, mockSetStats, mockFetchStats)
    );

    expect(result.current.formData.email).toBe('');
    expect(result.current.formData.roleName).toBe('user');
    expect(result.current.formData.isActive).toBe(true);
  });

  it('should validate form correctly', async () => {
    const { result } = renderHook(() =>
      useUserManagement(null, mockUsers, mockSetUsers, mockStats, mockSetStats, mockFetchStats)
    );

    // Empty email should fail validation
    act(() => {
      result.current.setFormData({ ...result.current.formData, email: '' });
    });

    const isValid = result.current.validateForm();
    expect(isValid).toBe(false);
    expect(result.current.formErrors.email).toBe('Email is required');

    // Valid email should pass
    act(() => {
      result.current.setFormData({
        ...result.current.formData,
        email: 'test@example.com',
        password: 'Password123!',
      });
    });

    const isValid2 = result.current.validateForm();
    expect(isValid2).toBe(true);
  });

  it('should create user successfully', async () => {
    userService.createUser.mockResolvedValue({
      success: true,
      data: { _id: '3', email: 'new@test.com' },
    });

    const { result } = renderHook(() =>
      useUserManagement(null, mockUsers, mockSetUsers, mockStats, mockSetStats, mockFetchStats)
    );

    act(() => {
      result.current.setFormData({
        email: 'new@test.com',
        password: 'Password123!',
        firstName: 'New',
        lastName: 'User',
        roleName: 'user',
        isActive: true,
      });
    });

    let createResult;
    await act(async () => {
      createResult = await result.current.handleCreate();
    });

    expect(createResult.success).toBe(true);
    expect(userService.createUser).toHaveBeenCalledWith(result.current.formData);
  });

  it('should toggle user active status with optimistic UI', async () => {
    userService.updateUser.mockResolvedValue({
      success: true,
      data: { ...mockUsers[0], isActive: false },
    });

    const { result } = renderHook(() =>
      useUserManagement(null, mockUsers, mockSetUsers, mockStats, mockSetStats, mockFetchStats)
    );

    await act(async () => {
      const toggleResult = await result.current.handleToggleActive(mockUsers[0]);
      expect(toggleResult.success).toBe(true);
    });

    // Should update users optimistically
    expect(mockSetUsers).toHaveBeenCalled();
    expect(mockFetchStats).toHaveBeenCalled();
  });

  it('should prevent editing own account', async () => {
    const currentUserId = '1';
    authService.getStoredUser.mockReturnValue({ id: '1' });

    const { result } = renderHook(() =>
      useUserManagement(currentUserId, mockUsers, mockSetUsers, mockStats, mockSetStats, mockFetchStats)
    );

    await act(async () => {
      const updateResult = await result.current.handleUpdate('1', { email: 'updated@test.com' });
      expect(updateResult.success).toBe(false);
      expect(updateResult.error).toContain('cannot edit your own account');
    });

    expect(userService.updateUser).not.toHaveBeenCalled();
  });

  it('should delete user with optimistic UI', async () => {
    userService.deleteUser.mockResolvedValue({ success: true });

    const { result } = renderHook(() =>
      useUserManagement(null, mockUsers, mockSetUsers, mockStats, mockSetStats, mockFetchStats)
    );

    await act(async () => {
      const deleteResult = await result.current.handleDelete('1');
      expect(deleteResult.success).toBe(true);
    });

    // Should update users and stats optimistically
    expect(mockSetUsers).toHaveBeenCalled();
    expect(mockSetStats).toHaveBeenCalled();
    expect(mockFetchStats).toHaveBeenCalled();
  });
});
