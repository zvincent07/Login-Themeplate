import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import roleService from '../../../services/roleService';
import authService from '../../../services/authService';
import Toast from '../../ui/Toast';
import { Modal, Badge, Button, PermissionButton, FormField, Input, DropdownMenu } from '../../ui';
import RoleStats from './RoleStats';
import RoleFilters from './RoleFilters';
import UserStack from './UserStack';
import PermissionsMatrix from './PermissionsMatrix';

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Track if we have successfully loaded data at least once
  const hasLoadedData = useRef(false);

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
      if (!hasLoadedData.current) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }

      const response = await roleService.getRoles();
      if (response.success) {
        setRoles(response.data || []);
        hasLoadedData.current = true;
      }
    } catch (error) {
      setToast({
        message: error.message || 'Failed to fetch roles',
        type: 'error',
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);


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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
          Role-Based Access Control (RBAC)
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          <PermissionButton
            user={authService.getStoredUser()}
            permission="roles:create"
            onClick={handleCreate}
            size="sm"
            className="flex items-center gap-1.5"
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
          </PermissionButton>
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
      <div className={`bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden ${isRefreshing ? 'opacity-70 transition-opacity' : ''}`}>
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
                              <Badge variant={isSystem ? 'info' : 'success'} size="sm">
                                {isSystem ? 'System' : 'Custom'}
                              </Badge>
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
                        <DropdownMenu
                          isOpen={openDropdown === roleId}
                          onClose={() => setOpenDropdown(null)}
                          trigger={
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (openDropdown === roleId) {
                                  setOpenDropdown(null);
                                } else {
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
                          }
                        >
                          {/* System Roles: Show only View Permissions */}
                          {isSystem ? (
                            <DropdownMenu.Item
                              onClick={() => {
                                handleViewPermissions(role);
                                setOpenDropdown(null);
                              }}
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
                            </DropdownMenu.Item>
                          ) : (
                            <>
                              <DropdownMenu.Item
                                onClick={() => {
                                  handleEdit(role);
                                  setOpenDropdown(null);
                                }}
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
                              </DropdownMenu.Item>
                              <DropdownMenu.Item
                                onClick={() => {
                                  handleDuplicate(role);
                                  setOpenDropdown(null);
                                }}
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
                              </DropdownMenu.Item>
                              <DropdownMenu.Item
                                onClick={() => {
                                  handleDelete(role);
                                  setOpenDropdown(null);
                                }}
                                disabled={(role.userCount || 0) > 0}
                                variant={(role.userCount || 0) > 0 ? 'default' : 'danger'}
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
                              </DropdownMenu.Item>
                            </>
                          )}
                        </DropdownMenu>
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
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Role"
        size="md"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="create-role-form"
              disabled={submitting}
              loading={submitting}
            >
              {submitting ? 'Creating...' : 'Create Role'}
            </Button>
          </>
        }
      >
        <form id="create-role-form" onSubmit={handleSubmitCreate}>
          <div className="space-y-4">
            <FormField
              label="Role Name"
              required
              error={formErrors.name}
            >
              <Input
                name="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Support Staff, Editor"
                required
                className={formErrors.name ? 'border-red-500' : ''}
              />
            </FormField>
            <FormField label="Description">
              <Input
                name="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of the role"
              />
            </FormField>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal && !!selectedRole}
        onClose={() => setShowEditModal(false)}
        title="Edit Role"
        size="md"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowEditModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-role-form"
              disabled={submitting}
              loading={submitting}
            >
              {submitting ? 'Updating...' : 'Update Role'}
            </Button>
          </>
        }
      >
        {selectedRole && (
          <form id="edit-role-form" onSubmit={handleSubmitEdit}>
            <div className="space-y-4">
              <FormField
                label="Role Name"
                required
                error={formErrors.name}
              >
                <Input
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
              </FormField>
              <FormField label="Description">
                <Input
                  name="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description of the role"
                />
              </FormField>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal && !!selectedRole}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Role"
        size="md"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDelete}
              disabled={submitting || (selectedRole && (selectedRole.userCount > 0 || isSystemRole(selectedRole.name)))}
              variant="danger"
              loading={submitting}
            >
              {submitting ? 'Deleting...' : 'Delete Role'}
            </Button>
          </>
        }
      >
        {selectedRole && (
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
        )}
      </Modal>

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
