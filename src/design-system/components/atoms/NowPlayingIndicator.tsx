/**
 * Now Playing Indicator Component
 * Lottie animation for showing now playing status
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import LottieView from 'lottie-react-native';

interface NowPlayingIndicatorProps {
  size?: number;
  style?: ViewStyle;
}

export const NowPlayingIndicator: React.FC<NowPlayingIndicatorProps> = ({
  size = 20,
  style,
}) => {
  const width = size * 4;  // Make it much much longer
  const height = size * 0.1; // Make it much less tall - squished
  
  return (
    <View style={[styles.container, style, { 
      width: '100%',
      height: height,
      overflow: 'hidden'
    }]}>
      <LottieView
        source={require('../../../../assets/NowPlaying.json')}
        autoPlay
        loop
        style={{
          width: '100%',
          height: height,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NowPlayingIndicator;