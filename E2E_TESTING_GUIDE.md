# Aether E2E Testing Guide

## Overview
Comprehensive end-to-end testing suite that validates every API endpoint, user flow, and feature integration in the Aether social chat application.

## 🚀 Quick Start

### Prerequisites
1. **Server Running**: Ensure the Aether server is running at `https://aether-server-j5kh.onrender.com`
2. **Node.js**: Version 18+ installed
3. **Dependencies**: Run `npm install` to install all dependencies

### Run All Tests (Recommended)
```bash
# Run the comprehensive test suite
./src/__tests__/e2e/run-tests.sh

# Or using npm
npm run test:e2e
```

### Run Specific Test Categories
```bash
# Authentication & User Management
npm run test:e2e:auth

# Chat & Messaging Features  
npm run test:e2e:chat

# Social & Friends Features
npm run test:e2e:social

# System Health & Performance
npm run test:e2e system/

# Complete User Journey
npm run test:e2e:integration
```

## 📊 Test Coverage

### API Endpoints Tested (50+ total)
- ✅ **System Health** (4 endpoints)
  - `/health` - Complete health check
  - `/llm` - AI service status
  - `/audit` - System audit
  - `/status` - Quick status

- ✅ **Authentication** (6 endpoints)  
  - `/auth/check-username/:username` - Username availability
  - `/auth/signup` - User registration
  - `/auth/login` - User authentication
  - `/auth/refresh` - Token refresh
  - `/auth/spotify/connect` - Spotify OAuth
  - `/auth/spotify/disconnect` - Spotify disconnect

- ✅ **User Management** (6 endpoints)
  - `/user/profile` - Get/update profile
  - `/user/settings` - Settings management
  - `/user/preferences` - Preferences management
  - `/user/delete` - Account deletion

- ✅ **Conversations** (9 endpoints)
  - `/conversation/conversations/recent` - Recent conversations
  - `/conversation/conversations/:id` - Specific conversation
  - `/conversation/conversations` - Create/search conversations
  - `/conversation/conversations/sync` - Offline sync
  - `/conversation/conversations/:id/messages` - Message management
  - `/conversation/conversations/:id/title` - Title updates
  - Delete conversation endpoints

- ✅ **Friends Management** (6 endpoints)
  - `/friends/my-username` - Current username
  - `/friends/lookup/:username` - User lookup
  - `/friends/add` - Friend requests
  - `/friends/list` - Friends list
  - `/friends/remove` - Remove friends
  - `/friends/requests/*` - Request management

- ✅ **Social Proxy** (6 endpoints)
  - `/social-proxy/profile` - Social profile
  - `/social-proxy/status` - Status updates
  - `/social-proxy/timeline` - Friend timeline
  - `/social-proxy/friend/:username` - Friend profiles
  - Activity reactions and comments

- ✅ **Spotify Integration** (9 endpoints)
  - `/spotify/auth` - OAuth URL generation
  - `/spotify/callback` - OAuth callbacks
  - `/spotify/status` - Connection status
  - `/spotify/refresh` - Data refresh
  - `/spotify/share-track` - Track sharing
  - `/spotify/live-status/:username` - Live status
  - Connect/disconnect endpoints

- ✅ **Real-time Features** (3 endpoints)
  - `/notifications/stream` - SSE notifications
  - `/notifications/stats` - Service statistics
  - `/social-chat` - Streaming AI chat
  - `/social-chat-with-files` - Chat with files

- ✅ **File Processing** (1 endpoint)
  - `/api/preview-image` - URL preview generation

### User Flow Testing
- 🎯 **Complete User Journey** (12-step process)
  1. User registration and setup
  2. Profile customization
  3. First AI chat conversation
  4. Friend discovery and connection
  5. Social platform interaction
  6. Spotify integration
  7. Advanced chat features
  8. Real-time features testing
  9. Data management and sync
  10. System health monitoring
  11. Performance validation
  12. Complete experience validation

### Performance Benchmarks
- ⚡ API response time < 2s (95th percentile)
- ⚡ SSE connection establishment < 1s  
- ⚡ Chat message streaming < 500ms first token
- ⚡ Image upload processing < 5s
- ⚡ Friend timeline load < 3s
- ⚡ Concurrent request handling
- ⚡ Rate limiting compliance

## 🧪 Test Structure

```
src/__tests__/e2e/
├── setup/
│   ├── testSetup.ts         # Global test configuration
│   ├── apiClient.ts         # Enhanced API client
│   ├── env.js              # Environment setup
│   ├── globalSetup.js      # Pre-test setup
│   └── globalTeardown.js   # Post-test cleanup
├── auth/
│   └── authentication.test.ts  # Auth endpoint tests
├── chat/
│   ├── messaging.test.ts       # AI chat & streaming
│   └── conversations.test.ts   # Conversation CRUD
├── social/
│   └── friends.test.ts         # Friend management
├── system/
│   └── health.test.ts         # Health & monitoring
├── integration/
│   └── fullUserFlow.test.ts   # Complete user journey
├── reports/                   # Generated test reports
├── jest.e2e.config.js        # Jest E2E configuration
└── run-tests.sh              # Test runner script
```

