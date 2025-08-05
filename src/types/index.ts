/**
 * Core application types and interfaces
 * Centralized type definitions for the entire application
 */

// Re-export all domain-specific types
export * from './api';
export * from './chat';
export * from './user';
export * from './navigation';
export * from './ui';
export * from './social';
export * from './analytics';

// Legacy compatibility - these will be removed in future versions
// @deprecated Use domain-specific type files instead
export type { User, UserSettings, EmotionalMetric, ConnectionProfile } from './user';
export type { Message, MessageAttachment, Conversation, ToolCall, MessageMetadata } from './chat';
export type { APIResponse, AuthResponse, ChatResponse, ApiError } from './api';
export type { ThemeContextType, ThemeColors, IconName, IconSize } from './ui';
export type { RootStackParamList, NavigationProps, ScreenName } from './navigation';
export type { Post, Comment, Community, CreatePostData, CreateCommentData } from './social';
export type { MetricEvent, UserJourneyStep, ChokePoint, RateLimitInfo } from './analytics';