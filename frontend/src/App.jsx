import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import authService from './services/authService';

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = authService.getStoredUser();
    if (storedUser && !location.pathname.includes('/login') && !location.pathname.includes('/register')) {
      // Redirect based on role
      const role = storedUser.roleName;
      if (role === 'admin') {
        navigate('/admin/dashboard');
      } else if (role === 'employee') {
        navigate('/employee/dashboard');
      } else {
        navigate('/dashboard');
      }
    }

    // Handle Google OAuth callback
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
  }, [navigate, location]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Login />} />
    </Routes>
  );
}

export default App;
