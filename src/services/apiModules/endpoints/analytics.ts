/**
 * Analytics API Endpoints
 * User statistics, listening insights, and engagement analytics
 */

import { makeRequest } from '../utils/request';
import type { StandardAPIResponse } from '../core/types';

export interface UserAnalyticsOverview {
  totalListeningTime: number;
  totalArtistsFollowed: number;
  totalInteractions: number;
  favoriteGenres: string[];
  topArtists: Array<{
    artistId: string;
    name: string;
    listeningTime: number;
    interactionCount: number;
  }>;
  discoveryStats: {
    newArtistsDiscovered: number;
    recommendationsAccepted: number;
    discoveryRate: number;
  };
  engagementMetrics: {
    dailyActiveStreak: number;
    averageSessionTime: number;
    contentEngagementRate: number;
  };
}

export interface ArtistAnalytics {
  artistId: string;
  artistName: string;
  totalListeningTime: number;
  totalInteractions: number;
  firstDiscovered: string;
  lastActivity: string;
  listeningPattern: Array<{
    date: string;
    duration: number;
    interactionCount: number;
  }>;
  topTracks?: Array<{
    trackId: string;
    trackName: string;
    playCount: number;
    duration: number;
  }>;
  engagementTypes: {
    releases: number;
    news: number;
    tours: number;
    social: number;
  };
}

export interface GenreAnalytics {
  genre: string;
  listeningTime: number;
  artistCount: number;
  interactionCount: number;
  trendDirection: 'up' | 'down' | 'stable';
  subgenres?: Array<{
    name: string;
    percentage: number;
  }>;
  topArtists: Array<{
    artistId: string;
    name: string;
    listeningTime: number;
  }>;
}

export interface DiscoveryAnalytics {
  totalDiscovered: number;
  discoveryRate: number;
  discoveryMethods: Array<{
    method: 'recommendation' | 'search' | 'social' | 'playlist' | 'radio';
    count: number;
    percentage: number;
  }>;
  retentionRate: number;
  averageTimeToFollow: number;
  discoveryTrends: Array<{
    date: string;
    discovered: number;
    retained: number;
  }>;
}

export interface ListeningAnalytics {
  totalTime: number;
  averageSessionTime: number;
  peakListeningHours: Array<{
    hour: number;
    duration: number;
    count: number;
  }>;
  weeklyPattern: Array<{
    day: string;
    duration: number;
    sessions: number;
  }>;
  deviceBreakdown?: Array<{
    device: string;
    duration: number;
    percentage: number;
  }>;
  timeOfDayPreferences: {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
  };
}

export interface EngagementAnalytics {
  totalInteractions: number;
  engagementRate: number;
  interactionTypes: Array<{
    type: 'view' | 'like' | 'share' | 'save' | 'follow' | 'dismiss';
    count: number;
    percentage: number;
  }>;
  contentEngagement: Array<{
    contentType: 'release' | 'news' | 'tour' | 'social';
    engagementRate: number;
    totalInteractions: number;
  }>;
  engagementTrends: Array<{
    date: string;
    interactions: number;
    engagementRate: number;
  }>;
}

export interface TasteProfile {
  primaryGenres: string[];
  secondaryGenres: string[];
  moodPreferences: string[];
  artistDiversity: number;
  explorationRate: number;
  tasteMaturity: 'emerging' | 'developing' | 'established' | 'expert';
  preferenceStrength: {
    genre: number;
    artist: number;
    mood: number;
    era: number;
  };
  recommendations: {
    accuracy: number;
    acceptanceRate: number;
    feedbackScore: number;
  };
}

export interface PersonalizedInsights {
  insights: Array<{
    id: string;
    type: 'discovery' | 'behavior' | 'preference' | 'achievement';
    title: string;
    description: string;
    data?: any;
    actionable?: boolean;
    priority: 'low' | 'medium' | 'high';
    generatedAt: string;
  }>;
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    unlockedAt: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  }>;
  recommendations: Array<{
    type: 'artist' | 'genre' | 'playlist' | 'event';
    title: string;
    reason: string;
    data: any;
    confidence: number;
  }>;
}

export interface AnalyticsExportData {
  exportId: string;
  format: 'json' | 'csv' | 'pdf';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  generatedAt: string;
  expiresAt: string;
  dataTypes: string[];
}

