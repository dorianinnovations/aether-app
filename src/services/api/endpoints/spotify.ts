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
      console.error('Failed to get Spotify auth URL:', error);
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
      console.error('Failed to handle mobile callback:', error);
      throw error;
    }
  },

  // Disconnect Spotify
  async disconnect(): Promise<any> {
    try {
      const response = await api.post('/spotify/disconnect');
      return response.data;
    } catch (error) {
      console.error('Failed to disconnect Spotify:', error);
      throw error;
    }
  },

  // Get Spotify status
  async getStatus(): Promise<any> {
    try {
      const response = await api.get('/spotify/status');
      return response.data;
    } catch (error) {
      console.error('Failed to get Spotify status:', error);
      throw error;
    }
  },

  // Refresh Spotify data
  async refresh(): Promise<any> {
    try {
      const response = await api.post('/spotify/refresh');
      return response.data;
    } catch (error) {
      console.error('Failed to refresh Spotify data:', error);
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
      console.error('Failed to share track:', error);
      throw error;
    }
  },

  // Get live Spotify status for a friend
  async getLiveStatus(username: string): Promise<any> {
    try {
      const response = await api.get(`/spotify/live-status/${username}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get live Spotify status:', error);
      throw error;
    }
  }
};