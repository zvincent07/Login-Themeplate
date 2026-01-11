import React, { useState, useEffect, useMemo, useCallback } from 'react';
import roleService from '../../../services/roleService';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import Label from '../../ui/Label';
import Toast from '../../ui/Toast';
import RoleStats from './RoleStats';
import RoleFilters from './RoleFilters';
import UserStack from './UserStack';
import PermissionsMatrix from './PermissionsMatrix';

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({});

  // Filter and sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Calculate stats from roles (automatically updates with optimistic UI)
  const stats = useMemo(() => {
    const systemRoles = ['admin', 'user', 'super admin', 'employee'];
    const systemRolesCount = roles.filter(r => 
      systemRoles.includes(r.name.toLowerCase())
    ).length;
    return {
      total: roles.length,
      systemRoles: systemRolesCount,
      customRoles: roles.length - systemRolesCount,
    };
  }, [roles]);

  // Fetch roles
  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await roleService.getRoles();
      if (response.success) {
        setRoles(response.data || []);
      }
    } catch (error) {
      setToast({
        message: error.message || 'Failed to fetch roles',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

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

  // Filter and sort roles
  const filteredAndSortedRoles = useMemo(() => {
    let filtered = roles;

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (role) =>
          role.name.toLowerCase().includes(searchLower) ||
          (role.description || '').toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'userCount':
          aValue = a.userCount || 0;
          bValue = b.userCount || 0;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [roles, searchTerm, sortBy, sortOrder]);

  // Check if role is system role
  const isSystemRole = (roleName) => {
    const systemRoles = ['admin', 'user', 'super admin', 'employee'];
    return systemRoles.includes(roleName.toLowerCase());
  };

  // Handle create
  const handleCreate = () => {
    setFormData({ name: '', description: '' });
    setFormErrors({});
    setSelectedRole(null);
    setShowCreateModal(true);
  };

  // Handle edit
  const handleEdit = (role) => {
    setFormData({
      name: role.name,
      description: role.description || '',
    });
    setFormErrors({});
    setSelectedRole(role);
    setShowEditModal(true);
    setOpenDropdown(null);
  };

  // Handle delete
  const handleDelete = (role) => {
    setSelectedRole(role);
    setShowDeleteModal(true);
    setOpenDropdown(null);
  };

  // Handle duplicate
  const handleDuplicate = (role) => {
    setFormData({
      name: `${role.name} (Copy)`,
      description: role.description || '',
    });
    setFormErrors({});
    setSelectedRole(null);
    setShowCreateModal(true);
    setOpenDropdown(null);
  };

  // Handle view permissions
  const handleViewPermissions = (role) => {
    setSelectedRole(role);
    setShowPermissionsModal(true);
    setOpenDropdown(null);
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Role name is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };


  // Submit create with Optimistic UI
  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Save current state for rollback
    const previousRoles = [...roles];

    // Optimistic update: Add new role immediately
    const optimisticRole = {
      _id: `temp-${Date.now()}`,
      name: formData.name.trim(),
      description: formData.description.trim() || '',
      userCount: 0,
      createdAt: new Date().toISOString(),
    };

    setRoles(prev => [...prev, optimisticRole]);
    setShowCreateModal(false);
    setSubmitting(true);

    try {
      // Make API call
      const response = await roleService.createRole(formData);
      
      if (response.success) {
        // Replace optimistic role with real role from server
        setRoles(prev => prev.map(role => 
          role._id === optimisticRole._id 
            ? { ...response.data, userCount: 0 }
            : role
        ));
        
        // Stats automatically update via useMemo - no need to refresh
        
        setToast({
          message: 'Role created successfully',
          type: 'success',
        });
      } else {
        // Rollback on failure
        setRoles(previousRoles);
        setToast({
          message: response.error || 'Failed to create role',
          type: 'error',
        });
      }
    } catch (error) {
      // Rollback on error
      setRoles(previousRoles);
      setToast({
        message: error.message || 'Failed to create role',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Submit edit with Optimistic UI
  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Save current state for rollback
    const previousRoles = [...roles];
    const roleId = selectedRole._id;

    // Optimistic update: Update role immediately
    setRoles(prev => prev.map(role => 
      role._id === roleId || role.id === roleId
        ? {
            ...role,
            name: formData.name.trim(),
            description: formData.description.trim() || '',
          }
        : role
    ));
    
    setShowEditModal(false);
    setSubmitting(true);

    try {
      // Make API call
      const response = await roleService.updateRole(roleId, formData);
      
      if (response.success) {
        // Replace optimistic update with server response (includes userCount)
        setRoles(prev => prev.map(role => 
          role._id === roleId || role.id === roleId
            ? { ...response.data, userCount: response.data.userCount || role.userCount || 0 }
            : role
        ));
        
        // Stats automatically update via useMemo - no need to refresh
        
        setToast({
          message: 'Role updated successfully',
          type: 'success',
        });
      } else {
        // Rollback on failure
        setRoles(previousRoles);
        setToast({
          message: response.error || 'Failed to update role',
          type: 'error',
        });
      }
    } catch (error) {
      // Rollback on error
      setRoles(previousRoles);
      setToast({
        message: error.message || 'Failed to update role',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm delete with Optimistic UI
  const handleConfirmDelete = async () => {
    // Save current state for rollback
    const previousRoles = [...roles];
    const roleId = selectedRole._id;

    // Optimistic update: Remove role immediately
    setRoles(prev => prev.filter(role => 
      role._id !== roleId && role.id !== roleId
    ));
    
    setShowDeleteModal(false);
    setSubmitting(true);

    try {
      // Make API call
      const response = await roleService.deleteRole(roleId);
      
      if (response.success) {
        // Stats automatically update via useMemo - no need to refresh
        
        setToast({
          message: 'Role deleted successfully',
          type: 'success',
        });
      } else {
        // Rollback on failure
        setRoles(previousRoles);
        setToast({
          message: response.error || 'Failed to delete role',
          type: 'error',
        });
      }
    } catch (error) {
      // Rollback on error
      setRoles(previousRoles);
      setToast({
        message: error.message || 'Failed to delete role',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
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
          Role-Based Access Control (RBAC)
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
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
            <span className="hidden sm:inline">Create Role</span>
            <span className="sm:hidden">Create</span>
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <RoleStats stats={stats} loading={loading} onCreateClick={handleCreate} />

      {/* Filters */}
      <RoleFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
      />

      {/* Roles Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading roles...</p>
          </div>
        ) : filteredAndSortedRoles.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {searchTerm ? 'No roles found matching your search' : 'No roles found. Create your first role to get started.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">
                    Description
                  </th>
                  <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Users
                  </th>
                  <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
                    Created
                  </th>
                  <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {filteredAndSortedRoles.map((role) => {
                  const roleId = role._id || role.id;
                  const isSystem = isSystemRole(role.name);
                  return (
                    <tr
                      key={roleId}
                      className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <td className="px-2 sm:px-4 py-2.5">
                        <div className="flex items-center">
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-slate-100 flex items-center gap-2">
                              {role.name}
                              {isSystem ? (
                                <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                  System
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                                  Custom
                                </span>
                              )}
                            </div>
                            {/* Mobile: Show description inline */}
                            <div className="md:hidden mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {role.description || (
                                <span className="italic text-gray-400 dark:text-gray-500">
                                  No description
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-2.5 hidden md:table-cell">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {role.description || (
                            <span className="italic text-gray-400 dark:text-gray-500">
                              No description
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-2.5 whitespace-nowrap">
                        <UserStack 
                          users={role.users || []} 
                          count={role.userCount || 0} 
                        />
                      </td>
                      <td className="px-2 sm:px-4 py-2.5 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                        {formatDate(role.createdAt)}
                      </td>
                      <td className="px-2 sm:px-4 py-2.5 whitespace-nowrap text-sm font-medium relative">
                        <div className="relative dropdown-container">
                          <button
                            data-role-id={roleId}
                            onClick={(e) => {
                              if (openDropdown === roleId) {
                                setOpenDropdown(null);
                              } else {
                                // Calculate if dropdown should open upward
                                const buttonRect = e.currentTarget.getBoundingClientRect();
                                const spaceBelow = window.innerHeight - buttonRect.bottom;
                                const spaceAbove = buttonRect.top;
                                // System roles have 1 item, custom roles have 3 items
                                const dropdownHeight = isSystem ? 50 : 150;
                                
                                const openUpward = spaceBelow < dropdownHeight && spaceAbove > dropdownHeight;
                                setDropdownPosition({ [roleId]: openUpward ? 'top' : 'bottom' });
                                setOpenDropdown(roleId);
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
                          
                          {/* Dropdown Menu */}
                          {openDropdown === roleId && (
                            <div 
                              className={`fixed w-40 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-gray-200 dark:border-slate-700 z-[100] py-1 ${
                                dropdownPosition[roleId] === 'top' 
                                  ? 'animate-[fadeIn_0.2s_ease-out_forwards,slideUp_0.2s_ease-out_forwards]' 
                                  : 'animate-[fadeIn_0.2s_ease-out_forwards,slideDown_0.2s_ease-out_forwards]'
                              }`}
                              style={{
                                left: `${(() => {
                                  const button = document.querySelector(`[data-role-id="${roleId}"]`);
                                  return button ? button.getBoundingClientRect().left : 0;
                                })()}px`,
                                [dropdownPosition[roleId] === 'top' ? 'bottom' : 'top']: `${(() => {
                                  const button = document.querySelector(`[data-role-id="${roleId}"]`);
                                  if (button) {
                                    const rect = button.getBoundingClientRect();
                                    return dropdownPosition[roleId] === 'top' 
                                      ? `${window.innerHeight - rect.top + 4}px`
                                      : `${rect.bottom + 4}px`;
                                  }
                                  return '0px';
                                })()}`
                              }}
                            >
                              {/* System Roles: Show only View Permissions */}
                              {isSystem ? (
                                <button
                                  onClick={() => handleViewPermissions(role)}
                                  className="w-full px-4 py-2.5 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-2"
                                  title="View permissions for this system role"
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
                                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    />
                                  </svg>
                                  <span>View Permissions</span>
                                </button>
                              ) : (
                                /* Custom Roles: Show Edit, Duplicate, Delete */
                                <>
                                  {/* Edit */}
                                  <button
                                    onClick={() => handleEdit(role)}
                                    className="w-full px-4 py-2.5 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-2"
                                    title="Edit role"
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
                                  
                                  {/* Duplicate */}
                                  <button
                                    onClick={() => handleDuplicate(role)}
                                    className="w-full px-4 py-2.5 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-2"
                                    title="Duplicate this role"
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
                                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                      />
                                    </svg>
                                    <span>Duplicate</span>
                                  </button>
                                  
                                  {/* Delete */}
                                  <button
                                    onClick={() => handleDelete(role)}
                                    disabled={(role.userCount || 0) > 0}
                                    className={`w-full px-4 py-2.5 text-sm text-left flex items-center gap-2 ${
                                      (role.userCount || 0) > 0
                                        ? 'text-gray-400 dark:text-gray-500 opacity-50 cursor-not-allowed'
                                        : 'text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer'
                                    }`}
                                    title={
                                      (role.userCount || 0) > 0
                                        ? `Cannot delete role with ${role.userCount} user(s)`
                                        : 'Delete role'
                                    }
                                  >
                                    <svg
                                      className={`w-4 h-4 ${(role.userCount || 0) > 0 ? 'text-gray-400 dark:text-gray-500' : 'text-red-600 dark:text-red-400'}`}
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
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4">
              Create New Role
            </h2>
            <form onSubmit={handleSubmitCreate}>
              <div className="mb-4">
                <Label htmlFor="create-name">Role Name *</Label>
                <Input
                  id="create-name"
                  name="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Support Staff, Editor"
                  required
                  className={formErrors.name ? 'border-red-500' : ''}
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {formErrors.name}
                  </p>
                )}
              </div>
              <div className="mb-6">
                <Label htmlFor="create-description">Description</Label>
                <Input
                  id="create-description"
                  name="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description of the role"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  disabled={submitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={submitting}
                  disabled={submitting}
                  className="flex-1"
                >
                  Create Role
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4">
              Edit Role
            </h2>
            <form onSubmit={handleSubmitEdit}>
              <div className="mb-4">
                <Label htmlFor="edit-name">Role Name *</Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Support Staff, Editor"
                  required
                  disabled={isSystemRole(selectedRole.name) && selectedRole.name.toLowerCase() === 'admin'}
                  className={formErrors.name ? 'border-red-500' : ''}
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {formErrors.name}
                  </p>
                )}
              </div>
              <div className="mb-6">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  name="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description of the role"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  disabled={submitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={submitting}
                  disabled={submitting}
                  className="flex-1"
                >
                  Update Role
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4">
              Delete Role
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete the role "{selectedRole.name}"?
              {selectedRole.userCount > 0 && (
                <span className="block mt-2 text-red-600 dark:text-red-400 font-medium">
                  This role is assigned to {selectedRole.userCount} user(s). You
                  must reassign these users before deleting the role.
                </span>
              )}
              {isSystemRole(selectedRole.name) && (
                <span className="block mt-2 text-red-600 dark:text-red-400 font-medium">
                  System roles cannot be deleted.
                </span>
              )}
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={submitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleConfirmDelete}
                loading={submitting}
                disabled={submitting || selectedRole.userCount > 0 || isSystemRole(selectedRole.name)}
                className="flex-1"
              >
                Delete Role
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Matrix Modal */}
      {showPermissionsModal && selectedRole && (
        <PermissionsMatrix
          role={selectedRole}
          isOpen={showPermissionsModal}
          onClose={() => {
            setShowPermissionsModal(false);
            setSelectedRole(null);
          }}
          isSystemRole={isSystemRole(selectedRole.name)}
        />
      )}
    </div>
  );
};

export default Roles;
