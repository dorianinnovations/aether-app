/**
 * Live Spotify Status Component
 * Shows friend's current/recent music status
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';

// Design System
import { useTheme } from '../../../contexts/ThemeContext';
import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';

// Services
import { SpotifyAPI } from '../../../services/api';

interface LiveSpotifyStatusProps {
  username: string;
  showHeader?: boolean;
  compact?: boolean;
  onStatusChange?: () => void;
}

interface LiveStatusData {
  success: boolean;
  connected: boolean;
  username: string;
  live?: {
    currentTrack: {
      name: string;
      artist: string;
      album: string;
      imageUrl?: string;
      spotifyUrl?: string;
      isPlaying?: boolean;
      progressMs?: number;
      durationMs?: number;
    };
    lastUpdated: string;
    statusAgeSeconds?: number;
  };
  recent?: {
    recentTrack: {
      name: string;
      artist: string;
      album: string;
      imageUrl?: string;
      spotifyUrl?: string;
      playedAt: string;
    };
    type: 'recent';
  };
  topTracks?: Array<{
    name: string;
    artist: string;
    album: string;
    imageUrl?: string;
    spotifyUrl?: string;
  }>;
}

export const LiveSpotifyStatus: React.FC<LiveSpotifyStatusProps> = ({
  username,
  showHeader = true,
  compact = false,
  onStatusChange
}) => {
  const { theme, colors } = useTheme();
  const [status, setStatus] = useState<LiveStatusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchLiveStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await SpotifyAPI.getLiveStatus(username);
      setStatus(response);
      setLastRefresh(new Date());
      
      if (!response.success) {
        setError(response.error || 'Failed to get live status');
      }
    } catch (err: any) {
      console.error('Error fetching live Spotify status:', err);
      setError(err.message || 'Failed to get live status');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchLiveStatus();
    
    const interval = setInterval(() => {
      fetchLiveStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [username]);

  const openInSpotify = (spotifyUrl?: string) => {
    if (spotifyUrl) {
      Linking.openURL(spotifyUrl).catch(() => {
        Alert.alert('Error', 'Failed to open Spotify');
      });
    }
  };

  const formatTimeAgo = (seconds?: number) => {
    if (!seconds) return '';
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const formatPlayedAt = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading && !status) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.text} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Checking music status...
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={16} color={colors.textSecondary} />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {error}
          </Text>
        </View>
      </View>
    );
  }

  if (!status || !status.connected) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <View style={styles.notConnectedContainer}>
          <MaterialIcons name="music-off" size={20} color={colors.textSecondary} />
          <Text style={[styles.notConnectedText, { color: colors.textSecondary }]}>
            {username} hasn't connected Spotify
          </Text>
        </View>
      </View>
    );
  }

  const currentTrack = status.live?.currentTrack;
  const recentTrack = status.recent?.recentTrack;
  const displayTrack = currentTrack || recentTrack;

  if (!displayTrack) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <View style={styles.noMusicContainer}>
          <MaterialIcons name="music-note" size={20} color={colors.textSecondary} />
          <Text style={[styles.noMusicText, { color: colors.textSecondary }]}>
            No recent music activity
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {showHeader && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialIcons name="music-note" size={16} color="#1DB954" />
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {currentTrack ? 'Now Playing' : 'Recently Played'}
            </Text>
            {currentTrack && status.live?.statusAgeSeconds && (
              <Text style={[styles.statusAge, { color: colors.textSecondary }]}>
                {formatTimeAgo(status.live.statusAgeSeconds)}
              </Text>
            )}
          </View>
          
          <TouchableOpacity
            onPress={fetchLiveStatus}
            disabled={loading}
            style={[styles.refreshButton, { backgroundColor: colors.background }]}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Feather name="refresh-cw" size={12} color={colors.text} />
            )}
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={[styles.trackContainer, compact && styles.trackContainerCompact]}
        onPress={() => openInSpotify(displayTrack.spotifyUrl)}
        activeOpacity={0.8}
      >
        <View style={styles.trackInfo}>
          {displayTrack.imageUrl && (
            <Image
              source={{ uri: displayTrack.imageUrl }}
              style={[styles.trackImage, compact && styles.trackImageCompact]}
            />
          )}
          
          <View style={styles.trackDetails}>
            <Text 
              style={[
                styles.trackName, 
                { color: colors.text },
                compact && styles.trackNameCompact
              ]} 
              numberOfLines={1}
            >
              {displayTrack.name}
            </Text>
            <Text 
              style={[
                styles.trackArtist, 
                { color: colors.textSecondary },
                compact && styles.trackArtistCompact
              ]} 
              numberOfLines={1}
            >
              {displayTrack.artist}
            </Text>
            
            {!compact && (
              <>
                {displayTrack.album && (
                  <Text style={[styles.trackAlbum, { color: colors.textSecondary }]} numberOfLines={1}>
                    {displayTrack.album}
                  </Text>
                )}
                
                {recentTrack && (
                  <Text style={[styles.playedTime, { color: colors.textSecondary }]}>
                    {formatPlayedAt(recentTrack.playedAt)}
                  </Text>
                )}
              </>
            )}
          </View>
        </View>

        <View style={styles.trackActions}>
          {currentTrack?.isPlaying && (
            <View style={[styles.playingIndicator, { backgroundColor: '#1DB954' }]}>
              <MaterialIcons name="play-arrow" size={12} color="white" />
            </View>
          )}
          <Feather name="external-link" size={14} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>

      {/* Top Tracks Preview */}
      {!compact && status.topTracks && status.topTracks.length > 0 && (
        <View style={styles.topTracksPreview}>
          <Text style={[styles.topTracksTitle, { color: colors.textSecondary }]}>
            Recent favorites
          </Text>
          <View style={styles.topTracksList}>
            {status.topTracks.slice(0, 2).map((track, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.topTrackItem, { borderColor: colors.borders.default }]}
                onPress={() => openInSpotify(track.spotifyUrl)}
                activeOpacity={0.8}
              >
                {track.imageUrl && (
                  <Image source={{ uri: track.imageUrl }} style={styles.topTrackImage} />
                )}
                <View style={styles.topTrackDetails}>
                  <Text style={[styles.topTrackName, { color: colors.text }]} numberOfLines={1}>
                    {track.name}
                  </Text>
                  <Text style={[styles.topTrackArtist, { color: colors.textSecondary }]} numberOfLines={1}>
                    {track.artist}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {lastRefresh && (
        <Text style={[styles.lastRefresh, { color: colors.textSecondary }]}>
          Updated {formatPlayedAt(lastRefresh.toISOString())}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: 'rgba(29, 185, 84, 0.2)',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },

  headerTitle: {
    ...typography.textStyles.caption,
    fontWeight: '600',
  },

  statusAge: {
    ...typography.textStyles.caption,
    fontSize: 10,
  },

  refreshButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  trackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  trackContainerCompact: {
    padding: spacing[1],
  },

  trackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  trackImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: spacing[3],
  },

  trackImageCompact: {
    width: 32,
    height: 32,
    marginRight: spacing[2],
  },

  trackDetails: {
    flex: 1,
  },

  trackName: {
    ...typography.textStyles.bodySmall,
    fontWeight: '600',
    marginBottom: 2,
  },

  trackNameCompact: {
    ...typography.textStyles.caption,
  },

  trackArtist: {
    ...typography.textStyles.caption,
    marginBottom: 2,
  },

  trackArtistCompact: {
    fontSize: 10,
  },

  trackAlbum: {
    ...typography.textStyles.caption,
    fontSize: 10,
    opacity: 0.8,
  },

  playedTime: {
    ...typography.textStyles.caption,
    fontSize: 10,
    marginTop: 2,
  },

  trackActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },

  playingIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  topTracksPreview: {
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },

  topTracksTitle: {
    ...typography.textStyles.caption,
    fontWeight: '600',
    marginBottom: spacing[2],
  },

  topTracksList: {
    gap: spacing[1],
  },

  topTrackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[1],
    borderRadius: 6,
    borderWidth: 1,
  },

  topTrackImage: {
    width: 24,
    height: 24,
    borderRadius: 4,
    marginRight: spacing[2],
  },

  topTrackDetails: {
    flex: 1,
  },

  topTrackName: {
    ...typography.textStyles.caption,
    fontWeight: '500',
  },

  topTrackArtist: {
    ...typography.textStyles.caption,
    fontSize: 10,
  },

  lastRefresh: {
    ...typography.textStyles.caption,
    fontSize: 10,
    textAlign: 'center',
    marginTop: spacing[2],
    fontStyle: 'italic',
  },

  // Loading, error, and empty states
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
  },

  loadingText: {
    ...typography.textStyles.caption,
  },

  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
  },

  errorText: {
    ...typography.textStyles.caption,
  },

  notConnectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
  },

  notConnectedText: {
    ...typography.textStyles.caption,
  },

  noMusicContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
  },

  noMusicText: {
    ...typography.textStyles.caption,
  },
});

export default LiveSpotifyStatus;