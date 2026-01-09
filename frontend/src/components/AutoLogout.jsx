import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const AutoLogout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      try {
        await authService.logout();
      } catch (error) {
        // Even if API call fails, clear local storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        // Always redirect to login
        navigate('/login', { replace: true });
      }
    };

    performLogout();
  }, [navigate]);

  // Show nothing while logging out
  return null;
};

export default AutoLogout;
