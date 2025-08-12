/**
 * Social Proxy Hook
 * Manages user's social proxy profile and status updates
 */

import { useState, useEffect, useCallback } from 'react';
import { SocialProxyAPI, SpotifyAPI, FriendsAPI } from '../services/api';
import { GrailsData } from '../design-system/components/molecules/GrailsSection';

export interface SocialProxyProfile {
  username: string;
  name?: string;
  currentStatus: string;
  currentPlans: string;
  mood: string;
  lastUpdated: string;
  friendsCount?: number;
  followersCount?: number;
  grails?: GrailsData;
  spotify: {
    connected: boolean;
    currentTrack?: {
      name: string;
      artist: string;
      album: string;
      imageUrl?: string;
      spotifyUrl?: string;
      lastPlayed: string;
    };
    recentTracks: Array<{
      name: string;
      artist: string;
      album: string;
      imageUrl?: string;
      spotifyUrl?: string;
      playedAt: string;
    }>;
    topTracks: Array<{
      name: string;
      artist: string;
      album: string;
      imageUrl?: string;
      spotifyUrl?: string;
      timeRange: string;
    }>;
  };
  personality: {
    interests: Array<{
      topic: string;
      confidence: number;
      lastMentioned: string;
    }>;
    communicationStyle: {
      casual: number;
      energetic: number;
      analytical: number;
      social: number;
      humor: number;
    };
    totalMessages: number;
    lastAnalyzed?: string;
  };
}

export interface Activity {
  _id: string;
  user: {
    username: string;
    name?: string;
  };
  type: string;
  content: {
    text: string;
    metadata?: Record<string, unknown>;
  };
  visibility: string;
  reactions: Array<{
    user: string;
    type: string;
    timestamp: string;
  }>;
  comments: Array<{
    user: {
      username: string;
    };
    text: string;
    timestamp: string;
  }>;
  createdAt: string;
}

export interface UseSocialProxyReturn {
  profile: SocialProxyProfile | null;
  timeline: Activity[];
  loading: boolean;
  error: string | null;
  
  // Profile management
  fetchProfile: () => Promise<void>;
  updateStatus: (status?: string, plans?: string, mood?: string) => Promise<void>;
  
  // Timeline management
  fetchTimeline: () => Promise<void>;
  refreshTimeline: () => Promise<void>;
  
  // Social interactions
  reactToActivity: (activityId: string, type: 'like' | 'love' | 'laugh' | 'curious' | 'relate') => Promise<void>;
  commentOnActivity: (activityId: string, text: string) => Promise<void>;
  
  // Spotify integration
  connectSpotify: () => Promise<string>;
  disconnectSpotify: () => Promise<void>;
  refreshSpotifyData: () => Promise<void>;
  shareTrack: (trackName: string, artist: string, message?: string) => Promise<void>;
}

