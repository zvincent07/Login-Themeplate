import React, { useState, useEffect, useCallback, useMemo } from 'react';
import userService from '../../../services/userService';
import authService from '../../../services/authService';
import roleService from '../../../services/roleService';
import Toast from '../../ui/Toast';
import UserStats from './UserStats';
import UserFilters from './UserFilters';
import UserSessions from './UserSessions';
import { MAX_EXPORT_LIMIT } from '../../../constants';
import { useUserFilters, useUserManagement, useUserSessions } from '../../../hooks';
import { Modal, Table, Badge, DropdownMenu, Pagination, FormField, PasswordInput, Button, Input, PermissionButton } from '../../ui';

/**
 * OPTIMISTIC UI PATTERN (for future updates):
 * 
 * When implementing new update operations, follow this pattern for instant UI feedback:
 * 
 * 1. Save current state for rollback:
 *    const previousState = [...currentState];
 * 
 * 2. Update UI immediately:
 *    setCurrentState(prev => /* optimistic update *\/);
 * 
 * 3. Make API call:
 *    const response = await apiCall();
 * 
 * 4. On success: Refresh to sync with server (optional, for data consistency)
 *    if (response.success) {
 *      fetchData(); // Sync with server
 *      setToast({ message: 'Success!', type: 'success' });
 *    }
 * 
 * 5. On failure: Rollback optimistic update
 *    else {
 *      setCurrentState(previousState); // Rollback
 *      setToast({ message: 'Failed', type: 'error' });
 *    }
 * 
 * Benefits:
 * - Instant UI feedback (feels faster)
 * - Automatic rollback on errors
 * - Better user experience
 * 
 * Example implementations in this file:
 * - handleToggleActive: Toggle user active/inactive
 * - handleSubmitEdit: Edit user details
 * - handleSubmitDelete: Delete user
 * - handleTerminateSession: Terminate user session
 * - handleTerminateAllOthers: Terminate all other sessions
 * - confirmBulkDelete: Bulk delete users
 * - handleRestore: Restore deleted user
 */

