import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import authService from '../services/authService';
import { checkPasswordStrength, getPasswordRequirements } from '../utils/passwordStrength';
import { Input, Button, Label } from './ui';
import ThemeToggle from './ThemeToggle';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');

  const { password, confirmPassword } = formData;
  const passwordRequirements = getPasswordRequirements();

  useEffect(() => {
    // Clear any existing session when accessing reset password page
    // This ensures the user can reset their password even if they're logged in
    const tokenParam = searchParams.get('token');
    
    if (!tokenParam) {
      setError('Invalid reset link. Please request a new password reset.');
      setToken('');
      // Redirect to forgot password if no token
      setTimeout(() => {
        navigate('/forgot-password');
      }, 3000);
    } else {
      setToken(tokenParam);
      setError(''); // Clear error if token is found
      // Clear existing session to prevent conflicts
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }, [searchParams, navigate]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');

    if (name === 'password') {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const strength = checkPasswordStrength(password);
    if (!strength.isValid) {
      setError('Password does not meet all requirements');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.resetPassword(token, password);
      if (response.success) {
        localStorage.setItem('token', response.token);
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
    } catch (err) {
      if (err.details && Array.isArray(err.details)) {
        setError(err.details.join(', '));
      } else {
        setError(err.message || 'Failed to reset password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/60 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4 sm:p-6 relative">
      {/* Theme Toggle - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center">
          <div className="w-full max-w-[420px]">
            <div className="mb-6 sm:mb-8">
              <h1 className="text-xl sm:text-2xl font-semibold text-black dark:text-white mb-1.5">
                Reset Password
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Enter your new password below
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 rounded-md">
                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password" required>
                  New Password
                </Label>
                <Input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={onChange}
                  required
                  placeholder="••••••••"
                />
                
                {/* Password Requirements */}
                {password && (
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md border border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {passwordRequirements.map((req) => {
                        const isMet = passwordStrength?.checks[req.key] || false;
                        return (
                          <div 
                            key={req.key} 
                            className={`flex items-center gap-1.5 text-xs transition-all ${
                              isMet 
                                ? 'opacity-100' 
                                : 'opacity-50'
                            }`}
                          >
                            <div className={`flex-shrink-0 w-1.5 h-1.5 rounded-full transition-all ${
                              isMet 
                                ? 'bg-black dark:bg-white' 
                                : 'bg-gray-300 dark:bg-gray-600'
                            }`} />
                            <span className={`text-xs ${
                              isMet 
                                ? 'text-gray-900 dark:text-gray-200' 
                                : 'text-gray-500 dark:text-gray-500'
                            }`}>
                              {req.text}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword" required>
                  Confirm Password
                </Label>
                <Input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={onChange}
                  required
                  placeholder="••••••••"
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">Passwords do not match</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={(passwordStrength && !passwordStrength.isValid) || !token}
                loading={loading}
              >
                Reset Password
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Remember your password?{' '}
                <Link
                  to="/login"
                  className="text-black dark:text-white font-medium hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