export const useSocialProxy = (): UseSocialProxyReturn => {
  const [profile, setProfile] = useState<SocialProxyProfile | null>(null);
  const [timeline, setTimeline] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's social proxy profile
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch profile data, friends count, and grails data
      const [profileResponse, friendsResponse, grailsResponse] = await Promise.all([
        SocialProxyAPI.getProfile(),
        FriendsAPI.getFriendsList().catch(() => ({ data: { friends: [] } })),
        SpotifyAPI.getGrails().catch((error) => {
          console.warn('Failed to fetch grails:', error);
          return { success: false, grails: { topTracks: [], topAlbums: [] } };
        })
      ]);
      
      if (profileResponse.success) {
        const friendsCount = friendsResponse.data?.friends?.length || 0;
        // For now, using friendsCount as followersCount since we don't have separate followers API
        // This can be updated when a proper followers endpoint is available
        const followersCount = Math.floor(friendsCount * 1.2); // Mock: slightly more followers than following
        
        // Include grails data in the profile
        const grailsData = grailsResponse.success ? grailsResponse.grails : { topTracks: [], topAlbums: [] };
        
        setProfile({
          ...profileResponse.profile,
          friendsCount,
          followersCount,
          grails: grailsData
        });
        
        console.log('✅ Social profile loaded with grails:', grailsData);
      }
    } catch (err: unknown) {
      setError((err as any).message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  // Update social proxy status
  const updateStatus = useCallback(async (status?: string, plans?: string, mood?: string) => {
    try {
      setError(null);
      const response = await SocialProxyAPI.updateStatus(status, plans, mood);
      if (response.success) {
        // Update local profile
        setProfile(prev => prev ? {
          ...prev,
          currentStatus: status || prev.currentStatus,
          currentPlans: plans || prev.currentPlans,
          mood: mood || prev.mood,
          lastUpdated: new Date().toISOString()
        } : null);
      }
    } catch (err: unknown) {
      setError((err as any).message || 'Failed to update status');
      throw err;
    }
  }, []);

  // Fetch friend timeline
  const fetchTimeline = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await SocialProxyAPI.getTimeline(1, 20);
      if (response.success && response.timeline) {
        setTimeline(response.timeline);
      } else {
        // Timeline endpoint not available, use empty timeline
        setTimeline([]);
      }
    } catch (err: unknown) {
      // Timeline endpoint not implemented yet, gracefully handle
      setTimeline([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh timeline
  const refreshTimeline = useCallback(async () => {
    await fetchTimeline();
  }, [fetchTimeline]);

  // React to an activity
  const reactToActivity = useCallback(async (activityId: string, type: 'like' | 'love' | 'laugh' | 'curious' | 'relate') => {
    try {
      const response = await SocialProxyAPI.reactToActivity(activityId, type);
      if (response.success) {
        // Update local timeline
        setTimeline(prev => prev.map(activity => 
          activity._id === activityId 
            ? { ...activity, reactions: response.reactions }
            : activity
        ));
      }
    } catch (err: unknown) {
      throw err;
    }
  }, []);

  // Comment on an activity
  const commentOnActivity = useCallback(async (activityId: string, text: string) => {
    try {
      const response = await SocialProxyAPI.commentOnActivity(activityId, text);
      if (response.success) {
        // Update local timeline
        setTimeline(prev => prev.map(activity => 
          activity._id === activityId 
            ? { ...activity, comments: response.comments }
            : activity
        ));
      }
    } catch (err: unknown) {
      throw err;
    }
  }, []);

  // Connect Spotify account
  const connectSpotify = useCallback(async (): Promise<string> => {
    try {
      const response = await SpotifyAPI.getAuthUrl();
      if (response.success) {
        return response.authUrl;
      }
      throw new Error('Failed to get Spotify auth URL');
    } catch (err: unknown) {
      throw err;
    }
  }, []);

  // Disconnect Spotify account
  const disconnectSpotify = useCallback(async () => {
    try {
      const response = await SpotifyAPI.disconnect();
      if (response.success) {
        // Update local profile
        setProfile(prev => prev ? {
          ...prev,
          spotify: {
            connected: false,
            recentTracks: [],
            topTracks: []
          }
        } : null);
      }
    } catch (err: unknown) {
      throw err;
    }
  }, []);

  // Refresh Spotify data
  const refreshSpotifyData = useCallback(async () => {
    try {
      const response = await SpotifyAPI.refresh();
      if (response.success) {
        // Refresh profile to get updated Spotify data
        await fetchProfile();
      }
    } catch (err: unknown) {
      throw err;
    }
  }, [fetchProfile]);

  // Share a track
  const shareTrack = useCallback(async (trackName: string, artist: string, message?: string) => {
    try {
      const response = await SpotifyAPI.shareTrack(trackName, artist, undefined, undefined, undefined, message);
      if (response.success) {
        // Refresh timeline to show the shared track
        await refreshTimeline();
      }
    } catch (err: unknown) {
      throw err;
    }
  }, [refreshTimeline]);

  // Load initial data
  useEffect(() => {
    fetchProfile();
    fetchTimeline();
  }, [fetchProfile, fetchTimeline]);

  return {
    profile,
    timeline,
    loading,
    error,
    fetchProfile,
    updateStatus,
    fetchTimeline,
    refreshTimeline,
    reactToActivity,
    commentOnActivity,
    connectSpotify,
    disconnectSpotify,
    refreshSpotifyData,
    shareTrack
  };
};