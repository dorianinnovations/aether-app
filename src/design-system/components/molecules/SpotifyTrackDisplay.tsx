import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import type { ThemeMode } from '../../../contexts/ThemeContext';
import { AlbumArt } from '../atoms/AlbumArt';
import { ScrollingTrackText } from './ScrollingTrackText';
import { SpotifyPulseEffect } from '../atoms/SpotifyPulseEffect';
import { Animated } from 'react-native';

interface TrackInfo {
  name: string;
  artist: string;
  album?: string;
  imageUrl?: string;
}

interface SpotifyTrackDisplayProps {
  track: TrackInfo;
  theme: ThemeMode;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  // Animation props
  pulseAnimation: Animated.Value;
  scaleAnimation: Animated.Value;
  albumArtFadeAnimation: Animated.Value;
  scrollAnimation: Animated.Value;
  // Layout callbacks
  onTextLayout?: (width: number) => void;
  onContainerLayout?: (width: number) => void;
}

export const SpotifyTrackDisplay: React.FC<SpotifyTrackDisplayProps> = ({
  track,
  theme,
  onPress,
  onPressIn,
  onPressOut,
  pulseAnimation,
  scaleAnimation,
  albumArtFadeAnimation,
  scrollAnimation,
  onTextLayout,
  onContainerLayout,
}) => {
  return (
    <TouchableOpacity 
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
    >
      <SpotifyPulseEffect
        pulseAnimation={pulseAnimation}
        scaleAnimation={scaleAnimation}
        theme={theme}
        style={styles.spotifyContent}
      >
        <BlurView
          intensity={20}
          tint={theme === 'dark' ? 'dark' : 'light'}
          style={StyleSheet.absoluteFillObject}
        />
        
        {/* Album Art Container */}
        {track.imageUrl && (
          <View style={styles.albumArtContainer}>
            <AlbumArt
              imageUrl={track.imageUrl}
              size={24}
              borderRadius={4}
              fadeAnimation={albumArtFadeAnimation}
            />
          </View>
        )}
        
        {/* Scrolling Text */}
        <ScrollingTrackText
          track={track}
          scrollAnimation={scrollAnimation}
          theme={theme}
          onTextLayout={onTextLayout}
          onContainerLayout={onContainerLayout}
        />
        
        {/* Tap Indicator */}
        <View style={styles.tapIndicator}>
          <Ionicons 
            name="chevron-forward" 
            size={16} 
            color={theme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'}
          />
        </View>
      </SpotifyPulseEffect>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  spotifyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 0.5,
    overflow: 'hidden',
    height: 36,
  },
  albumArtContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  tapIndicator: {
    position: 'absolute',
    right: 8,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});