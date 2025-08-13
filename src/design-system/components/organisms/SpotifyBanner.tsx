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
  const greenIndicatorAnim = useRef(new Animated.Value(0)).current;

  // State for animations
  const [textWidth, setTextWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [previousImageUrl, setPreviousImageUrl] = useState<string | null>(null);
  const [showGreenIndicator, setShowGreenIndicator] = useState(false);

  // Start pulse animation when currentTrack is available
  useEffect(() => {
    if (currentTrack && isConnected) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(spotifyPulseAnim, {
            toValue: 0,
            duration: 4000,
            useNativeDriver: true,
          }),
          Animated.timing(spotifyPulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic),
          }),
          Animated.timing(spotifyPulseAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.in(Easing.cubic),
          }),
        ])
      ).start();
    } else {
      spotifyPulseAnim.stopAnimation();
      spotifyPulseAnim.setValue(0);
    }
  }, [currentTrack, isConnected, spotifyPulseAnim]);

  // Start scrolling animation when track changes
  useEffect(() => {
    if (currentTrack && textWidth > 0 && containerWidth > 0) {
      scrollAnimation.setValue(0);
      
      const shouldAnimate = textWidth >= (containerWidth - 50);
      
      if (shouldAnimate) {
        const scrollDistance = textWidth + containerWidth;
        
        Animated.loop(
          Animated.sequence([
            Animated.timing(scrollAnimation, {
              toValue: 1,
              duration: Math.max(8000, scrollDistance * 25),
              useNativeDriver: true,
              easing: Easing.linear,
            }),
            Animated.delay(2000),
            Animated.timing(scrollAnimation, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }
    }
  }, [currentTrack, scrollAnimation, textWidth, containerWidth]);

  // Album art fade animation when image changes
  useEffect(() => {
    const currentImageUrl = currentTrack?.imageUrl;
    
    if (currentImageUrl && previousImageUrl && currentImageUrl !== previousImageUrl) {
      albumArtFadeAnim.setValue(0);
      
      Animated.timing(albumArtFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }).start(() => {
        setShowGreenIndicator(true);
        greenIndicatorAnim.setValue(0);
        
        Animated.timing(greenIndicatorAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }).start(() => {
          setTimeout(() => {
            Animated.timing(greenIndicatorAnim, {
              toValue: 2,
              duration: 400,
              useNativeDriver: true,
              easing: Easing.in(Easing.back(1.2)),
            }).start(() => {
              setShowGreenIndicator(false);
              greenIndicatorAnim.setValue(0);
            });
          }, 5000);
        });
      });
    }
    
    if (currentImageUrl !== previousImageUrl) {
      setPreviousImageUrl(currentImageUrl || null);
    }
  }, [currentTrack?.imageUrl, previousImageUrl, albumArtFadeAnim, greenIndicatorAnim]);

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
          greenIndicatorAnimation={greenIndicatorAnim}
          showGreenIndicator={showGreenIndicator}
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