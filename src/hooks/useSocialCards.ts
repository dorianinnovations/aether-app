/**
 * Feed Hook
 * Manages living profiles and feed data for friends/family
 */

import { useState, useEffect, useCallback } from 'react';
import type { SocialCard, Activity, Plan, SpotifyData, AvailabilityStatus } from '../types/social';
import { SocialProxyAPI, FriendsAPI } from '../services/api';
import { logger } from '../utils/logger';

interface SocialProxyData {
  mood?: string;
  recentActivities?: unknown[];
  socialProxy?: {
    currentPlans?: unknown;
    mood?: string;
    spotify?: unknown;
  };
}

export interface UseSocialCardsReturn {
  cards: SocialCard[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  fetchCards: () => Promise<void>;
  refreshCards: () => Promise<void>;
  sendHangoutRequest: (toUserId: string, type: string, message?: string) => Promise<void>;
  updateUserStatus: (status: string) => Promise<void>;
  updateAvailability: (availability: AvailabilityStatus) => Promise<void>;
}

// Helper functions for data transformation
const isRecentlyActive = (lastUpdated?: string): boolean => {
  if (!lastUpdated) return false;
  const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
  return new Date(lastUpdated).getTime() > fiveMinutesAgo;
};

const determineAvailabilityStatus = (socialProxy: SocialProxyData): 'available' | 'busy' | 'do-not-disturb' | 'away' => {
  if (!socialProxy?.mood) return 'away';

  switch (socialProxy.mood) {
    case 'busy':
    case 'focused':
      return 'busy';
    case 'available':
    case 'social':
      return 'available';
    default:
      return 'away';
  }
};

const mapActivityType = (backendType: string): Activity['type'] => {
  const typeMap: Record<string, Activity['type']> = {
    'status_update': 'other',
    'plans_update': 'other',
    'mood_update': 'other',
    'spotify_track': 'hobby',
    'spotify_discovery': 'hobby',
    'profile_update': 'other'
  };
  return typeMap[backendType] || 'other';
};

const getActivityEmoji = (type: string): string => {
  const emojiMap: Record<string, string> = {
    'status_update': '💭',
    'plans_update': '📅',
    'mood_update': '😊',
    'spotify_track': '🎵',
    'spotify_discovery': '🎶',
    'profile_update': '✨'
  };
  return emojiMap[type] || '📝';
};

const determineMusicMood = (topTracks?: any[]): SpotifyData['mood'] => {
  // Simple heuristic - could be enhanced
  if (!topTracks?.length) return undefined;
  return 'chill'; // Default for now
};

const transformActivities = (activities: any[]): Activity[] => {
  return activities.slice(0, 3).map((activity: any) => ({
    id: activity._id,
    type: mapActivityType(activity.type),
    description: activity.content.text,
    timestamp: activity.createdAt,
    emoji: getActivityEmoji(activity.type)
  }));
};

const transformPlans = (currentPlans?: string): Plan[] => {
  if (!currentPlans) return [];

  return [{
    id: 'current-plans',
    title: 'Current Plans',
    description: currentPlans,
    startTime: new Date().toISOString(),
    type: 'social',
    inviteOpen: false
  }];
};

const transformSpotifyData = (spotify: any): SpotifyData | undefined => {
  if (!spotify?.connected) return undefined;

  return {
    recentTracks: spotify.recentTracks?.slice(0, 5).map((track: any) => ({
      name: track.name,
      artist: track.artist,
      album: track.album,
      playedAt: track.playedAt
    })) || [],
    topArtistsThisWeek: spotify.topTracks?.slice(0, 3).map((track: any) => track.artist) || [],
    currentlyPlaying: spotify.currentTrack?.name ? {
      name: spotify.currentTrack.name,
      artist: spotify.currentTrack.artist,
      isPlaying: true
    } : undefined,
    mood: determineMusicMood(spotify.topTracks)
  };
};

// Transform backend data to SocialCard interface
const transformToSocialCard = (friend: any, socialProxy: any): SocialCard => {
  return {
    id: friend.user._id,
    userId: friend.user._id,
    name: friend.user.name || friend.user.username,
    avatar: undefined, // TODO: Add avatar support
    relationship: 'friend', // Default for now
    lastUpdated: socialProxy.socialProxy?.lastUpdated || friend.addedAt,
    isOnline: isRecentlyActive(socialProxy.socialProxy?.lastUpdated),

    // Social Proxy Data
    currentStatus: socialProxy.socialProxy?.currentStatus || '',
    availability: {
      status: determineAvailabilityStatus(socialProxy.socialProxy),
      message: socialProxy.socialProxy?.currentStatus || '',
      hangoutPreference: 'any'
    },
    recentActivities: transformActivities(socialProxy.recentActivities || []),
    upcomingPlans: transformPlans(socialProxy.socialProxy?.currentPlans),
    mood: socialProxy.socialProxy?.mood || '',

    // Spotify Data
    spotify: transformSpotifyData(socialProxy.socialProxy?.spotify),
    shareLevel: 'full'
  };
};

const createFallbackSocialCard = (friend: any): SocialCard => {
  return {
    id: friend.user._id,
    userId: friend.user._id,
    name: friend.user.name || friend.user.username,
    relationship: 'friend',
    lastUpdated: friend.addedAt,
    isOnline: false,
    currentStatus: 'No recent updates',
    availability: { status: 'away' },
    recentActivities: [],
    upcomingPlans: [],
    shareLevel: 'minimal'
  };
};

export const useSocialCards = (): UseSocialCardsReturn => {
  const [cards, setCards] = useState<SocialCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get friends list from backend
      const friendsResponse = await FriendsAPI.getFriendsList();

      if (friendsResponse.success && Array.isArray(friendsResponse.friends)) {
        // Transform backend friends data to SocialCard format
        const socialCards: SocialCard[] = await Promise.all(
          friendsResponse.friends.map(async (friend: any) => {
            try {
              // Get each friend's social proxy profile
              const profileResponse = await SocialProxyAPI.getFriendProfile(friend.username);

              return transformToSocialCard(friend, profileResponse.friend);
            } catch (error) {
              logger.warn(`Failed to load profile for ${friend.username}:`, error);
              return createFallbackSocialCard(friend);
            }
          })
        );

        setCards(socialCards);
      } else {
        setCards([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch social cards');
      logger.error('Error fetching social cards:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshCards = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      // Get friends list from backend
      const friendsResponse = await FriendsAPI.getFriendsList();

      if (friendsResponse.success && Array.isArray(friendsResponse.friends)) {
        // Transform backend friends data to SocialCard format
        const socialCards: SocialCard[] = await Promise.all(
          friendsResponse.friends.map(async (friend: any) => {
            try {
              // Get each friend's social proxy profile
              const profileResponse = await SocialProxyAPI.getFriendProfile(friend.username);

              return transformToSocialCard(friend, profileResponse.friend);
            } catch (error) {
              logger.warn(`Failed to load profile for ${friend.username}:`, error);
              return createFallbackSocialCard(friend);
            }
          })
        );

        setCards(socialCards);
      } else {
        setCards([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to refresh social cards');
      logger.error('Error refreshing social cards:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const sendHangoutRequest = useCallback(async (toUserId: string, type: string, message?: string) => {
    try {
      // TODO: Implement hangout request API
      logger.debug('Hangout request:', { toUserId, type, message });
      // For now, just show success
      return Promise.resolve();
    } catch (err: any) {
      logger.error('Failed to send hangout request:', err);
      throw err;
    }
  }, []);

  const updateUserStatus = useCallback(async (status: string) => {
    try {
      await SocialProxyAPI.updateStatus(status);
      // Refresh cards to show updated status
      await refreshCards();
    } catch (err: any) {
      logger.error('Failed to update user status:', err);
      throw err;
    }
  }, [refreshCards]);

  const updateAvailability = useCallback(async (availability: any) => {
    try {
      // TODO: Implement actual API call
      logger.debug('Updating availability:', availability);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // TODO: Update local state or refetch cards
    } catch (err) {
      logger.error('Error updating availability:', err);
      throw err;
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  // Auto-refresh disabled to prevent performance issues
  // Users can manually refresh with pull-to-refresh gesture

  return {
    cards,
    loading,
    error,
    refreshing,
    fetchCards,
    refreshCards,
    sendHangoutRequest,
    updateUserStatus,
    updateAvailability,
  };
};
