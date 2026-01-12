import React, { useState, useEffect, useMemo } from 'react';
import roleService from '../../../services/roleService';
import Button from '../../ui/Button';
import Toast from '../../ui/Toast';

const PermissionsMatrix = ({ role, isOpen, onClose, isSystemRole = false }) => {
  const [allPermissions, setAllPermissions] = useState([]);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch all permissions and role details
  useEffect(() => {
    if (!isOpen || !role) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [permissionsResponse, roleResponse] = await Promise.all([
          roleService.getAllPermissions(),
          roleService.getRole(role._id || role.id),
        ]);

        if (permissionsResponse.success) {
          const permissions = permissionsResponse.data || [];
          setAllPermissions(permissions);
          
          // Permissions are now auto-seeded, so if still empty, it means there's a real issue
          if (permissions.length === 0) {
            setToast({
              message: 'Permissions are being created. Please wait a moment and try again.',
              type: 'info',
            });
          }
        } else {
          setToast({
            message: permissionsResponse.error || 'Failed to load permissions',
            type: 'error',
          });
        }

        if (roleResponse.success) {
          // Handle both populated permissions (objects) and permission IDs (strings)
          const permissions = roleResponse.data.permissions || [];
          const permissionIds = permissions.map(p => 
            typeof p === 'object' ? (p._id || p.id) : p
          );
          setRolePermissions(permissionIds);
        } else {
          setToast({
            message: roleResponse.error || 'Failed to load role permissions',
            type: 'error',
          });
        }
      } catch (error) {
        console.error('Error loading permissions:', error);
        setToast({
          message: error.message || 'Failed to load permissions',
          type: 'error',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, role]);

  // Reset changes when modal closes
  useEffect(() => {
    if (!isOpen) {
      setHasChanges(false);
    }
  }, [isOpen]);

  // Group permissions by resource
  const permissionsByResource = useMemo(() => {
    const grouped = {};
    allPermissions.forEach(permission => {
      const resource = permission.resource;
      if (!grouped[resource]) {
        grouped[resource] = [];
      }
      grouped[resource].push(permission);
    });
    return grouped;
  }, [allPermissions]);

  // Get all unique resources
  const resources = useMemo(() => {
    return Object.keys(permissionsByResource).sort();
  }, [permissionsByResource]);

  // Get all unique actions (in order: read, create, update, delete)
  // Exclude 'manage' - it's redundant with 'All' toggle
  const actionOrder = useMemo(() => ['read', 'create', 'update', 'delete'], []);
  const actions = useMemo(() => {
    const actionSet = new Set();
    allPermissions.forEach(p => {
      // Exclude 'manage' action - use 'All' toggle instead
      if (p.action !== 'manage') {
        actionSet.add(p.action);
      }
    });
    return actionOrder.filter(a => actionSet.has(a));
  }, [allPermissions, actionOrder]);

  // Check if a permission is selected
  const isPermissionSelected = (permissionId) => {
    return rolePermissions.includes(permissionId);
  };

  // Toggle permission
  const togglePermission = (permissionId) => {
    if (isSystemRole || !permissionId) return; // Don't allow changes for system roles or invalid IDs

    setRolePermissions(prev => {
      const newPermissions = prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId];
      setHasChanges(true);
      return newPermissions;
    });
  };

  // Handle "All" toggle - selects/deselects all permissions for a resource
  const toggleResourceAll = (resource) => {
    if (isSystemRole) return;

    const resourcePermissions = permissionsByResource[resource] || [];
    if (!resourcePermissions || resourcePermissions.length === 0) return;
    
    // Exclude 'manage' action - only CRUD operations
    const crudPermissions = resourcePermissions.filter(p => p?.action !== 'manage');
    const resourcePermissionIds = crudPermissions
      .map(p => p?._id || p?.id)
      .filter(id => id); // Filter out any undefined values
    
    if (resourcePermissionIds.length === 0) return;

    const isFullySelected = resourcePermissionIds.every(id => rolePermissions.includes(id));

    if (isFullySelected) {
      // Deselect all permissions for this resource
      setRolePermissions(prev => {
        const newPermissions = prev.filter(id => !resourcePermissionIds.includes(id));
        setHasChanges(true);
        return newPermissions;
      });
    } else {
      // Select all permissions for this resource
      setRolePermissions(prev => {
        const newPermissions = [...new Set([...prev, ...resourcePermissionIds])];
        setHasChanges(true);
        return newPermissions;
      });
    }
  };

  // Save permissions
  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await roleService.updateRolePermissions(
        role._id || role.id,
        rolePermissions
      );

      if (response.success) {
        setToast({
          message: 'Permissions updated successfully',
          type: 'success',
        });
        setHasChanges(false);
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (error) {
      setToast({
        message: error.message || 'Failed to update permissions',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  // Get permission for a resource and action
  const getPermission = (resource, action) => {
    if (!permissionsByResource[resource]) return null;
    return permissionsByResource[resource].find(p => p?.action === action) || null;
  };

  // Check if all permissions for a resource are selected (excluding 'manage')
  const isResourceFullySelected = (resource) => {
    const resourcePermissions = permissionsByResource[resource] || [];
    if (resourcePermissions.length === 0) return false;
    // Only check CRUD permissions, exclude 'manage'
    const crudPermissions = resourcePermissions.filter(p => p?.action !== 'manage');
    if (crudPermissions.length === 0) return false;
    return crudPermissions.every(p => {
      const permId = p?._id || p?.id;
      return permId && rolePermissions.includes(permId);
    });
  };

  // Check if any permissions for a resource are selected (excluding 'manage')
  const isResourcePartiallySelected = (resource) => {
    const resourcePermissions = permissionsByResource[resource] || [];
    if (resourcePermissions.length === 0) return false;
    // Only check CRUD permissions, exclude 'manage'
    const crudPermissions = resourcePermissions.filter(p => p?.action !== 'manage');
    if (crudPermissions.length === 0) return false;
    const selectedCount = crudPermissions.filter(p => {
      const permId = p?._id || p?.id;
      return permId && rolePermissions.includes(permId);
    }).length;
    return selectedCount > 0 && selectedCount < crudPermissions.length;
  };

  if (!isOpen) return null;

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                Permissions Matrix
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {role?.name} {isSystemRole ? '(System Role - View Only)' : '(Custom Role - Editable)'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">Loading permissions...</p>
              </div>
            ) : resources.length === 0 ? (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-gray-400 dark:text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
                    No Permissions Available
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Permissions have been automatically created. Please refresh to see them.
                  </p>
                  <Button
                    onClick={() => {
                      // Reload permissions
                      window.location.reload();
                    }}
                    variant="primary"
                    size="md"
                    className="w-auto mx-auto"
                  >
                    Refresh Permissions
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                  <thead className="bg-gray-50 dark:bg-slate-700 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider sticky left-0 bg-gray-50 dark:bg-slate-700 z-20">
                        Resource
                      </th>
                      {actions.map(action => (
                        <th
                          key={action}
                          className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[100px]"
                        >
                          {action.charAt(0).toUpperCase() + action.slice(1)}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[120px]">
                        All
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                    {resources.map((resource) => {
                      const isFullySelected = isResourceFullySelected(resource);
                      const isPartiallySelected = isResourcePartiallySelected(resource);
                      
                      return (
                        <tr
                          key={resource}
                          className={`transition-colors ${
                            isSystemRole
                              ? 'hover:bg-gray-50 dark:hover:bg-slate-700/30'
                              : 'hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer'
                          }`}
                        >
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-slate-100 sticky left-0 bg-white dark:bg-slate-800 z-10 capitalize">
                            {resource}
                          </td>
                          {actions.map(action => {
                            const permission = getPermission(resource, action);
                            // If permission doesn't exist for this resource/action, show empty checkbox (N/A)
                            if (!permission || !permission._id) {
                              return (
                                <td key={action} className="px-4 py-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={false}
                                    disabled={true}
                                    className="h-4 w-4 rounded border-2 border-gray-300 dark:border-gray-600 opacity-30 cursor-not-allowed"
                                    title={`Not applicable: ${action} ${resource}`}
                                  />
                                </td>
                              );
                            }
                            const permissionId = permission._id || permission.id;
                            if (!permissionId) {
                              return (
                                <td key={action} className="px-4 py-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={false}
                                    disabled={true}
                                    className="h-4 w-4 rounded border-2 border-gray-300 dark:border-gray-600 opacity-30 cursor-not-allowed"
                                    title={`Not applicable: ${action} ${resource}`}
                                  />
                                </td>
                              );
                            }
                            const isSelected = isPermissionSelected(permissionId);
                            
                            return (
                              <td key={action} className="px-4 py-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => togglePermission(permissionId)}
                                  disabled={isSystemRole}
                                  className={`h-4 w-4 rounded border-2 focus:ring-2 focus:ring-offset-0 transition-colors ${
                                    isSystemRole
                                      ? 'border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 opacity-50 cursor-not-allowed'
                                      : isSelected
                                      ? 'border-blue-600 dark:border-blue-400 bg-blue-600 dark:bg-blue-500 text-white focus:ring-blue-500 dark:focus:ring-blue-400 cursor-pointer'
                                      : 'border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer'
                                  }`}
                                  title={permission?.description || `${action} ${resource}`}
                                />
                              </td>
                            );
                          })}
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={isFullySelected}
                              ref={(input) => {
                                if (input) {
                                  input.indeterminate = isPartiallySelected;
                                }
                              }}
                              onChange={() => toggleResourceAll(resource)}
                              disabled={isSystemRole}
                              className={`h-4 w-4 rounded border-2 focus:ring-2 focus:ring-offset-0 transition-colors ${
                                isSystemRole
                                  ? 'border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 opacity-50 cursor-not-allowed'
                                  : isFullySelected || isPartiallySelected
                                  ? 'border-blue-600 dark:border-blue-400 bg-blue-600 dark:bg-blue-500 text-white focus:ring-blue-500 dark:focus:ring-blue-400 cursor-pointer'
                                  : 'border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer'
                              }`}
                              title={`Select all permissions for ${resource}`}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {isSystemRole ? (
                <span className="text-blue-600 dark:text-blue-400">
                  System roles cannot be modified
                </span>
              ) : hasChanges ? (
                <span className="text-amber-600 dark:text-amber-400">
                  You have unsaved changes
                </span>
              ) : null}
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50"
              >
                {isSystemRole ? 'Close' : hasChanges ? 'Cancel' : 'Close'}
              </button>
              {!isSystemRole && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !hasChanges}
                  className="px-3 py-1.5 text-sm bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 shadow-sm hover:shadow-md transition-shadow flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Saving...</span>
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PermissionsMatrix;
