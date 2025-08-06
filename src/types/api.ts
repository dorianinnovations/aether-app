/**
 * API-related type definitions
 * Centralized API types for request/response handling with standardized patterns
 */

// ========================================
// STANDARDIZED API RESPONSE PATTERNS
// ========================================

/**
 * Standard API Response Wrapper
 * All API endpoints should return this format for consistency
 */
export interface StandardAPIResponse<T = any> {
  success: boolean;
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
    statusCode?: number;
  };
  timestamp?: string;
  requestId?: string;
}

/**
 * Standardized Error Response
 */
export interface APIError {
  success: false;
  status: 'error';
  error: {
    code: string;
    message: string;
    statusCode: number;
    details?: any;
  };
  timestamp: string;
  requestId?: string;
}

// ========================================
// AUTHENTICATION TYPES
// ========================================

export interface User {
  id: string;
  email: string;
  username?: string;
  name?: string;
  firstName?: string; // Additional name property variants
  fullName?: string;
  full_name?: string;
  avatar?: string;
  preferences?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse extends StandardAPIResponse<{
  user: User;
  token: string;
  refreshToken?: string;
  expiresAt?: string;
  welcomeEmail?: {
    sent: boolean;
    service: string;
    messageId: string;
  };
}> {}

export interface TokenRefreshResponse extends StandardAPIResponse<{
  token: string;
  refreshToken?: string;
  expiresAt?: string;
}> {}

// ========================================
// CHAT & MESSAGING TYPES
// ========================================

export interface ChatResponse extends StandardAPIResponse<{
  response: string;
  tone?: string;
  hasMemory?: boolean;
  hasTools?: boolean;
  toolsUsed?: number;
  toolResults?: Array<{
    tool: string;
    query?: string;
    type?: string;
    success: boolean;
    data?: any;
    tier?: string;
    processingTime?: number;
  }>;
  tier?: string;
  responseTime?: number;
  cognitiveEngineUsed?: boolean;
  messageId?: string;
  conversationId?: string;
}> {
  // Legacy support properties for backward compatibility
  content?: string; // Alternative property name for response text
  response?: string; // Direct response property
  metadata?: any; // Metadata property for additional response data
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    model?: string;
    tokens?: number;
    responseTime?: number;
    toolsUsed?: string[];
  };
}

export interface Conversation {
  id: string;
  title?: string;
  messages?: Message[];
  createdAt: string;
  updatedAt: string;
  userId: string;
  metadata?: {
    messageCount: number;
    lastMessageAt?: string;
  };
}

export interface ConversationResponse extends StandardAPIResponse<Conversation> {}
export interface ConversationListResponse extends StandardAPIResponse<{
  conversations: Conversation[];
  totalCount?: number;
  hasMore?: boolean;
  nextCursor?: string;
}> {}

// ========================================
// SOCIAL & FRIENDS TYPES
// ========================================

export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: string;
  updatedAt: string;
  friend?: User;
}

export interface FriendResponse extends StandardAPIResponse<Friend> {}
export interface FriendListResponse extends StandardAPIResponse<{
  friends: Friend[];
  totalCount?: number;
}> {}

// ========================================
// LEGACY SUPPORT (DEPRECATED)
// ========================================

/** @deprecated Use StandardAPIResponse instead */
export interface APIResponse<T = any> extends StandardAPIResponse<T> {
  // Legacy properties for backward compatibility
  available?: boolean; // For username availability checks
}

// ========================================
// STREAMING & SSE TYPES
// ========================================

export interface SSEEvent {
  type: string;
  data?: any;
  id?: string;
  retry?: number;
  timestamp?: string;
}

export type SSEEventHandler = (event: SSEEvent) => void;

export interface StreamChunk {
  content: string;
  isComplete: boolean;
  metadata?: {
    messageId: string;
    timestamp: number;
    chunkIndex?: number;
    totalChunks?: number;
  };
}

// ========================================
// SYSTEM & HEALTH TYPES
// ========================================

export interface HealthCheckResponse extends StandardAPIResponse<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  version: string;
  services: {
    database: 'connected' | 'disconnected';
    llm: 'available' | 'unavailable';
    cache: 'healthy' | 'degraded';
  };
  performance: {
    responseTime: number;
    memoryUsage?: number;
    cpuUsage?: number;
  };
}> {}

export interface SystemStatusResponse extends StandardAPIResponse<{
  environment: string;
  buildVersion: string;
  deploymentTime: string;
  activeConnections: number;
  totalRequests: number;
}> {}

// ========================================
// SPOTIFY INTEGRATION TYPES
// ========================================

export interface SpotifyAuthResponse extends StandardAPIResponse<{
  connected: boolean;
  authUrl?: string;
  userProfile?: {
    id: string;
    displayName: string;
    email: string;
    avatar?: string;
  };
}> {}

export interface SpotifyStatusResponse extends StandardAPIResponse<{
  isConnected: boolean;
  currentTrack?: {
    name: string;
    artist: string;
    album: string;
    isPlaying: boolean;
    progressMs: number;
    durationMs: number;
  };
}> {}
