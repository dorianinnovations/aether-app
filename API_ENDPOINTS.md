# Aether API Endpoints Documentation

## Base Configuration
- **Production URL**: `https://aether-server-j5kh.onrender.com`
- **Authentication**: JWT Bearer Token (except public endpoints)
- **Content-Type**: `application/json` (unless specified)

## Endpoint Categories

### 1. Health & System
```typescript
GET  /health                     // Full system health check
GET  /llm                        // AI service status
GET  /audit                      // System audit report
GET  /status                     // Quick status check
```

### 2. Authentication
```typescript
GET  /auth/check-username/:username     // Check username availability
POST /auth/signup                        // User registration
POST /auth/login                         // User login
POST /auth/refresh                       // Refresh JWT token
POST /auth/spotify/connect      🔒      // Link Spotify account
POST /auth/spotify/disconnect   🔒      // Unlink Spotify account
```

### 3. User Management
```typescript
GET    /user/profile        🔒    // Get user profile
GET    /user/settings       🔒    // Get user settings
POST   /user/settings       🔒    // Update settings
GET    /user/preferences    🔒    // Get preferences
POST   /user/preferences    🔒    // Update preferences
DELETE /user/delete         🔒    // Delete account
```

### 4. Conversations
```typescript
GET    /conversation/conversations/recent       🔒    // Recent conversations (paginated)
GET    /conversation/conversations/:id          🔒    // Get specific conversation
GET    /conversation/conversations              🔒    // Search conversations
POST   /conversation/conversations              🔒    // Create conversation
POST   /conversation/conversations/sync         🔒    // Sync conversations (offline)
POST   /conversation/conversations/:id/messages 🔒    // Add message
PUT    /conversation/conversations/:id/title    🔒    // Update title
DELETE /conversation/conversations/:id          🔒    // Delete conversation
DELETE /conversation/conversations/all          🔒    // Delete all conversations
```

### 5. Friends Management
```typescript
GET    /friends/my-username           🔒    // Get current username
GET    /friends/my-id                 🔒    // Get friend ID (legacy)
GET    /friends/lookup/:username      🔒    // Look up user
POST   /friends/add                   🔒    // Add friend
GET    /friends/list                  🔒    // Get friends list
DELETE /friends/remove                🔒    // Remove friend
```

### 6. Real-time Notifications (SSE)
```typescript
GET  /notifications/stream    🔒    // SSE notification stream
GET  /notifications/stats     🔒    // Service statistics
POST /notifications/test      🔒    // Send test notification
```

### 7. File Processing
```typescript
POST /api/preview-image    🔒    // Generate URL preview images
```

### 8. Social Proxy
```typescript
GET  /social-proxy/profile                      🔒    // Get social profile
POST /social-proxy/status                       🔒    // Update status/mood
GET  /social-proxy/timeline                     🔒    // Get friend timeline
GET  /social-proxy/friend/:username             🔒    // Get friend's proxy
POST /social-proxy/activity/:activityId/react   🔒    // React to activity
POST /social-proxy/activity/:activityId/comment 🔒    // Comment on activity
```

### 9. Spotify Integration
```typescript
GET  /spotify/debug-config                   // Debug configuration
GET  /spotify/auth                      🔒    // Get OAuth URL
GET  /spotify/callback                       // OAuth callback (web)
POST /spotify/mobile-callback               // OAuth callback (mobile)
POST /spotify/disconnect                🔒    // Disconnect account
GET  /spotify/status                    🔒    // Connection status
POST /spotify/refresh                   🔒    // Refresh data
POST /spotify/share-track               🔒    // Share track
GET  /spotify/live-status/:username     🔒    // Friend's live status
```

### 10. AI Chat (SSE Streaming)
```typescript
POST /social-chat              🔒    // SSE AI chat stream
POST /social-chat-with-files   🔒    // SSE AI chat with files
```

## Request/Response Examples

### Authentication
```typescript
// Login
POST /auth/login
{
  "username": "string",
  "password": "string"
}
Response: {
  "token": "jwt_token",
  "refreshToken": "refresh_token",
  "user": { ... }
}

// Refresh Token
POST /auth/refresh
{
  "refreshToken": "string"
}
Response: {
  "token": "new_jwt_token",
  "refreshToken": "new_refresh_token"
}
```

### Conversations
```typescript
// Create Conversation
POST /conversation/conversations
{
  "title": "string",
  "firstMessage": "string"
}

// Add Message
POST /conversation/conversations/:id/messages
{
  "role": "user" | "assistant",
  "content": "string",
  "metadata": { ... }
}

// Sync Conversations
POST /conversation/conversations/sync
{
  "conversations": [ ... ],
  "lastSyncTime": "ISO_date"
}
```

### Social Proxy
```typescript
// Update Status
POST /social-proxy/status
{
  "status": "string",
  "mood": "happy" | "excited" | "calm" | "focused",
  "currentPlans": "string",
  "location": "string"
}

// React to Activity
POST /social-proxy/activity/:activityId/react
{
  "reaction": "like" | "love" | "celebrate" | "support"
}
```

### Spotify
```typescript
// Get Auth URL
GET /spotify/auth?platform=web|mobile
Response: {
  "authUrl": "https://accounts.spotify.com/authorize?..."
}

// Mobile Callback
POST /spotify/mobile-callback
{
  "code": "string",
  "state": "string"
}

// Share Track
POST /spotify/share-track
{
  "trackId": "string",
  "message": "string"
}
```

### AI Chat (SSE)
```typescript
// Streaming Chat
POST /social-chat
{
  "message": "string",
  "conversationId": "string",
  "enableWebSearch": boolean
}
Response: Server-Sent Events stream
data: {"content": "word"}
data: {"metadata": { ... }}
data: [DONE]

// Chat with Files
POST /social-chat-with-files
Content-Type: multipart/form-data
{
  "message": "string",
  "conversationId": "string",
  "files": File[]
}
```

## SSE Integration Pattern

```typescript
// Frontend SSE Implementation
const eventSource = new EventSource(url, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'text/event-stream'
  }
});

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle streaming data
};

eventSource.onerror = (error) => {
  eventSource.close();
  // Handle error
};
```

## Error Responses

```typescript
// Standard Error Format
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "status": 400
}

// Common Error Codes
- UNAUTHORIZED: 401
- FORBIDDEN: 403
- NOT_FOUND: 404
- VALIDATION_ERROR: 400
- SERVER_ERROR: 500
- RATE_LIMIT: 429
```

## Rate Limiting

- Default: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes
- Chat endpoints: 50 requests per 15 minutes
- File uploads: 10 requests per 15 minutes

## Implementation Priority

### 🔴 Critical (Implement Immediately)
1. Spotify integration endpoints
2. Social proxy endpoints
3. Notification SSE stream
4. Conversation sync endpoint

### 🟡 Important (Implement Soon)
1. File preview endpoint
2. Friend management endpoints
3. Profile analytics
4. System health monitoring

### 🟢 Nice to Have
1. Audit endpoint integration
2. Advanced search features
3. Batch operations

## Notes
- 🔒 = Requires authentication
- SSE = Server-Sent Events streaming
- All authenticated endpoints require Bearer token in Authorization header
- File uploads use multipart/form-data
- Timestamps use ISO 8601 format