import { Link } from 'react-router-dom';
import { Button } from './ui';
import ThemeToggle from './ThemeToggle';
import authService from '../services/authService';
import { useEffect, useState } from 'react';
import { isAdmin } from '../utils/permissions';

const NotFound = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [dashboardPath, setDashboardPath] = useState('/dashboard');

  useEffect(() => {
    // Check if user is authenticated and determine dashboard path
    const user = authService.getStoredUser();
    const authenticated = authService.isAuthenticated();
    setIsAuthenticated(authenticated);

    if (authenticated && user) {
      const role = user.roleName || 'user';
      if (isAdmin(role)) {
        setDashboardPath('/admin/dashboard');
      } else if (role === 'employee') {
        setDashboardPath('/employee/dashboard');
      } else {
        setDashboardPath('/dashboard');
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/60 dark:from-slate-900 dark:to-slate-800 relative">
      {/* Theme Toggle - Top Right */}
      <div className="fixed top-4 right-4 z-[9999]">
        <ThemeToggle />
      </div>

      <div className="text-center px-4 max-w-md">
        {/* Visual Icon - Broken Link */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <svg
              className="w-28 h-28 md:w-36 md:h-36 text-blue-500 dark:text-blue-400 opacity-80"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            {/* X mark overlay to indicate broken */}
            <svg
              className="w-8 h-8 md:w-10 md:h-10 text-red-500 dark:text-red-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-9xl font-bold text-slate-900 dark:text-slate-100 mb-4">404</h1>
          <h2 className="text-3xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
            Page Not Found
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Smart Button */}
        <Link to={isAuthenticated ? dashboardPath : '/login'}>
          <Button variant="primary" className="w-full sm:w-auto min-w-[200px]">
            {isAuthenticated ? 'Back to Dashboard' : 'Back to Login'}
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
