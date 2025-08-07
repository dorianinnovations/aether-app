/**
 * User API Endpoints
 * Profile management, settings, preferences, and file uploads
 */

import { api } from '../core/client';
import { TokenManager } from '../utils/storage';

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
      const response = await api.put('/user/profile', profileData);
      return response.data;
    } catch (error: unknown) {
      if ((error as any).status === 404) {
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
      
      // Create file object for React Native
      const imageFile = {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'profile-picture.jpg',
      } as any;
      
      formData.append('profilePhoto', imageFile);

      const response = await api.post('/user/profile-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: unknown) {
      throw error;
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
      
      // Create file object for React Native
      const imageFile = {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'banner-image.jpg',
      } as any;
      
      formData.append('bannerImage', imageFile);

      const response = await api.post('/user/banner-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: unknown) {
      throw error;
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
};