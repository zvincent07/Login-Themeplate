/**
 * DASHBOARD SERVICE
 * 
 * Handles all dashboard-related API calls
 * Components should use this service, not fetch directly
 */

import api from './api';
import { API_ENDPOINTS } from '../config/api';

/**
 * Get dashboard statistics
 * @returns {Promise<object>} Dashboard stats response
 */
export const getDashboardStats = async () => {
  try {
    const response = await api.get(`${API_ENDPOINTS.dashboard}/stats`);
    return response;
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    throw error;
  }
};

const dashboardService = {
  getDashboardStats,
};

export default dashboardService;
