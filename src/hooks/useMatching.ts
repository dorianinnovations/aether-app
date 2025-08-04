/**
 * Aether - useMatching Hook
 * Manages matching service state and operations
 */

import { useState, useEffect, useCallback } from 'react';
import { MatchingAPI } from '../services/api';

export interface UserProfile {
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
  lastAnalyzed: string;
  compatibilityTags: string[];
  analysisVersion: string;
}

export interface MatchUser {
  id: string;
  username: string;
  email?: string;
}

export interface Compatibility {
  score: number;
  breakdown: {
    interests: number;
    communicationStyle: number;
    sharedTags: number;
  };
}

export interface Match {
  user: MatchUser;
  compatibility: Compatibility;
  matchReasons: string[];
}

export interface MatchingState {
  matches: Match[];
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  hasProfile: boolean;
}

export const useMatching = () => {
  const [state, setState] = useState<MatchingState>({
    matches: [],
    userProfile: null,
    loading: false,
    error: null,
    hasProfile: false,
  });

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }));
  };

  const fetchMatches = useCallback(async (limit: number = 10) => {
    // Check if user is authenticated
    const { TokenManager } = await import('../services/api');
    const token = await TokenManager.getToken();
    if (!token) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await MatchingAPI.findMatches(limit);
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          matches: response.matches || [],
          loading: false,
        }));
      } else {
        setError(response.error || 'Failed to fetch matches');
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Error fetching matches:', error);
      // Don't show error for auth failures, just clear loading
      if (error.status === 401) {
        setLoading(false);
        return;
      }
      setError(error.message || 'Failed to fetch matches');
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = useCallback(async () => {
    // Check if user is authenticated
    const { TokenManager } = await import('../services/api');
    const token = await TokenManager.getToken();
    if (!token) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await MatchingAPI.getUserProfile();
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          userProfile: response.profile,
          hasProfile: response.hasProfile,
          loading: false,
        }));
      } else {
        setError(response.error || 'Failed to fetch profile');
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      // Don't show error for auth failures, just clear loading
      if (error.status === 401) {
        setLoading(false);
        return;
      }
      setError(error.message || 'Failed to fetch profile');
      setLoading(false);
    }
  }, []);

  const refreshMatches = useCallback(async () => {
    await fetchMatches();
  }, [fetchMatches]);

  const refreshProfile = useCallback(async () => {
    await fetchUserProfile();
  }, [fetchUserProfile]);

  const forceAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await MatchingAPI.forceAnalysis();
      
      if (response.success) {
        // Refresh profile after analysis
        await fetchUserProfile();
      } else {
        setError(response.error || 'Failed to process analysis');
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Error forcing analysis:', error);
      setError(error.message || 'Failed to process analysis');
      setLoading(false);
    }
  }, [fetchUserProfile]);

  const testAnalysis = useCallback(async (message?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await MatchingAPI.testAnalysis(message);
      
      if (response.success) {
        // Refresh profile after test analysis
        await fetchUserProfile();
      } else {
        setError(response.error || 'Failed to test analysis');
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Error testing analysis:', error);  
      setError(error.message || 'Failed to test analysis');
      setLoading(false);
    }
  }, [fetchUserProfile]);

  // Convert server match data to UI-friendly format
  const getMatchesForUI = useCallback(() => {
    // Beautiful banner images for demo purposes
    const demoAvatars = [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1494790108755-2616b79bfbe2?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    ];

    const demoBanners = [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=120&fit=crop',
      'https://images.unsplash.com/photo-1519681393784-d120c3e9b5a4?w=400&h=120&fit=crop',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=120&fit=crop',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=120&fit=crop',
      'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=120&fit=crop',
    ];

    // Return empty array if no matches
    if (!state.matches || state.matches.length === 0) {
      return [];
    }

    // Generate realistic connection qualia based on interests and communication style
    const generateQualia = (matchReasons: string[], score: number) => {
      const vibes = [
        'Similar wavelength', 'Complementary energy', 'Shared curiosity', 'Creative spark',
        'Grounded connection', 'Intellectual resonance', 'Artistic alignment', 'Adventure sync',
        'Thoughtful exchange', 'Kindred spirit', 'Fresh perspective', 'Warm energy',
        'Deep roots', 'Gentle presence', 'Bright spark'
      ];
      
      const energies = [
        'Thoughtful & steady', 'Curious explorer', 'Creative dreamer', 'Gentle soul',
        'Adventure seeker', 'Deep thinker', 'Warm conversationalist', 'Quiet wisdom',
        'Playful spirit', 'Grounded optimist', 'Artistic soul', 'Nature lover',
        'Book enthusiast', 'Music aficionado', 'Travel minded'
      ];
      
      const resonances = [
        'Similar communication style', 'Complementary perspectives', 'Shared values',
        'Common interests', 'Similar life phase', 'Mutual curiosity', 'Parallel journeys',
        'Aligned worldview', 'Compatible rhythms', 'Shared humor', 'Similar energy'
      ];
      
      const timings = [
        'Recently active', 'Regular presence', 'Night owl', 'Early bird',
        'Weekend warrior', 'Just joined', 'Long-time member', 'Always around'
      ];
      
      // Use match data to influence selections
      const hash = matchReasons.join('').length;
      
      return {
        vibe: vibes[hash % vibes.length],
        energy: energies[(hash + 3) % energies.length],
        resonance: resonances[(hash + 7) % resonances.length],
        timing: timings[(hash + 11) % timings.length]
      };
    };

    return state.matches.map((match, index) => ({
      id: match.user.id,
      name: match.user.username,
      avatar: demoAvatars[index % demoAvatars.length],
      bannerImage: demoBanners[index % demoBanners.length],
      bannerColor: undefined, // Will use default color generation when no bannerImage
      connectionType: 'potential' as const,
      connectionQualia: generateQualia(match.matchReasons, match.compatibility.score),
      sharedInterests: match.matchReasons
        .filter(reason => reason.startsWith('Both interested in:'))
        .map(reason => reason.replace('Both interested in: ', ''))
        .join(', ')
        .split(', ')
        .filter(interest => interest.length > 0),
      distance: `${Math.floor(Math.random() * 10) + 1} km away`,
      lastSeen: 'Recently active',
      bio: match.matchReasons.join(' • '),
    }));
  }, [state.matches]);

  // Convert user profile for compatibility display
  const getProfileForUI = useCallback(() => {
    if (!state.userProfile) return null;

    const breakdown = [
      {
        category: 'Interests',
        score: state.userProfile.interests.length * 10, // Rough conversion
        color: '#4CAF50',
        description: `${state.userProfile.interests.length} interests detected`,
      },
      {
        category: 'Communication',
        score: Math.round(Object.values(state.userProfile.communicationStyle).reduce((a, b) => a + b, 0) / 5 * 100),
        color: '#2196F3',
        description: 'Communication style analyzed',
      },
      {
        category: 'Activity',
        score: Math.min(state.userProfile.totalMessages * 2, 100),
        color: '#FF9800',
        description: `${state.userProfile.totalMessages} messages analyzed`,
      },
    ];

    return {
      overallScore: Math.round(breakdown.reduce((sum, item) => sum + item.score, 0) / breakdown.length),
      breakdown,
      interests: state.userProfile.interests,
      communicationStyle: state.userProfile.communicationStyle,
      compatibilityTags: state.userProfile.compatibilityTags,
    };
  }, [state.userProfile]);

  return {
    ...state,
    fetchMatches,
    fetchUserProfile,
    refreshMatches,
    refreshProfile,
    forceAnalysis,
    testAnalysis,
    getMatchesForUI,
    getProfileForUI,
  };
};

export default useMatching;