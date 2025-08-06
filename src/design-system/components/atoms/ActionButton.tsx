import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { spacing } from '../../tokens/spacing';
import { designTokens } from '../../tokens/colors';

interface ActionButtonProps {
  icon: string;
  label?: string;
  theme: 'light' | 'dark';
  variant: 'primary' | 'secondary';
  onPress: () => void;
  disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  label,
  theme,
  variant,
  onPress,
  disabled = false
}) => {
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  
  const textColor = theme === 'dark' 
    ? designTokens.text.primaryDark 
    : designTokens.text.primary;

  const isPrimary = variant === 'primary';
  
  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.94,
      useNativeDriver: true,
      speed: 14,
      bounciness: 4,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      speed: 14,
      bounciness: 4,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      disabled={disabled}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Animated.View
        style={[
          styles.button,
          isPrimary ? styles.primaryButton : styles.secondaryButton,
          {
            backgroundColor: theme === 'dark' 
              ? 'rgba(255,255,255,0.1)' 
              : 'rgba(0, 0, 0, 0.08)',
            borderWidth: 1,
            borderColor: theme === 'light' 
              ? 'rgba(0,0,0,0.1)' 
              : 'rgba(255,255,255,0.15)',
            transform: [{ scale: scaleValue }],
          }
        ]}
      >
        <Feather name={icon as any} size={18} color={textColor} />
        {label && (
          <Text style={[styles.buttonText, { color: textColor }]}>
            {label}
          </Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
  primaryButton: {
    flex: 1,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[1],
    gap: spacing[2],
    minHeight: 36,
  },
  secondaryButton: {
    width: 48,
    height: 44,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 22,
    fontFamily: 'Nunito',
    letterSpacing: -0.3,
  },
});

export default ActionButton;