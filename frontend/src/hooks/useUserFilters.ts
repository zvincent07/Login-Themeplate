import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import userService from '../services/userService';
import { SEARCH_DEBOUNCE_MS } from '../constants';

interface User {
  _id?: string;
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roleName: string;
  isActive: boolean;
  isEmailVerified: boolean;
  deletedAt?: Date | null;
  [key: string]: any;
}

interface UseUserFiltersReturn {
  // State
  users: User[];
  filteredUsers: User[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  roleFilter: string;
  statusFilter: string;
  providerFilter: string;
  sortBy: string;
  sortOrder: string;
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  itemsPerPage: number;
  
  // Setters
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  setRoleFilter: React.Dispatch<React.SetStateAction<string>>;
  setStatusFilter: React.Dispatch<React.SetStateAction<string>>;
  setProviderFilter: React.Dispatch<React.SetStateAction<string>>;
  setSortBy: React.Dispatch<React.SetStateAction<string>>;
  setSortOrder: React.Dispatch<React.SetStateAction<string>>;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  
  // Actions
  fetchUsers: (page?: number, signal?: AbortSignal | null) => Promise<void>;
  refreshUsers: () => Promise<void>;
}

/**
 * Custom hook for managing user filters, search, pagination, and data fetching
 */
export const useUserFilters = (): UseUserFiltersReturn => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<string>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const itemsPerPage = 10;

  // AbortController ref for canceling in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch users with pagination and filters (server-side filtering)
  const fetchUsers = useCallback(async (page: number = 1, signal: AbortSignal | null = null) => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.getUsers(page, itemsPerPage, {
        search: searchTerm,
        role: roleFilter,
        status: statusFilter,
        provider: providerFilter,
        sortBy: sortBy,
        sortOrder: sortOrder,
      });
      
      // Check if request was aborted
      if (signal?.aborted) {
        return;
      }
      
      if (response.success) {
        setUsers(response.data || []);
        if (response.pagination) {
          setTotalPages(response.pagination.pages || 1);
          setTotalUsers(response.pagination.total || 0);
        }
      } else {
        setError(response.error || 'Failed to fetch users');
      }
    } catch (err: any) {
      // Don't set error if request was aborted
      if (signal?.aborted) {
        return;
      }
      setError(err.message || 'Failed to fetch users');
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [itemsPerPage, searchTerm, roleFilter, statusFilter, providerFilter, sortBy, sortOrder]);

  // Fetch users when page or filters change (with debounce for search)
  useEffect(() => {
    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    const timeoutId = setTimeout(() => {
      fetchUsers(currentPage, abortController.signal);
    }, searchTerm ? SEARCH_DEBOUNCE_MS : 0);

    return () => {
      clearTimeout(timeoutId);
      // Abort request on cleanup
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [currentPage, fetchUsers, searchTerm]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter, providerFilter, sortBy, sortOrder]);

  // Memoized filtered users (server-side filtering, so just return users)
  const filteredUsers = useMemo(() => users, [users]);

  return {
    // State
    users,
    filteredUsers,
    loading,
    error,
    searchTerm,
    roleFilter,
    statusFilter,
    providerFilter,
    sortBy,
    sortOrder,
    currentPage,
    totalPages,
    totalUsers,
    itemsPerPage,
    
    // Setters
    setUsers,
    setSearchTerm,
    setRoleFilter,
    setStatusFilter,
    setProviderFilter,
    setSortBy,
    setSortOrder,
    setCurrentPage,
    setError,
    
    // Actions
    fetchUsers,
    refreshUsers: () => fetchUsers(currentPage),
  };
};
