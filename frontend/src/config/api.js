// API Configuration
// Use v1 API endpoints (backward compatible - old routes still work)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const API_VERSION = '/v1';

export const API_ENDPOINTS = {
  health: '/health',
  auth: `${API_VERSION}/auth`,
  users: `${API_VERSION}/users`,
  chatbot: `${API_VERSION}/chatbot`,
  roles: `${API_VERSION}/roles`,
  auditLogs: `${API_VERSION}/audit-logs`,
  dashboard: `${API_VERSION}/dashboard`,
};

export default API_BASE_URL;

