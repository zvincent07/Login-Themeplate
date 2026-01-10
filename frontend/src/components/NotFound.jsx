import { Link } from 'react-router-dom';
import { Button } from './ui';
import ThemeToggle from './ThemeToggle';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/60 dark:from-slate-900 dark:to-slate-800 relative">
      {/* Theme Toggle - Top Right */}
      <div className="fixed top-4 right-4 z-[9999]">
        <ThemeToggle />
      </div>

      <div className="text-center px-4 max-w-md">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-slate-900 dark:text-slate-100 mb-4">404</h1>
          <h2 className="text-3xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
            Page Not Found
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/login">
            <Button variant="primary">
              Go to Login
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="outline">
              Create Account
            </Button>
          </Link>
        </div>

        <div className="mt-8">
          <Link
            to="/"
            className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 underline"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
