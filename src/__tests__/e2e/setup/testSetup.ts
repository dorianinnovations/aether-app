/**
 * Global E2E Test Setup
 * Configures test environment, mock services, and global utilities
 */
/* eslint-disable no-console */

import { setupMocks, mockAsyncStorage } from './mocks';

// Setup mocks first
setupMocks();

// Now import after mocks are set up
const AsyncStorage = mockAsyncStorage;

// Mock TokenManager for E2E tests
const TokenManager = {
  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem('@aether_auth_token');
  },
  
  async setToken(token: string): Promise<void> {
    await AsyncStorage.setItem('@aether_auth_token', token);
  },
  
  async removeToken(): Promise<void> {
    await AsyncStorage.removeItem('@aether_auth_token');
  },
  
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  },
  
  async getUserData(): Promise<any> {
    const userData = await AsyncStorage.getItem('@aether_user_data_temp');
    return userData ? JSON.parse(userData) : null;
  },
  
  async setUserData(userData: any): Promise<void> {
    await AsyncStorage.setItem('@aether_user_data_temp', JSON.stringify(userData));
  }
};

// Test configuration
export const TEST_CONFIG = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://aether-server-j5kh.onrender.com',
  TIMEOUT: 30000, // 30 seconds for E2E operations
  RETRY_ATTEMPTS: 3,
  DELAY_BETWEEN_TESTS: 1000,
};

// Test user accounts
export const TEST_USERS = {
  PRIMARY: {
    email: 'testuser1@aether.app',
    username: 'testuser1',
    password: 'TestPassword123!',
    name: 'Test User One',
  },
  SECONDARY: {
    email: 'testuser2@aether.app', 
    username: 'testuser2',
    password: 'TestPassword123!',
    name: 'Test User Two',
  },
  SPOTIFY: {
    email: 'spotifyuser@aether.app',
    username: 'spotifyuser',
    password: 'TestPassword123!',
    name: 'Spotify Test User',
  },
  ADMIN: {
    email: 'adminuser@aether.app',
    username: 'adminuser', 
    password: 'AdminPassword123!',
    name: 'Admin Test User',
  },
};

// Global test state
interface TestState {
  currentUser: any;
  authToken: string | null;
  conversationIds: string[];
  friendConnections: string[];
  createdContent: string[];
}

export const testState: TestState = {
  currentUser: null,
  authToken: null,
  conversationIds: [],
  friendConnections: [],
  createdContent: [],
};

/**
 * Setup function called before all tests
 */
export const setupTests = async (): Promise<void> => {
  console.log('🚀 Setting up E2E test environment...');
  
  // Clear AsyncStorage
  await AsyncStorage.clear();
  
  // Reset test state
  testState.currentUser = null;
  testState.authToken = null;
  testState.conversationIds = [];
  testState.friendConnections = [];
  testState.createdContent = [];
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  
  console.log('✅ Test environment setup complete');
};

/**
 * Cleanup function called after all tests
 */
export const teardownTests = async (): Promise<void> => {
  console.log('🧹 Cleaning up test environment...');
  
  try {
    // Cleanup created content
    await cleanupTestData();
    
    // Clear storage
    await AsyncStorage.clear();
    await TokenManager.removeToken();
    
    // Reset state
    Object.keys(testState).forEach(key => {
      (testState as any)[key] = Array.isArray((testState as any)[key]) ? [] : null;
    });
    
    console.log('✅ Test cleanup complete');
  } catch (error) {
    console.error('❌ Test cleanup failed:', error);
  }
};

/**
 * Clean up test data from server
 */
const cleanupTestData = async (): Promise<void> => {
  // This would typically call cleanup endpoints on the server
  // For now, we'll log what should be cleaned up
  
  if (testState.conversationIds.length > 0) {
    console.log(`🗑️  Would cleanup ${testState.conversationIds.length} conversations`);
  }
  
  if (testState.friendConnections.length > 0) {
    console.log(`🗑️  Would cleanup ${testState.friendConnections.length} friend connections`);
  }
  
  if (testState.createdContent.length > 0) {
    console.log(`🗑️  Would cleanup ${testState.createdContent.length} pieces of content`);
  }
};

