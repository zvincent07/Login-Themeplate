import React, { useState, useEffect, useMemo } from 'react';
import roleService from '../../../services/roleService';
import { Button, Checkbox, Badge } from '../../ui';
import Toast from '../../ui/Toast';

const Permissions = () => {
  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  
  // State for permissions
  const [rolePermissions, setRolePermissions] = useState([]); // Current state of checkboxes
  const [initialPermissions, setInitialPermissions] = useState([]); // Original state from server
  
  const [loading, setLoading] = useState(true);
  const [loadingRole, setLoadingRole] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Initial Data Load
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [rolesRes, permissionsRes] = await Promise.all([
          roleService.getRoles(),
          roleService.getAllPermissions()
        ]);

        if (rolesRes.success) {
          setRoles(rolesRes.data || []);
          // Select first role by default if available
          if (rolesRes.data && rolesRes.data.length > 0) {
            setSelectedRole(rolesRes.data[0]);
          }
        }
        
        if (permissionsRes.success) {
          setAllPermissions(permissionsRes.data || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setToast({ message: 'Failed to load data', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Fetch Selected Role Permissions
  useEffect(() => {
    if (!selectedRole) return;

    const fetchRoleDetails = async () => {
      try {
        setLoadingRole(true);
        const response = await roleService.getRole(selectedRole._id || selectedRole.id);
        if (response.success) {
          const perms = response.data.permissions || [];
          // Normalize to IDs
          const normalizedPerms = perms.map(p => typeof p === 'object' ? (p._id || p.id) : p);
          setRolePermissions(normalizedPerms);
          setInitialPermissions(normalizedPerms);
        }
      } catch (error) {
        console.error('Error fetching role details:', error);
        setToast({ message: 'Failed to load role permissions', type: 'error' });
      } finally {
        setLoadingRole(false);
      }
    };

    fetchRoleDetails();
  }, [selectedRole?._id]); // Only re-run if ID changes

  // Group Permissions by Resource
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

  const resources = useMemo(() => Object.keys(permissionsByResource).sort(), [permissionsByResource]);
  const actionOrder = ['create', 'read', 'update', 'delete', 'manage'];

  const formatResourceName = (name) => {
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Check if role is protected (Admin/Super Admin)
  const isSystemRole = useMemo(() => {
    if (!selectedRole) return false;
    // Check for explicit isSystem property or fallback to name list
    // Hybrid Model: Only Super Admin is immutable
    return selectedRole.name.toLowerCase() === 'super admin';
  }, [selectedRole]);

  // Check for unsaved changes
  const hasChanges = useMemo(() => {
    if (loadingRole) return false;
    // System roles can never have unsaved changes as they are read-only
    if (isSystemRole) return false;

    if (rolePermissions.length !== initialPermissions.length) return true;
    
    // Check if every item in rolePermissions is in initialPermissions
    const sortedCurrent = [...rolePermissions].sort();
    const sortedInitial = [...initialPermissions].sort();
    return JSON.stringify(sortedCurrent) !== JSON.stringify(sortedInitial);
  }, [rolePermissions, initialPermissions, loadingRole, isSystemRole]);

  // Keyboard shortcut for saving
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (hasChanges && !saving) {
          handleSaveChanges();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasChanges, saving, selectedRole, rolePermissions]); // Dependencies for closure access

  // Toggle Permission (Local State Only)
  const handleTogglePermission = (permissionId) => {
    if (!selectedRole) return;
    
    if (isSystemRole) {
      setToast({ message: "System roles cannot be modified.", type: "error" });
      return;
    }

    const isHas = rolePermissions.includes(permissionId);
    const newPermissions = isHas
      ? rolePermissions.filter(id => id !== permissionId)
      : [...rolePermissions, permissionId];

    setRolePermissions(newPermissions);
  };

  // Toggle All for a Resource (Local State Only)
  const handleToggleResource = (resource, enable) => {
    if (!selectedRole) return;

    if (isSystemRole) {
      setToast({ message: "System roles cannot be modified.", type: "error" });
      return;
    }
    
    const resourcePerms = permissionsByResource[resource] || [];
    const resourcePermIds = resourcePerms.map(p => p._id || p.id);
    
    let newPermissions = [...rolePermissions];
    
    if (enable) {
      // Add all missing
      resourcePermIds.forEach(id => {
        if (!newPermissions.includes(id)) newPermissions.push(id);
      });
    } else {
      // Remove all
      newPermissions = newPermissions.filter(id => !resourcePermIds.includes(id));
    }

    setRolePermissions(newPermissions);
  };

  // Save Changes
  const handleSaveChanges = async () => {
    if (!selectedRole) return;

    // Safety Check: System roles are read-only
    if (isSystemRole) {
      setToast({ message: "System roles cannot be modified.", type: "error" });
      return;
    }
    
    setSaving(true);
    try {
      const response = await roleService.updateRolePermissions(selectedRole._id || selectedRole.id, rolePermissions);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update permissions');
      }
      
      // Update initial state to match current state (clears dirty flag)
      setInitialPermissions(rolePermissions);
      setToast({ message: 'Permissions updated successfully', type: 'success' });
    } catch (error) {
      setToast({ message: error.message || 'Failed to update permissions', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Cancel Changes
  const handleCancelChanges = () => {
    setRolePermissions(initialPermissions);
  };

  if (loading) {
    return (
      <div className="max-h-[calc(100vh-7rem)] flex flex-col relative">
        <div className="mb-6">
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>

        <div className="flex flex-col md:flex-row flex-1 gap-6 overflow-hidden pb-0">
          {/* Sidebar Skeleton */}
          <div className="w-full md:w-64 flex-shrink-0 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col max-h-60 md:max-h-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-1 pb-20">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-9 w-full bg-gray-100 dark:bg-gray-700/50 rounded animate-pulse"></div>
              ))}
            </div>
          </div>

          {/* Main Content Skeleton */}
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="h-7 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-96 bg-gray-100 dark:bg-gray-700/50 rounded animate-pulse"></div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 pb-20">
              <div className="space-y-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[1, 2, 3, 4].map((j) => (
                        <div key={j} className="flex items-start gap-3 p-2">
                          <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            <div className="h-3 w-32 bg-gray-100 dark:bg-gray-700/50 rounded animate-pulse"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-h-[calc(100vh-7rem)] flex flex-col relative">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Granular Permissions
        </h1>
        {/* Helper text removed as requested */}
      </div>

      <div className="flex flex-col md:flex-row flex-1 gap-6 overflow-hidden pb-0">
        {/* Sidebar - Roles List */}
        <div className="w-full md:w-64 flex-shrink-0 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col max-h-60 md:max-h-full">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">Roles</h2>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-1 pb-20">
            {roles.map(role => (
              <button
                key={role._id || role.id}
                onClick={() => {
                  if (hasChanges) {
                     if (window.confirm("You have unsaved changes. Discard them?")) {
                       setSelectedRole(role);
                     }
                  } else {
                    setSelectedRole(role);
                  }
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  (selectedRole?._id === role._id || selectedRole?.id === role.id)
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-white font-medium'
                    : 'text-gray-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {role.name}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content - Permission Matrix */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow flex flex-col overflow-hidden">
          {selectedRole ? (
            <>
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {selectedRole.name}
                    {isSystemRole && (
                      <Badge variant="info">System Role</Badge>
                    )}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {selectedRole.description || 'No description provided'}
                  </p>
                </div>
                {isSystemRole && (
                   <span className="text-sm text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-900/30 px-3 py-1 rounded-full">
                     Read-Only
                   </span>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 pb-20">
                {loadingRole ? (
                  <div className="space-y-8">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                          <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        </div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {[1, 2, 3, 4].map((j) => (
                            <div key={j} className="flex items-start gap-3 p-2">
                              <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1"></div>
                              <div className="flex-1 space-y-2">
                                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                <div className="h-3 w-32 bg-gray-100 dark:bg-gray-700/50 rounded animate-pulse"></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-8">
                    {resources.map(resource => {
                      const resourcePermissions = permissionsByResource[resource];
                      // Check if all permissions for this resource are enabled
                      const allEnabled = resourcePermissions.every(p => rolePermissions.includes(p._id || p.id));
                      
                      return (
                        <div key={resource} className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ${isSystemRole ? 'opacity-75' : ''}`}>
                          <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {formatResourceName(resource)}
                            </h3>
                            <div className="flex items-center gap-2">
                              {!isSystemRole && (
                                <button
                                  onClick={() => handleToggleResource(resource, !allEnabled)}
                                  className="text-xs font-medium text-primary-600 dark:text-blue-300 hover:text-primary-700 dark:hover:text-blue-200"
                                >
                                  {allEnabled ? 'Uncheck All' : 'Check All'}
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {resourcePermissions.sort((a, b) => {
                                // Sort by action order
                                const aIdx = actionOrder.indexOf(a.action);
                                const bIdx = actionOrder.indexOf(b.action);
                                return aIdx - bIdx;
                            }).map(permission => (
                              <div key={permission._id || permission.id} className={`flex items-start gap-3 p-2 rounded transition-colors ${isSystemRole ? 'cursor-not-allowed hover:bg-transparent' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}>
                                <div className={isSystemRole ? 'pointer-events-auto' : ''} onClick={isSystemRole ? () => handleTogglePermission(permission._id || permission.id) : undefined}>
                                  <Checkbox
                                    id={`perm-${permission._id || permission.id}`}
                                    checked={rolePermissions.includes(permission._id || permission.id)}
                                    onChange={() => handleTogglePermission(permission._id || permission.id)}
                                    disabled={false} // Always enabled to capture clicks, logic handles lock
                                    className={isSystemRole ? 'cursor-not-allowed opacity-60' : ''}
                                  />
                                </div>
                                <div className="flex flex-col">
                                  <label 
                                    htmlFor={`perm-${permission._id || permission.id}`}
                                    className={`text-sm font-medium ${isSystemRole ? 'text-gray-500 dark:text-gray-400 cursor-not-allowed' : 'text-gray-900 dark:text-white cursor-pointer'} capitalize`}
                                  >
                                    {permission.action}
                                  </label>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {permission.description || `${permission.action} ${permission.resource}`}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
              Select a role to manage permissions
            </div>
          )}
        </div>
      </div>

      {/* Floating Save Footer */}
      {hasChanges && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-lg px-6 py-3 flex items-center gap-4 z-10 animate-fade-in-up">
           <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
             You have unsaved changes
           </span>
           <div className="flex items-center gap-2">
             <Button 
               variant="outline" 
               onClick={handleCancelChanges} 
               disabled={saving}
               className="h-[38px] px-4 text-sm"
             >
               Cancel
             </Button>
             <Button 
               variant="primary" 
               onClick={handleSaveChanges} 
               isLoading={saving}
               className="h-[38px] px-4 text-sm"
             >
               Save
             </Button>
           </div>
        </div>
      )}
    </div>
  );
};

export default Permissions;
