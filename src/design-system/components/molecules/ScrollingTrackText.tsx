import React, { useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import type { ThemeMode } from '../../../contexts/ThemeContext';

interface TrackInfo {
  name: string;
  artist: string;
  album?: string;
}

interface ScrollingTrackTextProps {
  track: TrackInfo;
  scrollAnimation: Animated.Value;
  theme: ThemeMode;
  onTextLayout?: (width: number) => void;
  onContainerLayout?: (width: number) => void;
}

export const ScrollingTrackText: React.FC<ScrollingTrackTextProps> = ({
  track,
  scrollAnimation,
  theme,
  onTextLayout,
  onContainerLayout,
}) => {
  const [textWidth, setTextWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  const handleTextLayout = (event: any) => {
    const width = event.nativeEvent.layout.width;
    setTextWidth(width);
    onTextLayout?.(width);
  };

  const handleContainerLayout = (event: any) => {
    const width = event.nativeEvent.layout.width;
    setContainerWidth(width);
    onContainerLayout?.(width);
  };

  return (
    <View 
      style={styles.scrollContainer}
      onLayout={handleContainerLayout}
    >
      <Animated.View
        style={[
          styles.textContainer,
          {
            transform: [{
              translateX: scrollAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [
                  -textWidth || -300, 
                  containerWidth + (textWidth || 300)
                ],
              })
            }],
          }
        ]}
        onLayout={handleTextLayout}
      >
        <Text style={[
          styles.trackText,
          { 
            color: theme === 'dark' ? '#E0E0E0' : '#4A4A4A',
            fontWeight: '600'
          }
        ]}>
          {track.name}
        </Text>
        <Text style={[
          styles.trackText,
          { 
            color: theme === 'dark' ? '#C0C0C0' : '#606060',
            fontWeight: '400'
          }
        ]}>
          {' '}{track.artist}
        </Text>
        <Text style={[
          styles.trackText,
          { 
            color: theme === 'dark' ? '#A0A0A0' : '#707070',
            fontWeight: '300'
          }
        ]}>
          {' '}{track.album || 'Unknown Album'}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    letterSpacing: -0.1,
    fontWeight: '500',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});