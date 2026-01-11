import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import userService from '../services/userService';
import { SEARCH_DEBOUNCE_MS } from '../constants';

/**
 * Custom hook for managing user filters, search, pagination, and data fetching
 */
export const useUserFilters = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const itemsPerPage = 10;

  // AbortController ref for canceling in-flight requests
  const abortControllerRef = useRef(null);

  // Fetch users with pagination and filters (server-side filtering)
  const fetchUsers = useCallback(async (page = 1, signal = null) => {
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
    } catch (err) {
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
