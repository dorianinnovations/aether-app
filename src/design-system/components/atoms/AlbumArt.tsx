import React from 'react';
import { Animated, Image, StyleSheet } from 'react-native';

interface AlbumArtProps {
  imageUrl?: string;
  size?: number;
  borderRadius?: number;
  fadeAnimation?: Animated.Value;
}

export const AlbumArt: React.FC<AlbumArtProps> = ({
  imageUrl,
  size = 24,
  borderRadius = 4,
  fadeAnimation,
}) => {
  if (!imageUrl) return null;

  const animatedStyle = fadeAnimation ? {
    opacity: fadeAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    })
  } : undefined;

  return (
    <Animated.View style={animatedStyle}>
      <Image 
        source={{ uri: imageUrl }}
        style={[
          styles.albumArt,
          {
            width: size,
            height: size,
            borderRadius,
          }
        ]}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  albumArt: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});