import api from './api';
import { API_ENDPOINTS } from '../config/api';

const roleService = {
  // Get all roles
  getRoles: async () => {
    return await api.get(API_ENDPOINTS.roles);
  },

  // Get single role
  getRole: async (roleId) => {
    return await api.get(`${API_ENDPOINTS.roles}/${roleId}`);
  },

  // Create new role
  createRole: async (roleData) => {
    return await api.post(API_ENDPOINTS.roles, roleData);
  },

  // Update role
  updateRole: async (roleId, roleData) => {
    return await api.put(`${API_ENDPOINTS.roles}/${roleId}`, roleData);
  },

  // Delete role
  deleteRole: async (roleId) => {
    return await api.delete(`${API_ENDPOINTS.roles}/${roleId}`);
  },

  // Get all permissions
  getAllPermissions: async () => {
    return await api.get(`${API_ENDPOINTS.roles}/permissions/all`);
  },

  // Update role permissions
  updateRolePermissions: async (roleId, permissionIds) => {
    return await api.put(`${API_ENDPOINTS.roles}/${roleId}/permissions`, { permissionIds });
  },
};

export default roleService;
