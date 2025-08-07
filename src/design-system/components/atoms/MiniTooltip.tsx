import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface MiniTooltipProps {
  text: string;
  visible: boolean;
  theme: 'light' | 'dark';
  position?: 'top' | 'bottom';
  width?: number;
}

export const MiniTooltip: React.FC<MiniTooltipProps> = ({ 
  text, 
  visible, 
  theme, 
  position = 'top',
  width = 120 
}) => {
  const [opacity] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [visible, opacity]);

  if (!visible) return null;

  const isTop = position === 'top';

  return (
    <Animated.View
      style={[
        styles.tooltip,
        isTop ? styles.tooltipTop : styles.tooltipBottom,
        {
          opacity,
          width,
          left: -width / 2 + 20, // Center relative to badge
          backgroundColor: theme === 'light' ? 'rgba(0, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.9)',
          shadowColor: theme === 'light' ? '#000' : '#fff',
        },
      ]}
    >
      <Text
        style={[
          styles.tooltipText,
          { color: '#fff' },
        ]}
      >
        {text}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  tooltip: {
    position: 'absolute',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 1000,
  },
  tooltipTop: {
    top: -50,
  },
  tooltipBottom: {
    bottom: -50,
  },
  tooltipText: {
    fontSize: 9,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 12,
  },
});

export default MiniTooltip;