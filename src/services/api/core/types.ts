/**
 * Core API Types and Interfaces
 * Centralized type definitions for API services
 */

import {
  StandardAPIResponse,
  APIError,
  AuthResponse,
  ChatResponse,
  ConversationResponse,
  ConversationListResponse,
  FriendResponse,
  FriendListResponse,
  HealthCheckResponse,
  SystemStatusResponse,
  SpotifyAuthResponse,
  SpotifyStatusResponse,
  User
} from '../../../types/api';

// Re-export core types for easy access
export type {
  StandardAPIResponse,
  APIError,
  AuthResponse,
  ChatResponse,
  ConversationResponse,
  ConversationListResponse,
  FriendResponse,
  FriendListResponse,
  HealthCheckResponse,
  SystemStatusResponse,
  SpotifyAuthResponse,
  SpotifyStatusResponse,
  User
};

/**
 * Enhanced API Error with additional details
 */
export interface EnhancedApiError extends Error {
  message: string;
  status?: number;
  code?: string;
  isRateLimit?: boolean;
  retryAfter?: number;
  statusCode?: number;
  response?: {
    status: number;
    data: any;
  };
}

/**
 * Storage key configuration
 */
export const getStorageKeys = (userId?: string) => ({
  USER_DATA: userId ? `@aether_user_data_${userId}` : '@aether_user_data_temp',
  CONVERSATIONS: userId ? `@aether_conversations_${userId}` : '@aether_conversations_temp',
  SETTINGS: userId ? `@aether_settings_${userId}` : '@aether_settings_temp',
  CACHE: userId ? `@aether_cache_${userId}` : '@aether_cache_temp'
});

export const AUTH_TOKEN_KEY = '@aether_auth_token';