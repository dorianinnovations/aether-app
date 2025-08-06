/**
 * Conversation API Endpoints
 * Chat history, conversation management, and synchronization
 */

import { api } from '../core/client';
import { ChatAPI } from './chat';

export const ConversationAPI = {
  async getRecentConversations(limit: number = 20): Promise<any> {
    const response = await api.get(`/conversation/conversations/recent?limit=${limit}`);
    
    // Handle different possible response formats from Aether API
    let conversations = [];
    let total = 0;
    
    if (response.data.success && response.data.data) {
      // Format: { success: true, data: [...] }
      conversations = Array.isArray(response.data.data) ? response.data.data : [];
      total = response.data.total || conversations.length;
    } else if (Array.isArray(response.data.data)) {
      // Format: { data: [...] }
      conversations = response.data.data;
      total = response.data.total || conversations.length;
    } else if (Array.isArray(response.data)) {
      // Format: [...]
      conversations = response.data;
      total = conversations.length;
    } else {
      // Fallback - try to extract from data field
      conversations = response.data.conversations || response.data.data || [];
      total = response.data.total || conversations.length;
    }
    
    return {
      conversations,
      total
    };
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

  async syncConversations(conversations?: any[], lastSyncTime?: string): Promise<any> {
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

  async addMessageToConversation(conversationId: string, message: any): Promise<any> {
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

  // Debug function to directly query conversations with full response logging
  async debugConversations(): Promise<any> {
    console.log('DEBUG: Making direct API call to /conversation/conversations/recent');
    try {
      const response = await api.get('/conversation/conversations/recent?limit=20');
      console.log('DEBUG: Full API response:', JSON.stringify(response.data, null, 2));
      console.log('DEBUG: Response status:', response.status);
      console.log('DEBUG: Response headers:', response.headers);
      return response.data;
    } catch (error: any) {
      console.log('DEBUG: API call failed:', error);
      console.log('DEBUG: Error response:', error.response?.data);
      console.log('DEBUG: Error status:', error.response?.status);
      throw error;
    }
  },

  // Debug function to test conversation creation
  async debugCreateTestConversation(): Promise<any> {
    console.log('DEBUG: Attempting to create a test conversation');
    try {
      // First try to send a test message which should create a conversation
      const testMessage = await ChatAPI.socialChat('Hello, this is a test message to create a conversation.');
      console.log('DEBUG: Test message sent:', testMessage);
      
      // Then try to get conversations again
      const conversations = await this.debugConversations();
      return conversations;
    } catch (error: any) {
      console.log('DEBUG: Failed to create test conversation:', error);
      throw error;
    }
  },
};