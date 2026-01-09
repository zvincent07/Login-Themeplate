import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';
import { Input, Button, Label, Checkbox } from './ui';
import ThemeToggle from './ThemeToggle';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileError, setTurnstileError] = useState(false);
  const turnstileRef = useRef(null);
  const turnstileRendered = useRef(false);

  const { email, password } = formData;

  const onChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Check if Turnstile token exists (only if Turnstile is enabled)
    const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
    if (siteKey && siteKey !== 'your-turnstile-site-key' && !turnstileToken) {
      setError('Please complete the security verification.');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.login(email, password, turnstileToken, rememberMe);
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
      setError(err.message || 'Login failed. Please try again.');
      // Reset Turnstile on error
      if (window.turnstile && turnstileRef.current) {
        window.turnstile.reset(turnstileRef.current);
        setTurnstileToken('');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Prevent double rendering in StrictMode
    if (turnstileRendered.current) return;
    
    const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
    
    // Skip if Turnstile is not configured
    if (!siteKey || siteKey === 'your-turnstile-site-key') {
      // Auto-enable login if Turnstile is not configured
      setTurnstileToken('skip-verification');
      return;
    }

    // Wait for Turnstile script to load
    const checkTurnstile = () => {
      if (window.turnstile && turnstileRef.current && !turnstileRendered.current) {
        try {
          turnstileRendered.current = true;
          window.turnstile.render(turnstileRef.current, {
            sitekey: siteKey,
            callback: (token) => {
              setTurnstileToken(token);
              setTurnstileError(false);
            },
            'error-callback': () => {
              setTurnstileToken('');
              setTurnstileError(true);
            },
            'expired-callback': () => {
              setTurnstileToken('');
            },
          });
        } catch (err) {
          setTurnstileError(true);
          setTurnstileToken('skip-verification');
        }
      } else if (!window.turnstile) {
        // Retry after a short delay if script hasn't loaded
        setTimeout(checkTurnstile, 100);
      }
    };

    // Check immediately and also after a delay
    checkTurnstile();
    const timeoutId = setTimeout(checkTurnstile, 500);

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      if (window.turnstile && turnstileRef.current && turnstileRendered.current) {
        try {
          window.turnstile.remove(turnstileRef.current);
        } catch (err) {
          // Ignore cleanup errors
        }
        turnstileRendered.current = false;
      }
    };
  }, []);

  const handleGoogleLogin = () => {
    // Use full backend URL for Google OAuth to avoid redirect_uri_mismatch
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
    window.location.href = `${backendUrl}/api/auth/google`;
  };

  return (
    <div className="min-h-screen flex relative">
      {/* Theme Toggle - Top Right */}
      <div className="fixed top-4 right-4 z-[9999]">
        <ThemeToggle />
      </div>
      
      <div className="w-full grid md:grid-cols-2">
        {/* Left Side - Login Form */}
        <div className="w-full bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/60 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4 sm:p-6 order-2 md:order-1">
          <div className="w-full max-w-[420px]">
              <div className="mb-6 sm:mb-8">
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-slate-100 mb-1.5">
                  Welcome back
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400">
                  Sign in to continue to your account
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 rounded-md">
                  <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email" required>
                    Email
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={onChange}
                    required
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="password" required>
                    Password
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
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 text-xs">
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    label="Remember me"
                  />
                  <Link
                    to="/forgot-password"
                    className="text-black dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Cloudflare Turnstile */}
                {import.meta.env.VITE_TURNSTILE_SITE_KEY && 
                 import.meta.env.VITE_TURNSTILE_SITE_KEY !== 'your-turnstile-site-key' && (
                  <div className="flex justify-center">
                    <div ref={turnstileRef}></div>
                  </div>
                )}

                {turnstileError && (
                  <div className="p-2 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/50 rounded-md">
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 text-center">
                      Security verification failed. You can still try to sign in.
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={turnstileToken === '' && !turnstileError}
                  loading={loading}
                >
                  Sign in
                </Button>
              </form>

              {/* Google OAuth */}
              <div className="mt-5">
                <div className="relative mb-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400">
                      Or continue with
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleLogin}
                  className="flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="text-sm font-medium">
                    Google
                  </span>
                </Button>
              </div>

              <div className="mt-6 text-center">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Don't have an account?{' '}
                  <a
                    href="/register"
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = '/register';
                    }}
                    className="text-black dark:text-white font-medium hover:underline"
                  >
                    Sign up
                  </a>
                </p>
              </div>
            </div>
          </div>

        {/* Right Side - Welcome Section */}
        <div className="w-full bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4 sm:p-6 order-1 md:order-2 hidden md:flex">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 md:w-32 md:h-32 mb-6 mx-auto">
              <svg
                viewBox="0 0 200 200"
                className="w-full h-full text-slate-700 dark:text-slate-300"
                fill="none"
                stroke="currentColor"
              >
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  strokeWidth="1.5"
                  className="opacity-20"
                />
                <path
                  d="M100 40 L100 60 M100 140 L100 160 M40 100 L60 100 M140 100 L160 100"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="100" cy="100" r="30" strokeWidth="1.5" />
                <circle cx="100" cy="100" r="8" fill="currentColor" />
              </svg>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-3">
              Welcome back
            </h2>
            <p className="text-base md:text-lg text-slate-700 dark:text-slate-300 mb-2">
              Secure Access
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Your data is protected with industry-standard security
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
