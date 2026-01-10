import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../services/authService';
import { Input, Button, Label } from './ui';
import ThemeToggle from './ThemeToggle';

const VerifyOTP = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const email = searchParams.get('email');
  
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState(email || '');

  useEffect(() => {
    // If no userId in URL, try to get from localStorage (for register flow)
    if (!userId && !email) {
      // Check if we have user info from registration
      const storedUserId = localStorage.getItem('pendingUserId');
      const storedEmail = localStorage.getItem('pendingEmail');
      if (storedUserId && storedEmail) {
        setUserEmail(storedEmail);
        // Redirect with query params
        navigate(`/verify-otp?userId=${storedUserId}&email=${storedEmail}`, { replace: true });
      } else {
        // No user info, redirect to login
        navigate('/login', { replace: true });
      }
    }
  }, [userId, email, navigate]);

  const onOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    setError('');
  };

  const onVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');

    if (!userId) {
      setError('Invalid verification link. Please check your email.');
      return;
    }

    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.verifyOTP(userId, otp);

      if (response.success && response.data?.user) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Clear pending user info
        localStorage.removeItem('pendingUserId');
        localStorage.removeItem('pendingEmail');
        
        const role = response.data.user?.roleName || 'user';
        if (role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else if (role === 'employee') {
          navigate('/employee/dashboard', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onResendOTP = async () => {
    if (!userId) {
      setError('Invalid verification link. Please check your email.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await authService.resendOTP(userId);
      setError('');
      // Show success message
      setError('OTP code has been resent to your email.');
      setTimeout(() => setError(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!userId && !email) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/60 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4 sm:p-6 relative">
      {/* Theme Toggle - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="w-full max-w-[420px] mx-auto">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl font-semibold text-black dark:text-white mb-1.5">
              Verify your email
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 break-words">
              We've sent a 6-digit code to <strong className="break-all">{userEmail || email}</strong>
            </p>
          </div>

          {error && (
            <div className={`mb-4 p-3 border rounded-md ${
              error.includes('resent') 
                ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/50'
                : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50'
            }`}>
              <p className={`text-xs ${
                error.includes('resent')
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>{error}</p>
            </div>
          )}

          <form onSubmit={onVerifyOTP} className="space-y-4">
            <div>
              <Label htmlFor="otp" required>
                Enter OTP Code
              </Label>
              <Input
                type="text"
                id="otp"
                value={otp}
                onChange={onOtpChange}
                required
                maxLength={6}
                className="text-xl sm:text-2xl text-center tracking-widest font-mono"
                placeholder="000000"
                autoFocus
              />
            </div>

            <Button
              type="submit"
              disabled={otp.length !== 6 || loading}
              loading={loading}
            >
              Verify Email
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={onResendOTP}
              disabled={loading}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 underline disabled:opacity-50"
            >
              Didn't receive the code? Resend
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
