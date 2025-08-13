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
      // Note: Timeline endpoint not yet implemented on server
      // Returning mock success response to prevent 404 errors
      return {
        success: false,
        message: 'Timeline endpoint not available',
        data: []
      };
    } catch (error) {
      logger.error('Failed to fetch timeline:', error);
      throw error;
    }
  },

  // Get friend's profile (placeholder until backend implemented)
  async getFriendProfile(username: string): Promise<any> {
    try {
      logger.info('getFriendProfile endpoint not implemented on server');
      return {
        success: false,
        message: 'getFriendProfile endpoint not available',
        data: null
      };
    } catch (error) {
      logger.error('Failed to fetch friend profile:', error);
      throw error;
    }
  },

  // React to activity (placeholder until backend implemented)
  async reactToActivity(activityId: string, reactionType: string): Promise<any> {
    try {
      logger.info('reactToActivity endpoint not implemented on server');
      return {
        success: false,
        message: 'reactToActivity endpoint not available',
        data: null
      };
    } catch (error) {
      logger.error('Failed to react to activity:', error);
      throw error;
    }
  },

  // Comment on activity (placeholder until backend implemented)
  async commentOnActivity(activityId: string, comment: string): Promise<any> {
    try {
      logger.info('commentOnActivity endpoint not implemented on server');
      return {
        success: false,
        message: 'commentOnActivity endpoint not available',
        data: null
      };
    } catch (error) {
      logger.error('Failed to comment on activity:', error);
      throw error;
    }
  },

  // Note: The following endpoints are also not yet implemented on backend:
  // - createPost
  // - deletePost
  // They would need to be added to /routes/social-proxy.js
};