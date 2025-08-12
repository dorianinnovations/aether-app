/**
 * useSpotifyLive Hook
 * Fetches live Spotify status for displaying current song
 */

import { useState, useEffect, useRef } from 'react';
import { SpotifyAPI } from '../services/apiModules/endpoints/spotify';
import { logger } from '../utils/logger';

interface SpotifyTrack {
  name: string;
  artist: string;
  album?: string;
  imageUrl?: string;
  spotifyUrl?: string;
  isPlaying?: boolean;
  progressMs?: number;
  durationMs?: number;
}

interface UseSpotifyLiveReturn {
  currentTrack: SpotifyTrack | null;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  refresh: () => Promise<void>;
}

export const useSpotifyLive = (refreshInterval: number = 30000): UseSpotifyLiveReturn => {
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCurrentTrack = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await SpotifyAPI.getStatus();
      
      if (response.success && response.spotify) {
        const spotifyData = response.spotify;
        setIsConnected(spotifyData.connected || false);
        
        if (spotifyData.connected && spotifyData.currentTrack) {
          console.log('Setting current track:', spotifyData.currentTrack);
          setCurrentTrack({
            name: spotifyData.currentTrack.name,
            artist: spotifyData.currentTrack.artist,
            album: spotifyData.currentTrack.album,
            imageUrl: spotifyData.currentTrack.imageUrl,
            spotifyUrl: spotifyData.currentTrack.spotifyUrl,
            isPlaying: true,
            progressMs: undefined,
            durationMs: undefined,
          });
        } else {
          console.log('No currentTrack found, connected:', spotifyData.connected);
          setCurrentTrack(null);
        }
      } else {
        setIsConnected(false);
        setCurrentTrack(null);
      }
    } catch (err: any) {
      logger.error('Failed to fetch Spotify track:', err);
      setError(err.message || 'Failed to fetch current track');
      setIsConnected(false);
      setCurrentTrack(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = async () => {
    await fetchCurrentTrack();
  };

  useEffect(() => {
    // Initial fetch
    fetchCurrentTrack();

    // Set up polling interval
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(fetchCurrentTrack, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refreshInterval]);

  return {
    currentTrack,
    isLoading,
    error,
    isConnected,
    refresh,
  };
};