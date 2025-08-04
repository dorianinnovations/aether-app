/**
 * Test setup file for Jest
 */

// Mock React Native completely 
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  Dimensions: { get: jest.fn().mockReturnValue({ width: 375, height: 812 }) },
  Alert: { alert: jest.fn() },
}));

// Suppress console during tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};