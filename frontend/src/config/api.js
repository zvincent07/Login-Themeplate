// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const API_ENDPOINTS = {
  health: '/health',
  auth: '/auth',
  users: '/users',
  chatbot: '/chatbot',
  roles: '/roles',
  auditLogs: '/audit-logs',
};

export default API_BASE_URL;

