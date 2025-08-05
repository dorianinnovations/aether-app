/**
 * Social Screen Constants
 * Static data for communities, colors, and tabs
 */

import type { Community, SocialTab } from '../types';

export const SOCIAL_TABS: { key: SocialTab; label: string; icon: string }[] = [
  { key: 'feed', label: 'Feed', icon: 'home' },
  { key: 'groups', label: 'Groups', icon: 'users' },
  { key: 'strategize', label: 'Strategize', icon: 'target' },
  { key: 'collaborate', label: 'Collaborate', icon: 'git-branch' },
];

export const COMMUNITIES: Community[] = [
  {
    id: 'general',
    name: 'General',
    description: 'General discussions and updates',
    color: '#6366f1',
    memberCount: 1250,
    isJoined: true,
  },
  {
    id: 'tech',
    name: 'Tech Talk',
    description: 'Technology discussions and innovation',
    color: '#10b981',
    memberCount: 890,
    isJoined: true,
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Art, design, and creative projects',
    color: '#f59e0b',
    memberCount: 567,
    isJoined: false,
  },
  {
    id: 'wellness',
    name: 'Wellness',
    description: 'Health, fitness, and mental wellbeing',
    color: '#ec4899',
    memberCount: 723,
    isJoined: true,
  },
  {
    id: 'learning',
    name: 'Learning',
    description: 'Education and skill development',
    color: '#8b5cf6',
    memberCount: 445,
    isJoined: false,
  },
];

export const COMMUNITY_COLORS = {
  general: '#6366f1',
  tech: '#10b981',
  creative: '#f59e0b',
  wellness: '#ec4899',
  learning: '#8b5cf6',
  default: '#64748b',
} as const;

export const POST_ACTION_COLORS = {
  like: '#ef4444',
  comment: '#3b82f6',
  share: '#10b981',
} as const;
