/**
 * Jest Test Setup
 * 
 * Global test configuration
 * Mock setup
 * Test utilities
 */

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test-db';

// Increase timeout for async operations
jest.setTimeout(10000);

// Mock logger to avoid console output in tests
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
