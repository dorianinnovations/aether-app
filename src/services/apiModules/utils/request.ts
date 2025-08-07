/**
 * Base API Request Methods
 * Standardized request handling with error management
 */

import { AxiosRequestConfig } from 'axios';
import { api } from '../core/client';
import { StandardAPIResponse } from '../core/types';
import { handleError } from '../../../utils/errorHandler';
import { logger } from '../../../utils/logger';

/**
 * Base API request method with standardized error handling
 */
export const makeRequest = async <T = unknown>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  endpoint: string,
  data?: unknown,
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
  } catch (error: unknown) {
    // Use unified error handler for consistent error responses
    handleError(error, {
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
  isNetworkError: (error: unknown): boolean => {
    return !(error as any).response && (error as any).request;
  },

  isServerError: (error: unknown): boolean => {
    return (error as any).response && (error as any).response.status >= 500;
  },

  isClientError: (error: unknown): boolean => {
    return (error as any).response && (error as any).response.status >= 400 && (error as any).response.status < 500;
  },

  getErrorMessage: (error: unknown): string => {
    if ((error as any).message) return (error as any).message;
    if ((error as any).response?.data?.message) return (error as any).response.data.message;
    if ((error as any).request) return 'Network error - please check your connection';
    return 'An unexpected error occurred';
  },

  // Conversation API utility functions (moved from original api.ts)
  async getRecentConversations(limit: number = 20, page: number = 1): Promise<unknown> {
    try {
      const response = await api.get('/conversation/conversations/recent', {
        params: { limit, page }
      });
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch recent conversations:', error);
      throw error;
    }
  },

  async deleteConversation(conversationId: string): Promise<unknown> {
    try {
      const response = await api.delete(`/conversation/conversations/${conversationId}`);
      return response.data;
    } catch (error) {
      logger.error('Failed to delete conversation:', error);
      throw error;
    }
  },

  async deleteAllConversations(): Promise<unknown> {
    try {
      const response = await api.delete('/conversation/conversations/all');
      return response.data;
    } catch (error) {
      logger.error('Failed to delete all conversations:', error);
      throw error;
    }
  },

  async getConversation(conversationId: string, messageLimit: number = 500): Promise<unknown> {
    try {
      const response = await api.get(`/conversation/conversations/${conversationId}`, {
        params: { messageLimit }
      });
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch conversation:', error);
      throw error;
    }
  },
};