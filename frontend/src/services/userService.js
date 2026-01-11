import api from './api';
import { API_ENDPOINTS } from '../config/api';

const userService = {
  // Get all users (Admin only) with pagination and filters
  getUsers: async (page = 1, limit = 10, filters = {}) => {
    const { search = '', role = '', status = '', provider = '', sortBy = 'createdAt', sortOrder = 'desc' } = filters;
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (search) params.append('search', search);
    if (role && role !== 'all') params.append('role', role);
    if (status && status !== 'all') params.append('status', status);
    if (provider && provider !== 'all') params.append('provider', provider);
    if (sortBy) params.append('sortBy', sortBy);
    if (sortOrder) params.append('sortOrder', sortOrder);
    
    return await api.get(`${API_ENDPOINTS.users}?${params.toString()}`);
  },

  // Get single user
  getUser: async (userId) => {
    return await api.get(`${API_ENDPOINTS.users}/${userId}`);
  },

  // Create user (Admin only)
  createUser: async (userData) => {
    // For now, we'll use the employees endpoint, but this can be extended
    return await api.post(`${API_ENDPOINTS.users}/employees`, userData);
  },

  // Update user
  updateUser: async (userId, userData) => {
    return await api.put(`${API_ENDPOINTS.users}/${userId}`, userData);
  },

  // Delete user (Admin only)
  deleteUser: async (userId) => {
    return await api.delete(`${API_ENDPOINTS.users}/${userId}`);
  },

  // Restore deleted user (Admin only)
  restoreUser: async (userId) => {
    return await api.post(`${API_ENDPOINTS.users}/${userId}/restore`);
  },

  // Get user statistics (Admin only)
  getUserStats: async () => {
    return await api.get(`${API_ENDPOINTS.users}/stats`);
  },

  // Get user sessions (Admin only) - all sessions, no pagination
  getUserSessions: async (userId) => {
    return await api.get(`${API_ENDPOINTS.users}/${userId}/sessions`);
  },

  // Terminate user session (Admin only)
  terminateSession: async (userId, sessionId) => {
    return await api.delete(`${API_ENDPOINTS.users}/${userId}/sessions/${sessionId}`);
  },

  // Terminate all other user sessions except current (Admin only)
  terminateAllOtherSessions: async (userId) => {
    return await api.delete(`${API_ENDPOINTS.users}/${userId}/sessions`);
  },
};

export default userService;
