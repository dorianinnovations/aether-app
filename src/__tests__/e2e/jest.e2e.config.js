/**
 * Jest Configuration for E2E Tests
 * Specialized configuration for end-to-end testing
 */

module.exports = {
  // Test environment setup
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/**/*.test.ts',
    '<rootDir>/**/*.test.tsx'
  ],
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/setup/testSetup.ts',
    '<rootDir>/setup/jest-setup.ts'
  ],
  
  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../../src/$1',
    '^@tests/(.*)$': '<rootDir>/../$1',
    '^@e2e/(.*)$': '<rootDir>/$1'
  },
  
  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  
  // File extensions to consider
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Test timeout (increased for E2E tests)
  testTimeout: 120000, // 2 minutes per test
  
  // Collect coverage information
  collectCoverage: false, // Disable for initial run
  
  // Coverage output
  coverageDirectory: '<rootDir>/reports/coverage',
  coverageReporters: ['html', 'text', 'lcov', 'json-summary'],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Test result processors
  reporters: [
    'default'
  ],
  
  // Global setup and teardown
  globalSetup: '<rootDir>/setup/globalSetup.js',
  globalTeardown: '<rootDir>/setup/globalTeardown.js',
  
  // Test environment variables
  setupFiles: [
    '<rootDir>/setup/env.js'
  ],
  
  // Verbose output for detailed logging
  verbose: true,
  
  // Handle async operations
  detectOpenHandles: true,
  forceExit: true,
  
  // Retry configuration removed (not supported in standard Jest)
  
  // Bail on first failure for faster feedback
  bail: false,
  
  // Run tests in sequence (not parallel) to avoid conflicts
  maxWorkers: 1,
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  
  // Test result caching
  cache: false, // Disable cache for E2E tests to ensure fresh runs
};