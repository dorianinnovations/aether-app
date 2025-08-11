/**
 * Artist Discovery API Endpoints
 * Artist search, following, discovery, and management
 */

import { makeRequest } from '../utils/request';
import type { StandardAPIResponse } from '../core/types';

export interface Artist {
  id: string;
  name: string;
  genre?: string[];
  image?: string;
  spotifyId?: string;
  lastfmUrl?: string;
  bio?: string;
  followers?: number;
  verified?: boolean;
}

export interface ArtistDetails extends Artist {
  albums?: any[];
  topTracks?: any[];
  relatedArtists?: Artist[];
  upcomingEvents?: any[];
  recentNews?: any[];
  socialMedia?: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
}

export interface Following {
  id: string;
  userId: string;
  artistId: string;
  artist: Artist;
  notificationPreferences: {
    releases: boolean;
    news: boolean;
    tours: boolean;
    social: boolean;
  };
  priority: 'low' | 'medium' | 'high';
  followedAt: string;
}

export interface ArtistUpdate {
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
}

export interface ArtistSearchParams {
  q: string;
  limit?: number;
  offset?: number;
  genre?: string;
  verified?: boolean;
}

export interface ArtistDiscoveryParams {
  limit?: number;
  genre?: string;
  based_on?: 'listening_history' | 'followed_artists' | 'preferences';
  exclude_followed?: boolean;
}

export const ArtistAPI = {
  // Artist Search & Discovery
  async searchArtists(params: ArtistSearchParams): Promise<StandardAPIResponse<Artist[]>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    return await makeRequest<Artist[]>('GET', `/artists/search?${queryParams.toString()}`);
  },

  async discoverArtists(params?: ArtistDiscoveryParams): Promise<StandardAPIResponse<Artist[]>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    return await makeRequest<Artist[]>('GET', `/artists/discover?${queryParams.toString()}`);
  },

  async getArtistDetails(artistId: string): Promise<StandardAPIResponse<ArtistDetails>> {
    return await makeRequest<ArtistDetails>('GET', `/artists/${artistId}/details`);
  },

  async getArtistUpdates(artistId: string, limit?: number): Promise<StandardAPIResponse<ArtistUpdate[]>> {
    const queryParams = limit ? `?limit=${limit}` : '';
    return await makeRequest<ArtistUpdate[]>('GET', `/artists/${artistId}/updates${queryParams}`);
  },

  // Following Management
  async followArtist(artistId: string, notificationPreferences?: Following['notificationPreferences']): Promise<StandardAPIResponse<Following>> {
    return await makeRequest<Following>('POST', '/artists/follow', {
      artistId,
      notificationPreferences: notificationPreferences || {
        releases: true,
        news: true,
        tours: true,
        social: false
      }
    });
  },

  async unfollowArtist(artistId: string): Promise<StandardAPIResponse<void>> {
    return await makeRequest<void>('DELETE', '/artists/unfollow', { artistId });
  },

  async getFollowedArtists(): Promise<StandardAPIResponse<Following[]>> {
    return await makeRequest<Following[]>('GET', '/artists/following');
  },

  async updateNotificationPreferences(
    artistId: string, 
    preferences: Following['notificationPreferences']
  ): Promise<StandardAPIResponse<Following>> {
    return await makeRequest<Following>('PUT', `/artists/${artistId}/notifications`, {
      notificationPreferences: preferences
    });
  },

  async updateArtistPriority(
    artistId: string, 
    priority: Following['priority']
  ): Promise<StandardAPIResponse<Following>> {
    return await makeRequest<Following>('PUT', `/artists/${artistId}/priority`, { priority });
  },

  // Artist Information
  async getArtistsByGenre(genre: string, limit?: number): Promise<StandardAPIResponse<Artist[]>> {
    const queryParams = new URLSearchParams({ genre });
    if (limit) queryParams.append('limit', limit.toString());
    
    return await makeRequest<Artist[]>('GET', `/artists/search?${queryParams.toString()}`);
  },

  async getTrendingArtists(genre?: string, limit?: number): Promise<StandardAPIResponse<Artist[]>> {
    const queryParams = new URLSearchParams();
    if (genre) queryParams.append('genre', genre);
    if (limit) queryParams.append('limit', limit.toString());
    
    return await makeRequest<Artist[]>('GET', `/artists/trending?${queryParams.toString()}`);
  },

  // Utility Methods
  async isFollowingArtist(artistId: string): Promise<boolean> {
    try {
      const response = await this.getFollowedArtists();
      if (response.success && response.data) {
        return response.data.some(following => following.artistId === artistId);
      }
      return false;
    } catch (error) {
      console.error('Error checking if following artist:', error);
      return false;
    }
  },

  async getFollowingCount(): Promise<number> {
    try {
      const response = await this.getFollowedArtists();
      return response.success && response.data ? response.data.length : 0;
    } catch (error) {
      console.error('Error getting following count:', error);
      return 0;
    }
  }
};