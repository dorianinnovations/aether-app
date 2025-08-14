/**
 * User API Endpoints
 * Profile management, settings, preferences, and file uploads
 */

import { api } from '../core/client';
import { TokenManager } from '../utils/storage';
import { Platform } from 'react-native';
import { ImageUtils } from '../../../utils/imageUtils';
import { ErrorHandler } from '../../../utils/errorHandling';

export const UserAPI = {
  async getProfile(): Promise<unknown> {
    try {
      // Use the correct profile endpoint
      const response = await api.get('/user/profile');
      return response.data;
    } catch (error: unknown) {
      if ((error as any).status === 404) {
        // Fallback: try to get basic user info from auth endpoint or token data
        const userData = await TokenManager.getUserData();
        if (userData) {
          return {
            status: 'success',
            data: {
              user: userData,
              profilePicture: null,
              bannerImage: null,
            }
          };
        }
        throw new Error('Profile endpoint not available and no cached user data found');
      }
      throw error;
    }
  },

  async updateProfile(profileData: Record<string, unknown>): Promise<unknown> {
    try {
      const cleanedData = { ...profileData };
      
      // Only include badges if they're valid - don't strip them entirely since they're a paid feature
      if (cleanedData.badges && Array.isArray(cleanedData.badges)) {
        const validBadges = (cleanedData.badges as any[]).filter((badge: any) => 
          badge && 
          typeof badge === 'object' &&
          badge.id && 
          badge.badgeType &&
          typeof badge.id === 'string' &&
          typeof badge.badgeType === 'string'
        );
        
        // Only send badges if we have valid ones, otherwise omit the field
        if (validBadges.length > 0) {
          cleanedData.badges = validBadges;
        } else {
          delete cleanedData.badges;
        }
      }
      
      const response = await api.put('/user/profile', cleanedData);
      return response.data;
    } catch (error: unknown) {
      
      if ((error as any).response?.status === 404) {
        // Profile update endpoint not available yet
        // For now, just update local storage and return success
        const currentUserData = await TokenManager.getUserData();
        if (currentUserData) {
          const updatedUserData = { ...currentUserData, ...profileData };
          await TokenManager.setUserData(updatedUserData);
          return {
            status: 'success',
            message: 'Profile updated locally (server endpoint not available yet)',
            data: { user: updatedUserData }
          };
        }
        throw new Error('Profile update endpoint not available and no cached user data found');
      }
      throw error;
    }
  },

  async uploadProfilePicture(imageUri: string): Promise<any> {
    try {
      const formData = new FormData();
      
      // Use image utilities for better platform compatibility
      const { fileObject } = ImageUtils.getFormDataConfig(imageUri, 'profile');
      
      formData.append('profilePhoto', fileObject);

      const response = await api.post('/user/profile-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // Add timeout and other options for better reliability
        timeout: 60000, // 60 second timeout
      });
      
      return response.data;
    } catch (error: unknown) {
      // Enhanced error logging and processing
      const processedError = ErrorHandler.processApiError(error, 'profile_image_upload');
      
      console.error('Profile picture upload error details:', {
        error,
        imageUri,
        platform: Platform.OS,
        processedError,
        errorMessage: (error as any)?.message,
        errorResponse: (error as any)?.response?.data,
        errorStatus: (error as any)?.response?.status,
      });
      
      // Create a more informative error object
      const enhancedError = new Error(processedError.userMessage);
      (enhancedError as any).originalError = error;
      (enhancedError as any).errorCode = processedError.errorCode;
      
      throw enhancedError;
    }
  },

  async deleteProfilePicture(): Promise<any> {
    try {
      const response = await api.delete('/user/profile-photo');
      return response.data;
    } catch (error: unknown) {
      throw error;
    }
  },

  async uploadBannerImage(imageUri: string): Promise<any> {
    try {
      const formData = new FormData();
      
      // Use image utilities for better platform compatibility
      const { fileObject } = ImageUtils.getFormDataConfig(imageUri, 'banner');
      
      formData.append('bannerImage', fileObject);

      const response = await api.post('/user/banner-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // Add timeout and other options for better reliability
        timeout: 60000, // 60 second timeout
      });
      
      return response.data;
    } catch (error: unknown) {
      // Enhanced error logging and processing
      const processedError = ErrorHandler.processApiError(error, 'banner_image_upload');
      
      console.error('Banner image upload error details:', {
        error,
        imageUri,
        platform: Platform.OS,
        processedError,
        errorMessage: (error as any)?.message,
        errorResponse: (error as any)?.response?.data,
        errorStatus: (error as any)?.response?.status,
      });
      
      // Create a more informative error object
      const enhancedError = new Error(processedError.userMessage);
      (enhancedError as any).originalError = error;
      (enhancedError as any).errorCode = processedError.errorCode;
      
      throw enhancedError;
    }
  },

  async deleteBannerImage(): Promise<any> {
    try {
      const response = await api.delete('/user/banner-image');
      return response.data;
    } catch (error: unknown) {
      throw error;
    }
  },

  async getProfileImages(): Promise<any> {
    try {
      const response = await api.get('/user/images');
      return response.data;
    } catch (error: unknown) {
      throw error;
    }
  },

  async getSettings(): Promise<any> {
    const response = await api.get('/user/settings');
    return response.data;
  },

  async updateSettings(settings: any): Promise<any> {
    const response = await api.post('/user/settings', settings);
    return response.data;
  },

  async getPreferences(): Promise<any> {
    const response = await api.get('/user/preferences');
    return response.data;
  },

  async updatePreferences(preferences: any): Promise<any> {
    const response = await api.post('/user/preferences', preferences);
    return response.data;
  },

  async deleteAccount(): Promise<any> {
    const response = await api.delete('/user/delete');
    return response.data;
  },

  async getPublicProfile(username: string): Promise<unknown> {
    try {
      const response = await api.get(`/user/${username}/profile`);
      return response.data;
    } catch (error: unknown) {
      if ((error as any).response?.status === 404) {
        throw new Error(`User '${username}' not found`);
      }
      throw error;
    }
  },
};