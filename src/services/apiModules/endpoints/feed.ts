/**
 * Artist Feed API Endpoints
 * Personalized artist timeline, releases, news, and content feeds
 */

import { makeRequest } from '../utils/request';
import type { StandardAPIResponse } from '../core/types';
import type { Artist, ArtistUpdate } from './artists';

export interface FeedItem extends ArtistUpdate {
  id: string;
  artistId: string;
  artist: Artist;
  type: 'release' | 'news' | 'tour' | 'social';
  title: string;
  content: string;
  url?: string;
  imageUrl?: string;
  publishedAt: string;
  source: string;
  viewed?: boolean;
  interacted?: boolean;
  priority: 'low' | 'medium' | 'high';
  engagementScore?: number;
}

export interface FeedPreferences {
  showReleases: boolean;
  showNews: boolean;
  showTours: boolean;
  showSocial: boolean;
  prioritizeFollowedArtists: boolean;
  maxItemsPerDay: number;
  contentLanguage?: string;
  timeRange?: '24h' | '7d' | '30d';
}

export interface FeedStats {
  totalItems: number;
  viewedItems: number;
  interactedItems: number;
  topCategories: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  engagementRate: number;
  averageTimeSpent: number;
}

export interface TrendingContent {
  id: string;
  title: string;
  type: 'artist' | 'release' | 'news' | 'genre';
  data: any;
  trendScore: number;
  timeframe: '1h' | '24h' | '7d';
}

export interface FeedTimelineParams {
  limit?: number;
  offset?: number;
  type?: 'release' | 'news' | 'tour' | 'social';
  artistId?: string;
  since?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface InteractionData {
  type: 'view' | 'like' | 'share' | 'save' | 'dismiss';
  duration?: number;
  context?: string;
}

export const FeedAPI = {
  // Main Feed Content
  async getTimeline(params?: FeedTimelineParams): Promise<StandardAPIResponse<FeedItem[]>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    return await makeRequest<FeedItem[]>('GET', `/feed/timeline?${queryParams.toString()}`);
  },

  async getReleases(limit?: number, since?: string): Promise<StandardAPIResponse<FeedItem[]>> {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', limit.toString());
    if (since) queryParams.append('since', since);
    
    return await makeRequest<FeedItem[]>('GET', `/feed/releases?${queryParams.toString()}`);
  },

  async getNews(limit?: number, since?: string): Promise<StandardAPIResponse<FeedItem[]>> {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', limit.toString());
    if (since) queryParams.append('since', since);
    
    return await makeRequest<FeedItem[]>('GET', `/feed/news?${queryParams.toString()}`);
  },

  async getTours(limit?: number, since?: string): Promise<StandardAPIResponse<FeedItem[]>> {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', limit.toString());
    if (since) queryParams.append('since', since);
    
    return await makeRequest<FeedItem[]>('GET', `/feed/tours?${queryParams.toString()}`);
  },

  async getTrendingContent(timeframe?: '1h' | '24h' | '7d'): Promise<StandardAPIResponse<TrendingContent[]>> {
    const queryParams = timeframe ? `?timeframe=${timeframe}` : '';
    return await makeRequest<TrendingContent[]>('GET', `/feed/trending${queryParams}`);
  },

  // Feed Interactions
  async markAsViewed(updateIds: string[]): Promise<StandardAPIResponse<void>> {
    return await makeRequest<void>('POST', '/feed/mark-viewed', { updateIds });
  },

  async interactWithUpdate(updateId: string, interaction: InteractionData): Promise<StandardAPIResponse<void>> {
    return await makeRequest<void>('POST', `/feed/interact/${updateId}`, interaction);
  },

  // Feed Preferences
  async getFeedPreferences(): Promise<StandardAPIResponse<FeedPreferences>> {
    return await makeRequest<FeedPreferences>('GET', '/feed/preferences');
  },

  async updateFeedPreferences(preferences: Partial<FeedPreferences>): Promise<StandardAPIResponse<FeedPreferences>> {
    return await makeRequest<FeedPreferences>('PUT', '/feed/preferences', preferences);
  },

  // Feed Analytics
  async getFeedStats(timeRange?: '7d' | '30d' | '90d'): Promise<StandardAPIResponse<FeedStats>> {
    const queryParams = timeRange ? `?timeRange=${timeRange}` : '';
    return await makeRequest<FeedStats>('GET', `/feed/stats${queryParams}`);
  },

  // Utility Methods
  async getUnviewedCount(): Promise<number> {
    try {
      const response = await this.getTimeline({ limit: 100 });
      if (response.success && response.data) {
        return response.data.filter(item => !item.viewed).length;
      }
      return 0;
    } catch (error) {
      console.error('Error getting unviewed count:', error);
      return 0;
    }
  },

  async getLatestReleases(limit: number = 10): Promise<FeedItem[]> {
    try {
      const response = await this.getReleases(limit);
      return response.success && response.data ? response.data : [];
    } catch (error) {
      console.error('Error getting latest releases:', error);
      return [];
    }
  },

  async getPersonalizedFeed(limit: number = 20): Promise<FeedItem[]> {
    try {
      const response = await this.getTimeline({ limit, priority: 'high' });
      return response.success && response.data ? response.data : [];
    } catch (error) {
      console.error('Error getting personalized feed:', error);
      return [];
    }
  },

  async refreshFeed(): Promise<FeedItem[]> {
    try {
      const response = await this.getTimeline({ 
        limit: 50, 
        since: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Last 24 hours
      });
      return response.success && response.data ? response.data : [];
    } catch (error) {
      console.error('Error refreshing feed:', error);
      return [];
    }
  },

  // Batch Operations
  async batchMarkViewed(items: FeedItem[]): Promise<void> {
    const unviewedIds = items
      .filter(item => !item.viewed)
      .map(item => item.id);
    
    if (unviewedIds.length > 0) {
      await this.markAsViewed(unviewedIds);
    }
  },

  async batchInteract(interactions: Array<{ updateId: string; interaction: InteractionData }>): Promise<void> {
    const promises = interactions.map(({ updateId, interaction }) => 
      this.interactWithUpdate(updateId, interaction)
    );
    
    await Promise.allSettled(promises);
  }
};