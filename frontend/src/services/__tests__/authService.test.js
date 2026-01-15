/**
 * FRONTEND AUTH SERVICE TESTS
 * 
 * Test authentication API calls
 * Mock API responses
 * Test error handling
 */

import authService from '../authService';
import api from '../api';

jest.mock('../api');

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const mockResponse = {
        success: true,
        token: 'token123',
        data: { user: { id: '123', email: 'test@example.com' } },
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await authService.login('test@example.com', 'password123');

      expect(api.post).toHaveBeenCalledWith(
        expect.stringContaining('/login'),
        expect.objectContaining({
          email: 'test@example.com',
          password: 'password123',
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle login errors', async () => {
      const mockError = { message: 'Invalid credentials' };
      api.post.mockRejectedValue(mockError);

      await expect(
        authService.login('test@example.com', 'wrong')
      ).rejects.toEqual(mockError);
    });
  });

  describe('register', () => {
    it('should register user successfully', async () => {
      const mockResponse = {
        success: true,
        data: { userId: '123', requiresVerification: true },
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await authService.register({
        email: 'new@example.com',
        password: 'Password123!',
        firstName: 'New',
        lastName: 'User',
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('verifyOTP', () => {
    it('should verify OTP successfully', async () => {
      const mockResponse = {
        success: true,
        token: 'token123',
        data: { user: { id: '123', isEmailVerified: true } },
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await authService.verifyOTP('user123', '123456');

      expect(api.post).toHaveBeenCalledWith(
        expect.stringContaining('/verify-otp'),
        { userId: 'user123', otp: '123456' }
      );
      expect(result).toEqual(mockResponse);
    });
  });
});
