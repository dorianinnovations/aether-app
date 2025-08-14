import React, { useState, useRef, useEffect } from 'react';
import { 
  Animated, 
  Easing, 
  Platform, 
  StyleSheet, 
  View 
} from 'react-native';
import * as Haptics from 'expo-haptics';
import type { ThemeMode } from '../../../contexts/ThemeContext';
import { SpotifyTrackDisplay } from '../molecules/SpotifyTrackDisplay';
import { SpotifyLinkPrompt } from '../atoms';

interface TrackInfo {
  name: string;
  artist: string;
  album?: string;
  imageUrl?: string;
  durationMs?: number;
  isPlaying?: boolean;
  lastUpdated?: number;
}

interface SpotifyBannerProps {
  theme: ThemeMode;
  currentTrack?: TrackInfo;
  isConnected: boolean;
  showLinkPrompt: boolean;
  onTrackPress?: (track: TrackInfo) => void;
  onConnectPress?: () => void;
}

export const SpotifyBanner: React.FC<SpotifyBannerProps> = ({
  theme,
  currentTrack,
  isConnected,
  showLinkPrompt,
  onTrackPress,
  onConnectPress,
}) => {
  // Animation refs
  const spotifyPulseAnim = useRef(new Animated.Value(0)).current;
  const spotifyScaleAnim = useRef(new Animated.Value(1)).current;
  const albumArtFadeAnim = useRef(new Animated.Value(1)).current;
  const scrollAnimation = useRef(new Animated.Value(0)).current;
  const bannerOpacityAnim = useRef(new Animated.Value(1)).current;

  // State for animations and auto-hide
  const [textWidth, setTextWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [previousImageUrl, setPreviousImageUrl] = useState<string | null>(null);
  const [shouldShowBanner, setShouldShowBanner] = useState(true);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Adaptive timeout calculation
  const calculateHideTimeout = (track: TrackInfo): number => {
    const BUFFER_MINUTES = 2; // Extra time after song ends
    const MIN_TIMEOUT = 5; // Minimum timeout (5 minutes)
    const MAX_TIMEOUT = 15; // Maximum timeout (15 minutes)
    
    if (track.durationMs) {
      const trackMinutes = track.durationMs / 60000; // Convert ms to minutes
      const timeout = trackMinutes + BUFFER_MINUTES;
      return Math.min(Math.max(timeout, MIN_TIMEOUT), MAX_TIMEOUT) * 60 * 1000; // Convert to ms
    }
    
    // Fallback for unknown duration
    return 8 * 60 * 1000; // 8 minutes default
  };

  // Auto-hide logic based on track activity
  useEffect(() => {
    if (currentTrack && isConnected && (currentTrack.isPlaying || currentTrack.isPlaying === undefined)) {
      // Show for playing tracks OR when playing status is unknown (fallback)
      // Show banner and reset opacity only for actively playing tracks
      setShouldShowBanner(true);
      bannerOpacityAnim.setValue(1);
      
      // Clear any existing timeout
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      
      // Set new timeout based on track duration
      const timeoutMs = calculateHideTimeout(currentTrack);
      
      hideTimeoutRef.current = setTimeout(() => {
        // Fade out animation
        Animated.timing(bannerOpacityAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }).start(() => {
          setShouldShowBanner(false);
        });
      }, timeoutMs);
    } else if (isConnected && (!currentTrack || !currentTrack.isPlaying) && shouldShowBanner) {
      // No track or not playing but still connected - hide after short delay
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      
      hideTimeoutRef.current = setTimeout(() => {
        // Fade out animation
        Animated.timing(bannerOpacityAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }).start(() => {
          setShouldShowBanner(false);
        });
      }, 45000); // 45 seconds when no track or not playing
    } else {
      // Not connected or already hidden - clear timeout
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    }
    
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [currentTrack?.name, currentTrack?.artist, currentTrack?.lastUpdated, currentTrack?.isPlaying, isConnected, shouldShowBanner, bannerOpacityAnim]);

  // Start pulse animation when currentTrack is available and playing
  useEffect(() => {
    if (currentTrack && isConnected && (currentTrack.isPlaying || currentTrack.isPlaying === undefined) && shouldShowBanner) {
      // Reset scale animation to ensure clean state
      spotifyScaleAnim.setValue(1);
      
      Animated.loop(
        Animated.sequence([
          Animated.timing(spotifyPulseAnim, {
            toValue: 0,
            duration: 4000,
            useNativeDriver: false, // Must be false for border/shadow animations
          }),
          Animated.timing(spotifyPulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: false, // Must be false for border/shadow animations
            easing: Easing.out(Easing.cubic),
          }),
          Animated.timing(spotifyPulseAnim, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: false, // Must be false for border/shadow animations
            easing: Easing.out(Easing.quad),
          }),
        ])
      ).start();
    } else {
      // Stop all animations and reset to initial values
      spotifyPulseAnim.stopAnimation();
      spotifyScaleAnim.stopAnimation();
      spotifyPulseAnim.setValue(0);
      spotifyScaleAnim.setValue(1);
    }
  }, [currentTrack, isConnected, currentTrack?.isPlaying, shouldShowBanner, spotifyPulseAnim, spotifyScaleAnim]);

  // Start scrolling animation when track changes
  useEffect(() => {
    if (currentTrack && textWidth > 0 && containerWidth > 0 && shouldShowBanner) {
      // Stop any existing scroll animation and reset
      scrollAnimation.stopAnimation();
      scrollAnimation.setValue(0);
      
      const shouldAnimate = textWidth >= (containerWidth - 50);
      
      if (shouldAnimate) {
        const scrollDistance = textWidth + containerWidth;
        
        Animated.loop(
          Animated.sequence([
            Animated.timing(scrollAnimation, {
              toValue: 1,
              duration: Math.max(8000, scrollDistance * 25),
              useNativeDriver: true, // Safe for transform animations
              easing: Easing.linear,
            }),
            Animated.delay(2000),
            Animated.timing(scrollAnimation, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true, // Safe for transform animations
            }),
          ])
        ).start();
      }
    } else {
      // Clean up scroll animation when not needed
      scrollAnimation.stopAnimation();
      scrollAnimation.setValue(0);
    }
  }, [currentTrack, scrollAnimation, textWidth, containerWidth]);

  // Album art fade animation when image changes
  useEffect(() => {
    const currentImageUrl = currentTrack?.imageUrl;
    
    if (currentImageUrl && previousImageUrl && currentImageUrl !== previousImageUrl) {
      // Stop any existing fade animation and reset
      albumArtFadeAnim.stopAnimation();
      albumArtFadeAnim.setValue(0);
      
      Animated.timing(albumArtFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true, // Safe for opacity animations
        easing: Easing.out(Easing.ease),
      }).start();
    } else if (currentImageUrl && !previousImageUrl) {
      // First time showing image - start at full opacity
      albumArtFadeAnim.setValue(1);
    }
    
    if (currentImageUrl !== previousImageUrl) {
      setPreviousImageUrl(currentImageUrl || null);
    }
  }, [currentTrack?.imageUrl, previousImageUrl, albumArtFadeAnim]);

  // Cleanup animations on unmount
  useEffect(() => {
    return () => {
      spotifyPulseAnim.stopAnimation();
      spotifyScaleAnim.stopAnimation();
      scrollAnimation.stopAnimation();
      albumArtFadeAnim.stopAnimation();
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [spotifyPulseAnim, spotifyScaleAnim, scrollAnimation, albumArtFadeAnim]);

  const handleTrackPress = () => {
    if (currentTrack && onTrackPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onTrackPress(currentTrack);
    }
  };

  const handlePressIn = () => {
    Animated.spring(spotifyScaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 200,
      friction: 7,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(spotifyScaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 7,
    }).start();
  };

  return (
    <Animated.View 
      style={[styles.container, { opacity: bannerOpacityAnim }]}
    >
      {currentTrack && isConnected && shouldShowBanner && (currentTrack.isPlaying || currentTrack.isPlaying === undefined) ? (
        <SpotifyTrackDisplay
          track={currentTrack}
          theme={theme}
          onPress={handleTrackPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          pulseAnimation={spotifyPulseAnim}
          scaleAnimation={spotifyScaleAnim}
          albumArtFadeAnimation={albumArtFadeAnim}
          scrollAnimation={scrollAnimation}
          onTextLayout={setTextWidth}
          onContainerLayout={setContainerWidth}
        />
      ) : (
        showLinkPrompt && !isConnected && (
          <SpotifyLinkPrompt 
            theme={theme}
            onPress={onConnectPress}
          />
        )
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 0,
    right: 0,
    zIndex: 500,
    paddingHorizontal: 16,
  },
});