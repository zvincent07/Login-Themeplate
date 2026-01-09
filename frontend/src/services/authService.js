import api from './api';
import { API_ENDPOINTS } from '../config/api';

const authService = {
  // Register new user (public - only for 'user' role)
  register: async (userData) => {
    const response = await api.post(`${API_ENDPOINTS.auth}/register`, userData);
    if (!response.success && response.details) {
      const error = new Error(response.error || 'Registration failed');
      error.details = response.details;
      throw error;
    }
    return response;
  },

  // Verify OTP
  verifyOTP: async (userId, otp) => {
    return await api.post(`${API_ENDPOINTS.auth}/verify-otp`, { userId, otp });
  },

  // Resend OTP
  resendOTP: async (userId) => {
    return await api.post(`${API_ENDPOINTS.auth}/resend-otp`, { userId });
  },

  // Login user
  login: async (email, password, turnstileToken, rememberMe = false) => {
    return await api.post(`${API_ENDPOINTS.auth}/login`, { 
      email, 
      password,
      turnstileToken,
      rememberMe
    });
  },

  // Forgot password
  forgotPassword: async (email) => {
    return await api.post(`${API_ENDPOINTS.auth}/forgot-password`, { email });
  },

  // Reset password
  resetPassword: async (token, password) => {
    return await api.post(`${API_ENDPOINTS.auth}/reset-password`, { token, password });
  },

  // Get current user
  getMe: async () => {
    return await api.get(`${API_ENDPOINTS.auth}/me`);
  },

  // Logout (client-side token removal)
  logout: async () => {
    try {
      await api.post(`${API_ENDPOINTS.auth}/logout`);
    } catch (error) {
      // Silently fail - still remove local storage
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Get stored user
  getStoredUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Get stored token
  getToken: () => {
    return localStorage.getItem('token');
  },
};

export default authService;
