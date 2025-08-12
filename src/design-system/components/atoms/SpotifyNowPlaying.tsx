/**
 * SpotifyNowPlaying Component
 * Tiny, low-profile display of current Spotify track
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSpotifyLive } from '../../../hooks/useSpotifyLive';
import { designTokens } from '../../tokens/colors';

interface SpotifyNowPlayingProps {
  theme: 'light' | 'dark';
  refreshInterval?: number;
}

export const SpotifyNowPlaying: React.FC<SpotifyNowPlayingProps> = ({ 
  theme, 
  refreshInterval = 30000 
}) => {
  const { currentTrack, isConnected } = useSpotifyLive(refreshInterval);

  if (!isConnected || !currentTrack) {
    return null;
  }

  const handlePress = () => {
    if (currentTrack.spotifyUrl) {
      Linking.openURL(currentTrack.spotifyUrl);
    }
  };

  const displayText = `${currentTrack.name} • ${currentTrack.artist}`;

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        {
          backgroundColor: theme === 'dark' 
            ? 'rgba(30, 215, 96, 0.08)' 
            : 'rgba(30, 215, 96, 0.06)',
          borderColor: theme === 'dark'
            ? 'rgba(30, 215, 96, 0.15)'
            : 'rgba(30, 215, 96, 0.12)',
        }
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <Ionicons 
          name="musical-notes" 
          size={12} 
          color={theme === 'dark' ? '#1ED760' : '#1DB954'} 
          style={styles.icon}
        />
        <Text 
          style={[
            styles.text,
            {
              color: theme === 'dark' 
                ? designTokens.text.mutedDark 
                : designTokens.text.muted,
            }
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {displayText}
        </Text>
        {currentTrack.isPlaying && (
          <View style={[
            styles.playingIndicator,
            {
              backgroundColor: theme === 'dark' ? '#1ED760' : '#1DB954',
            }
          ]} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 0.5,
    justifyContent: 'center',
    alignSelf: 'center',
    maxWidth: '90%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    letterSpacing: -0.1,
    flexShrink: 1,
  },
  playingIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginLeft: 4,
  },
});