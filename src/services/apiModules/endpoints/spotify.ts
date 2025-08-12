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

  // Handle OAuth callback (alias for handleMobileCallback)
  async handleCallback(code: string): Promise<any> {
    try {
      const response = await api.post('/spotify/mobile-callback', {
        code,
        state: 'mobile'
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

  // Get current track (alias for getStatus)
  async getCurrentTrack(): Promise<any> {
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
  },

  // Get artist listening history for heatmap visualization
  async getArtistListeningHistory(artistId: string, days: number = 365): Promise<any> {
    try {
      const response = await api.get(`/spotify/artist-listening-history/${artistId}`, {
        params: {
          days
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Search for tracks, albums, artists
  async search(query: string, type: 'track' | 'album' | 'artist' | 'playlist' = 'track', limit: number = 20): Promise<any> {
    try {
      const response = await api.get('/spotify/search', {
        params: {
          q: query,
          type: type,
          limit
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get user's grails (favorite songs and albums)
  async getGrails(): Promise<any> {
    try {
      const response = await api.get('/spotify/grails');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Save user's grails (favorite songs and albums)
  async saveGrails(grails: any): Promise<any> {
    try {
      console.log('SpotifyAPI.saveGrails: Sending grails data:', JSON.stringify(grails, null, 2));
      console.log('SpotifyAPI.saveGrails: Making request to /spotify/grails');
      
      const response = await api.post('/spotify/grails', grails);
      console.log('SpotifyAPI.saveGrails: Response received:', response.status, response.data);
      return response.data;
    } catch (error: any) {
      console.error('SpotifyAPI.saveGrails: Error occurred:', error);
      if (error.response) {
        console.error('SpotifyAPI.saveGrails: Error response status:', error.response.status);
        console.error('SpotifyAPI.saveGrails: Error response data:', error.response.data);
        console.error('SpotifyAPI.saveGrails: Error response headers:', error.response.headers);
      } else if (error.request) {
        console.error('SpotifyAPI.saveGrails: No response received:', error.request);
      } else {
        console.error('SpotifyAPI.saveGrails: Request setup error:', error.message);
      }
      throw error;
    }
  }
};