/**
 * ConnectionStatusIndicator - Atomic Connection Status Component
 * Single responsibility: Display real-time connection status
 * Extracted from ChatScreen for better maintainability
 */

import React, { useRef, useEffect } from 'react';
import {
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';
import { useTheme } from '../../../contexts/ThemeContext';

interface ConnectionStatusIndicatorProps {
  isConnected: boolean;
  isReconnecting?: boolean;
  showText?: boolean;
  compact?: boolean;
}

export const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
  isConnected,
  isReconnecting = false,
  showText = true,
  compact = false,
}) => {
  const { theme } = useTheme();
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const slideAnimation = useRef(new Animated.Value(0)).current;

  // Pulse animation for reconnecting state
  useEffect(() => {
    if (isReconnecting) {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 0.3,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
      return () => pulseLoop.stop();
    } else {
      pulseAnimation.setValue(1);
    }
  }, [isReconnecting]);

  // Slide in/out animation
  useEffect(() => {
    Animated.timing(slideAnimation, {
      toValue: (!isConnected || isReconnecting) ? 1 : 0,
      duration: 300,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      useNativeDriver: true,
    }).start();
  }, [isConnected, isReconnecting]);

  const getStatusConfig = () => {
    if (isReconnecting) {
      return {
        icon: 'sync' as const,
        color: '#FFD23F', // warning color
        text: 'Reconnecting...',
        backgroundColor: theme === 'dark' 
          ? 'rgba(255, 193, 7, 0.1)' 
          : 'rgba(255, 193, 7, 0.05)',
      };
    }
    
    if (!isConnected) {
      return {
        icon: 'alert-circle' as const,
        color: '#FF6B9D', // error color
        text: 'Disconnected',
        backgroundColor: theme === 'dark' 
          ? 'rgba(220, 53, 69, 0.1)' 
          : 'rgba(220, 53, 69, 0.05)',
      };
    }
    
    return {
      icon: 'checkmark-circle' as const,
      color: '#7DCE82', // success color
      text: 'Connected',
      backgroundColor: theme === 'dark' 
        ? 'rgba(40, 167, 69, 0.1)' 
        : 'rgba(40, 167, 69, 0.05)',
    };
  };

  const statusConfig = getStatusConfig();

  if (isConnected && !isReconnecting) return null;

  return (
    <Animated.View
      style={[
        compact ? styles.compactContainer : styles.container,
        {
          backgroundColor: statusConfig.backgroundColor,
          borderColor: statusConfig.color,
          opacity: slideAnimation,
          transform: [
            {
              translateY: slideAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.iconContainer,
          {
            opacity: pulseAnimation,
          },
        ]}
      >
        <Ionicons
          name={statusConfig.icon}
          size={compact ? 14 : 16}
          color={statusConfig.color}
        />
      </Animated.View>
      
      {showText && !compact && (
        <Text
          style={[
            styles.statusText,
            {
              color: statusConfig.color,
              fontSize: 14,
              fontFamily: typography.fonts.bodyMedium,
            },
          ]}
        >
          {statusConfig.text}
        </Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    marginVertical: spacing.xs,
  },
  compactContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconContainer: {
    marginRight: spacing.xs,
  },
  statusText: {
    flex: 1,
  },
});

export default ConnectionStatusIndicator;