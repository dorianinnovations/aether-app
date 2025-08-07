/**
 * Authentication Interceptors and Token Management
 * Request/response interceptors for token handling and auth refresh
 */

import { AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './client';
import { TokenManager } from '../utils/storage';
import { transformResponse, createEnhancedError } from './errors';

// Setup request interceptor - Add auth token
api.interceptors.request.use(
  async (config: any) => {
    const token = await TokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Request logging can be enabled for debugging if needed
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Setup response interceptor - Standardized error handling and token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Don't auto-transform responses - let endpoints handle their own response format
    // The automatic transformation was causing data corruption
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    
    // Handle unauthorized - attempt token refresh first, but NOT for auth endpoints
    if (error.response?.status === 401 && !originalRequest._retry && 
        !originalRequest.url?.includes('/auth/login') && 
        !originalRequest.url?.includes('/auth/signup') &&
        !originalRequest.url?.includes('/auth/refresh')) {
      originalRequest._retry = true;
      
      try {
        // Get refresh token from storage directly to avoid circular dependency
        const refreshToken = await AsyncStorage.getItem('@aether_refresh_token');
        if (refreshToken) {
          const refreshResponse = await api.post('/auth/refresh', { refreshToken });
          if (refreshResponse.data?.success && refreshResponse.data?.data?.token) {
            await TokenManager.setToken(refreshResponse.data.data.token);
            if (refreshResponse.data.data.refreshToken) {
              await AsyncStorage.setItem('@aether_refresh_token', refreshResponse.data.data.refreshToken);
            }
            originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.data.token}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        // Only remove token if this is a critical endpoint, not for optional requests
        if (!originalRequest.url?.includes('/conversations') && !originalRequest.url?.includes('/socket.io')) {
          await TokenManager.removeToken();
        }
        // Navigation to login should be handled by the app
      }
    }

    const enhancedError = createEnhancedError(error, originalRequest);
    return Promise.reject(enhancedError);
  }
);