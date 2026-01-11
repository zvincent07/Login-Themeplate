import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { checkPasswordStrength, getPasswordRequirements } from '../utils/passwordStrength';
import { Input, Button, Label } from './ui';
import ThemeToggle from './ThemeToggle';
import CursorTracker from '../utils/cursorTracker';
import { isAdmin } from '../utils/roleHelpers';

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('register'); // 'register' or 'verify'
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const cursorTrackerRef = useRef(null);

  const { firstName, lastName, email, password } = formData;

  const passwordRequirements = getPasswordRequirements();

  // Initialize cursor tracking
  useEffect(() => {
    // Create cursor tracker instance
    cursorTrackerRef.current = new CursorTracker();
    cursorTrackerRef.current.startTracking();

    // Cleanup on unmount
    return () => {
      if (cursorTrackerRef.current) {
        cursorTrackerRef.current.stopTracking();
      }
    };
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Check password strength in real-time
    if (name === 'password') {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const onBlur = (e) => {
    const { name, value } = e.target;
    setTouchedFields((prev) => ({ ...prev, [name]: true }));

    // Validate on blur
    const errors = { ...fieldErrors };
    
    if (name === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors.email = 'Please enter a valid email address';
      } else {
        delete errors.email;
      }
    }

    if (name === 'firstName' && !value.trim()) {
      errors.firstName = 'First name is required';
    } else if (name === 'firstName') {
      delete errors.firstName;
    }

    if (name === 'lastName' && !value.trim()) {
      errors.lastName = 'Last name is required';
    } else if (name === 'lastName') {
      delete errors.lastName;
    }

    setFieldErrors(errors);
  };

  const onOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    setError('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Mark all fields as touched
    setTouchedFields({
      firstName: true,
      lastName: true,
      email: true,
      password: true,
    });

    // Validate all fields
    const errors = {};
    if (!firstName.trim()) errors.firstName = 'First name is required';
    if (!lastName.trim()) errors.lastName = 'Last name is required';
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.email = 'Please enter a valid email address';
      }
    }
    if (!password) {
      errors.password = 'Password is required';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const strength = checkPasswordStrength(password);
    if (!strength.isValid) {
      setError('Password does not meet all requirements');
      return;
    }

    // Stop cursor tracking and get movement data
    let movementData = null;
    if (cursorTrackerRef.current) {
      cursorTrackerRef.current.stopTracking();
      movementData = cursorTrackerRef.current.getMovementData();
    }

    setLoading(true);

    try {
      const response = await authService.register({
        firstName,
        lastName,
        email,
        password,
        movementData,
      });

      if (response.success) {
        setUserId(response.data.userId);
        setStep('verify');
      }
    } catch (err) {
      if (err.details && Array.isArray(err.details)) {
        setError(err.details.join(', '));
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');

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
        const role = response.data.user?.roleName || 'user';
        if (isAdmin(role)) {
          navigate('/admin/dashboard');
        } else if (role === 'employee') {
          navigate('/employee/dashboard');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onResendOTP = async () => {
    setError('');
    setLoading(true);

    try {
      await authService.resendOTP(userId);
      setError('');
      alert('OTP code has been resent to your email.');
    } catch (err) {
      setError(err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
    window.location.href = `${backendUrl}/api/auth/google`;
  };

  // OTP Verification Step
  if (step === 'verify') {
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
                We've sent a 6-digit code to <strong className="break-all">{email}</strong>
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 rounded-md">
                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
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
                />
              </div>

              <Button
                type="submit"
                disabled={otp.length !== 6}
                loading={loading}
              >
                Verify Email
              </Button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Didn't receive the code?{' '}
                <button
                  onClick={onResendOTP}
                  disabled={loading}
                  className="text-black dark:text-white font-medium hover:underline disabled:opacity-50"
                >
                  Resend OTP
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Registration Step
  return (
    <div className="min-h-screen flex relative">
      {/* Theme Toggle - Top Right */}
      <div className="fixed top-4 right-4 z-[9999]">
        <ThemeToggle />
      </div>
      
      <div className="w-full grid md:grid-cols-2">
        {/* Left Side - Register Form */}
        <div className="w-full bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/60 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4 sm:p-6 order-2 md:order-1">
          <div className="w-full max-w-[420px]">
              <div className="mb-6 sm:mb-8">
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-slate-100 mb-1.5">
                  Create account
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400">
                  Sign up to get started
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 rounded-md">
                  <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="firstName" required>
                      First name
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
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <Input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={firstName}
                        onChange={onChange}
                        onBlur={onBlur}
                        required
                        placeholder="John"
                        className={`pl-9 ${touchedFields.firstName && fieldErrors.firstName ? 'border-red-500 dark:border-red-500' : ''}`}
                      />
                    </div>
                    {touchedFields.firstName && fieldErrors.firstName && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="lastName" required>
                      Last name
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
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <Input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={lastName}
                        onChange={onChange}
                        onBlur={onBlur}
                        required
                        placeholder="Doe"
                        className={`pl-9 ${touchedFields.lastName && fieldErrors.lastName ? 'border-red-500 dark:border-red-500' : ''}`}
                      />
                    </div>
                    {touchedFields.lastName && fieldErrors.lastName && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.lastName}</p>
                    )}
                  </div>
                </div>

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
                      name="email"
                      value={email}
                      onChange={onChange}
                      onBlur={onBlur}
                      required
                      placeholder="you@example.com"
                      className={`pl-9 ${touchedFields.email && fieldErrors.email ? 'border-red-500 dark:border-red-500' : ''}`}
                    />
                  </div>
                  {touchedFields.email && fieldErrors.email && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.email}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="password" required>
                    Password
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
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={password}
                      onChange={onChange}
                      onBlur={onBlur}
                      required
                      placeholder="••••••••"
                      className={`pl-9 pr-9 ${touchedFields.password && fieldErrors.password ? 'border-red-500 dark:border-red-500' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {showPassword ? (
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
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0A9.97 9.97 0 015.12 5.12m3.17 3.17L12 12m-3.71-3.71L5.12 5.12M12 12l3.71 3.71M12 12l-3.71-3.71m7.42 7.42L18.88 18.88A9.97 9.97 0 0019 12a9.97 9.97 0 00-.12-1.88m-3.17 3.17L12 12m3.71 3.71L18.88 18.88"
                          />
                        </svg>
                      ) : (
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
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                  {touchedFields.password && fieldErrors.password && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.password}</p>
                  )}
                  
                  {/* Password Requirements - Interactive with Green Checkmarks */}
                  {password && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md border border-gray-200 dark:border-gray-700">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {passwordRequirements.map((req) => {
                          const isMet = passwordStrength?.checks[req.key] || false;
                          return (
                            <div 
                              key={req.key} 
                              className={`flex items-center gap-2 text-xs transition-all duration-200 ${
                                isMet 
                                  ? 'opacity-100' 
                                  : 'opacity-60'
                              }`}
                            >
                              {isMet ? (
                                <svg
                                  className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2.5}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              ) : (
                                <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                                </div>
                              )}
                              <span className={`text-xs transition-colors ${
                                isMet 
                                  ? 'text-green-700 dark:text-green-400 font-medium' 
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

                <Button
                  type="submit"
                  disabled={passwordStrength && !passwordStrength.isValid}
                  loading={loading}
                >
                  Sign up
                </Button>
              </form>

              {/* Google OAuth */}
              <div className="mt-5">
                <div className="relative mb-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-500"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300">
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

              <div className="mt-6 mb-6 pb-4 text-center">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Already have an account?{' '}
                  <a
                    href="/login"
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = '/login';
                    }}
                    className="text-black dark:text-white font-medium hover:underline"
                  >
                    Sign in
                  </a>
                </p>
              </div>
            </div>
          </div>

        {/* Right Side - Marketing Panel */}
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
                  d="M70 100 L90 120 L130 80"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="100" cy="100" r="30" strokeWidth="1.5" />
              </svg>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-3">
              Start building faster
            </h2>
            <p className="text-base md:text-lg text-slate-700 dark:text-slate-300 mb-4">
              Join 10,000+ developers managing their users with ease
            </p>
            
            {/* Benefits Checklist */}
            <div className="space-y-3 text-left max-w-xs mx-auto">
              <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <svg
                  className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Free forever</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <svg
                  className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <svg
                  className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Industry-standard security</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <svg
                  className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Get started in minutes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
