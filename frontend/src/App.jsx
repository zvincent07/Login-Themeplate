import { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import AutoLogout from './components/AutoLogout';
import NotFound from './components/NotFound';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import authService from './services/authService';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const oauthProcessingRef = useRef(false);

  useEffect(() => {
    const path = location.pathname;
    
    // Handle Google OAuth callback FIRST (before any route checks)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');
    
    if (error) {
      // Redirect to login with error message
      navigate(`/login?error=${error}`, { replace: true });
      return;
    }
    
    if (token && !oauthProcessingRef.current) {
      oauthProcessingRef.current = true;
      localStorage.setItem('token', token);
      // Fetch user data
      authService.getMe()
        .then((response) => {
          if (response.success && response.data?.user) {
            localStorage.setItem('user', JSON.stringify(response.data.user));
            const role = response.data.user?.roleName || 'user';
            // Clear URL params
            window.history.replaceState({}, document.title, '/');
            if (role === 'admin') {
              navigate('/admin/dashboard', { replace: true });
            } else if (role === 'employee') {
              navigate('/employee/dashboard', { replace: true });
            } else {
              navigate('/dashboard', { replace: true });
            }
          } else {
            // If getMe fails, redirect to login
            localStorage.removeItem('token');
            navigate('/login?error=authentication_failed', { replace: true });
          }
        })
        .catch(() => {
          // If getMe fails, redirect to login
          localStorage.removeItem('token');
          navigate('/login?error=authentication_failed', { replace: true });
        })
        .finally(() => {
          oauthProcessingRef.current = false;
        });
      return;
    }

    const isPublicRoute = 
      path === '/login' || 
      path === '/register' || 
      path === '/auth/logout' || 
      path === '/forgot-password' || 
      path.startsWith('/reset-password') ||
      path === '/'; // Root path

    // Don't redirect if on public routes
    if (isPublicRoute) {
      return;
    }

    // Check if user is already logged in
    const storedUser = authService.getStoredUser();
    if (storedUser) {
      // Redirect based on role, but only if not already on the correct route
      const role = storedUser.roleName || 'user';
      const targetRoute = role === 'admin' 
        ? '/admin/dashboard' 
        : role === 'employee' 
        ? '/employee/dashboard' 
        : '/dashboard';
      
      // Only navigate if not already on the target route
      if (path !== targetRoute) {
        navigate(targetRoute, { replace: true });
      }
      return;
    }

    // If not logged in and on a protected route, redirect to login
    // But don't redirect if already on login to avoid loops
    if (!storedUser && path !== '/login') {
      navigate('/login', { replace: true });
    }
  }, [navigate, location]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/auth/logout" element={<AutoLogout />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
      <Route path="/" element={<Login />} />
      {/* Catch-all route for 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
