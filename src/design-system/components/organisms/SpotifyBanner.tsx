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

  // State for animations
  const [textWidth, setTextWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [previousImageUrl, setPreviousImageUrl] = useState<string | null>(null);

  // Start pulse animation when currentTrack is available
  useEffect(() => {
    if (currentTrack && isConnected) {
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
  }, [currentTrack, isConnected, spotifyPulseAnim, spotifyScaleAnim]);

  // Start scrolling animation when track changes
  useEffect(() => {
    if (currentTrack && textWidth > 0 && containerWidth > 0) {
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
    <View style={styles.container}>
      {currentTrack && isConnected ? (
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
        showLinkPrompt && (
          <SpotifyLinkPrompt 
            theme={theme}
            onPress={onConnectPress}
          />
        )
      )}
    </View>
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