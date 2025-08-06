/**
 * Base API Request Methods
 * Standardized request handling with error management
 */

import { AxiosRequestConfig } from 'axios';
import { api } from '../core/client';
import { StandardAPIResponse } from '../core/types';
import { handleError } from '../../../utils/errorHandler';

/**
 * Base API request method with standardized error handling
 */
export const makeRequest = async <T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  endpoint: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<StandardAPIResponse<T>> => {
  try {
    const response = await api.request({
      method,
      url: endpoint,
      data,
      ...config
    });
    
    return response.data;
  } catch (error: any) {
    // Use unified error handler for consistent error responses
    const standardResponse = handleError(error, {
      endpoint,
      method,
      requestData: data,
      timestamp: new Date().toISOString()
    });
    
    // Re-throw enhanced error for backward compatibility with existing error handling
    throw error;
  }
};

// Utility functions for API interactions
export const ApiUtils = {
  isNetworkError: (error: any): boolean => {
    return !error.response && error.request;
  },

  isServerError: (error: any): boolean => {
    return error.response && error.response.status >= 500;
  },

  isClientError: (error: any): boolean => {
    return error.response && error.response.status >= 400 && error.response.status < 500;
  },

  getErrorMessage: (error: any): string => {
    if (error.message) return error.message;
    if (error.response?.data?.message) return error.response.data.message;
    if (error.request) return 'Network error - please check your connection';
    return 'An unexpected error occurred';
  },

  // Conversation API utility functions (moved from original api.ts)
  async getRecentConversations(limit: number = 20, page: number = 1): Promise<any> {
    try {
      const response = await api.get('/conversation/conversations/recent', {
        params: { limit, page }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch recent conversations:', error);
      throw error;
    }
  },

  async deleteConversation(conversationId: string): Promise<any> {
    try {
      const response = await api.delete(`/conversation/conversations/${conversationId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      throw error;
    }
  },

  async deleteAllConversations(): Promise<any> {
    try {
      const response = await api.delete('/conversation/conversations/all');
      return response.data;
    } catch (error) {
      console.error('Failed to delete all conversations:', error);
      throw error;
    }
  },

  async getConversation(conversationId: string, messageLimit: number = 500): Promise<any> {
    try {
      const response = await api.get(`/conversation/conversations/${conversationId}`, {
        params: { messageLimit }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch conversation:', error);
      throw error;
    }
  },
};