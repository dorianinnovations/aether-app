/**
 * Spotify API Endpoints
 * Spotify integration, OAuth, status tracking, and music sharing
 */

import { api } from '../core/client';

export const SpotifyAPI = {
  // Get Spotify authorization URL
  async getAuthUrl(): Promise<any> {
    try {
      const response = await api.get('/spotify/auth?platform=mobile');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Handle mobile OAuth callback
  async handleMobileCallback(code: string, state: string): Promise<any> {
    try {
      const response = await api.post('/spotify/mobile-callback', {
        code,
        state
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Disconnect Spotify
  async disconnect(): Promise<any> {
    try {
      const response = await api.post('/spotify/disconnect');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get Spotify status
  async getStatus(): Promise<any> {
    try {
      const response = await api.get('/spotify/status');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Refresh Spotify data
  async refresh(): Promise<any> {
    try {
      const response = await api.post('/spotify/refresh');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Share track
  async shareTrack(trackName: string, artist: string, album?: string, imageUrl?: string, spotifyUrl?: string, message?: string): Promise<any> {
    try {
      const response = await api.post('/spotify/share-track', {
        trackName,
        artist,
        album,
        imageUrl,
        spotifyUrl,
        message
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get live Spotify status for a friend
  async getLiveStatus(username: string): Promise<any> {
    try {
      const response = await api.get(`/spotify/live-status/${username}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get user's top tracks from Spotify
  async getTopTracks(timeRange: 'short_term' | 'medium_term' | 'long_term' = 'short_term', limit: number = 10): Promise<any> {
    try {
      const response = await api.get('/spotify/top-tracks', {
        params: {
          time_range: timeRange,
          limit
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};