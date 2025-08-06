/**
 * TypeScript types for E2E tests
 * Provides proper typing for API responses and test data
 */

// Auth API types
export interface AuthResponse {
  token: string;
  data?: {
    user: UserData;
  };
  user?: UserData;
  success?: boolean;
}

export interface UserData {
  id?: string;
  _id?: string;
  email: string;
  username?: string;
  name?: string;
}

// API Response wrapper
export interface APIResponse<T = any> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
  status?: string;
}

// Health check response
export interface HealthResponse {
  status: 'healthy' | 'ok' | 'unhealthy';
  services?: {
    [key: string]: 'up' | 'down';
  };
  timestamp?: string;
}

// Conversation types
export interface ConversationData {
  id?: string;
  _id?: string;
  conversationId?: string;
  title?: string;
  messages?: MessageData[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MessageData {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Social types
export interface SocialProfile {
  username: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
}

export interface TimelineActivity {
  id: string;
  type: string;
  content: string;
  timestamp: string;
  user: SocialProfile;
}

// Friends types
export interface FriendData {
  username: string;
  displayName?: string;
  status?: 'pending' | 'accepted' | 'blocked';
  avatar?: string;
}

// Spotify types
export interface SpotifyData {
  connected: boolean;
  authUrl?: string;
  currentTrack?: {
    name: string;
    artist: string;
    album?: string;
    imageUrl?: string;
    isPlaying?: boolean;
  };
}

// Notification types
export interface NotificationData {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  read?: boolean;
}

// Test utilities
export interface TestCredentials {
  email: string;
  username: string;
  password: string;
  name: string;
}

export interface TestResult {
  testName: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  endpoint?: string;
}

// Extended API response types with proper generics
export type AuthenticatedResponse<T> = APIResponse<T> & {
  token?: string;
  user?: UserData;
};

export type ConversationResponse = APIResponse<{
  conversation?: ConversationData;
  conversations?: ConversationData[];
}>;

export type FriendsResponse = APIResponse<{
  friends?: FriendData[];
  user?: FriendData;
  profile?: FriendData;
}>;

export type SocialResponse = APIResponse<{
  timeline?: TimelineActivity[];
  activities?: TimelineActivity[];
  profile?: SocialProfile;
}>;