/**
 * Conversation API Endpoints
 * Chat history, conversation management, and synchronization
 */

import { api } from '../core/client';
import { ChatAPI } from './chat';

export const ConversationAPI = {
  async getRecentConversations(limit: number = 20): Promise<any> {
    const response = await api.get(`/conversation/conversations/recent?limit=${limit}`);
    return response.data;
  },

  async getConversation(conversationId: string, messageLimit?: number): Promise<any> {
    // Use messageLimit parameter as expected by server (max 500)
    const limit = Math.min(messageLimit || 500, 500); // Respect server max of 500
    const params = `?messageLimit=${limit}`;
    const response = await api.get(`/conversation/conversations/${conversationId}${params}`);
    
    // Handle different response formats
    if (response.data.success && response.data.data) {
      return response.data.data;
    } else if (response.data.data) {
      return response.data.data;
    } else {
      return response.data;
    }
  },

  async createConversation(title?: string): Promise<any> {
    const response = await api.post('/conversation/conversations', { title });
    return response.data;
  },

  async syncConversations(conversations?: unknown[], lastSyncTime?: string): Promise<unknown> {
    const response = await api.post('/conversation/conversations/sync', { 
      conversations,
      lastSyncTime 
    });
    return response.data;
  },

  async updateConversationTitle(conversationId: string, title: string): Promise<any> {
    const response = await api.put(`/conversation/conversations/${conversationId}/title`, { title });
    return response.data;
  },

  async addMessageToConversation(conversationId: string, message: Record<string, unknown>): Promise<unknown> {
    const response = await api.post(`/conversation/conversations/${conversationId}/messages`, message);
    return response.data;
  },

  async searchConversations(query: string, limit: number = 10): Promise<any> {
    const response = await api.get(`/conversation/conversations?search=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data;
  },

  async deleteConversation(conversationId: string): Promise<any> {
    const response = await api.delete(`/conversation/conversations/${conversationId}`);
    return response.data;
  },

  async deleteAllConversations(): Promise<any> {
    const response = await api.delete('/conversation/conversations/all');
    return response.data;
  },

};