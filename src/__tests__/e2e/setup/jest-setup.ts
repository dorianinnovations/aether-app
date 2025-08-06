/**
 * Jest setup for E2E tests
 * Extends Jest matchers and global configuration
 */

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeOneOf(expected: any[]): R;
    }
  }
}

// Add custom matcher for flexible status code checking
expect.extend({
  toBeOneOf(received: any, expected: any[]) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected.join(', ')}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected.join(', ')}`,
        pass: false,
      };
    }
  },
});

// Mock console methods to reduce test noise
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Set up global test environment
process.env.NODE_ENV = 'test';
process.env.EXPO_PUBLIC_API_URL = 'https://aether-server-j5kh.onrender.com';

// Increase timeout for E2E tests
jest.setTimeout(60000);