/**
 * API Storage Management
 * Token and user data storage utilities
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AUTH_TOKEN_KEY, getStorageKeys } from '../core/types';
import { logger } from '../../../utils/logger';

// Token management
export const TokenManager = {
  async getToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      return token;
    } catch (error) {
      logger.error('Error getting token:', error);
      return null;
    }
  },

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await this.getToken();
      return !!token;
    } catch (error) {
      logger.error('Error checking authentication:', error);
      return false;
    }
  },

  async setToken(token: string): Promise<void> {
    try {
      if (!token || token === 'undefined' || token === 'null') {
        logger.warn('Attempted to set undefined/null token, removing instead:', token);
        await this.removeToken();
        return;
      }
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    } catch (error) {
      logger.error('Error setting token:', error);
    }
  },

  async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      // Get current user data to find user ID for cleanup
      const currentUser = await this.getUserData();
      const userId = currentUser?.id;
      
      // Remove user-specific data if we have a user ID
      if (userId) {
        const keys = getStorageKeys(userId);
        await Promise.all([
          AsyncStorage.removeItem(keys.USER_DATA),
          AsyncStorage.removeItem(keys.CONVERSATIONS),
          AsyncStorage.removeItem(keys.SETTINGS),
          AsyncStorage.removeItem(keys.CACHE)
        ]);
      }
    } catch (error) {
      logger.error('Error removing token:', error);
    }
  },

  async getUserData(): Promise<User | null> {
    try {
      // Try to find user-specific storage first
      const allKeys = await AsyncStorage.getAllKeys();
      const userDataKey = allKeys.find(key => key.includes('@aether_user_data_') && !key.includes('_temp'));
      
      if (userDataKey) {
        const userData = await AsyncStorage.getItem(userDataKey);
        return userData ? JSON.parse(userData) : null;
      }
      
      // Fallback to temp storage
      const tempKeys = getStorageKeys();
      const userData = await AsyncStorage.getItem(tempKeys.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      logger.error('Error getting user data:', error);
      return null;
    }
  },

  async setUserData(userData: User): Promise<void> {
    try {
      const userId = userData?.id;
      
      if (!userId) {
        logger.warn('User data missing ID, storing in temp location:', userData);
        // Store in temp location if no user ID
        const tempKeys = getStorageKeys();
        await AsyncStorage.setItem(tempKeys.USER_DATA, JSON.stringify(userData));
        return;
      }
      
      const keys = getStorageKeys(userId);
      
      // Store in user-specific location
      await AsyncStorage.setItem(keys.USER_DATA, JSON.stringify(userData));
      
      // Clean up any temp storage
      const tempKeys = getStorageKeys();
      await AsyncStorage.removeItem(tempKeys.USER_DATA);
    } catch (error) {
      logger.error('Error setting user data:', error);
    }
  },
};