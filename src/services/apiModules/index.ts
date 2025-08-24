/**
 * Aether API Service - Modular Architecture
 * Main entry point with backward compatibility for existing imports
 */

// Initialize authentication interceptors by importing core
import './core/auth';

// Export core functionality
export * from './core';

// Export all API modules
export { AuthAPI } from './endpoints/auth';
export { ChatAPI } from './endpoints/chat';
export { UserAPI } from './endpoints/user';
export { ConversationAPI } from './endpoints/conversation';
export { FriendsAPI } from './endpoints/friends';
export { SocialProxyAPI } from './endpoints/social';
export { SpotifyAPI } from './endpoints/spotify';
export { SystemAPI, HealthAPI } from './endpoints/system';
export { NotificationsAPI } from './endpoints/notifications';
export { FileAPI } from './endpoints/files';
export { GitHubAPI } from './endpoints/github';

// New artist-focused API modules
export { ArtistAPI } from './endpoints/artists';
export { AnalyticsAPI } from './endpoints/analytics';
export { MemoryAPI } from './endpoints/memory';
export { musicApi } from './endpoints/music';

// Export utilities
export { makeRequest, ApiUtils } from './utils/request';
export { TokenManager } from './utils/storage';

// Export axios instance for custom requests (backward compatibility)
export { api } from './core/client';

// Export default for backward compatibility
import { api } from './core/client';
export default api;