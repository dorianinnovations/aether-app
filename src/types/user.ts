/**
 * User and profile type definitions
 * Types for user data, settings, and profile management
 */

export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string; // Additional name property variants
  fullName?: string;
  full_name?: string;
  username?: string;
  profilePicture?: string;
  avatar?: string; // Alternative to profilePicture
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
  colorfulBubblesEnabled: boolean;
  voiceEnabled: boolean;
  language: string;
}

export interface ConnectionProfile {
  id: string;
  name: string;
  profilePicture?: string;
  compatibilityScore: number;
  sharedInterests: string[];
  location?: string;
  lastActive: string;
}

export interface EmotionalMetric {
  id: string;
  userId: string;
  emotion: string;
  intensity: number;
  timestamp: string;
  context?: string;
}
