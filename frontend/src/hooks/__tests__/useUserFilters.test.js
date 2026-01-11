import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useUserFilters } from '../useUserFilters';
import userService from '../../services/userService';

// Mock the userService
vi.mock('../../services/userService', () => ({
  default: {
    getUsers: vi.fn(),
  },
}));

describe('useUserFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    userService.getUsers.mockResolvedValue({
      success: true,
      data: [],
      pagination: { pages: 1, total: 0 },
    });

    const { result } = renderHook(() => useUserFilters());

    expect(result.current.searchTerm).toBe('');
    expect(result.current.roleFilter).toBe('all');
    expect(result.current.statusFilter).toBe('all');
    expect(result.current.currentPage).toBe(1);
    expect(result.current.loading).toBe(true);
  });

  it('should fetch users on mount', async () => {
    const mockUsers = [
      { _id: '1', email: 'user1@test.com', roleName: 'user' },
      { _id: '2', email: 'user2@test.com', roleName: 'admin' },
    ];

    userService.getUsers.mockResolvedValue({
      success: true,
      data: mockUsers,
      pagination: { pages: 1, total: 2 },
    });

    const { result } = renderHook(() => useUserFilters());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(userService.getUsers).toHaveBeenCalledWith(
      1,
      10,
      expect.objectContaining({
        search: '',
        role: 'all',
        status: 'all',
        provider: 'all',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })
    );

    expect(result.current.users).toEqual(mockUsers);
    expect(result.current.totalUsers).toBe(2);
  });

  it('should update search term and refetch users', async () => {
    userService.getUsers.mockResolvedValue({
      success: true,
      data: [],
      pagination: { pages: 1, total: 0 },
    });

    const { result } = renderHook(() => useUserFilters());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    result.current.setSearchTerm('test@example.com');

    await waitFor(() => {
      expect(result.current.searchTerm).toBe('test@example.com');
    }, { timeout: 500 });

    // Should reset to page 1 when search changes
    expect(result.current.currentPage).toBe(1);
  });

  it('should handle API errors', async () => {
    userService.getUsers.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useUserFilters());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
  });
});
