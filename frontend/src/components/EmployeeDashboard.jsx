import React from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import ThemeToggle from './ThemeToggle';

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    const storedUser = authService.getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    } else {
      // No user found, redirect to login
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/60 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="fixed top-4 right-4 z-[9999]">
          <ThemeToggle />
        </div>
        <p className="text-gray-700 dark:text-gray-300">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/60 dark:from-slate-900 dark:to-slate-800">
      {/* Theme Toggle - Top Right */}
      <div className="fixed top-4 right-4 z-[9999]">
        <ThemeToggle />
      </div>

      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-4">
            Employee Dashboard
          </h1>
          
          <div className="space-y-4 mb-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-slate-400">Email</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                {user.email}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 dark:text-slate-400">Role</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-slate-100 capitalize">
                {user.roleName || 'Employee'}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-600 text-white font-semibold rounded-md shadow-md hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
