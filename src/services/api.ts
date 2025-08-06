/**
 * Aether API Service - Backward Compatibility Layer
 * Re-exports from modular API architecture for existing imports
 */

// Direct re-export to maintain backward compatibility
export {
  // Core exports
  api as default,
  api,
  API_BASE_URL,
  TokenManager,
  makeRequest,
  ApiUtils,
  
  // API modules
  AuthAPI,
  ChatAPI,
  UserAPI,
  ConversationAPI,
  FriendsAPI,
  SocialProxyAPI,
  SpotifyAPI,
  SystemAPI,
  HealthAPI,
  NotificationsAPI,
  FileAPI
} from './apiModules';