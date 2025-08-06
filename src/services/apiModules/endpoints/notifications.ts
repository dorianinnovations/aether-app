/**
 * Notifications API Endpoints
 * Real-time notification streaming and testing
 */

import { api } from '../core/client';

export const NotificationsAPI = {
  // Create SSE connection for real-time notifications
  async createNotificationStream(): Promise<any> {
    // Use the NotificationStream service for React Native compatibility
    const { NotificationStream } = await import('../../NotificationStream');
    return NotificationStream;
  },

  // Get notification service stats
  async getStats(): Promise<any> {
    try {
      const response = await api.get('/notifications/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to get notification stats:', error);
      throw error;
    }
  },

  // Send test notification (for development)
  async sendTest(type?: string, message?: string, data?: any): Promise<any> {
    try {
      const response = await api.post('/notifications/test', {
        type,
        message,
        data
      });
      return response.data;
    } catch (error) {
      console.error('Failed to send test notification:', error);
      throw error;
    }
  }
};