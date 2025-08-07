/**
 * Social Proxy API Endpoints
 * Social platform integration, timeline, reactions, and activities
 */

import { api } from '../core/client';
import { logger } from '../../../utils/logger';

export const SocialProxyAPI = {
  // Get user's social proxy profile
  async getProfile(): Promise<any> {
    try {
      const response = await api.get('/social-proxy/profile');
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch social proxy profile:', error);
      throw error;
    }
  },

  // Update social proxy status
  async updateStatus(currentStatus?: string, currentPlans?: string, mood?: string): Promise<any> {
    try {
      const response = await api.post('/social-proxy/status', {
        currentStatus,
        currentPlans,
        mood
      });
      return response.data;
    } catch (error) {
      logger.error('Failed to update social proxy status:', error);
      throw error;
    }
  },

  // Get friend timeline
  async getTimeline(page: number = 1, limit: number = 20): Promise<any> {
    try {
      const response = await api.get('/social-proxy/timeline', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch timeline:', error);
      throw error;
    }
  },

  // Get friend's social proxy
  async getFriendProfile(username: string): Promise<any> {
    try {
      const response = await api.get(`/social-proxy/friend/${username}`);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch friend profile:', error);
      throw error;
    }
  },

  // React to activity
  async reactToActivity(activityId: string, type: 'like' | 'love' | 'laugh' | 'curious' | 'relate'): Promise<any> {
    try {
      const response = await api.post(`/social-proxy/activity/${activityId}/react`, { type });
      return response.data;
    } catch (error) {
      logger.error('Failed to react to activity:', error);
      throw error;
    }
  },

  // Comment on activity
  async commentOnActivity(activityId: string, text: string): Promise<any> {
    try {
      const response = await api.post(`/social-proxy/activity/${activityId}/comment`, { text });
      return response.data;
    } catch (error) {
      logger.error('Failed to comment on activity:', error);
      throw error;
    }
  },

  // Create a new post
  async createPost(text: string, visibility: 'public' | 'friends' | 'private' = 'friends'): Promise<any> {
    try {
      const response = await api.post('/social-proxy/posts', { text, visibility });
      return response.data;
    } catch (error) {
      logger.error('Failed to create post:', error);
      throw error;
    }
  },

  // Delete a post
  async deletePost(postId: string): Promise<any> {
    try {
      const response = await api.delete(`/social-proxy/posts/${postId}`);
      return response.data;
    } catch (error) {
      logger.error('Failed to delete post:', error);
      throw error;
    }
  }
};