const Users = () => {
  // Custom hooks for data management
  const filters = useUserFilters();
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    unverified: 0,
  });
  const [currentUserId, setCurrentUserId] = useState(null);
  
  // Fetch stats - must be defined before useUserManagement hook
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
  
  const management = useUserManagement(
    currentUserId,
    filters.users,
    filters.setUsers,
    stats,
    setStats,
    fetchStats
  );
  
  const sessions = useUserSessions();

  // UI state (modals, dropdowns, etc.)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [activeViewTab, setActiveViewTab] = useState('details'); // 'details' or 'sessions'
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewUserDetails, setViewUserDetails] = useState(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState({ current: 0, total: 0 });
  const [copiedUserId, setCopiedUserId] = useState(false);
  const [toast, setToast] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null); // Track which user's dropdown is open
  const [dropdownPosition, setDropdownPosition] = useState({}); // Track dropdown positions (top/bottom)
  const [selectedUsers, setSelectedUsers] = useState([]); // Track selected users for bulk actions
  const [roles, setRoles] = useState([]); // Available roles from RBAC
  const [loadingRoles, setLoadingRoles] = useState(false);

  // Clear selection when filters change (to prevent selecting users from different filter sets)
  useEffect(() => {
    setSelectedUsers([]);
  }, [filters.searchTerm, filters.roleFilter, filters.statusFilter, filters.providerFilter]);

  // Fetch stats on component mount and after user operations
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Fetch current user ID on component mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await authService.getMe();
        if (response.success && response.data) {
          setCurrentUserId(response.data.id || response.data._id);
        }
      } catch {
        // Silently fail - not critical if we can't get current user
      }
    };
    fetchCurrentUser();
  }, []);

  // Fetch roles from RBAC system
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoadingRoles(true);
        const response = await roleService.getRoles();
        if (response.success && response.data) {
          // Sort roles by name for consistent display
          const sortedRoles = [...response.data].sort((a, b) => 
            a.name.toLowerCase().localeCompare(b.name.toLowerCase())
          );
          setRoles(sortedRoles);
        }
      } catch (error) {
        console.error('Failed to fetch roles:', error);
        // Fallback to empty array - will show loading state
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchRoles();
  }, []);

  // Prevent modals from opening for current user - runs immediately when modal state changes
  useEffect(() => {
    if (!currentUserId) return;
    
    // Check edit modal - close immediately if opened for current user
    if (showEditModal && selectedUser) {
      const selectedUserId = selectedUser._id || selectedUser.id;
      const isCurrentUser = selectedUserId && (selectedUserId === currentUserId || selectedUserId.toString() === currentUserId.toString());
      
      if (isCurrentUser) {
        setShowEditModal(false);
        setSelectedUser(null);
        setToast({
          message: 'You cannot edit your own account.',
          type: 'error',
        });
        return; // Exit early to prevent further checks
      }
    }
    
    // Check delete modal - close immediately if opened for current user
    if (showDeleteModal && selectedUser) {
      const selectedUserId = selectedUser._id || selectedUser.id;
      const isCurrentUser = selectedUserId && (selectedUserId === currentUserId || selectedUserId.toString() === currentUserId.toString());
      
      if (isCurrentUser) {
        setShowDeleteModal(false);
        setSelectedUser(null);
        setToast({
          message: 'You cannot delete your own account.',
          type: 'error',
        });
      }
    }
  }, [currentUserId, selectedUser, showEditModal, showDeleteModal]);

  // Use filteredUsers from hook
  const filteredUsers = filters.filteredUsers;

  // Compute whether edit modal should be shown - prevents rendering if editing own account
  const shouldShowEditModal = useMemo(() => {
    if (!showEditModal || !selectedUser) return false;
    // If currentUserId is not loaded yet, allow modal to show (will be closed by useEffect if needed)
    if (!currentUserId) return true;
    const editingUserId = selectedUser._id || selectedUser.id;
    if (!editingUserId) return true;
    const isCurrentUser = editingUserId === currentUserId || editingUserId.toString() === currentUserId.toString();
    return !isCurrentUser; // Only return false if it's the current user
  }, [showEditModal, selectedUser, currentUserId]);

  // Compute whether delete modal should be shown - prevents rendering if deleting own account
  const shouldShowDeleteModal = useMemo(() => {
    if (!showDeleteModal || !selectedUser) return false;
    // If currentUserId is not loaded yet, allow modal to show (will be closed by useEffect if needed)
    if (!currentUserId) return true;
    const deletingUserId = selectedUser._id || selectedUser.id;
    if (!deletingUserId) return true;
    const isCurrentUser = deletingUserId === currentUserId || deletingUserId.toString() === currentUserId.toString();
    return !isCurrentUser; // Only return false if it's the current user
  }, [showDeleteModal, selectedUser, currentUserId]);

  // Memoize selection state calculations
  const allSelected = useMemo(() => {
    const nonDeletedUsers = filteredUsers.filter(user => !user.deletedAt);
    return nonDeletedUsers.length > 0 && 
      nonDeletedUsers.every(user => selectedUsers.includes(user._id || user.id));
  }, [filteredUsers, selectedUsers]);

  // Handle create user
  const handleCreate = () => {
    management.setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      roleName: 'user',
      isActive: true,
      isEmailVerified: false,
    });
    management.setFormErrors({});
    management.setShowPassword(false);
    setShowCreateModal(true);
  };

  // Handle edit user
  const handleEdit = (user) => {
    // Prevent editing own account
    if (management.isOwnAccount(user._id || user.id)) {
      setToast({
        message: 'You cannot edit your own account.',
        type: 'error',
      });
      return;
    }
    
    setSelectedUser(user);
    // Only set allowed fields for editing (exclude MongoDB/system fields)
    // Allowed fields: firstName, lastName, email, password, role, roleName, isActive
    // Note: isEmailVerified is not in backend updateUserFields, so we exclude it
    management.setFormData({
      email: user.email || '',
      password: '', // Empty by default (leave blank to keep current)
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      roleName: user.roleName || 'user',
      isActive: user.isActive !== undefined ? user.isActive : true,
      // Exclude: isEmailVerified, _id, createdAt, updatedAt, __v, otp, provider, createdBy, deletedAt
    });
    management.setFormErrors({});
    management.setShowPassword(false);
    setShowEditModal(true);
  };

  // Handle delete user
  const handleDelete = (user) => {
    // Prevent deleting own account
    if (management.isOwnAccount(user._id || user.id)) {
      setToast({
        message: 'You cannot delete your own account.',
        type: 'error',
      });
      setOpenDropdown(null);
      return;
    }
    
    setSelectedUser(user);
    setShowDeleteModal(true);
    setOpenDropdown(null);
  };

  // Handle view user
  const handleView = async (user) => {
    setSelectedUser(user);
    setOpenDropdown(null); // Close dropdown
    setShowViewModal(true);
    setActiveViewTab('details');
    setLoadingUserDetails(true);
    setViewUserDetails(null);
    
    try {
      // Fetch full user details
      const response = await userService.getUser(user._id || user.id);
      if (response.success) {
        setViewUserDetails(response.data);
      } else {
        filters.setError(response.error || 'Failed to fetch user details');
        // Fallback to using the user data we already have
        setViewUserDetails(user);
      }
    } catch (err) {
      filters.setError(err.message || 'Failed to fetch user details');
      // Fallback to using the user data we already have
      setViewUserDetails(user);
    } finally {
      setLoadingUserDetails(false);
    }
  };

  // Handle view user sessions (using hook)
  const handleViewSessions = async (user) => {
    setSelectedUser(user);
    const result = await sessions.fetchUserSessions(user._id || user.id);
    if (!result.success) {
      filters.setError(result.error || 'Failed to fetch user sessions');
    }
  };

  // Handle terminate session with Optimistic UI (using hook)
  const handleTerminateSession = async (sessionId) => {
    if (!selectedUser) return;
    
    const result = await sessions.handleTerminateSession(
      selectedUser._id || selectedUser.id,
      sessionId
    );
    
    if (result.success) {
      setToast({
        message: 'Session terminated successfully',
        type: 'success',
      });
    } else {
      setToast({
        message: result.error || 'Failed to terminate session',
        type: 'error',
      });
    }
  };

  // Handle terminate all other sessions with Optimistic UI (using hook)
  const handleTerminateAllOthers = async () => {
    if (!selectedUser) return;
    
    try {
      const result = await sessions.handleTerminateAllOthers(
        selectedUser._id || selectedUser.id
      );
      
      if (result.success) {
        setToast({
          message: result.message || 'Sessions terminated successfully',
          type: 'success',
        });
        return result;
      } else {
        setToast({
          message: result.error || 'Failed to terminate sessions',
          type: 'error',
        });
        throw new Error(result.error || 'Failed to terminate sessions');
      }
    } catch (err) {
      setToast({
        message: err.message || 'Failed to terminate sessions',
        type: 'error',
      });
      throw err;
    }
  };

  // Handle deactivate/activate user with Optimistic UI (using hook)
  const handleToggleActive = async (user) => {
    setOpenDropdown(null);
    const result = await management.handleToggleActive(user);
    
    if (result.success) {
      setToast({
        message: `User ${!user.isActive ? 'activated' : 'deactivated'} successfully!`,
        type: 'success',
      });
    } else {
      setToast({
        message: result.error || 'Failed to update user',
        type: 'error',
      });
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

  // Validate form (wrapper to add create modal specific validation)
  const validateForm = () => {
    const errors = {};
    if (!management.formData.email) {
      errors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(management.formData.email)) {
      errors.email = 'Please provide a valid email';
    }
    // Password is only required for 'user' role in create modal
    if (showCreateModal && management.formData.roleName === 'user' && !management.formData.password) {
      errors.password = 'Password is required';
    } else if (management.formData.password && management.formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    if (!management.formData.firstName) {
      errors.firstName = 'First name is required';
    }
    if (!management.formData.lastName) {
      errors.lastName = 'Last name is required';
    }
    management.setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit create
  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Note: filterAllowedFields in handleCreate will ensure only allowed fields are sent
    // Password will be handled in handleCreate based on roleName
    const result = await management.handleCreate();
    
    if (result.success) {
      setShowCreateModal(false);
      filters.setError(null);
      // Show success toast
      if (result.data?.user?.requiresVerification) {
        setToast({
          message: `User created successfully! Verification email with OTP has been sent to ${management.formData.email}`,
          type: 'success',
        });
      } else {
        setToast({
          message: 'User created successfully!',
          type: 'success',
        });
      }
      filters.refreshUsers();
      fetchStats();
    } else {
      filters.setError(result.error || 'Failed to create user');
      if (result.error) {
        setToast({
          message: result.error,
          type: 'error',
        });
      }
    }
  };

  // Submit edit with Optimistic UI (using hook)
  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const userId = selectedUser?._id || selectedUser?.id;
    if (!userId) return;

    // Prevent editing own account
    if (management.isOwnAccount(userId)) {
      setToast({
        message: 'You cannot edit your own account.',
        type: 'error',
      });
      return;
    }

    const result = await management.handleUpdate(userId, management.formData);
    
    if (result.success) {
      // Update viewUserDetails if it's the same user
      if (viewUserDetails && (viewUserDetails._id || viewUserDetails.id) === userId) {
        setViewUserDetails({
          ...viewUserDetails,
          ...management.formData,
        });
      }
      
      setShowEditModal(false);
      setSelectedUser(null);
      setToast({
        message: 'User updated successfully!',
        type: 'success',
      });
    } else {
      setToast({
        message: result.error || 'Failed to update user',
        type: 'error',
      });
    }
  };

  // Submit delete with Optimistic UI (using hook)
  const handleSubmitDelete = async () => {
    const userId = selectedUser?._id || selectedUser?.id;
    if (!userId) return;
    
    setShowDeleteModal(false);
    const userToDelete = selectedUser;
    setSelectedUser(null);
    
    const result = await management.handleDelete(userId);
    
    if (result.success) {
      setToast({
        message: 'User deleted successfully!',
        type: 'success',
      });
    } else {
      setSelectedUser(userToDelete);
      setToast({
        message: result.error || 'Failed to delete user',
        type: 'error',
      });
    }
  };

  // Handle restore user with Optimistic UI
  const handleRestore = async (user) => {
    setOpenDropdown(null);
    const result = await management.handleRestore(user);
    
    if (result.success) {
      filters.refreshUsers();
      setToast({
        message: 'User restored successfully!',
        type: 'success',
      });
    } else {
      setToast({
        message: result.error || 'Failed to restore user',
        type: 'error',
      });
    }
  };

  // Export to CSV - memoized
  const handleExportCSV = useCallback(async (usersToExport = null) => {
    try {
      filters.setError(null);
      let usersToExportData = usersToExport;
      
      // If no users provided, fetch all users matching current filters
      if (!usersToExportData) {
        // Fetch with a high limit to get all users (or use multiple requests if needed)
        const response = await userService.getUsers(1, MAX_EXPORT_LIMIT, {
          search: filters.searchTerm,
          role: filters.roleFilter,
          status: filters.statusFilter,
          provider: filters.providerFilter,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
        });
        
        if (response && response.success) {
          // response.data is directly the array of users (same as fetchUsers)
          usersToExportData = Array.isArray(response.data) ? response.data : [];
          
          // If we got the max limit, warn user that there might be more users
          if (usersToExportData.length === MAX_EXPORT_LIMIT && response.pagination && response.pagination.total > MAX_EXPORT_LIMIT) {
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
      
      if (usersToExportData && Array.isArray(usersToExportData) && usersToExportData.length > 0) {
        // Create CSV headers
        const headers = ['Email', 'First Name', 'Last Name', 'Role', 'Status', 'Email Verified', 'Provider', 'Created At'];
        
        // Create CSV rows
        const rows = usersToExportData.map(user => [
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
          message: `Exported ${usersToExportData.length} user${usersToExportData.length !== 1 ? 's' : ''} to CSV`,
          type: 'success',
        });
      } else {
        setToast({
          message: 'No users to export',
          type: 'info',
        });
      }
    } catch (err) {
      filters.setError(err.message || 'Failed to export users');
      setToast({
        message: err.message || 'Failed to export users',
        type: 'error',
      });
    }
  }, [filters]);

  // Handle checkbox selection
  const handleSelectUser = (userId, user) => {
    // Don't allow selecting deleted users
    if (user?.deletedAt) return;
    
    // Don't allow selecting current user
    if (currentUserId && (userId === currentUserId || userId.toString() === currentUserId.toString())) {
      setToast({
        message: 'You cannot select your own account',
        type: 'warning',
      });
      return;
    }
    
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
      // Only select non-deleted users and exclude current user
      setSelectedUsers(filteredUsers
        .filter(user => {
          if (user.deletedAt) return false;
          if (currentUserId) {
            const userId = user._id || user.id;
            return !(userId === currentUserId || userId.toString() === currentUserId.toString());
          }
          return true;
        })
        .map(user => user._id || user.id));
    }
  };

  // Bulk delete selected users - memoized
  const handleBulkDelete = useCallback(() => {
    if (selectedUsers.length === 0) return;
    setShowBulkDeleteModal(true);
  }, [selectedUsers.length]);

  // Confirm and execute bulk delete with Optimistic UI (using hook)
  const confirmBulkDelete = async () => {
    if (selectedUsers.length === 0) return;

    // Filter out current user from bulk delete
    const usersToDelete = selectedUsers.filter(userId => {
      if (currentUserId && (userId === currentUserId || userId.toString() === currentUserId.toString())) {
        return false;
      }
      return true;
    });

    // If current user was in selection, show warning
    if (usersToDelete.length < selectedUsers.length) {
      setToast({
        message: 'You cannot delete your own account. Other selected users will be deleted.',
        type: 'warning',
      });
    }

    if (usersToDelete.length === 0) {
      setShowBulkDeleteModal(false);
      setSelectedUsers([]);
      setToast({
        message: 'You cannot delete your own account',
        type: 'error',
      });
      return;
    }

    setSelectedUsers([]);
    setShowBulkDeleteModal(false);
    setBulkDeleteProgress({ current: 0, total: usersToDelete.length });

    // Use hook's bulk delete with progress tracking
    const result = await management.handleBulkDelete(usersToDelete);
    
    if (result.success) {
      setToast({
        message: result.message || `Successfully deleted ${result.successCount} user(s)`,
        type: 'success',
      });
    } else {
      setToast({
        message: result.message || `Failed to delete ${result.failureCount || 0} user(s)`,
        type: 'error',
      });
      if (result.errors && result.errors.length > 0) {
        filters.setError(result.errors.slice(0, 3).join('; '));
      }
    }
    
    setBulkDeleteProgress({ current: 0, total: 0 });
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

  // Table columns configuration
  const columns = useMemo(() => [
    {
      label: 'User',
      key: 'user',
      className: 'w-full md:w-auto',
      render: (user) => {
        const userId = user._id || user.id;
        const isCurrentUser = currentUserId && (userId === currentUserId || userId.toString() === currentUserId.toString());
        return (
          <div className="flex items-center">
            <div className="flex-shrink-0 h-8 w-8">
              <div className={`h-8 w-8 rounded-full ${getAvatarColor(user)} flex items-center justify-center`}>
                <span className="text-xs font-medium text-white">
                  {getInitials(user)}
                </span>
              </div>
            </div>
            <div className="ml-2 sm:ml-3 min-w-0 flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-white truncate flex items-center gap-2">
                {user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.email}
                {isCurrentUser && (
                  <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-blue-600 dark:bg-blue-500 text-white">
                    You
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-200 truncate">
                {user.email}
              </div>
              {/* Mobile: Show role and status inline */}
              <div className="md:hidden mt-1 flex items-center gap-2 flex-wrap">
                <Badge variant="info" size="sm" className="capitalize">
                  {user.roleName || 'user'}
                </Badge>
                <Badge variant={user.isActive ? 'success' : 'danger'} size="sm">
                  {user.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>
        );
      }
    },
    {
      label: 'Role',
      key: 'roleName',
      className: 'hidden md:table-cell',
      render: (user) => (
        <Badge variant="info" size="sm" className="capitalize">
          {user.roleName || 'user'}
        </Badge>
      )
    },
    {
      label: 'Status',
      key: 'isActive',
      className: 'hidden lg:table-cell',
      render: (user) => (
        <Badge variant={user.isActive ? 'success' : 'danger'} size="sm">
          {user.isActive ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      label: 'Email Verified',
      key: 'isEmailVerified',
      className: 'hidden lg:table-cell',
      render: (user) => (
        user.isEmailVerified ? (
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
        )
      )
    },
    {
      label: 'Created',
      key: 'createdAt',
      className: 'hidden xl:table-cell text-xs text-gray-500 dark:text-gray-200',
      render: (user) => formatDate(user.createdAt)
    },
    {
      label: 'Actions',
      key: 'actions',
      align: 'center',
      render: (user) => {
        const userId = user._id || user.id;
        const isCurrentUser = currentUserId && (userId === currentUserId || userId.toString() === currentUserId.toString());
        
        return (
          <div className="relative dropdown-container flex justify-center">
            <button
              data-user-id={userId}
              onClick={(e) => {
                e.stopPropagation(); // Prevent row click
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
              className="p-1.5 text-gray-600 dark:text-white hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
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
            {openDropdown === userId && (
              <div 
                className={`fixed w-40 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-gray-200 dark:border-slate-700 z-[100] py-1 ${
                  dropdownPosition[userId] === 'top' 
                    ? 'animate-[fadeIn_0.2s_ease-out_forwards,slideUp_0.2s_ease-out_forwards]' 
                    : 'animate-[fadeIn_0.2s_ease-out_forwards,slideDown_0.2s_ease-out_forwards]'
                }`}
                style={{
                  left: `${(() => {
                    const button = document.querySelector(`[data-user-id="${userId}"]`);
                    // Align right edge of dropdown with right edge of button
                    return button ? button.getBoundingClientRect().right - 160 : 0; 
                  })()}px`,
                  [dropdownPosition[userId] === 'top' ? 'bottom' : 'top']: `${(() => {
                    const button = document.querySelector(`[data-user-id="${userId}"]`);
                    if (button) {
                      const rect = button.getBoundingClientRect();
                      return dropdownPosition[userId] === 'top' 
                        ? `${window.innerHeight - rect.top + 4}px`
                        : `${rect.bottom + 4}px`;
                    }
                    return '0px';
                  })()}`
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Show Restore for deleted users, otherwise show normal actions */}
                {user.deletedAt ? (
                  <>
                    {/* View */}
                    <button
                      onClick={() => handleView(user)}
                      className="w-full px-4 py-2.5 text-sm text-left text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>View</span>
                    </button>
                    
                    {/* Restore */}
                    <button
                      onClick={() => handleRestore(user)}
                      disabled={management.submitting}
                      className="w-full px-4 py-2.5 text-sm text-left text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2 disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Restore</span>
                    </button>
                  </>
                ) : (
                  <>
                    {/* View */}
                    <button
                      onClick={() => handleView(user)}
                      className="w-full px-4 py-2.5 text-sm text-left text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>View</span>
                    </button>
                    
                    {/* Edit */}
                    <button
                      type="button"
                      className={`w-full px-4 py-2.5 text-sm text-left flex items-center gap-2 ${
                        isCurrentUser
                          ? 'text-gray-400 dark:text-gray-400 opacity-50'
                          : 'text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer'
                      }`}
                      title={isCurrentUser ? "You cannot edit your own account" : "Edit user"}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        if (management.isOwnAccount(userId)) {
                          setToast({
                            message: 'You cannot edit your own account.',
                            type: 'error',
                          });
                          return;
                        }
                        handleEdit(user);
                        setOpenDropdown(null);
                      }}
                    >
                      <svg className={`w-4 h-4 ${isCurrentUser ? 'text-gray-400 dark:text-slate-500' : 'text-gray-600 dark:text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span className={isCurrentUser ? 'line-through' : ''}>Edit</span>
                    </button>
                    
                    {/* Deactivate/Activate */}
                    <button
                      type="button"
                      className={`w-full px-4 py-2.5 text-sm text-left flex items-center gap-2 ${
                        isCurrentUser
                          ? 'text-gray-400 dark:text-slate-500 opacity-50 cursor-pointer'
                          : user.isActive
                          ? 'text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer'
                          : 'text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer'
                      } ${management.submitting && !isCurrentUser ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={isCurrentUser ? "You cannot deactivate your own account" : user.isActive ? "Deactivate user" : "Activate user"}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        if (management.isOwnAccount(userId)) {
                          setToast({
                            message: 'You cannot deactivate your own account.',
                            type: 'error',
                          });
                          return;
                        }
                        
                        if (management.submitting) return;
                        handleToggleActive(user);
                        setOpenDropdown(null);
                      }}
                    >
                      {user.isActive ? (
                        <>
                          <svg className={`w-4 h-4 ${isCurrentUser ? 'text-gray-400 dark:text-gray-400' : 'text-amber-600 dark:text-amber-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                          <span className={isCurrentUser ? 'line-through' : ''}>Deactivate</span>
                        </>
                      ) : (
                        <>
                          <svg className={`w-4 h-4 ${isCurrentUser ? 'text-gray-400 dark:text-slate-500' : 'text-green-600 dark:text-green-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className={isCurrentUser ? 'line-through' : ''}>Activate</span>
                        </>
                      )}
                    </button>
                    
                    {/* Delete */}
                    <button
                      className={`w-full px-4 py-2.5 text-sm text-left flex items-center gap-2 ${
                        isCurrentUser
                          ? 'text-gray-400 dark:text-slate-500 cursor-not-allowed opacity-50'
                          : 'text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer'
                      }`}
                      title={isCurrentUser ? "You cannot delete your own account" : "Delete user"}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        if (management.isOwnAccount(userId)) {
                          setToast({
                            message: 'You cannot delete your own account.',
                            type: 'error',
                          });
                          return;
                        }
                        handleDelete(user);
                      }}
                    >
                      <svg className={`w-4 h-4 ${isCurrentUser ? 'text-gray-400 dark:text-slate-500' : 'text-red-600 dark:text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span className={isCurrentUser ? 'line-through text-gray-400 dark:text-slate-500' : 'text-red-600 dark:text-red-400'}>Delete</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        );
      }
    }
  ], [currentUserId, getAvatarColor, getInitials, handleEdit, handleRestore, handleToggleActive, handleDelete, handleView, management, openDropdown, dropdownPosition]);

  return (
    <div className="max-h-[calc(100vh-7rem)] flex flex-col relative">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
          User Management
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleExportCSV().catch(err => {
                filters.setError(err.message || 'Failed to export users');
                setToast({
                  message: err.message || 'Failed to export users',
                  type: 'error',
                });
              });
            }}
            title="Export to CSV"
            className="w-auto flex items-center gap-1.5"
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
          </Button>
          <PermissionButton
            user={authService.getStoredUser()}
            permission="users:create"
            onClick={handleCreate}
            size="sm"
            className="w-auto flex items-center gap-1.5"
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
          </PermissionButton>
        </div>
      </div>

      {/* Stats Bar */}
      <UserStats stats={stats} loading={filters.loading} />

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
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkExport}
                disabled={management.submitting}
                className="flex items-center gap-1.5 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">Export Selected</span>
                <span className="sm:hidden">Export</span>
              </Button>
              <PermissionButton
                user={authService.getStoredUser()}
                permission="users:delete"
                onClick={handleBulkDelete}
                disabled={management.submitting}
                variant="danger"
                size="sm"
                className="flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="hidden sm:inline">Delete Selected</span>
                <span className="sm:hidden">Delete</span>
              </PermissionButton>
            </div>
          </div>
        </div>
      ) : (
        /* Filters - Shows when no users are selected */
        <UserFilters
          searchTerm={filters.searchTerm}
          setSearchTerm={filters.setSearchTerm}
          roleFilter={filters.roleFilter}
          setRoleFilter={filters.setRoleFilter}
          statusFilter={filters.statusFilter}
          setStatusFilter={filters.setStatusFilter}
          providerFilter={filters.providerFilter}
          setProviderFilter={filters.setProviderFilter}
          sortBy={filters.sortBy}
          setSortBy={filters.setSortBy}
          sortOrder={filters.sortOrder}
          setSortOrder={filters.setSortOrder}
        />
      )}

      {/* Users Table */}
      <div className={`flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden ${filters.isRefreshing ? 'opacity-70 transition-opacity' : ''}`}>
        <Table
          columns={columns}
          data={filteredUsers}
          loading={filters.loading}
          emptyMessage="No users found"
          selectable={true}
          selectedRows={selectedUsers}
          onSelectAll={handleSelectAll}
          onSelectRow={(user) => handleSelectUser(user._id || user.id, user)}
          onRowClick={handleView}
          rowClassName={(user) => {
             const userId = user._id || user.id;
             const isCurrentUser = currentUserId && (userId === currentUserId || userId.toString() === currentUserId.toString());
             return isCurrentUser ? 'ring-2 ring-blue-500 dark:ring-blue-400 z-10' : '';
          }}
          className="flex-1"
        />

        {/* Pagination - Only show if totalUsers > 10 */}
        {filters.totalUsers > 10 && (
          <div className="border-t border-gray-200 dark:border-slate-700 p-4">
            <Pagination
              currentPage={filters.currentPage}
              totalPages={filters.totalPages}
              onPageChange={filters.setCurrentPage}
              loading={filters.loading}
            />
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New User"
        size="md"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-user-form"
              disabled={management.submitting}
              loading={management.submitting}
            >
              {management.submitting ? 'Creating...' : 'Create User'}
            </Button>
          </>
        }
      >
        <form id="create-user-form" onSubmit={handleSubmitCreate} autoComplete="off">
          <div className="space-y-3">
            <FormField
              label="Email"
              required
              error={management.formErrors.email}
            >
              <Input
                type="email"
                autoComplete="off"
                value={management.formData.email}
                onChange={(e) =>
                  management.setFormData({ ...management.formData, email: e.target.value })
                }
              />
            </FormField>

            {/* Password field - only show for 'user' role */}
            {management.formData.roleName === 'user' ? (
              <PasswordInput
                value={management.formData.password}
                onChange={(e) =>
                  management.setFormData({ ...management.formData, password: e.target.value })
                }
                showPassword={management.showPassword}
                onTogglePassword={() => management.setShowPassword(!management.showPassword)}
                error={management.formErrors.password}
                label="Password"
                required
                autoComplete="new-password"
              />
            ) : (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  <strong>Note:</strong> Password will be auto-generated and sent via email. The user will need to verify their account using the OTP code sent to their email.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                label="First Name"
                required
                error={management.formErrors.firstName}
              >
                <Input
                  type="text"
                  value={management.formData.firstName}
                  onChange={(e) =>
                    management.setFormData({ ...management.formData, firstName: e.target.value })
                  }
                />
              </FormField>

              <FormField
                label="Last Name"
                required
                error={management.formErrors.lastName}
              >
                <Input
                  type="text"
                  value={management.formData.lastName}
                  onChange={(e) =>
                    management.setFormData({ ...management.formData, lastName: e.target.value })
                  }
                />
              </FormField>
            </div>

            <FormField label="Role" required>
              <select
                value={management.formData.roleName}
                onChange={(e) =>
                  management.setFormData({ ...management.formData, roleName: e.target.value })
                }
                disabled={loadingRoles}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingRoles ? (
                  <option value="">Loading roles...</option>
                ) : roles.length === 0 ? (
                  <option value="">No roles available</option>
                ) : (
                  roles.map((role) => (
                    <option key={role._id || role.id} value={role.name}>
                      {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                    </option>
                  ))
                )}
              </select>
            </FormField>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={management.formData.isActive}
                onChange={(e) =>
                  management.setFormData({ ...management.formData, isActive: e.target.checked })
                }
                className="h-3.5 w-3.5 text-slate-600 focus:ring-slate-500 border-gray-300 rounded"
              />
              <label
                  htmlFor="isActive"
                  className="ml-2 block text-xs text-gray-700 dark:text-slate-300"
                >
                  Active
                </label>
            </div>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={shouldShowEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
        }}
        title="Edit User"
        size="md"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setSelectedUser(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-user-form"
              disabled={management.submitting}
              loading={management.submitting}
            >
              {management.submitting ? 'Updating...' : 'Update User'}
            </Button>
          </>
        }
      >
        <form id="edit-user-form" onSubmit={handleSubmitEdit}>
          <div className="space-y-3">
            <FormField
              label="Email"
              required
              error={management.formErrors.email}
            >
              <Input
                type="email"
                value={management.formData.email}
                onChange={(e) =>
                  management.setFormData({ ...management.formData, email: e.target.value })
                }
              />
            </FormField>

            <PasswordInput
              value={management.formData.password}
              onChange={(e) =>
                management.setFormData({ ...management.formData, password: e.target.value })
              }
              showPassword={management.showPassword}
              onTogglePassword={() => management.setShowPassword(!management.showPassword)}
              error={management.formErrors.password}
              label="Password (leave blank to keep current)"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                label="First Name"
                required
                error={management.formErrors.firstName}
              >
                <Input
                  type="text"
                  value={management.formData.firstName}
                  onChange={(e) =>
                    management.setFormData({ ...management.formData, firstName: e.target.value })
                  }
                />
              </FormField>

              <FormField
                label="Last Name"
                required
                error={management.formErrors.lastName}
              >
                <Input
                  type="text"
                  value={management.formData.lastName}
                  onChange={(e) =>
                    management.setFormData({ ...management.formData, lastName: e.target.value })
                  }
                />
              </FormField>
            </div>

            <FormField label="Role" required>
              <select
                value={management.formData.roleName}
                onChange={(e) =>
                  management.setFormData({ ...management.formData, roleName: e.target.value })
                }
                disabled={loadingRoles}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingRoles ? (
                  <option value="">Loading roles...</option>
                ) : roles.length === 0 ? (
                  <option value="">No roles available</option>
                ) : (
                  roles.map((role) => (
                    <option key={role._id || role.id} value={role.name}>
                      {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                    </option>
                  ))
                )}
              </select>
            </FormField>

            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={management.formData.isActive}
                  onChange={(e) =>
                    management.setFormData({ ...management.formData, isActive: e.target.checked })
                  }
                  className="h-3.5 w-3.5 text-slate-600 focus:ring-slate-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="editIsActive"
                  className="ml-2 block text-xs text-gray-700 dark:text-slate-300"
                >
                  Active
                </label>
              </div>
              {/* Note: isEmailVerified is not in backend updateUserFields, so we don't include it in the form */}
              {/* If you need to update email verification status, add it to backend updateUserFields first */}
            </div>
          </div>
        </form>
      </Modal>

      {/* Bulk Delete Confirmation Modal */}
      <Modal
        isOpen={showBulkDeleteModal}
        onClose={() => {
          setShowBulkDeleteModal(false);
          setBulkDeleteProgress({ current: 0, total: 0 });
        }}
        title={`Delete ${selectedUsers.length} User${selectedUsers.length !== 1 ? 's' : ''}?`}
        size="md"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowBulkDeleteModal(false);
                setBulkDeleteProgress({ current: 0, total: 0 });
              }}
              disabled={management.submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmBulkDelete}
              disabled={management.submitting}
              variant="danger"
              loading={management.submitting}
            >
              {management.submitting ? 'Deleting...' : 'Delete'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
          Are you sure you want to delete {selectedUsers.length} selected user{selectedUsers.length !== 1 ? 's' : ''}? 
          This action cannot be undone.
        </p>
        {bulkDeleteProgress.total > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-600 dark:text-slate-400 mb-1">
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
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={shouldShowDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedUser(null);
        }}
        title="Delete User"
        size="md"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedUser(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitDelete}
              disabled={management.submitting}
              variant="danger"
              loading={management.submitting}
            >
              {management.submitting ? 'Deleting...' : 'Delete User'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
          Are you sure you want to delete{' '}
          <span className="font-semibold">
            {selectedUser?.firstName && selectedUser?.lastName
              ? `${selectedUser.firstName} ${selectedUser.lastName}`
              : selectedUser?.email}
          </span>
          ? This action cannot be undone.
        </p>
      </Modal>

      {/* View User Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedUser(null);
          setViewUserDetails(null);
          setActiveViewTab('details');
          sessions.setUserSessions([]);
          sessions.setSelectedSessionForMap(null);
        }}
        title="User Details"
        size={activeViewTab === 'sessions' ? 'xl' : 'lg'}
        footer={
          activeViewTab === 'details' ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedUser(null);
                  setViewUserDetails(null);
                  setActiveViewTab('details');
                  sessions.setUserSessions([]);
                  sessions.setSelectedSessionForMap(null);
                }}
              >
                Close
              </Button>
              {viewUserDetails && (() => {
                const viewUserId = viewUserDetails._id || viewUserDetails.id;
                const isViewingCurrentUser = currentUserId && (viewUserId === currentUserId || viewUserId?.toString() === currentUserId.toString());
                return (
                  <PermissionButton
                    user={authService.getStoredUser()}
                    permission="users:update"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      // Double check before calling handler
                      if (isViewingCurrentUser) {
                        setToast({
                          message: 'You cannot edit your own account.',
                          type: 'error',
                        });
                        return;
                      }
                      
                      setShowViewModal(false);
                      handleEdit(viewUserDetails);
                    }}
                    disabled={isViewingCurrentUser}
                    title={isViewingCurrentUser ? "You cannot edit your own account" : "Edit user"}
                  >
                    Edit User
                  </PermissionButton>
                );
              })()}
            </>
          ) : null
        }
      >
        <div className={`${activeViewTab === 'sessions' ? 'flex-shrink-0' : ''}`}>

              {/* Avatar and Basic Info */}
              {viewUserDetails && (
                <div className="flex items-center gap-4 pb-4 mb-4 border-b border-gray-200 dark:border-slate-700">
                  <div className={`h-16 w-16 rounded-full ${getAvatarColor(viewUserDetails)} flex items-center justify-center`}>
                    <span className="text-xl font-medium text-white">
                      {getInitials(viewUserDetails)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                      {viewUserDetails.firstName && viewUserDetails.lastName
                        ? `${viewUserDetails.firstName} ${viewUserDetails.lastName}`
                        : viewUserDetails.email}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{viewUserDetails.email}</p>
                  </div>
                </div>
              )}

              {/* Tabs - Segmented Control Style */}
              <div className="flex gap-0 mb-6 bg-gray-100 dark:bg-slate-700/50 p-0.5 rounded-lg">
                <button
                  onClick={() => {
                    setActiveViewTab('details');
                    if (!viewUserDetails && selectedUser) {
                      handleView(selectedUser);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all flex-1 justify-center ${
                    activeViewTab === 'details'
                      ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 shadow-sm'
                      : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>User Details</span>
                </button>
                <button
                  onClick={() => {
                    setActiveViewTab('sessions');
                    if (selectedUser) {
                      handleViewSessions(selectedUser);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all flex-1 justify-center ${
                    activeViewTab === 'sessions'
                      ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 shadow-sm'
                      : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>User Sessions</span>
                </button>
              </div>

              {/* Tab Content */}
              {loadingUserDetails && activeViewTab === 'details' ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Loading user details...</p>
                </div>
              ) : activeViewTab === 'details' && viewUserDetails ? (
                <div className="space-y-4">

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
                      <Badge variant="info" size="sm" className="capitalize">
                        {viewUserDetails.roleName || 'N/A'}
                      </Badge>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Status
                      </label>
                      <Badge variant={viewUserDetails.isActive ? 'success' : 'danger'} size="sm">
                        {viewUserDetails.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    {/* Email Verified */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Email Verified
                      </label>
                      <Badge variant={viewUserDetails.isEmailVerified ? 'success' : 'warning'} size="sm">
                        {viewUserDetails.isEmailVerified ? 'Verified' : 'Unverified'}
                      </Badge>
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
              ) : activeViewTab === 'details' ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-red-600 dark:text-red-400">Failed to load user details</p>
                </div>
              ) : null}

              {/* Sessions Tab Content */}
              {activeViewTab === 'sessions' && (
                <div className="flex-1 overflow-hidden px-6 pb-6 -mx-6">
                  {sessions.loadingSessions ? (
                    <div className="py-8 text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Loading sessions...</p>
                    </div>
                  ) : (
                    <UserSessions
                      user={selectedUser}
                      sessions={sessions.userSessions}
                      loading={sessions.loadingSessions}
                      onClose={() => {
                        setShowViewModal(false);
                        setSelectedUser(null);
                        sessions.setUserSessions([]);
                        sessions.setSelectedSessionForMap(null);
                        setActiveViewTab('details');
                      }}
                      onTerminateSession={handleTerminateSession}
                      onTerminateAllOthers={handleTerminateAllOthers}
                      submitting={sessions.submitting}
                    />
                  )}
                </div>
              )}

        </div>
      </Modal>
    </div>
  );
};

export default Users;
