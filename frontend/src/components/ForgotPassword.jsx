import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/authService';
import { Input, Button, Label } from './ui';
import ThemeToggle from './ThemeToggle';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const intervalRef = useRef(null);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Handle countdown timer
  useEffect(() => {
    if (cooldownSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setCooldownSeconds((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [cooldownSeconds]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    // Prevent submission during cooldown
    if (cooldownSeconds > 0) {
      return;
    }

    setLoading(true);

    try {
      const response = await authService.forgotPassword(email);
      if (response.success) {
        setSuccess(true);
        // Start 60-second cooldown timer
        setCooldownSeconds(60);
      }
    } catch (err) {
      setError(err.message || 'Failed to send password reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative">
      {/* Theme Toggle - Top Right */}
      <div className="fixed top-4 right-4 z-[9999]">
        <ThemeToggle />
      </div>
      
      <div className="w-full grid md:grid-cols-2">
        {/* Left Side - Forgot Password Form */}
        <div className="w-full bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/60 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4 sm:p-6 order-2 md:order-1">
          <div className="w-full max-w-[420px]">
            {/* Back to Login Link */}
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-6 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Login
            </Link>

            <div className="mb-6 sm:mb-8">
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-slate-100 mb-1.5">
                Forgot Password
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400">
                Enter your email address and we'll send you a link to reset your password
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 rounded-md">
                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {success ? (
              <>
                <div className="mb-4 p-3 sm:p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/50 rounded-md">
                  <p className="text-xs sm:text-sm text-green-600 dark:text-green-400">
                    If an account exists with this email, a password reset link has been sent. Please check your email.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSuccess(false);
                    setError('');
                  }}
                  className="w-full text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 underline transition-colors"
                >
                  Try a different email
                </button>
              </>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email" required>
                    Email
                  </Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <Input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className="pl-9"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  loading={loading}
                  disabled={loading || cooldownSeconds > 0}
                >
                  {loading
                    ? 'Sending...'
                    : cooldownSeconds > 0
                    ? `Resend in ${cooldownSeconds}s`
                    : 'Send Reset Link'}
                </Button>
              </form>
            )}

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

        {/* Right Side - Reassuring Panel */}
        <div className="w-full bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4 sm:p-6 order-1 md:order-2 hidden md:flex">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 md:w-32 md:h-32 mb-6 mx-auto">
              <svg
                className="w-full h-full text-slate-700 dark:text-slate-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  className="opacity-80"
                />
              </svg>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-3">
              Don't worry, it happens
            </h2>
            <p className="text-base md:text-lg text-slate-700 dark:text-slate-300 mb-2">
              We'll send you a secure link
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Reset your password and get you back on track in seconds
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
