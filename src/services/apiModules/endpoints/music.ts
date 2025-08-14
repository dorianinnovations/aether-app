/**
 * Music Discovery API Endpoints
 * Connects to the music preferences and discovery system
 */

import { makeRequest } from '../utils/request';

export interface MusicPreferences {
  danceability?: number;
  energy?: number;
  valence?: number;
  tempo?: number;
  acousticness?: number;
  instrumentalness?: number;
  speechiness?: number;
  loudness?: number;
}

export interface DiscoverySettings {
  adaptiveLearning?: boolean;
  explorationFactor?: number;
  diversityBoost?: number;
  feedbackSensitivity?: number;
}

export interface TrackData {
  id: string;
  name: string;
  artist: string;
  album: string;
  imageUrl?: string;
  spotifyUrl?: string;
  previewUrl?: string;
  duration?: number;
  popularity?: number;
  explicit?: boolean;
}

export interface DiscoverMusicRequest {
  preferences?: MusicPreferences;
  count?: number;
  strategy?: 'custom_prediction' | 'spotify_fallback' | 'hybrid';
}

export interface DiscoverMusicResponse {
  songs: TrackData[];
  strategy: string;
  timestamp: string;
  totalFound: number;
  usingSpotifyFallback: boolean;
}

export interface FeedbackRequest {
  trackId: string;
  rating: number;
  feedback?: string;
}

export interface UserMusicProfile {
  customWeights: MusicPreferences;
  featureRanges: any;
  adaptiveLearning: boolean;
  explorationFactor: number;
  diversityBoost: number;
  derivedPreferences: any;
  totalFeedbackReceived: number;
}

export const musicApi = {
  /**
   * Discover personalized music based on user preferences
   */
  async discoverMusic(params: DiscoverMusicRequest): Promise<DiscoverMusicResponse> {
    const response = await makeRequest<DiscoverMusicResponse>('POST', '/music-preferences/discover', params);
    if (!response.data) {
      throw new Error('No data received from music discovery API');
    }
    return response.data;
  },

  /**
   * Rank user-provided tracks using the prediction algorithm
   */
  async rankTracks(tracks: TrackData[]): Promise<{ rankedTracks: TrackData[] }> {
    const response = await makeRequest<{ rankedTracks: TrackData[] }>('POST', '/music-preferences/rank-tracks', { tracks });
    if (!response.data) {
      throw new Error('No data received from track ranking API');
    }
    return response.data;
  },

  /**
   * Get current user music preferences and settings
   */
  async getSettings(): Promise<{ data: UserMusicProfile }> {
    const response = await makeRequest<{ data: UserMusicProfile }>('GET', '/music-preferences/settings');
    if (!response.data) {
      throw new Error('No data received from music settings API');
    }
    return response.data;
  },

  /**
   * Update audio feature weights
   */
  async updateWeights(weights: MusicPreferences): Promise<void> {
    await makeRequest<void>('PUT', '/music-preferences/weights', weights);
  },

  /**
   * Set preferred ranges for audio features
   */
  async updateRanges(ranges: any): Promise<void> {
    await makeRequest<void>('PUT', '/music-preferences/ranges', ranges);
  },

  /**
   * Update prediction preferences and settings
   */
  async updatePreferences(settings: DiscoverySettings): Promise<void> {
    await makeRequest<void>('PUT', '/music-preferences/preferences', settings);
  },

  /**
   * Submit feedback for a track to improve recommendations
   */
  async submitFeedback(feedback: FeedbackRequest): Promise<void> {
    await makeRequest<void>('POST', '/music-preferences/feedback', feedback);
  },

  /**
   * Get user's personalized music profile
   */
  async getProfile(): Promise<{ data: any }> {
    const response = await makeRequest<{ data: any }>('GET', '/music-preferences/profile');
    if (!response.data) {
      throw new Error('No data received from music profile API');
    }
    return response.data;
  },
};