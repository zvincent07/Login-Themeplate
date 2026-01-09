import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import AutoLogout from './components/AutoLogout';
import authService from './services/authService';

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const isPublicRoute = 
      path === '/login' || 
      path === '/register' || 
      path === '/auth/logout' || 
      path === '/forgot-password' || 
      path.startsWith('/reset-password');

    // Don't redirect if on public routes
    if (isPublicRoute) {
      return;
    }

    // Check if user is already logged in
    const storedUser = authService.getStoredUser();
    if (storedUser) {
      // Redirect based on role
      const role = storedUser.roleName;
      if (role === 'admin') {
        navigate('/admin/dashboard');
      } else if (role === 'employee') {
        navigate('/employee/dashboard');
      } else {
        navigate('/dashboard');
      }
      return;
    }

    // Handle Google OAuth callback (only if not on reset-password page)
    if (!path.startsWith('/reset-password')) {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      if (token) {
        localStorage.setItem('token', token);
        // Fetch user data
        authService.getMe().then((response) => {
          if (response.success) {
            localStorage.setItem('user', JSON.stringify(response.data.user));
            const role = response.data.user.roleName;
            if (role === 'admin') {
              navigate('/admin/dashboard');
            } else if (role === 'employee') {
              navigate('/employee/dashboard');
            } else {
              navigate('/dashboard');
            }
          }
        });
      }
    }
  }, [navigate, location]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/auth/logout" element={<AutoLogout />} />
      <Route path="/" element={<Login />} />
    </Routes>
  );
}

export default App;
