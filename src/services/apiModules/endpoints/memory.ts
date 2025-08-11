/**
 * Memory API Endpoints
 * RAG memory system for music preferences and learning
 */

import { makeRequest } from '../utils/request';
import type { StandardAPIResponse } from '../core/types';

export interface MemoryItem {
  id: string;
  userId: string;
  content: string;
  type: 'preference' | 'interaction' | 'discovery' | 'feedback' | 'context';
  category?: 'artist' | 'genre' | 'mood' | 'behavior' | 'social';
  metadata?: {
    artistId?: string;
    genre?: string;
    confidence?: number;
    source?: string;
    timestamp?: string;
    context?: string;
  };
  embedding?: number[];
  relevanceScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MemorySearchParams {
  query: string;
  type?: MemoryItem['type'];
  category?: MemoryItem['category'];
  limit?: number;
  threshold?: number;
  includeEmbeddings?: boolean;
}

export interface MemorySearchResult {
  items: MemoryItem[];
  totalCount: number;
  searchTime: number;
  similarityScores: number[];
}

export interface MemoryStats {
  totalItems: number;
  typeBreakdown: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  averageConfidence: number;
  oldestItem: string;
  newestItem: string;
  storageSize: number;
}

export interface PreferencePattern {
  pattern: string;
  confidence: number;
  examples: string[];
  relatedPreferences: string[];
  strength: 'weak' | 'moderate' | 'strong';
  category: 'artist' | 'genre' | 'mood' | 'behavior';
  lastReinforced: string;
}

export interface UserPreferences {
  musicTaste: {
    favoriteGenres: string[];
    dislikedGenres: string[];
    artistPreferences: Array<{
      artistId: string;
      name: string;
      preference: 'love' | 'like' | 'neutral' | 'dislike';
      confidence: number;
    }>;
    moodPreferences: string[];
  };
  behaviorPatterns: Array<{
    pattern: string;
    frequency: number;
    confidence: number;
    context?: string;
  }>;
  discoveryPreferences: {
    preferredSources: string[];
    openness: number;
    riskTolerance: 'conservative' | 'moderate' | 'adventurous';
  };
  contextualPreferences: Array<{
    context: string;
    preferences: string[];
    confidence: number;
  }>;
}

export interface ConversationContext {
  conversationId: string;
  relevantMemories: MemoryItem[];
  contextSummary: string;
  keyTopics: string[];
  userMood?: string;
  conversationType: 'discovery' | 'recommendation' | 'analysis' | 'casual';
}

export const MemoryAPI = {
  // Memory Storage
  async storeMemory(
    content: string,
    type: MemoryItem['type'],
    category?: MemoryItem['category'],
    metadata?: MemoryItem['metadata']
  ): Promise<StandardAPIResponse<MemoryItem>> {
    return await makeRequest<MemoryItem>('POST', '/memory/store', {
      content,
      type,
      category,
      metadata
    });
  },

  async storeBatch(memories: Array<{
    content: string;
    type: MemoryItem['type'];
    category?: MemoryItem['category'];
    metadata?: MemoryItem['metadata'];
  }>): Promise<StandardAPIResponse<MemoryItem[]>> {
    return await makeRequest<MemoryItem[]>('POST', '/memory/store-batch', { memories });
  },

  // Memory Search & Retrieval
  async searchMemories(params: MemorySearchParams): Promise<StandardAPIResponse<MemorySearchResult>> {
    return await makeRequest<MemorySearchResult>('POST', '/memory/search', params);
  },

  async getMemoryById(memoryId: string): Promise<StandardAPIResponse<MemoryItem>> {
    return await makeRequest<MemoryItem>('GET', `/memory/item/${memoryId}`);
  },

  async getMemoriesByType(
    type: MemoryItem['type'], 
    limit?: number
  ): Promise<StandardAPIResponse<MemoryItem[]>> {
    const queryParams = limit ? `?limit=${limit}` : '';
    return await makeRequest<MemoryItem[]>('GET', `/memory/type/${type}${queryParams}`);
  },

  async getMemoriesByCategory(
    category: MemoryItem['category'], 
    limit?: number
  ): Promise<StandardAPIResponse<MemoryItem[]>> {
    const queryParams = limit ? `?limit=${limit}` : '';
    return await makeRequest<MemoryItem[]>('GET', `/memory/category/${category}${queryParams}`);
  },

  // Memory Analytics
  async getMemoryStats(): Promise<StandardAPIResponse<MemoryStats>> {
    return await makeRequest<MemoryStats>('GET', '/memory/stats');
  },

  async getUserPreferences(): Promise<StandardAPIResponse<UserPreferences>> {
    return await makeRequest<UserPreferences>('GET', '/memory/preferences');
  },

  async getPreferencePatterns(): Promise<StandardAPIResponse<PreferencePattern[]>> {
    return await makeRequest<PreferencePattern[]>('GET', '/memory/patterns');
  },

  // Conversation Context
  async getConversationContext(conversationId: string): Promise<StandardAPIResponse<ConversationContext>> {
    return await makeRequest<ConversationContext>('GET', `/memory/conversation/${conversationId}/context`);
  },

  async autoStoreConversation(
    conversationId: string,
    messages?: any[]
  ): Promise<StandardAPIResponse<MemoryItem[]>> {
    return await makeRequest<MemoryItem[]>('POST', `/memory/auto-store/${conversationId}`, {
      messages
    });
  },

  // Memory Management
  async updateMemory(
    memoryId: string,
    updates: Partial<Pick<MemoryItem, 'content' | 'metadata' | 'type' | 'category'>>
  ): Promise<StandardAPIResponse<MemoryItem>> {
    return await makeRequest<MemoryItem>('PUT', `/memory/item/${memoryId}`, updates);
  },

  async deleteMemory(memoryId: string): Promise<StandardAPIResponse<void>> {
    return await makeRequest<void>('DELETE', `/memory/item/${memoryId}`);
  },

  async clearMemories(
    filter?: { type?: string; category?: string; olderThan?: string }
  ): Promise<StandardAPIResponse<{ deletedCount: number }>> {
    return await makeRequest<{ deletedCount: number }>('DELETE', '/memory/clear', filter);
  },

  // Utility Methods
  async findSimilarPreferences(
    preference: string,
    limit: number = 5
  ): Promise<MemoryItem[]> {
    try {
      const response = await this.searchMemories({
        query: preference,
        type: 'preference',
        limit,
        threshold: 0.7
      });
      return response.success && response.data ? response.data.items : [];
    } catch (error) {
      console.error('Error finding similar preferences:', error);
      return [];
    }
  },

  async getRecentInteractions(limit: number = 10): Promise<MemoryItem[]> {
    try {
      const response = await this.getMemoriesByType('interaction', limit);
      return response.success && response.data ? response.data : [];
    } catch (error) {
      console.error('Error getting recent interactions:', error);
      return [];
    }
  },

  async getDiscoveryHistory(limit: number = 20): Promise<MemoryItem[]> {
    try {
      const response = await this.getMemoriesByType('discovery', limit);
      return response.success && response.data ? response.data : [];
    } catch (error) {
      console.error('Error getting discovery history:', error);
      return [];
    }
  },

  async storeUserFeedback(
    content: string,
    context?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await this.storeMemory(content, 'feedback', 'behavior', {
        ...metadata,
        context,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error storing user feedback:', error);
    }
  },

  async storeArtistInteraction(
    artistId: string,
    artistName: string,
    interactionType: string,
    context?: string
  ): Promise<void> {
    try {
      const content = `${interactionType} ${artistName}`;
      await this.storeMemory(content, 'interaction', 'artist', {
        artistId,
        source: interactionType,
        context,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error storing artist interaction:', error);
    }
  },

  async reinforcePreference(
    preference: string,
    category: MemoryItem['category'] = 'artist'
  ): Promise<void> {
    try {
      // Search for existing similar preferences
      const similar = await this.findSimilarPreferences(preference, 1);
      
      if (similar.length > 0) {
        // Update existing preference with higher confidence
        const existing = similar[0];
        await this.updateMemory(existing.id, {
          metadata: {
            ...existing.metadata,
            confidence: Math.min((existing.metadata?.confidence || 0.5) + 0.1, 1.0),
            timestamp: new Date().toISOString()
          }
        });
      } else {
        // Create new preference
        await this.storeMemory(preference, 'preference', category, {
          confidence: 0.7,
          source: 'reinforcement',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error reinforcing preference:', error);
    }
  }
};