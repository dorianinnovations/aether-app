/**
 * TypingIndicator Component
 * Shows animated typing indicator for friend conversations
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

interface TypingIndicatorProps {
  username: string;
  theme: 'light' | 'dark';
  visible: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  username,
  theme,
  visible
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  const colors = {
    background: theme === 'dark' ? '#333' : '#f0f0f0',
    text: theme === 'dark' ? '#ccc' : '#666',
    dot: theme === 'dark' ? '#666' : '#999'
  };

  useEffect(() => {
    if (visible) {
      // Fade in the indicator
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Animate typing dots
      const animateDot = (dot: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(dot, {
              toValue: 1,
              duration: 400,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0.3,
              duration: 400,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        );
      };

      const animation = Animated.parallel([
        animateDot(dot1, 0),
        animateDot(dot2, 200),
        animateDot(dot3, 400),
      ]);

      animation.start();

      return () => {
        animation.stop();
      };
    } else {
      // Fade out the indicator
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, opacity, dot1, dot2, dot3]);

  if (!visible) return null;

  return (
    <Animated.View style={[
      styles.container,
      {
        opacity,
        backgroundColor: colors.background,
      }
    ]}>
      <View style={styles.content}>
        <Text style={[styles.text, { color: colors.text }]}>
          {username} is typing
        </Text>
        
        <View style={styles.dotsContainer}>
          <Animated.View style={[
            styles.dot,
            {
              backgroundColor: colors.dot,
              opacity: dot1,
            }
          ]} />
          <Animated.View style={[
            styles.dot,
            {
              backgroundColor: colors.dot,
              opacity: dot2,
            }
          ]} />
          <Animated.View style={[
            styles.dot,
            {
              backgroundColor: colors.dot,
              opacity: dot3,
            }
          ]} />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    fontStyle: 'italic',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});

export default TypingIndicator;