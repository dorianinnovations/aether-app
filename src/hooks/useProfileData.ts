/**
 * Profile Data Fusion Hook
 * Manages synchronization between basic profile data and social proxy data
 */

import { useState, useEffect, useCallback } from 'react';
import { UserAPI, FriendsAPI } from '../services/api';
import { TokenManager } from '../services/apiModules/utils/storage';
import { logger } from '../utils/logger';
import { useSocialProxy } from './useSocialProxy';
import { userBadgesService, UserBadge } from '../services/userBadgesService';

interface UserProfile {
  profilePicture?: string;
  bannerImage?: string;
  name?: string;
  email: string;
  id: string;
  bio?: string;
  location?: string;
  website?: string;
  username?: string;
  createdAt?: string;
  badges?: UserBadge[];
}

export interface UseProfileDataReturn {
  // Combined profile data
  profile: UserProfile | null;
  socialProfile: any;
  
  // Loading states
  loading: boolean;
  socialLoading: boolean;
  
  // Error states  
  error: string | null;
  socialError: string | null;
  
  // Actions
  loadProfile: () => Promise<void>;
  saveProfile: (profileData: Partial<UserProfile>) => Promise<void>;
  refreshAllData: () => Promise<void>;
  
  // Social proxy actions passed through
  updateStatus: (status?: string, plans?: string, mood?: string) => Promise<void>;
  refreshSpotifyData: () => Promise<void>;
}

export const useProfileData = (): UseProfileDataReturn => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use social proxy hook for living profile data
  const {
    profile: socialProfile,
    loading: socialLoading,
    error: socialError,
    fetchProfile: fetchSocialProfile,
    updateStatus,
    refreshSpotifyData
  } = useSocialProxy();
  
  // Load basic profile data
  const loadProfile = useCallback(async () => {
    const token = await TokenManager.getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const [profileResponse, usernameResponse, profileImagesResponse] = await Promise.all([
        UserAPI.getProfile(),
        FriendsAPI.getUserUsername().catch(() => ({ username: null })),
        UserAPI.getProfileImages().catch(() => ({ data: { profilePhoto: null, bannerImage: null } }))
      ]);
      
      if ((profileResponse as any).status === 'success' && ((profileResponse as any).data?.user || (profileResponse as any).data?.data?.user)) {
        const userData = (profileResponse as any).data?.user || (profileResponse as any).data?.data?.user;
        
        // Handle both id and _id fields from backend
        const userId = userData.id || userData._id;
        
        
        // Fetch user badges
        const userBadges = await userBadgesService.getUserBadges(
          userId, 
          userData.email, 
          userData.name || usernameResponse.username
        );
        
        // Get profile images from the images endpoint
        const profileImages = (profileImagesResponse as any).data || {};
        
        setProfile({
          id: userId, // Use resolved userId instead of userData.id
          email: userData.email,
          name: userData.name,
          bio: userData.bio,
          location: userData.location,
          website: userData.website,
          profilePicture: profileImages.profilePhoto?.url,
          bannerImage: profileImages.bannerImage?.url,
          username: usernameResponse.username || userData.username,
          createdAt: userData.createdAt,
          badges: userBadges,
        });
        
        // Profile data loaded
      } else {
        logger.error('Profile response missing user data:', profileResponse);
        throw new Error('Profile data is incomplete');
      }
    } catch (error: any) {
      logger.error('Error loading profile:', error);
      setError(error.message || 'Failed to load profile');
      
      if (error.status !== 401) {
        // For non-auth errors, set a user-friendly error
        setError('Failed to load profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Save profile data
  const saveProfile = useCallback(async (profileData: Partial<UserProfile>) => {
    if (!profile) {
      throw new Error('No profile data to update');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await UserAPI.updateProfile(profileData);
      
      if ((response as any).status === 'success' || (response as any).success) {
        // Update local profile state immediately with the saved data
        const updatedProfile = { ...profile, ...profileData };
        setProfile(updatedProfile);
        
        // Skip background refresh - let the calling component handle its own state
        // The ProfileScreen component will maintain its own local state after save
        // to prevent data overwriting issues
        
        // Profile updated
      } else {
        throw new Error((response as any).message || 'Failed to save profile changes');
      }
    } catch (error: any) {
      logger.error('Error saving profile:', error);
      setError(error.message || 'Failed to save profile');
      throw error; // Re-throw so calling component can handle UI feedback
    } finally {
      setLoading(false);
    }
  }, [profile, loadProfile, fetchSocialProfile]);
  
  // Refresh all data sources
  const refreshAllData = useCallback(async () => {
    try {
      setError(null);
      await Promise.all([
        loadProfile(),
        fetchSocialProfile()
      ]);
      logger.info('All profile data refreshed successfully');
    } catch (error: any) {
      logger.error('Error refreshing profile data:', error);
      setError('Failed to refresh profile data');
    }
  }, [loadProfile, fetchSocialProfile]);
  
  // Initialize data on mount
  useEffect(() => {
    const initializeData = async () => {
      const token = await TokenManager.getToken();
      if (token) {
        // Load basic profile first, then social proxy will load automatically
        await loadProfile();
      }
    };
    
    initializeData();
  }, [loadProfile]);
  
  
  return {
    // Data
    profile,
    socialProfile,
    
    // Loading states
    loading,
    socialLoading,
    
    // Error states
    error,
    socialError,
    
    // Actions
    loadProfile,
    saveProfile,
    refreshAllData,
    
    // Social proxy actions
    updateStatus,
    refreshSpotifyData
  };
};