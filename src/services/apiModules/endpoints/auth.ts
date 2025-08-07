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
    
    
    if (response.success && (response.data || (response as any).token)) {
      // Store tokens and user data with cleanup - Backend returns token at root level
      const token = (response as any).token || response.data?.token;
      const user = response.data?.user;
      const refreshToken = (response as any).refreshToken || response.data?.refreshToken;
      
      if (token) {
        await TokenManager.setToken(token);
      }
      if (refreshToken) {
        await AsyncStorage.setItem('@aether_refresh_token', refreshToken);
      }
      if (user) {
        await TokenManager.setUserData(user);
        
        // Clean up any contaminated storage for this user
        if (user.id) {
          await StorageCleanup.cleanupUserStorage(user.id);
        }
      }
    }
    
    return response as AuthResponse;
  },

  async login(emailOrUsername: string, password: string): Promise<AuthResponse> {
    // Always send as 'email' field to satisfy backend validation
    // Backend should handle both email and username on the server side
    const response = await makeRequest<AuthResponse['data']>('POST', '/auth/login', {
      email: emailOrUsername,
      password,
    });
    
    
    const token = (response as any).token || response.data?.token;  // Backend returns token at root level
    const user = response.data?.user;
    
    if (response.status === 'success') {
      if (!token) {
        throw new Error('Authentication failed: Backend did not return authentication token');
      }
      
      if (!user || !user.id) {
        throw new Error('Authentication failed: Backend did not return valid user data');
      }
      
      // Store tokens and user data with cleanup
      await TokenManager.setToken(token);
      const refreshToken = (response as any).refreshToken || response.data?.refreshToken;
      if (refreshToken) {
        await AsyncStorage.setItem('@aether_refresh_token', refreshToken);
      }
      await TokenManager.setUserData(user);
      
      // Clean up any contaminated storage for this user
      if (user?.id) {
        await StorageCleanup.cleanupUserStorage(user.id);
      }
    }
    
    // Return response in AuthResponse format
    return {
      success: response.status === 'success',
      status: response.status || 'error',
      data: {
        token,
        user,
        refreshToken: response.data?.refreshToken
      }
    } as AuthResponse;
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
    } catch (error: unknown) {
      if ((error as any).status === 409 || (error as any).statusCode === 409) {
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