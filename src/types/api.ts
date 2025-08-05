/**
 * API-related type definitions
 * Centralized API types for request/response handling
 */

export interface AuthResponse {
  status: string;
  token: string;
  data: {
    user: {
      id: string;
      email: string;
      username?: string;
      name?: string;
    };
  };
  welcomeEmail?: {
    sent: boolean;
    service: string;
    messageId: string;
  };
}

export interface ChatResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

export interface ApiError {
  message: string;
  code?: number;
  details?: any;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// SSE Types
export interface SSEEvent {
  type: string;
  data?: any;
  id?: string;
  retry?: number;
}

export type SSEEventHandler = (event: SSEEvent) => void;

// Stream Types
export interface StreamChunk {
  content: string;
  isComplete: boolean;
  metadata?: {
    messageId: string;
    timestamp: number;
  };
}
