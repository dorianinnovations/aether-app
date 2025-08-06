/**
 * Authentication API Endpoints
 * User authentication, token management, and Spotify integration
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageCleanup } from '../../../utils/storageCleanup';
import { makeRequest } from '../utils/request';
import { TokenManager } from '../utils/storage';
import type { AuthResponse, SpotifyAuthResponse, StandardAPIResponse } from '../core/types';

export const AuthAPI = {
  async signup(email: string, password: string, name?: string, username?: string): Promise<AuthResponse> {
    const response = await makeRequest<AuthResponse['data']>('POST', '/auth/signup', {
      email,
      password,
      ...(name && { name }),
      ...(username && { username }),
    });
    
    if (response.success && response.data) {
      // Store tokens and user data with cleanup
      await TokenManager.setToken(response.data.token);
      if (response.data.refreshToken) {
        await AsyncStorage.setItem('@aether_refresh_token', response.data.refreshToken);
      }
      await TokenManager.setUserData(response.data.user);
      
      // Clean up any contaminated storage for this user
      if (response.data.user?.id) {
        await StorageCleanup.cleanupUserStorage(response.data.user.id);
      }
    }
    
    return response as AuthResponse;
  },

  async login(emailOrUsername: string, password: string): Promise<AuthResponse> {
    // Determine if it's an email or username based on presence of @ symbol
    const isEmail = emailOrUsername.includes('@');
    
    const response = await makeRequest<AuthResponse['data']>('POST', '/auth/login', {
      ...(isEmail ? { email: emailOrUsername } : { username: emailOrUsername }),
      password,
    });
    
    if (response.success && response.data) {
      // Store tokens and user data with cleanup
      await TokenManager.setToken(response.data.token);
      if (response.data.refreshToken) {
        await AsyncStorage.setItem('@aether_refresh_token', response.data.refreshToken);
      }
      await TokenManager.setUserData(response.data.user);
      
      // Clean up any contaminated storage for this user
      if (response.data.user?.id) {
        await StorageCleanup.cleanupUserStorage(response.data.user.id);
      }
    }
    
    return response as AuthResponse;
  },

  async logout(): Promise<void> {
    await TokenManager.removeToken();
  },

  async refreshToken(): Promise<AuthResponse> {
    try {
      // Get refresh token from storage
      const refreshToken = await AsyncStorage.getItem('@aether_refresh_token');
      const response = await makeRequest<AuthResponse['data']>('POST', '/auth/refresh', {
        refreshToken
      });
      
      if (response.success && response.data) {
        // Store new tokens
        await TokenManager.setToken(response.data.token);
        if (response.data.refreshToken) {
          await AsyncStorage.setItem('@aether_refresh_token', response.data.refreshToken);
        }
      }
      
      return response as AuthResponse;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  },

  async connectSpotify(): Promise<SpotifyAuthResponse> {
    return await makeRequest<SpotifyAuthResponse['data']>('POST', '/auth/spotify/connect') as SpotifyAuthResponse;
  },

  async disconnectSpotify(): Promise<SpotifyAuthResponse> {
    return await makeRequest<SpotifyAuthResponse['data']>('POST', '/auth/spotify/disconnect') as SpotifyAuthResponse;
  },

  async checkUsernameAvailability(username: string): Promise<StandardAPIResponse<{ available: boolean; message?: string }>> {
    try {
      return await makeRequest<{ available: boolean; message?: string }>('GET', `/auth/check-username/${username}`);
    } catch (error: any) {
      if (error.status === 409 || error.statusCode === 409) {
        return {
          success: false,
          status: 'error',
          data: { available: false, message: 'Username already taken' }
        };
      }
      throw error;
    }
  },
};