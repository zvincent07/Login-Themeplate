import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { checkPasswordStrength, getPasswordRequirements } from '../utils/passwordStrength';

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('register'); // 'register' or 'verify'
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);

  const { firstName, lastName, email, password, confirmPassword } = formData;

  const passwordRequirements = getPasswordRequirements();

  const onChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');

    // Check password strength in real-time
    if (name === 'password') {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const onOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    setError('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

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
      const response = await authService.register({
        firstName,
        lastName,
        email,
        password,
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

      if (response.success) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/dashboard');
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
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="max-w-md mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-black dark:text-white mb-1.5">
                Verify your email
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                We've sent a 6-digit code to <strong>{email}</strong>
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 rounded-md">
                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={onVerifyOTP} className="space-y-4">
              <div>
                <label
                  htmlFor="otp"
                  className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5"
                >
                  Enter OTP Code
                </label>
                <input
                  type="text"
                  id="otp"
                  value={otp}
                  onChange={onOtpChange}
                  required
                  maxLength={6}
                  className="w-full px-3 py-2 text-2xl text-center tracking-widest border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white dark:bg-gray-800 dark:text-white outline-none transition-all font-mono"
                  placeholder="000000"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-2 px-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-md hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>
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
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-12 items-center">
        {/* Left Side - Register Form */}
        <div className="w-full order-2 md:order-1">
          <div className="max-w-md mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-black dark:text-white mb-1.5">
                Create account
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Sign up to get started
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 rounded-md">
                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5"
                  >
                    First name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={firstName}
                    onChange={onChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white dark:bg-gray-800 dark:text-white outline-none transition-all"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5"
                  >
                    Last name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={lastName}
                    onChange={onChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white dark:bg-gray-800 dark:text-white outline-none transition-all"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={onChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white dark:bg-gray-800 dark:text-white outline-none transition-all"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={onChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white dark:bg-gray-800 dark:text-white outline-none transition-all"
                  placeholder="••••••••"
                />
                
                {/* Password Requirements - Modern Grid Design */}
                {password && (
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md border border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-2 gap-2">
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
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5"
                >
                  Confirm password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={onChange}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white dark:bg-gray-800 dark:text-white outline-none transition-all"
                  placeholder="••••••••"
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || (passwordStrength && !passwordStrength.isValid)}
                className="w-full py-2 px-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-md hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating account...' : 'Sign up'}
              </button>
            </form>

            {/* Google OAuth */}
            <div className="mt-5">
              <div className="relative mb-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                    Or continue with
                  </span>
                </div>
              </div>

              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-200"
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
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  Google
                </span>
              </button>
            </div>

            <div className="mt-6 text-center">
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

        {/* Right Side - Minimal Icon */}
        <div className="w-full order-1 md:order-2 flex items-center justify-center hidden md:flex">
          <div className="relative w-full max-w-sm">
            <div className="flex flex-col items-center justify-center">
              <div className="w-32 h-32 mb-6">
                <svg
                  viewBox="0 0 200 200"
                  className="w-full h-full text-black dark:text-white"
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
              <h2 className="text-lg font-medium text-black dark:text-white mb-1">
                Join us today
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-xs">
                Start your journey with us and unlock amazing features
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
