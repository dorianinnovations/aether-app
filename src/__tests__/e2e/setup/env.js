/**
 * Environment Setup for E2E Tests
 * Sets up environment variables and test-specific configurations
 */
/* eslint-disable no-console */

// Set test environment
process.env.NODE_ENV = 'test';

// API Configuration
process.env.EXPO_PUBLIC_API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://aether-server-j5kh.onrender.com';

// Test user credentials (for demo purposes - in real tests use secure test accounts)
process.env.TEST_USER_PASSWORD = 'TestPassword123!';
process.env.SPOTIFY_TEST_TOKEN = 'sp_test_token_123';

// Test configuration
process.env.TEST_TIMEOUT = '120000'; // 2 minutes
process.env.TEST_RETRY_ATTEMPTS = '3';
process.env.TEST_DELAY_BETWEEN = '1000'; // 1 second

// Disable real external services in tests
process.env.DISABLE_SPOTIFY_OAUTH = 'true';
process.env.DISABLE_WEB_SEARCH = 'true';
process.env.DISABLE_PUSH_NOTIFICATIONS = 'true';

// Test database configuration (if applicable)
process.env.TEST_DB_URL = process.env.TEST_DB_URL || 'memory';

// Logging configuration
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'info';
process.env.DISABLE_CONSOLE_LOGS = 'false'; // Keep logs for E2E debugging

console.log('🔧 E2E Test environment configured');
console.log(`   API URL: ${process.env.EXPO_PUBLIC_API_URL}`);
console.log(`   Test timeout: ${process.env.TEST_TIMEOUT}ms`);
console.log(`   Node environment: ${process.env.NODE_ENV}`);