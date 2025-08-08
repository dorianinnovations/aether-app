/**
 * Profile Data Service
 * Centralized service for managing profile data operations
 */

import { UserAPI } from './apiModules/endpoints/user';
import { UserBadgeType } from '../design-system/components/atoms';
import { logger } from '../utils/logger';

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  name?: string;
  bio?: string;
  location?: string;
  website?: string;
  profilePicture?: string;
  bannerImage?: string;
  createdAt?: string;
  badges?: Array<{
    id: string;
    badgeType: UserBadgeType;
    isVisible: boolean;
  }>;
}

export interface SocialProfile {
  currentStatus?: string;
  mood?: string;
  currentPlans?: string;
  spotify?: {
    connected: boolean;
    currentTrack?: {
      name: string;
      artist: string;
    };
    recentTracks?: Array<{
      name: string;
      artist: string;
    }>;
  };
  personality?: {
    interests?: Array<{
      topic: string;
      confidence: number;
    }>;
    communicationStyle?: {
      [key: string]: number;
    };
    totalMessages?: number;
    lastAnalyzed?: string;
  };
}

export interface ProfileDataResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class ProfileDataService {
  /**
   * Get user profile data
   */
  static async getUserProfile(): Promise<ProfileDataResult<UserProfile>> {
    try {
      const response = await UserAPI.getProfile();
      
      if (response && typeof response === 'object' && 'data' in response) {
        const profileData = (response as any).data;
        
        // Handle both direct user data and nested user object
        const user = profileData.user || profileData;
        
        const profile: UserProfile = {
          id: user.id || '',
          email: user.email || '',
          username: user.username,
          name: user.name,
          bio: user.bio,
          location: user.location,
          website: user.website,
          profilePicture: profileData.profilePicture?.url || user.profilePicture,
          bannerImage: profileData.bannerImage?.url || user.bannerImage,
          createdAt: user.createdAt,
          badges: user.badges || []
        };

        return {
          success: true,
          data: profile
        };
      }

      throw new Error('Invalid profile data format');
    } catch (error: any) {
      logger.error('Failed to get user profile:', error);
      return {
        success: false,
        error: error.message || 'Failed to load profile data'
      };
    }
  }

  /**
   * Update user profile data
   */
  static async updateProfile(
    profileData: Partial<Pick<UserProfile, 'name' | 'bio' | 'location' | 'website'>>
  ): Promise<ProfileDataResult<UserProfile>> {
    try {
      const response = await UserAPI.updateProfile(profileData);
      
      if (response && typeof response === 'object') {
        const updatedData = (response as any).data;
        
        // Return updated profile data
        return {
          success: true,
          data: updatedData?.user || updatedData
        };
      }

      return { success: true };
    } catch (error: any) {
      logger.error('Failed to update profile:', error);
      return {
        success: false,
        error: error.message || 'Failed to update profile'
      };
    }
  }

  /**
   * Get social profile data (mock for now - would integrate with actual API)
   */
  static async getSocialProfile(): Promise<ProfileDataResult<SocialProfile>> {
    try {
      // This would be replaced with actual API call
      // For now, return mock data or null
      return {
        success: true,
        data: undefined // No social profile data yet
      };
    } catch (error: any) {
      logger.error('Failed to get social profile:', error);
      return {
        success: false,
        error: error.message || 'Failed to load social profile data'
      };
    }
  }

  /**
   * Get complete profile data (user + social)
   */
  static async getCompleteProfile(): Promise<{
    userProfile: ProfileDataResult<UserProfile>;
    socialProfile: ProfileDataResult<SocialProfile>;
  }> {
    const [userProfile, socialProfile] = await Promise.all([
      this.getUserProfile(),
      this.getSocialProfile()
    ]);

    return {
      userProfile,
      socialProfile
    };
  }

  /**
   * Refresh all profile data
   */
  static async refreshAllData(): Promise<{
    userProfile: ProfileDataResult<UserProfile>;
    socialProfile: ProfileDataResult<SocialProfile>;
  }> {
    // Clear any cached data first (if implemented)
    return await this.getCompleteProfile();
  }

  /**
   * Validate profile field data
   */
  static validateProfileField(field: string, value: string): { valid: boolean; error?: string } {
    switch (field) {
      case 'email':
        if (!value || !/\S+@\S+\.\S+/.test(value)) {
          return { valid: false, error: 'Please enter a valid email address' };
        }
        break;
      case 'website':
        if (value && !/(https?:\/\/)?([\w\-])+\.{1}([a-zA-Z]{2,63})([\/\w-]*)*\/?\??([^#\n\r]*)?#?([^\n\r]*)/i.test(value)) {
          return { valid: false, error: 'Please enter a valid website URL' };
        }
        break;
      case 'bio':
        if (value && value.length > 500) {
          return { valid: false, error: 'Bio must be less than 500 characters' };
        }
        break;
      case 'name':
        if (value && value.length > 100) {
          return { valid: false, error: 'Name must be less than 100 characters' };
        }
        break;
      case 'location':
        if (value && value.length > 100) {
          return { valid: false, error: 'Location must be less than 100 characters' };
        }
        break;
    }

    return { valid: true };
  }

  /**
   * Check if profile is complete
   */
  static isProfileComplete(profile: UserProfile): boolean {
    return !!(
      profile.email &&
      profile.name &&
      profile.bio &&
      (profile.profilePicture || profile.username)
    );
  }

  /**
   * Get profile completion percentage
   */
  static getProfileCompletionPercentage(profile: UserProfile): number {
    const fields = [
      profile.email,
      profile.name,
      profile.bio,
      profile.location,
      profile.website,
      profile.profilePicture,
      profile.bannerImage
    ];

    const completedFields = fields.filter(field => !!field).length;
    return Math.round((completedFields / fields.length) * 100);
  }
}