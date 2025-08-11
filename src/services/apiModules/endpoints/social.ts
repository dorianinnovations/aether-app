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
      logger.info('Timeline endpoint not implemented on server, falling back to mock response');
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

  // Note: The following endpoints are not yet implemented on backend:
  // - getFriendProfile
  // - reactToActivity  
  // - commentOnActivity
  // - createPost
  // - deletePost
  // They would need to be added to /routes/social-proxy.js
};