import { useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import VerifyOTP from './components/VerifyOTP';
import AutoLogout from './components/AutoLogout';
import NotFound from './components/NotFound';
import UserDashboard from './components/dashboards/UserDashboard';
import AdminDashboard from './components/dashboards/AdminDashboard';
import EmployeeDashboard from './components/dashboards/EmployeeDashboard';
import authService from './services/authService';
import { isAdmin } from './utils/permissions';

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
            if (isAdmin(role)) {
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
      path.startsWith('/verify-otp') ||
      path === '/'; // Root path

    // Define valid routes (excluding catch-all)
    const validRoutes = [
      '/login',
      '/register',
      '/forgot-password',
      '/auth/logout',
      '/dashboard',
      '/admin',
      '/employee/dashboard',
      '/'
    ];
    
    // Check if path matches a valid route (or is a sub-route of valid routes)
    const isValidRoute = validRoutes.some(route => {
      if (route === '/') return path === '/';
      if (route === '/admin') return path.startsWith('/admin');
      return path === route || path.startsWith(route + '/');
    });

    // Don't redirect if on public routes
    if (isPublicRoute) {
      return;
    }

    // Check if user is already logged in
    const storedUser = authService.getStoredUser();
    if (storedUser) {
      const role = storedUser.roleName || 'user';
      
      // Allow admin (super admin or admin) to access any /admin/* route
      if (isAdmin(role) && path.startsWith('/admin')) {
        return;
      }
      
      // Allow employee to access /employee/dashboard
      if (role === 'employee' && path.startsWith('/employee')) {
        return;
      }
      
      // Allow user to access /dashboard
      if (role === 'user' && path === '/dashboard') {
        return;
      }
      
      // If on an invalid route (404), let NotFound component handle it
      if (!isValidRoute) {
        return;
      }
      
      // Redirect based on role if not on correct route
      const targetRoute = isAdmin(role)
        ? '/admin/dashboard' 
        : role === 'employee' 
        ? '/employee/dashboard' 
        : '/dashboard';
      
      navigate(targetRoute, { replace: true });
      return;
    }

    // If not logged in and on an invalid route (404), let NotFound component handle it
    // Don't redirect to login - let the 404 page show with option to go to login
    if (!storedUser && !isValidRoute) {
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
      <Route path="/verify-otp" element={<VerifyOTP />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/auth/logout" element={<AutoLogout />} />
      <Route path="/dashboard" element={<UserDashboard />} />
      <Route path="/admin/*" element={<AdminDashboard />} />
      <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
      <Route path="/" element={<Login />} />
      {/* Catch-all route for 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
