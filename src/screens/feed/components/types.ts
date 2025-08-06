/**
 * Feed Component Types
 * Interfaces for customizable post cards and profile sections
 */

// Card Layout Types
export type CardLayout = 'classic' | 'modern' | 'minimal' | 'magazine' | 'artistic';
export type ProfilePlacement = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-right' | 'inline';
export type TextStyle = 'elegant' | 'casual' | 'bold' | 'compact';

export interface CardPreferences {
  layout: CardLayout;
  profilePlacement: ProfilePlacement;
  textStyle: TextStyle;
  accentColor: string;
  showEngagement: boolean;
  showTimestamp: boolean;
  showLocation: boolean;
  cardCornerRadius: number;
  textSize: 'small' | 'medium' | 'large';
}

export interface ProfileMockup {
  name: string;
  avatar: string;
  relationship: string;
  relationshipDetail?: string;
  location: string;
  color: string;
  gradient: [string, string];
  preferences: CardPreferences;
}

// Engagement section props
export interface EngagementData {
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  userHasLiked: boolean;
  engagement: 'high' | 'medium' | 'low';
}

export interface EngagementActions {
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
}

// Profile section props
export interface ProfileData {
  name: string;
  avatar: string;
  relationship: string;
  relationshipDetail?: string;
  location?: string;
  color: string;
}