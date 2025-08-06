# E2E Test Suite for Aether App

## Overview
Comprehensive end-to-end testing suite that validates every API endpoint, user flow, and feature integration in the Aether social chat application.

## Test Structure

```
src/__tests__/e2e/
├── README.md                    # This file
├── setup/
│   ├── testSetup.ts            # Global test configuration
│   ├── testData.ts             # Test user accounts and mock data
│   ├── apiClient.ts            # Test-specific API client
│   └── testHelpers.ts          # Reusable test utilities
├── auth/
│   ├── authentication.test.ts   # Login, signup, token refresh
│   ├── userManagement.test.ts   # Profile, settings, preferences
│   └── spotifyAuth.test.ts      # Spotify OAuth integration
├── chat/
│   ├── messaging.test.ts        # AI chat, streaming, attachments
│   ├── conversations.test.ts    # CRUD operations, sync
│   └── realtime.test.ts         # SSE streaming, notifications
├── social/
│   ├── friends.test.ts          # Friend management, lookup
│   ├── socialProxy.test.ts      # Status updates, timeline
│   └── reactions.test.ts        # Activity reactions, comments
├── spotify/
│   ├── integration.test.ts      # OAuth flow, status, refresh
│   ├── sharing.test.ts          # Track sharing, live status
│   └── realtime.test.ts         # Live music updates
├── system/
│   ├── health.test.ts           # System health, monitoring
│   ├── fileProcessing.test.ts   # Image previews, uploads
│   └── performance.test.ts      # Load testing, rate limits
├── integration/
│   ├── fullUserFlow.test.ts     # Complete user journey
│   ├── crossFeature.test.ts     # Feature interactions
│   └── edgeCases.test.ts        # Error scenarios, edge cases
└── reports/
    ├── coverage.html            # Generated coverage report
    └── results.json             # Test execution results
```

## Test Execution

### Run All Tests
```bash
npm test -- src/__tests__/e2e/
```

### Run by Category
```bash
npm test -- src/__tests__/e2e/auth/
npm test -- src/__tests__/e2e/chat/
npm test -- src/__tests__/e2e/social/
npm test -- src/__tests__/e2e/spotify/
npm test -- src/__tests__/e2e/system/
npm test -- src/__tests__/e2e/integration/
```

### Run Specific Test
```bash
npm test -- src/__tests__/e2e/auth/authentication.test.ts
```

### Generate Coverage Report
```bash
npm run test:coverage -- src/__tests__/e2e/
```

## Test Data Management

### Test Users
- `testUser1@aether.app` - Primary test account
- `testUser2@aether.app` - Secondary for friend interactions
- `spotifyUser@aether.app` - Spotify-connected account
- `adminUser@aether.app` - Admin privileges for system tests

### Environment Variables
```env
EXPO_PUBLIC_API_URL=https://aether-server-j5kh.onrender.com
TEST_USER_PASSWORD=TestPassword123!
SPOTIFY_TEST_TOKEN=sp_test_token_123
```

## Coverage Requirements

### API Endpoints (50+ endpoints)
- ✅ Authentication (6 endpoints)
- ✅ User Management (6 endpoints)  
- ✅ Conversations (9 endpoints)
- ✅ Friends (6 endpoints)
- ✅ Social Proxy (6 endpoints)
- ✅ Spotify (9 endpoints)
- ✅ Notifications (3 endpoints)
- ✅ System Health (4 endpoints)
- ✅ File Processing (1 endpoint)
- ✅ AI Chat (2 endpoints)

### User Flows
- Registration → Onboarding → First Chat
- Friend Addition → Social Timeline → Reactions
- Spotify Connect → Track Sharing → Live Status
- Profile Updates → Settings Management
- Conversation Management → Message History
- Real-time Notifications → SSE Streaming

### Error Scenarios
- Network failures
- Authentication errors
- Rate limiting
- Invalid inputs
- Server errors
- Concurrent operations

## Success Criteria

### Performance Benchmarks
- API response time < 2s (95th percentile)
- SSE connection establishment < 1s
- Chat message streaming < 500ms first token
- Image upload processing < 5s
- Friend timeline load < 3s

### Reliability Targets
- 99.9% endpoint success rate
- Zero memory leaks during long sessions
- Graceful degradation on network issues
- Proper error recovery and retry logic

### Security Validation
- JWT token management
- Refresh token rotation
- Input sanitization
- File upload validation
- Rate limiting compliance

## Continuous Integration

### Pre-commit Hooks
- Run critical path tests
- Validate API connectivity
- Check test data integrity

### Pipeline Integration
- Full E2E suite on PR creation
- Performance regression detection
- Coverage requirement enforcement
- Automatic test report generation

## Maintenance

### Data Cleanup
Tests automatically clean up created data after execution to prevent pollution of test environment.

### Mock Services
For offline testing, mock implementations of external services (Spotify OAuth, etc.) are available.

### Test Updates
When new features or endpoints are added, corresponding tests must be created following the established patterns.