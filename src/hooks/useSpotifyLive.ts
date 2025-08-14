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
  lastUpdated?: number; // Timestamp when track was last updated
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
  const lastTrackChangeRef = useRef<number>(0);
  const previousTrackRef = useRef<string | null>(null);

  const fetchCurrentTrack = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await SpotifyAPI.getStatus();
      
      if (response.success && response.spotify) {
        const spotifyData = response.spotify;
        setIsConnected(spotifyData.connected || false);
        
        if (spotifyData.connected && spotifyData.currentTrack) {
          
          // Check if track is actually playing
          const hasLastPlayed = spotifyData.currentTrack.lastPlayed;
          const lastPlayedTime = hasLastPlayed ? new Date(spotifyData.currentTrack.lastPlayed).getTime() : 0;
          const currentTime = Date.now();
          const timeSinceLastPlayed = currentTime - lastPlayedTime;
          
          // Use server's isPlaying status - should now be reliable
          const isActuallyPlaying = 
            spotifyData.currentTrack.isPlaying === true || 
            spotifyData.currentTrack.playing === true ||
            // Fallback: if server doesn't provide isPlaying and track was recently changed (< 5 seconds)
            (spotifyData.currentTrack.isPlaying === undefined && 
             hasLastPlayed && timeSinceLastPlayed < 5000);
          
          
          // Always set the track information, let the banner component handle display logic
          setCurrentTrack({
            name: spotifyData.currentTrack.name,
            artist: spotifyData.currentTrack.artist,
            album: spotifyData.currentTrack.album,
            imageUrl: spotifyData.currentTrack.imageUrl,
            spotifyUrl: spotifyData.currentTrack.spotifyUrl,
            isPlaying: isActuallyPlaying,
            progressMs: spotifyData.currentTrack.progressMs,
            durationMs: spotifyData.currentTrack.durationMs,
            lastUpdated: Date.now(),
          });
        } else {
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