## 📈 Test Reports

After running tests, check these locations for reports:

### Generated Reports
- **HTML Report**: `src/__tests__/e2e/reports/e2e-test-report.html`
- **Coverage Report**: `src/__tests__/e2e/reports/coverage/index.html`
- **Execution Summary**: `src/__tests__/e2e/reports/test-execution-summary.json`
- **Individual Logs**: `src/__tests__/e2e/reports/*-output.log`

### Reading Results
- **Green ✅**: Test passed successfully
- **Red ❌**: Test failed - check logs for details
- **Yellow ⚠️**: Warning or partial success
- **Blue ℹ️**: Informational message

## 🔧 Configuration

### Environment Variables
```bash
# API Configuration
EXPO_PUBLIC_API_URL=https://aether-server-j5kh.onrender.com

# Test Configuration
TEST_TIMEOUT=120000          # 2 minutes per test
TEST_RETRY_ATTEMPTS=3        # Retry failed tests
TEST_DELAY_BETWEEN=1000      # 1s delay between tests

# Feature Toggles
DISABLE_SPOTIFY_OAUTH=true   # Disable external OAuth in tests
DISABLE_WEB_SEARCH=true      # Disable web search features
```

### Test Data Management
- **Test Users**: Automatically generated unique users per test run
- **Cleanup**: Automatic cleanup of test data after execution
- **Isolation**: Each test suite uses independent test data

## 🚨 Troubleshooting

### Common Issues

**Server Not Accessible**
```bash
# Check server status
curl https://aether-server-j5kh.onrender.com/health

# Run with verbose logging
VERBOSE=true ./src/__tests__/e2e/run-tests.sh
```

**Tests Timing Out**
```bash
# Increase timeout
TEST_TIMEOUT=300000 npm run test:e2e
```

**Rate Limiting**
```bash
# Add delays between tests
TEST_DELAY_BETWEEN=2000 npm run test:e2e
```

**Spotify Tests Failing**
```bash
# Disable Spotify features for local testing
DISABLE_SPOTIFY_OAUTH=true npm run test:e2e
```

### Debug Mode
```bash
# Run with maximum verbosity
VERBOSE=true npm run test:e2e:watch

# Run single test file
npm run test:e2e src/__tests__/e2e/auth/authentication.test.ts

# Check specific endpoint
curl -H "Content-Type: application/json" \
     https://aether-server-j5kh.onrender.com/health
```

## 📋 Test Checklist

Before running E2E tests, verify:

- [ ] Aether server is running and accessible
- [ ] All npm dependencies are installed
- [ ] No other test processes are running
- [ ] Sufficient disk space for reports
- [ ] Network connection is stable

## 🎯 Success Criteria

Tests are considered successful when:

- **90%+ Test Suites Pass**: All critical functionality working
- **API Response Times**: Under performance thresholds
- **No Memory Leaks**: Consistent performance over time
- **Error Handling**: Graceful handling of edge cases
- **Security**: Authentication and authorization working
- **Real-time Features**: SSE streaming functional

## 🔮 Advanced Usage

### Custom Test Scenarios
```bash
# Test specific user flow
npm run test:e2e -- --testNamePattern="Complete User Journey"

# Test only critical endpoints
npm run test:e2e -- --testNamePattern="Health|Auth|Chat"

# Generate detailed coverage
npm run test:e2e:coverage --verbose
```

### CI/CD Integration
```yaml
# GitHub Actions example
- name: Run E2E Tests
  run: |
    npm install
    npm run test:e2e
  env:
    EXPO_PUBLIC_API_URL: ${{ secrets.API_URL }}
    TEST_TIMEOUT: 300000
```

### Performance Testing
```bash
# Run performance-focused tests
npm run test:e2e system/ -- --testNamePattern="Performance"

# Load testing
CONCURRENT_USERS=10 npm run test:e2e:integration
```

## 📞 Support

If you encounter issues with the E2E test suite:

1. **Check Logs**: Review generated log files in `reports/`
2. **Verify Server**: Ensure backend server is operational
3. **Update Dependencies**: Run `npm install` to get latest versions
4. **Report Issues**: Document failing tests with full error messages

## 🎉 Success!

When all tests pass, you'll see:
```
🎉 E2E Test Suite PASSED with excellent results!
📊 Success Rate: 95%+
⚡ All performance benchmarks met
🔒 Security validations passed
```

This means your Aether application is fully functional and ready for production! 🚀