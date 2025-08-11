/**
 * Toast Component
 * Provides user feedback for success, error, warning, and info messages
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { spacing } from '../../tokens/spacing';
import { glassmorphism } from '../../tokens/glassmorphism';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  visible: boolean;
  message: string;
  type: ToastType;
  duration?: number;
  onDismiss: () => void;
  position?: 'top' | 'bottom';
  showCloseButton?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type,
  duration = 4000,
  onDismiss,
  position = 'top',
  showCloseButton = true,
}) => {
  const { theme, colors } = useTheme();
  const translateY = useRef(new Animated.Value(position === 'top' ? -100 : 100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss
      if (duration > 0) {
        const timer = setTimeout(() => {
          dismissToast();
        }, duration);

        return () => clearTimeout(timer);
      }
    } else {
      dismissToast();
    }
  }, [visible]);

  const dismissToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: position === 'top' ? -100 : 100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const getToastStyles = () => {
    const baseStyle = {
      backgroundColor: colors.surface,
      borderColor: colors.borders?.default || colors.textSecondary,
    };

    switch (type) {
      case 'success':
        return {
          ...baseStyle,
          backgroundColor: theme === 'dark' ? '#1B4332' : '#D4F4DD',
          borderColor: theme === 'dark' ? '#40916C' : '#52B788',
        };
      case 'error':
        return {
          ...baseStyle,
          backgroundColor: theme === 'dark' ? '#5C1A1A' : '#FECACA',
          borderColor: theme === 'dark' ? '#DC2626' : '#EF4444',
        };
      case 'warning':
        return {
          ...baseStyle,
          backgroundColor: theme === 'dark' ? '#451A03' : '#FEF3C7',
          borderColor: theme === 'dark' ? '#D97706' : '#F59E0B',
        };
      case 'info':
        return {
          ...baseStyle,
          backgroundColor: theme === 'dark' ? '#1E3A8A' : '#DBEAFE',
          borderColor: theme === 'dark' ? '#3B82F6' : '#60A5FA',
        };
      default:
        return baseStyle;
    }
  };

  const getIconName = (): keyof typeof Feather.glyphMap => {
    switch (type) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'alert-triangle';
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return theme === 'dark' ? '#52B788' : '#16A34A';
      case 'error':
        return theme === 'dark' ? '#EF4444' : '#DC2626';
      case 'warning':
        return theme === 'dark' ? '#F59E0B' : '#D97706';
      case 'info':
        return theme === 'dark' ? '#60A5FA' : '#3B82F6';
      default:
        return colors.text;
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <View style={[styles.container, { [position]: position === 'top' ? 60 : 100 }]} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.toast,
          getToastStyles(),
          {
            transform: [{ translateY }],
            opacity,
            shadowColor: colors.surfaces?.shadow || colors.textSecondary,
          },
        ]}
      >
        <View style={styles.content}>
          <Feather
            name={getIconName()}
            size={20}
            color={getIconColor()}
            style={styles.icon}
          />
          <Text style={[styles.message, { color: colors.text }]} numberOfLines={3}>
            {message}
          </Text>
          {showCloseButton && (
            <TouchableOpacity
              onPress={dismissToast}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="x" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    paddingHorizontal: spacing[4],
  },
  toast: {
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: screenWidth - spacing[8],
    minWidth: 280,
    ...Platform.select({
      ios: {
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    minHeight: 56,
  },
  icon: {
    marginRight: spacing[3],
  },
  message: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  closeButton: {
    marginLeft: spacing[2],
    padding: spacing[1],
  },
});