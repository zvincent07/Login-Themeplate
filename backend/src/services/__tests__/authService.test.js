/**
 * AUTH SERVICE TESTS
 * 
 * Test authentication business logic
 * Mock repositories
 * Test password validation
 * Test OTP flow
 */

const authService = require('../authService');
const userRepository = require('../../repositories/userRepository');
const roleRepository = require('../../repositories/roleRepository');
const bannedIPRepository = require('../../repositories/bannedIPRepository');
const loginAttemptRepository = require('../../repositories/loginAttemptRepository');

jest.mock('../../repositories/userRepository');
jest.mock('../../repositories/roleRepository');
jest.mock('../../repositories/bannedIPRepository');
jest.mock('../../repositories/loginAttemptRepository');
jest.mock('../../repositories/sessionRepository');
jest.mock('../../utils/generateToken');
jest.mock('../../utils/passwordValidator');
jest.mock('../../utils/generateOTP');
jest.mock('../../services/emailService');
jest.mock('../../utils/ipGeolocation');
jest.mock('../../utils/auditLogger');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { parseUserAgent } = require('../../utils/ipGeolocation');
    parseUserAgent.mockReturnValue({ platform: 'test', browser: 'test', version: '1.0', os: 'test' });
  });

  describe('register', () => {
    it('should register user and send OTP email', async () => {
      const mockRole = { _id: 'role123', name: 'user' };
      const mockUser = { _id: 'user123', email: 'test@example.com' };

      roleRepository.findByName.mockResolvedValue(mockRole);
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue(mockUser);

      const validatePasswordStrength = require('../../utils/passwordValidator');
      validatePasswordStrength.mockReturnValue({ isValid: true });

      const { sendOTPEmail } = require('../../services/emailService');
      sendOTPEmail.mockResolvedValue({ success: true });

      const result = await authService.register({
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(result.requiresVerification).toBe(true);
      expect(sendOTPEmail).toHaveBeenCalled();
    });

    it('should throw error if password is weak', async () => {
      const validatePasswordStrength = require('../../utils/passwordValidator');
      validatePasswordStrength.mockReturnValue({
        isValid: false,
        errors: ['Password must be at least 8 characters'],
      });

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'weak',
          firstName: 'Test',
          lastName: 'User',
        })
      ).rejects.toThrow('Password does not meet requirements');
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      const mockUserModel = {
        _id: 'user123',
        email: 'test@example.com',
        password: 'hashed',
        isActive: true,
        isEmailVerified: true,
        roleName: 'user',
        matchPassword: jest.fn().mockResolvedValue(true),
        toObject: () => ({ _id: 'user123', email: 'test@example.com' }),
      };

      userRepository.findByEmailWithPassword.mockResolvedValue(mockUserModel);

      bannedIPRepository.isBanned.mockResolvedValue(false);
      loginAttemptRepository.resetAttempts.mockResolvedValue({ deletedCount: 1 });
      userRepository.updateLastLogin.mockResolvedValue({});

      const { generateToken } = require('../../utils/generateToken');
      generateToken.mockReturnValue('token123');

      const result = await authService.login(
        'test@example.com',
        'password123',
        false,
        '127.0.0.1',
        'Mozilla/5.0'
      );

      expect(result.token).toBe('token123');
      expect(result.user).toBeDefined();
    });

    it('should ban IP after too many failed attempts', async () => {
      userRepository.findByEmailWithPassword.mockResolvedValue(null);

      bannedIPRepository.isBanned.mockResolvedValue(false);
      loginAttemptRepository.recordFailedAttempt.mockResolvedValue({
        attempts: 10,
      });
      bannedIPRepository.banIP.mockResolvedValue({});

      await expect(
        authService.login('test@example.com', 'wrong', false, '127.0.0.1', 'Mozilla/5.0')
      ).rejects.toThrow('Too many failed login attempts');

      expect(bannedIPRepository.banIP).toHaveBeenCalled();
    });
  });

  describe('verifyOTP', () => {
    it('should verify OTP and activate account', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        isEmailVerified: false,
        otp: { code: '123456', expiresAt: new Date(Date.now() + 600000) },
      };

      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.updateById.mockResolvedValue({
        ...mockUser,
        isEmailVerified: true,
      });

      const { generateToken } = require('../../utils/generateToken');
      generateToken.mockReturnValue('token123');

      const result = await authService.verifyOTP('user123', '123456');

      expect(result.token).toBe('token123');
      expect(result.user.isEmailVerified).toBe(true);
    });

    it('should throw error if OTP is expired', async () => {
      const mockUser = {
        _id: 'user123',
        isEmailVerified: false,
        otp: { code: '123456', expiresAt: new Date(Date.now() - 1000) },
      };

      userRepository.findById.mockResolvedValue(mockUser);

      await expect(
        authService.verifyOTP('user123', '123456')
      ).rejects.toThrow('OTP has expired');
    });
  });
});