export interface InteractionTrackingData {
  type: 'artist_view' | 'artist_follow' | 'content_view' | 'content_interact' | 'search' | 'discovery';
  entityId: string;
  entityType: 'artist' | 'content' | 'genre' | 'search_query';
  context?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export const AnalyticsAPI = {
  // Overview Analytics
  async getOverview(timeRange?: '7d' | '30d' | '90d' | '1y'): Promise<StandardAPIResponse<UserAnalyticsOverview>> {
    const queryParams = timeRange ? `?timeRange=${timeRange}` : '';
    return await makeRequest<UserAnalyticsOverview>('GET', `/analytics/overview${queryParams}`);
  },

  // Detailed Analytics
  async getArtistAnalytics(timeRange?: '7d' | '30d' | '90d' | '1y'): Promise<StandardAPIResponse<ArtistAnalytics[]>> {
    const queryParams = timeRange ? `?timeRange=${timeRange}` : '';
    return await makeRequest<ArtistAnalytics[]>('GET', `/analytics/artists${queryParams}`);
  },

  async getDiscoveryAnalytics(timeRange?: '7d' | '30d' | '90d' | '1y'): Promise<StandardAPIResponse<DiscoveryAnalytics>> {
    const queryParams = timeRange ? `?timeRange=${timeRange}` : '';
    return await makeRequest<DiscoveryAnalytics>('GET', `/analytics/discovery${queryParams}`);
  },

  async getListeningAnalytics(timeRange?: '7d' | '30d' | '90d' | '1y'): Promise<StandardAPIResponse<ListeningAnalytics>> {
    const queryParams = timeRange ? `?timeRange=${timeRange}` : '';
    return await makeRequest<ListeningAnalytics>('GET', `/analytics/listening${queryParams}`);
  },

  async getEngagementAnalytics(timeRange?: '7d' | '30d' | '90d' | '1y'): Promise<StandardAPIResponse<EngagementAnalytics>> {
    const queryParams = timeRange ? `?timeRange=${timeRange}` : '';
    return await makeRequest<EngagementAnalytics>('GET', `/analytics/engagement${queryParams}`);
  },

  async getGenreAnalytics(timeRange?: '7d' | '30d' | '90d' | '1y'): Promise<StandardAPIResponse<GenreAnalytics[]>> {
    const queryParams = timeRange ? `?timeRange=${timeRange}` : '';
    return await makeRequest<GenreAnalytics[]>('GET', `/analytics/genres${queryParams}`);
  },

  // Advanced Analytics
  async getTasteProfile(): Promise<StandardAPIResponse<TasteProfile>> {
    return await makeRequest<TasteProfile>('GET', '/analytics/taste-profile');
  },

  async getPersonalizedInsights(): Promise<StandardAPIResponse<PersonalizedInsights>> {
    return await makeRequest<PersonalizedInsights>('GET', '/analytics/insights');
  },

  // Interaction Tracking
  async trackInteraction(interaction: InteractionTrackingData): Promise<StandardAPIResponse<void>> {
    return await makeRequest<void>('POST', '/analytics/track', interaction);
  },

  // Data Export
  async exportData(
    dataTypes: string[], 
    format: 'json' | 'csv' | 'pdf' = 'json',
    timeRange?: string
  ): Promise<StandardAPIResponse<AnalyticsExportData>> {
    return await makeRequest<AnalyticsExportData>('POST', '/analytics/export', {
      dataTypes,
      format,
      timeRange
    });
  },

  // Recalculation
  async recalculateAnalytics(): Promise<StandardAPIResponse<void>> {
    return await makeRequest<void>('POST', '/analytics/recalculate');
  },

  // Utility Methods
  async getQuickStats(): Promise<{
    totalListeningTime: number;
    artistsFollowed: number;
    newDiscoveries: number;
    engagementRate: number;
  }> {
    try {
      const response = await this.getOverview('30d');
      if (response.success && response.data) {
        const data = response.data;
        return {
          totalListeningTime: data.totalListeningTime,
          artistsFollowed: data.totalArtistsFollowed,
          newDiscoveries: data.discoveryStats.newArtistsDiscovered,
          engagementRate: data.engagementMetrics.contentEngagementRate
        };
      }
      return {
        totalListeningTime: 0,
        artistsFollowed: 0,
        newDiscoveries: 0,
        engagementRate: 0
      };
    } catch (error) {
      console.error('Error getting quick stats:', error);
      return {
        totalListeningTime: 0,
        artistsFollowed: 0,
        newDiscoveries: 0,
        engagementRate: 0
      };
    }
  },

  async getTopGenres(limit: number = 5): Promise<string[]> {
    try {
      const response = await this.getOverview('30d');
      if (response.success && response.data) {
        return response.data.favoriteGenres.slice(0, limit);
      }
      return [];
    } catch (error) {
      console.error('Error getting top genres:', error);
      return [];
    }
  },

  async getListeningStreak(): Promise<number> {
    try {
      const response = await this.getOverview();
      if (response.success && response.data) {
        return response.data.engagementMetrics.dailyActiveStreak;
      }
      return 0;
    } catch (error) {
      console.error('Error getting listening streak:', error);
      return 0;
    }
  }
};