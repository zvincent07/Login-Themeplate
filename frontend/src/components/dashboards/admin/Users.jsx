import React, { useState, useEffect, useCallback, useMemo } from 'react';
import userService from '../../../services/userService';
import Toast from '../../ui/Toast';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewUserDetails, setViewUserDetails] = useState(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState({ current: 0, total: 0 });
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    roleName: 'user',
    isActive: true,
    isEmailVerified: false,
  });
  const [copiedUserId, setCopiedUserId] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null); // Track which user's dropdown is open
  const [dropdownPosition, setDropdownPosition] = useState({}); // Track dropdown positions (top/bottom)
  const [selectedUsers, setSelectedUsers] = useState([]); // Track selected users for bulk actions
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const itemsPerPage = 10;
  
  // Stats state
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    unverified: 0,
  });

  // Fetch users with pagination and filters (server-side filtering)
  const fetchUsers = useCallback(async (page = 1) => {
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
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage, searchTerm, roleFilter, statusFilter, providerFilter, sortBy, sortOrder]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await userService.getUserStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  // Fetch users when page or filters change (with debounce for search)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers(currentPage);
    }, searchTerm ? 300 : 0); // Debounce search by 300ms

    return () => clearTimeout(timeoutId);
  }, [currentPage, fetchUsers, searchTerm]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter, providerFilter, sortBy, sortOrder]);

  // Clear selection when filters change (to prevent selecting users from different filter sets)
  useEffect(() => {
    setSelectedUsers([]);
  }, [searchTerm, roleFilter, statusFilter, providerFilter]);

  // Fetch stats on component mount and after user operations
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Use users directly (no client-side filtering needed) - memoized to prevent unnecessary recalculations
  const filteredUsers = useMemo(() => users, [users]);

  // Memoize selection state calculations
  const allSelected = useMemo(() => {
    const nonDeletedUsers = filteredUsers.filter(user => !user.deletedAt);
    return nonDeletedUsers.length > 0 && 
      nonDeletedUsers.every(user => selectedUsers.includes(user._id || user.id));
  }, [filteredUsers, selectedUsers]);

  // Handle create user
  const handleCreate = () => {
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      roleName: 'user',
      isActive: true,
    });
    setFormErrors({});
    setShowPassword(false);
    setShowCreateModal(true);
  };

  // Handle edit user
  const handleEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      email: user.email || '',
      password: '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      roleName: user.roleName || 'user',
      isActive: user.isActive !== undefined ? user.isActive : true,
    });
    setFormErrors({});
    setShowPassword(false);
    setShowEditModal(true);
  };

  // Handle delete user
  const handleDelete = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
    setOpenDropdown(null); // Close dropdown
  };

  // Handle view user
  const handleView = async (user) => {
    setSelectedUser(user);
    setOpenDropdown(null); // Close dropdown
    setShowViewModal(true);
    setLoadingUserDetails(true);
    setViewUserDetails(null);
    
    try {
      // Fetch full user details
      const response = await userService.getUser(user._id || user.id);
      if (response.success) {
        setViewUserDetails(response.data);
      } else {
        setError(response.error || 'Failed to fetch user details');
        // Fallback to using the user data we already have
        setViewUserDetails(user);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch user details');
      // Fallback to using the user data we already have
      setViewUserDetails(user);
    } finally {
      setLoadingUserDetails(false);
    }
  };

  // Handle deactivate/activate user
  const handleToggleActive = async (user) => {
    try {
      setSubmitting(true);
      const updateData = {
        ...user,
        isActive: !user.isActive,
      };
      delete updateData.password; // Don't send password
      const response = await userService.updateUser(user._id || user.id, updateData);
      if (response.success) {
        setToast({
          message: `User ${updateData.isActive ? 'activated' : 'deactivated'} successfully!`,
          type: 'success',
        });
        fetchUsers(currentPage);
        fetchStats(); // Refresh stats
      } else {
        setError(response.error || 'Failed to update user');
      }
    } catch (err) {
      setError(err.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
      setOpenDropdown(null); // Close dropdown
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && !event.target.closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'Please provide a valid email';
    }
    // Password is only required for 'user' role in create modal
    if (showCreateModal && formData.roleName === 'user' && !formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    if (!formData.firstName) {
      errors.firstName = 'First name is required';
    }
    if (!formData.lastName) {
      errors.lastName = 'Last name is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit create
  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setError(null);
      
      // Prepare data - don't send password for Admin/Employee (will be auto-generated)
      const createData = { ...formData };
      if (formData.roleName === 'admin' || formData.roleName === 'employee') {
        delete createData.password; // Password will be auto-generated
      }
      
      const response = await userService.createUser(createData);
      if (response.success) {
        setShowCreateModal(false);
        setError(null);
        // Show success toast
        if (response.data?.user?.requiresVerification) {
          setToast({
            message: `User created successfully! Verification email with OTP has been sent to ${formData.email}`,
            type: 'success',
          });
        } else {
          setToast({
            message: 'User created successfully!',
            type: 'success',
          });
        }
        fetchUsers(currentPage);
        fetchStats(); // Refresh stats
      } else {
        setError(response.error || 'Failed to create user');
      }
    } catch (err) {
      setError(err.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit edit
  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const updateData = { ...formData };
      // Don't send password if it's empty (not changing password)
      if (!updateData.password) {
        delete updateData.password;
      }
      const response = await userService.updateUser(selectedUser._id || selectedUser.id, updateData);
      if (response.success) {
        setShowEditModal(false);
        setSelectedUser(null);
        fetchUsers(currentPage);
        fetchStats(); // Refresh stats
      } else {
        setError(response.error || 'Failed to update user');
      }
    } catch (err) {
      setError(err.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit delete
  const handleSubmitDelete = async () => {
    try {
      setSubmitting(true);
      const response = await userService.deleteUser(selectedUser._id || selectedUser.id);
      if (response.success) {
        setShowDeleteModal(false);
        setSelectedUser(null);
        fetchUsers(currentPage);
        fetchStats(); // Refresh stats
        setToast({
          message: 'User deleted successfully!',
          type: 'success',
        });
      } else {
        setError(response.error || 'Failed to delete user');
      }
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle restore user
  const handleRestore = async (user) => {
    try {
      setSubmitting(true);
      const response = await userService.restoreUser(user._id || user.id);
      if (response.success) {
        setOpenDropdown(null);
        fetchUsers(currentPage);
        fetchStats(); // Refresh stats
        setToast({
          message: 'User restored successfully!',
          type: 'success',
        });
      } else {
        setError(response.error || 'Failed to restore user');
      }
    } catch (err) {
      setError(err.message || 'Failed to restore user');
    } finally {
      setSubmitting(false);
    }
  };

  // Export to CSV - memoized
  const handleExportCSV = useCallback(async (usersToExport = null) => {
    try {
      let users = usersToExport;
      
      // If no users provided, fetch all users matching current filters
      if (!users) {
        // Fetch with a high limit to get all users (or use multiple requests if needed)
        const response = await userService.getUsers(1, 10000, {
          search: searchTerm,
          role: roleFilter,
          status: statusFilter,
          provider: providerFilter,
          sortBy: sortBy,
          sortOrder: sortOrder,
        });
        
        if (response && response.success) {
          // response.data is directly the array of users (same as fetchUsers)
          users = Array.isArray(response.data) ? response.data : [];
          
          // If we got the max limit, warn user that there might be more users
          if (users.length === 10000 && response.pagination && response.pagination.total > 10000) {
            setToast({
              message: `Exported first 10,000 users. Total users: ${response.pagination.total}. Consider using filters to export specific users.`,
              type: 'info',
            });
          }
        } else {
          const errorMsg = response?.error || 'Failed to fetch users for export';
          throw new Error(errorMsg);
        }
      }
      
      if (users && Array.isArray(users) && users.length > 0) {
        // Create CSV headers
        const headers = ['Email', 'First Name', 'Last Name', 'Role', 'Status', 'Email Verified', 'Provider', 'Created At'];
        
        // Create CSV rows
        const rows = users.map(user => [
          user.email || '',
          user.firstName || '',
          user.lastName || '',
          user.roleName || '',
          user.isActive ? 'Active' : 'Inactive',
          user.isEmailVerified ? 'Verified' : 'Unverified',
          user.provider || '',
          user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '',
        ]);

        // Combine headers and rows
        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        
        // Clean up: remove link and revoke URL
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);

        setToast({
          message: `Exported ${users.length} user${users.length !== 1 ? 's' : ''} to CSV`,
          type: 'success',
        });
      } else {
        setToast({
          message: 'No users to export',
          type: 'info',
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to export users');
      setToast({
        message: err.message || 'Failed to export users',
        type: 'error',
      });
    }
  }, [searchTerm, roleFilter, statusFilter, providerFilter, sortBy, sortOrder]);

  // Handle checkbox selection
  const handleSelectUser = (userId, user) => {
    // Don't allow selecting deleted users
    if (user?.deletedAt) return;
    
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      // Only select non-deleted users
      setSelectedUsers(filteredUsers
        .filter(user => !user.deletedAt)
        .map(user => user._id || user.id));
    }
  };

  // Bulk delete selected users - memoized
  const handleBulkDelete = useCallback(() => {
    if (selectedUsers.length === 0) return;
    setShowBulkDeleteModal(true);
  }, [selectedUsers.length]);

  // Confirm and execute bulk delete
  const confirmBulkDelete = async () => {
    if (selectedUsers.length === 0) return;

    try {
      setSubmitting(true);
      setBulkDeleteProgress({ current: 0, total: selectedUsers.length });
      
      const results = { success: 0, failed: 0 };
      const errors = [];

      // Delete users one by one to show progress and handle errors gracefully
      for (let i = 0; i < selectedUsers.length; i++) {
        try {
          await userService.deleteUser(selectedUsers[i]);
          results.success++;
        } catch (err) {
          results.failed++;
          errors.push(err.message || 'Failed to delete user');
        }
        setBulkDeleteProgress({ current: i + 1, total: selectedUsers.length });
      }
      
      setShowBulkDeleteModal(false);
      setSelectedUsers([]);
      fetchUsers(currentPage);
      fetchStats();
      
      if (results.failed === 0) {
        setToast({
          message: `Successfully deleted ${results.success} user${results.success !== 1 ? 's' : ''}`,
          type: 'success',
        });
      } else {
        setToast({
          message: `Deleted ${results.success} user${results.success !== 1 ? 's' : ''}, ${results.failed} failed`,
          type: 'error',
        });
        if (errors.length > 0) {
          setError(errors.slice(0, 3).join('; '));
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to delete users');
    } finally {
      setSubmitting(false);
      setBulkDeleteProgress({ current: 0, total: 0 });
    }
  };

  // Bulk export selected users
  const handleBulkExport = async () => {
    if (selectedUsers.length === 0) return;
    
    const selectedUsersData = filteredUsers.filter(user => 
      selectedUsers.includes(user._id || user.id)
    );
    
    await handleExportCSV(selectedUsersData);
    setSelectedUsers([]);
  };

  // Get initials for avatar
  const getInitials = (user) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  // Get avatar background color based on user (for variety)
  const getAvatarColor = (user) => {
    const colors = [
      'bg-blue-500 dark:bg-blue-600',
      'bg-purple-500 dark:bg-purple-600',
      'bg-pink-500 dark:bg-pink-600',
      'bg-indigo-500 dark:bg-indigo-600',
      'bg-teal-500 dark:bg-teal-600',
      'bg-cyan-500 dark:bg-cyan-600',
      'bg-emerald-500 dark:bg-emerald-600',
      'bg-amber-500 dark:bg-amber-600',
    ];
    // Use user ID or email to consistently assign a color
    const id = (user._id || user.id || user.email || '').toString();
    const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">
          User Management
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleExportCSV().catch(err => {
                setError(err.message || 'Failed to export users');
                setToast({
                  message: err.message || 'Failed to export users',
                  type: 'error',
                });
              });
            }}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
            title="Export to CSV"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">Export</span>
          </button>
          <button
            onClick={handleCreate}
            className="px-3 py-1.5 text-sm bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center gap-1.5 shadow-sm hover:shadow-md"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="hidden sm:inline">Create User</span>
            <span className="sm:hidden">Create</span>
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-3 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{stats.total}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-3 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Active Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{stats.active}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-3 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Unverified</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{stats.unverified}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-3 p-2.5 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Bulk Actions Bar - Shows when users are selected */}
      {selectedUsers.length > 0 ? (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg shadow p-3 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
                {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setSelectedUsers([])}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
              >
                Clear selection
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleBulkExport}
                disabled={submitting}
                className="px-3 py-1.5 text-sm border border-blue-300 dark:border-blue-700 rounded-md text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 disabled:opacity-50 flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">Export Selected</span>
                <span className="sm:hidden">Export</span>
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={submitting}
                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="hidden sm:inline">Delete Selected</span>
                <span className="sm:hidden">Delete</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Filters - Shows when no users are selected */
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-3 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Search */}
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search
              </label>
              <input
                type="text"
                placeholder="Search by email, name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 h-[32px] text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="employee">Employee</option>
                <option value="user">User</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 h-[32px] text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
                <option value="deleted">Deleted</option>
              </select>
            </div>

            {/* Provider Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Provider
              </label>
              <select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 h-[32px] text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                <option value="all">All Providers</option>
                <option value="local">Local</option>
                <option value="google">Google</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sort By
              </label>
              <div className="flex gap-1">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 h-[32px] text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  <option value="createdAt">Created Date</option>
                  <option value="firstName">First Name</option>
                  <option value="lastName">Last Name</option>
                  <option value="email">Email</option>
                  <option value="lastLogin">Last Login</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-2 py-1.5 h-[32px] border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600"
                  title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                >
                  {sortOrder === 'asc' ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">No users found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-12">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(input) => {
                          if (input) {
                            const hasSomeSelected = selectedUsers.length > 0 && !allSelected;
                            input.indeterminate = hasSomeSelected;
                          }
                        }}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </th>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">
                      Role
                    </th>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
                      Status
                    </th>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
                      Email Verified
                    </th>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden xl:table-cell">
                      Created
                    </th>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                  {filteredUsers.map((user) => {
                    const userId = user._id || user.id;
                    const isSelected = selectedUsers.includes(userId);
                    return (
                    <tr key={userId} className={`hover:bg-gray-50 dark:hover:bg-slate-700 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                      <td className="px-2 sm:px-4 py-2.5 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={!!user.deletedAt}
                          onChange={() => handleSelectUser(userId, user)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="px-2 sm:px-4 py-2.5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className={`h-8 w-8 rounded-full ${getAvatarColor(user)} flex items-center justify-center`}>
                              <span className="text-xs font-medium text-white">
                                {getInitials(user)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-2 sm:ml-3 min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
                              {user.firstName && user.lastName
                                ? `${user.firstName} ${user.lastName}`
                                : user.email}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-slate-400 truncate">
                              {user.email}
                            </div>
                            {/* Mobile: Show role and status inline */}
                            <div className="md:hidden mt-1 flex items-center gap-2 flex-wrap">
                              <span className="px-1.5 py-0.5 inline-flex text-xs leading-4 font-medium rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 capitalize">
                                {user.roleName || 'user'}
                              </span>
                              {user.isActive ? (
                                <span className="px-1.5 py-0.5 inline-flex text-xs leading-4 font-medium rounded bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                                  Active
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 inline-flex text-xs leading-4 font-medium rounded bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                                  Inactive
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-2.5 whitespace-nowrap hidden md:table-cell">
                        <span className="px-1.5 py-0.5 inline-flex text-xs leading-4 font-medium rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 capitalize">
                          {user.roleName || 'user'}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-2.5 whitespace-nowrap hidden lg:table-cell">
                        {user.isActive ? (
                          <span className="px-1.5 py-0.5 inline-flex text-xs leading-4 font-medium rounded bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                            Active
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 inline-flex text-xs leading-4 font-medium rounded bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-2 sm:px-4 py-2.5 whitespace-nowrap hidden lg:table-cell">
                        {user.isEmailVerified ? (
                          <div className="flex items-center" title="Email Verified">
                            <svg
                              className="w-5 h-5 text-green-600 dark:text-green-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                        ) : (
                          <div className="flex items-center" title="Email Unverified">
                            <svg
                              className="w-5 h-5 text-amber-600 dark:text-amber-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                              />
                            </svg>
                          </div>
                        )}
                      </td>
                      <td className="px-2 sm:px-4 py-2.5 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 hidden xl:table-cell">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-2 sm:px-4 py-2.5 whitespace-nowrap text-sm font-medium relative">
                        <div className="relative dropdown-container">
                          <button
                            data-user-id={user._id || user.id}
                            onClick={(e) => {
                              const userId = user._id || user.id;
                              if (openDropdown === userId) {
                                setOpenDropdown(null);
                              } else {
                                // Calculate if dropdown should open upward
                                const buttonRect = e.currentTarget.getBoundingClientRect();
                                const spaceBelow = window.innerHeight - buttonRect.bottom;
                                const spaceAbove = buttonRect.top;
                                const dropdownHeight = 180; // Approximate height of dropdown
                                
                                // Open upward if not enough space below but enough space above
                                const openUpward = spaceBelow < dropdownHeight && spaceAbove > dropdownHeight;
                                setDropdownPosition({ [userId]: openUpward ? 'top' : 'bottom' });
                                setOpenDropdown(userId);
                              }
                            }}
                            className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                            title="Actions"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
                              />
                            </svg>
                          </button>
                          
                          {/* Dropdown Menu - Using fixed positioning to avoid scrollbar */}
                          {openDropdown === (user._id || user.id) && (
                            <div 
                              className={`fixed w-40 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-gray-200 dark:border-slate-700 z-[100] py-1 ${
                                dropdownPosition[user._id || user.id] === 'top' 
                                  ? 'animate-[fadeIn_0.2s_ease-out_forwards,slideUp_0.2s_ease-out_forwards]' 
                                  : 'animate-[fadeIn_0.2s_ease-out_forwards,slideDown_0.2s_ease-out_forwards]'
                              }`}
                              style={{
                                left: `${(() => {
                                  const button = document.querySelector(`[data-user-id="${user._id || user.id}"]`);
                                  return button ? button.getBoundingClientRect().left : 0;
                                })()}px`,
                                [dropdownPosition[user._id || user.id] === 'top' ? 'bottom' : 'top']: `${(() => {
                                  const button = document.querySelector(`[data-user-id="${user._id || user.id}"]`);
                                  if (button) {
                                    const rect = button.getBoundingClientRect();
                                    return dropdownPosition[user._id || user.id] === 'top' 
                                      ? `${window.innerHeight - rect.top + 4}px`
                                      : `${rect.bottom + 4}px`;
                                  }
                                  return '0px';
                                })()}`
                              }}
                            >
                              {/* Show Restore for deleted users, otherwise show normal actions */}
                              {user.deletedAt ? (
                                <>
                                  {/* View */}
                                  <button
                                    onClick={() => handleView(user)}
                                    className="w-full px-4 py-2.5 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                                  >
                                    <svg
                                      className="w-4 h-4 text-blue-600 dark:text-blue-400"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                      />
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                      />
                                    </svg>
                                    <span>View</span>
                                  </button>
                                  
                                  {/* Restore */}
                                  <button
                                    onClick={() => handleRestore(user)}
                                    disabled={submitting}
                                    className="w-full px-4 py-2.5 text-sm text-left text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2 disabled:opacity-50"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                      />
                                    </svg>
                                    <span>Restore</span>
                                  </button>
                                </>
                              ) : (
                                <>
                                  {/* View */}
                                  <button
                                    onClick={() => handleView(user)}
                                    className="w-full px-4 py-2.5 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                                  >
                                    <svg
                                      className="w-4 h-4 text-blue-600 dark:text-blue-400"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                      />
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                      />
                                    </svg>
                                    <span>View</span>
                                  </button>
                                  
                                  {/* Edit */}
                                  <button
                                    onClick={() => {
                                      handleEdit(user);
                                      setOpenDropdown(null);
                                    }}
                                    className="w-full px-4 py-2.5 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                                  >
                                    <svg
                                      className="w-4 h-4 text-gray-600 dark:text-gray-400"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                      />
                                    </svg>
                                    <span>Edit</span>
                                  </button>
                                  
                                  {/* Deactivate/Activate */}
                                  <button
                                    onClick={() => handleToggleActive(user)}
                                    disabled={submitting}
                                    className="w-full px-4 py-2.5 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2 disabled:opacity-50"
                                  >
                                    {user.isActive ? (
                                      <>
                                        <svg
                                          className="w-4 h-4 text-amber-600 dark:text-amber-400"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                          />
                                        </svg>
                                        <span>Deactivate</span>
                                      </>
                                    ) : (
                                      <>
                                        <svg
                                          className="w-4 h-4 text-green-600 dark:text-green-400"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                          />
                                        </svg>
                                        <span>Activate</span>
                                      </>
                                    )}
                                  </button>
                                  
                                  {/* Delete */}
                                  <button
                                    onClick={() => handleDelete(user)}
                                    className="w-full px-4 py-2.5 text-sm text-left text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                    <span>Delete</span>
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Pagination - Only show if totalUsers > 10 */}
            {totalUsers > 10 && (
              <div className="px-4 py-2 border-t border-gray-200 dark:border-slate-700 flex items-center justify-center">
                <div className="flex items-center gap-0.5">
                  {/* First Page */}
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1 || loading}
                    className="w-7 h-7 flex items-center justify-center border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-800"
                    title="First page"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  {/* Previous Page */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || loading}
                    className="w-7 h-7 flex items-center justify-center border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-800"
                    title="Previous page"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  {/* Current Page */}
                  <button
                    disabled
                    className="w-7 h-7 flex items-center justify-center bg-blue-600 dark:bg-blue-500 text-white text-xs font-medium"
                  >
                    {currentPage}
                  </button>
                  
                  {/* Page Info */}
                  <span className="px-1.5 text-xs text-gray-700 dark:text-gray-400">
                    of {totalPages}
                  </span>
                  
                  {/* Next Page */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || loading}
                    className="w-7 h-7 flex items-center justify-center border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-800"
                    title="Next page"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  
                  {/* Last Page */}
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages || loading}
                    className="w-7 h-7 flex items-center justify-center border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-800"
                    title="Last page"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-3">
                Create New User
              </h2>
              <form onSubmit={handleSubmitCreate}>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500"
                    />
                    {formErrors.email && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        {formErrors.email}
                      </p>
                    )}
                  </div>

                  {/* Password field - only show for 'user' role */}
                  {formData.roleName === 'user' ? (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({ ...formData, password: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 pr-9 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          {showPassword ? (
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0A9.97 9.97 0 015.12 5.12m3.17 3.17L12 12m-3.71-3.71L5.12 5.12M12 12l3.71 3.71M12 12l-3.71-3.71m7.42 7.42L18.88 18.88A9.97 9.97 0 0019 12a9.97 9.97 0 00-.12-1.88m-3.17 3.17L12 12m3.71 3.71L18.88 18.88"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                      {formErrors.password && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {formErrors.password}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                      <p className="text-xs text-blue-800 dark:text-blue-200">
                        <strong>Note:</strong> Password will be auto-generated and sent via email. The user will need to verify their account using the OTP code sent to their email.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({ ...formData, firstName: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500"
                      />
                      {formErrors.firstName && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {formErrors.firstName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500"
                      />
                      {formErrors.lastName && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {formErrors.lastName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Role *
                    </label>
                    <select
                      value={formData.roleName}
                      onChange={(e) =>
                        setFormData({ ...formData, roleName: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500"
                    >
                      <option value="user">User</option>
                      <option value="employee">Employee</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="h-3.5 w-3.5 text-slate-600 focus:ring-slate-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="isActive"
                      className="ml-2 block text-xs text-gray-700 dark:text-gray-300"
                    >
                      Active
                    </label>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-3 py-1.5 text-sm bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {submitting ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-3">
                Edit User
              </h2>
              <form onSubmit={handleSubmitEdit}>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500"
                    />
                    {formErrors.email && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        {formErrors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Password (leave blank to keep current)
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 pr-9 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        {showPassword ? (
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0A9.97 9.97 0 015.12 5.12m3.17 3.17L12 12m-3.71-3.71L5.12 5.12M12 12l3.71 3.71M12 12l-3.71-3.71m7.42 7.42L18.88 18.88A9.97 9.97 0 0019 12a9.97 9.97 0 00-.12-1.88m-3.17 3.17L12 12m3.71 3.71L18.88 18.88"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                    {formErrors.password && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        {formErrors.password}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({ ...formData, firstName: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500"
                      />
                      {formErrors.firstName && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {formErrors.firstName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500"
                      />
                      {formErrors.lastName && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {formErrors.lastName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Role *
                    </label>
                    <select
                      value={formData.roleName}
                      onChange={(e) =>
                        setFormData({ ...formData, roleName: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500"
                    >
                      <option value="user">User</option>
                      <option value="employee">Employee</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="editIsActive"
                        checked={formData.isActive}
                        onChange={(e) =>
                          setFormData({ ...formData, isActive: e.target.checked })
                        }
                        className="h-3.5 w-3.5 text-slate-600 focus:ring-slate-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="editIsActive"
                        className="ml-2 block text-xs text-gray-700 dark:text-gray-300"
                      >
                        Active
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="editIsEmailVerified"
                        checked={formData.isEmailVerified}
                        onChange={(e) =>
                          setFormData({ ...formData, isEmailVerified: e.target.checked })
                        }
                        className="h-3.5 w-3.5 text-slate-600 focus:ring-slate-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="editIsEmailVerified"
                        className="ml-2 block text-xs text-gray-700 dark:text-gray-300"
                      >
                        Email Verified
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedUser(null);
                    }}
                    className="px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-3 py-1.5 text-sm bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {submitting ? 'Updating...' : 'Update User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-3">
                Delete {selectedUsers.length} User{selectedUsers.length !== 1 ? 's' : ''}?
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Are you sure you want to delete {selectedUsers.length} selected user{selectedUsers.length !== 1 ? 's' : ''}? 
                This action cannot be undone.
              </p>
              {bulkDeleteProgress.total > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                    <span>Deleting...</span>
                    <span>{bulkDeleteProgress.current} / {bulkDeleteProgress.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(bulkDeleteProgress.current / bulkDeleteProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkDeleteModal(false);
                    setBulkDeleteProgress({ current: 0, total: 0 });
                  }}
                  disabled={submitting}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBulkDelete}
                  disabled={submitting}
                  className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {submitting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-3">
                Delete User
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Are you sure you want to delete{' '}
                <span className="font-semibold">
                  {selectedUser?.firstName && selectedUser?.lastName
                    ? `${selectedUser.firstName} ${selectedUser.lastName}`
                    : selectedUser?.email}
                </span>
                ? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitDelete}
                  disabled={submitting}
                  className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {submitting ? 'Deleting...' : 'Delete User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {showViewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                  User Details
                </h2>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedUser(null);
                    setViewUserDetails(null);
                  }}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {loadingUserDetails ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Loading user details...</p>
                </div>
              ) : viewUserDetails ? (
                <div className="space-y-4">
                  {/* Avatar and Basic Info */}
                  <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-slate-700">
                    <div className={`h-16 w-16 rounded-full ${getAvatarColor(viewUserDetails)} flex items-center justify-center`}>
                      <span className="text-xl font-medium text-white">
                        {getInitials(viewUserDetails)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                        {viewUserDetails.firstName && viewUserDetails.lastName
                          ? `${viewUserDetails.firstName} ${viewUserDetails.lastName}`
                          : viewUserDetails.email}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{viewUserDetails.email}</p>
                    </div>
                  </div>

                  {/* User Information Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Email */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Email
                      </label>
                      <p className="text-sm text-gray-900 dark:text-slate-100">{viewUserDetails.email || 'N/A'}</p>
                    </div>

                    {/* Role */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Role
                      </label>
                      <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 capitalize">
                        {viewUserDetails.roleName || 'N/A'}
                      </span>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Status
                      </label>
                      {viewUserDetails.isActive ? (
                        <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                          Active
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                          Inactive
                        </span>
                      )}
                    </div>

                    {/* Email Verified */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Email Verified
                      </label>
                      {viewUserDetails.isEmailVerified ? (
                        <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                          Verified
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                          Unverified
                        </span>
                      )}
                    </div>

                    {/* Provider */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Authentication Provider
                      </label>
                      <p className="text-sm text-gray-900 dark:text-slate-100 capitalize">
                        {viewUserDetails.provider || 'N/A'}
                      </p>
                    </div>

                    {/* User ID */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        User ID
                      </label>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-mono break-all flex-1">
                          {viewUserDetails._id || viewUserDetails.id || 'N/A'}
                        </p>
                        <button
                          onClick={async () => {
                            const userId = viewUserDetails._id || viewUserDetails.id;
                            if (userId) {
                              try {
                                await navigator.clipboard.writeText(userId);
                                setCopiedUserId(true);
                                setTimeout(() => setCopiedUserId(false), 2000);
                              } catch (err) {
                                console.error('Failed to copy:', err);
                              }
                            }
                          }}
                          className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
                          title="Copy to clipboard"
                        >
                          {copiedUserId ? (
                            <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                        {copiedUserId && (
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">Copied!</span>
                        )}
                      </div>
                    </div>

                    {/* Created At */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Created At
                      </label>
                      <p className="text-sm text-gray-900 dark:text-slate-100">
                        {viewUserDetails.createdAt
                          ? new Date(viewUserDetails.createdAt).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'N/A'}
                      </p>
                    </div>

                    {/* Updated At */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Last Updated
                      </label>
                      <p className="text-sm text-gray-900 dark:text-slate-100">
                        {viewUserDetails.updatedAt
                          ? new Date(viewUserDetails.updatedAt).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'N/A'}
                      </p>
                    </div>

                    {/* Last Login */}
                    {viewUserDetails.lastLogin && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Last Login
                        </label>
                        <p className="text-sm text-gray-900 dark:text-slate-100">
                          {new Date(viewUserDetails.lastLogin).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    )}

                    {/* Created By */}
                    {viewUserDetails.createdBy && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Created By
                        </label>
                        <p className="text-sm text-gray-900 dark:text-slate-100">
                          {viewUserDetails.createdBy.email || 
                           (viewUserDetails.createdBy.firstName && viewUserDetails.createdBy.lastName
                             ? `${viewUserDetails.createdBy.firstName} ${viewUserDetails.createdBy.lastName}`
                             : 'N/A')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-red-600 dark:text-red-400">Failed to load user details</p>
                </div>
              )}

              {/* Modal Footer */}
              <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-slate-700">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedUser(null);
                    setViewUserDetails(null);
                  }}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                  Close
                </button>
                {viewUserDetails && (
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      handleEdit(viewUserDetails);
                    }}
                    className="px-4 py-2 text-sm bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 shadow-sm hover:shadow-md transition-shadow"
                  >
                    Edit User
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
