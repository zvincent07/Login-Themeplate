import { useState, useCallback } from 'react';
import userService from '../services/userService';
import authService from '../services/authService';

/**
 * Custom hook for managing user CRUD operations with Optimistic UI
 */
export const useUserManagement = (currentUserId, users, setUsers, stats, setStats, fetchStats) => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    roleName: 'user',
    isActive: true,
    isEmailVerified: false,
  });
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  /**
   * Check if user is the current logged-in admin
   */
  const isOwnAccount = useCallback((userId) => {
    if (!userId) return false;
    const userIdStr = String(userId || '');
    
    // Get current user ID from state or localStorage as fallback
    let currentUserIdToCheck = currentUserId;
    if (!currentUserIdToCheck) {
      try {
        const storedUser = authService.getStoredUser();
        currentUserIdToCheck = storedUser?.id || storedUser?._id;
      } catch (e) {
        // Ignore
      }
    }
    const currentUserIdStr = String(currentUserIdToCheck || '');
    
    return currentUserIdToCheck && userId && (
      userId === currentUserIdToCheck || 
      userIdStr === currentUserIdStr ||
      userId?.toString() === currentUserIdToCheck.toString() ||
      String(userId) === String(currentUserIdToCheck)
    );
  }, [currentUserId]);

  /**
   * Validate form data
   */
  const validateForm = useCallback(() => {
    const errors = {};
    
    if (!formData.email || !formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }
    
    // Password is required for new users (when creating)
    // For editing, password is optional (only required if changing password)
    if (!formData.password && !formData._id) {
      errors.password = 'Password is required';
    } else if (formData.password && formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    
    if (formData.firstName && formData.firstName.length > 50) {
      errors.firstName = 'First name must be less than 50 characters';
    }
    
    if (formData.lastName && formData.lastName.length > 50) {
      errors.lastName = 'Last name must be less than 50 characters';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  /**
   * Create user
   */
  const handleCreate = useCallback(async () => {
    if (!validateForm()) return false;

    try {
      setSubmitting(true);
      setFormErrors({});
      const response = await userService.createUser(formData);
      
      if (response.success) {
        return { success: true, data: response.data };
      } else {
        setFormErrors({ submit: response.error || 'Failed to create user' });
        return { success: false, error: response.error };
      }
    } catch (err) {
      setFormErrors({ submit: err.message || 'Failed to create user' });
      return { success: false, error: err.message };
    } finally {
      setSubmitting(false);
    }
  }, [formData, validateForm]);

  /**
   * Update user with Optimistic UI
   */
  const handleUpdate = useCallback(async (userId, updateData) => {
    // Prevent editing own account
    if (isOwnAccount(userId)) {
      return { success: false, error: 'You cannot edit your own account.' };
    }

    // Optimistic UI: Save current state for rollback
    const previousUsers = [...users];
    
    // Update UI immediately
    const updatedUser = {
      ...users.find(u => (u._id || u.id) === userId),
      ...updateData,
    };
    
    setUsers(prevUsers => 
      prevUsers.map(u => 
        (u._id || u.id) === userId 
          ? updatedUser
          : u
      )
    );

    try {
      setSubmitting(true);
      const dataToUpdate = { ...updateData };
      // Don't send password if it's empty (not changing password)
      if (!dataToUpdate.password) {
        delete dataToUpdate.password;
      }
      const response = await userService.updateUser(userId, dataToUpdate);
      
      if (response.success) {
        // Success: Only refresh stats (users already updated optimistically)
        fetchStats();
        return { success: true, data: response.data };
      } else {
        // Failure: Rollback optimistic update
        setUsers(previousUsers);
        return { success: false, error: response.error };
      }
    } catch (err) {
      // Failure: Rollback optimistic update
      setUsers(previousUsers);
      return { success: false, error: err.message };
    } finally {
      setSubmitting(false);
    }
  }, [users, setUsers, isOwnAccount, fetchStats]);

  /**
   * Delete user with Optimistic UI
   */
  const handleDelete = useCallback(async (userId) => {
    // Prevent deleting own account
    if (isOwnAccount(userId)) {
      return { success: false, error: 'You cannot delete your own account.' };
    }

    const userToDelete = users.find(u => (u._id || u.id) === userId);
    if (!userToDelete) {
      return { success: false, error: 'User not found' };
    }

    // Optimistic UI: Save current state for rollback
    const previousUsers = [...users];
    const previousStats = { ...stats };
    
    // Update UI immediately - remove user from list
    setUsers(prevUsers => prevUsers.filter(u => (u._id || u.id) !== userId));
    
    // Update stats optimistically
    setStats(prevStats => ({
      ...prevStats,
      total: Math.max(0, (prevStats.total || 0) - 1),
      active: userToDelete?.isActive 
        ? Math.max(0, (prevStats.active || 0) - 1)
        : prevStats.active
    }));
    
    try {
      setSubmitting(true);
      const response = await userService.deleteUser(userId);
      
      if (response.success) {
        // Success: Only refresh stats (users already updated optimistically)
        fetchStats();
        return { success: true };
      } else {
        // Failure: Rollback optimistic update
        setUsers(previousUsers);
        setStats(previousStats);
        return { success: false, error: response.error };
      }
    } catch (err) {
      // Failure: Rollback optimistic update
      setUsers(previousUsers);
      setStats(previousStats);
      return { success: false, error: err.message };
    } finally {
      setSubmitting(false);
    }
  }, [users, setUsers, stats, setStats, isOwnAccount, fetchStats]);

  /**
   * Toggle user active/inactive with Optimistic UI
   */
  const handleToggleActive = useCallback(async (user) => {
    const userId = user._id || user.id;
    
    // Prevent deactivating own account
    if (isOwnAccount(userId)) {
      return { success: false, error: 'You cannot deactivate your own account.' };
    }
    
    // Optimistic UI: Save current state for rollback
    const previousUsers = [...users];
    const newIsActive = !user.isActive;
    
    // Update UI immediately
    setUsers(prevUsers => 
      prevUsers.map(u => 
        (u._id || u.id) === userId 
          ? { ...u, isActive: newIsActive }
          : u
      )
    );
    
    // Update stats optimistically
    setStats(prevStats => ({
      ...prevStats,
      active: newIsActive 
        ? (prevStats.active || 0) + 1 
        : Math.max(0, (prevStats.active || 0) - 1)
    }));
    
    try {
      setSubmitting(true);
      const updateData = {
        ...user,
        isActive: newIsActive,
      };
      delete updateData.password; // Don't send password
      const response = await userService.updateUser(userId, updateData);
      
      if (response.success) {
        // Success: Only refresh stats (users already updated optimistically)
        fetchStats();
        return { success: true, data: response.data };
      } else {
        // Failure: Rollback optimistic update
        setUsers(previousUsers);
        setStats(prevStats => ({
          ...prevStats,
          active: newIsActive 
            ? Math.max(0, (prevStats.active || 0) - 1)
            : (prevStats.active || 0) + 1
        }));
        return { success: false, error: response.error };
      }
    } catch (err) {
      // Failure: Rollback optimistic update
      setUsers(previousUsers);
      setStats(prevStats => ({
        ...prevStats,
        active: newIsActive 
          ? Math.max(0, (prevStats.active || 0) - 1)
          : (prevStats.active || 0) + 1
      }));
      return { success: false, error: err.message };
    } finally {
      setSubmitting(false);
    }
  }, [users, setUsers, stats, setStats, isOwnAccount, fetchStats]);

  /**
   * Restore deleted user with Optimistic UI
   */
  const handleRestore = useCallback(async (user) => {
    const userId = user._id || user.id;
    
    // Optimistic UI: Save current state for rollback
    const previousUsers = [...users];
    
    // Update UI immediately - remove deletedAt
    setUsers(prevUsers => 
      prevUsers.map(u => 
        (u._id || u.id) === userId 
          ? { ...u, deletedAt: null }
          : u
      )
    );
    
    try {
      setSubmitting(true);
      const response = await userService.restoreUser(userId);
      
      if (response.success) {
        // Success: Refresh users and stats
        fetchStats();
        return { success: true, data: response.data };
      } else {
        // Failure: Rollback optimistic update
        setUsers(previousUsers);
        return { success: false, error: response.error };
      }
    } catch (err) {
      // Failure: Rollback optimistic update
      setUsers(previousUsers);
      return { success: false, error: err.message };
    } finally {
      setSubmitting(false);
    }
  }, [users, setUsers, fetchStats]);

  /**
   * Bulk delete users
   */
  const handleBulkDelete = useCallback(async (userIds) => {
    const previousUsers = [...users];
    const previousStats = { ...stats };
    
    // Optimistic UI: Remove all selected users immediately
    setUsers(prevUsers => 
      prevUsers.filter(u => !userIds.includes(u._id || u.id))
    );
    
    // Update stats optimistically
    const deletedUsers = users.filter(u => userIds.includes(u._id || u.id));
    const activeCount = deletedUsers.filter(u => u.isActive).length;
    
    setStats(prevStats => ({
      ...prevStats,
      total: Math.max(0, (prevStats.total || 0) - userIds.length),
      active: Math.max(0, (prevStats.active || 0) - activeCount)
    }));
    
    let successCount = 0;
    let failureCount = 0;
    const errors = [];
    
    try {
      setSubmitting(true);
      
      // Delete users one by one (can be optimized to batch API call)
      for (const userId of userIds) {
        try {
          const response = await userService.deleteUser(userId);
          if (response.success) {
            successCount++;
          } else {
            failureCount++;
            errors.push(`${userId}: ${response.error}`);
          }
        } catch (err) {
          failureCount++;
          errors.push(`${userId}: ${err.message}`);
        }
      }
      
      if (failureCount === 0) {
        // All succeeded: Refresh stats
        fetchStats();
        return { 
          success: true, 
          successCount, 
          message: `Successfully deleted ${successCount} user(s)` 
        };
      } else {
        // Some failed: Rollback and report errors
        setUsers(previousUsers);
        setStats(previousStats);
        return { 
          success: false, 
          successCount, 
          failureCount, 
          errors,
          message: `Failed to delete ${failureCount} user(s)` 
        };
      }
    } catch (err) {
      // Complete failure: Rollback
      setUsers(previousUsers);
      setStats(previousStats);
      return { success: false, error: err.message };
    } finally {
      setSubmitting(false);
    }
  }, [users, setUsers, stats, setStats, fetchStats]);

  return {
    // State
    formData,
    formErrors,
    submitting,
    showPassword,
    
    // Setters
    setFormData,
    setFormErrors,
    setShowPassword,
    
    // Actions
    validateForm,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleToggleActive,
    handleRestore,
    handleBulkDelete,
    isOwnAccount,
  };
};
