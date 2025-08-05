/**
 * Analytics and metrics type definitions
 * Types for tracking user behavior and performance metrics
 */

export interface MetricEvent {
  name: string;
  timestamp: number;
  userId?: string;
  sessionId: string;
  properties?: Record<string, any>;
}

export interface UserJourneyStep {
  step: string;
  timestamp: number;
  duration?: number;
  completed: boolean;
  metadata?: Record<string, any>;
}

export interface ChokePoint {
  location: string;
  frequency: number;
  averageTime: number;
  userFeedback?: string[];
}

export interface RateLimitInfo {
  remaining: number;
  resetTime: number;
  limit: number;
  retryAfter?: number;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  context?: string;
}