/**
 * Delay execution for specified milliseconds
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry function with exponential backoff
 */
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxAttempts: number = TEST_CONFIG.RETRY_ATTEMPTS,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      const delayMs = baseDelay * Math.pow(2, attempt - 1);
      console.log(`⚠️  Attempt ${attempt} failed, retrying in ${delayMs}ms...`);
      await delay(delayMs);
    }
  }
  
  throw lastError!;
};

/**
 * Assert that a condition is true, with detailed error message
 */
export const assertCondition = (
  condition: boolean,
  message: string,
  actualValue?: any,
  expectedValue?: any
): void => {
  if (!condition) {
    const errorMessage = [
      `❌ Assertion failed: ${message}`,
      actualValue !== undefined ? `   Actual: ${JSON.stringify(actualValue)}` : '',
      expectedValue !== undefined ? `   Expected: ${JSON.stringify(expectedValue)}` : '',
    ].filter(Boolean).join('\n');
    
    throw new Error(errorMessage);
  }
};

/**
 * Wait for a condition to be true with timeout
 */
export const waitForCondition = async (
  condition: () => boolean | Promise<boolean>,
  timeout: number = 10000,
  checkInterval: number = 100
): Promise<void> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await delay(checkInterval);
  }
  
  throw new Error(`Condition not met within ${timeout}ms timeout`);
};

/**
 * Generate random test data
 */
export const generateTestData = {
  email: () => `test.${Date.now()}.${Math.random().toString(36).substr(2, 9)}@aether.app`,
  username: () => `testuser_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
  name: () => `Test User ${Date.now().toString().slice(-6)}`,
  message: () => `Test message ${Date.now()} - ${Math.random().toString(36).substr(2, 10)}`,
  title: () => `Test Title ${Date.now()}`,
  status: () => `Test status update ${Date.now()}`,
};

/**
 * Mock implementations for external services
 */
export const mockServices = {
  spotify: {
    authUrl: 'https://accounts.spotify.com/authorize?mock=true',
    callbackCode: 'mock_spotify_code_123',
    currentTrack: {
      name: 'Test Track',
      artist: 'Test Artist',
      album: 'Test Album',
      imageUrl: 'https://via.placeholder.com/300x300',
      isPlaying: true,
    },
  },
  
  notifications: {
    mockEvent: {
      type: 'test',
      data: { message: 'Mock notification' },
      timestamp: new Date().toISOString(),
    },
  },
};

/**
 * Test result tracking
 */
interface TestResult {
  testName: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  endpoint?: string;
}

export const testResults: TestResult[] = [];

export const recordTestResult = (result: TestResult): void => {
  testResults.push(result);
};

export const generateTestReport = (): string => {
  const total = testResults.length;
  const passed = testResults.filter(r => r.status === 'passed').length;
  const failed = testResults.filter(r => r.status === 'failed').length;
  const skipped = testResults.filter(r => r.status === 'skipped').length;
  
  const report = [
    '📊 E2E Test Results Summary',
    '=' .repeat(40),
    `Total Tests: ${total}`,
    `✅ Passed: ${passed} (${((passed / total) * 100).toFixed(1)}%)`,
    `❌ Failed: ${failed} (${((failed / total) * 100).toFixed(1)}%)`,
    `⏭️  Skipped: ${skipped} (${((skipped / total) * 100).toFixed(1)}%)`,
    '',
    'Failed Tests:',
    ...testResults
      .filter(r => r.status === 'failed')
      .map(r => `  - ${r.testName}: ${r.error}`),
  ].join('\n');
  
  return report;
};

// Jest setup
beforeAll(async () => {
  await setupTests();
}, TEST_CONFIG.TIMEOUT);

afterAll(async () => {
  await teardownTests();
  console.log('\n' + generateTestReport());
}, TEST_CONFIG.TIMEOUT);

// Add delay between tests to avoid rate limiting
afterEach(async () => {
  await delay(TEST_CONFIG.DELAY_BETWEEN_TESTS);
});