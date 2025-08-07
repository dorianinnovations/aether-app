import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { designTokens } from '../../tokens/colors';

interface BadgeProps {
  children: React.ReactNode;
  theme: 'light' | 'dark';
  variant?: 'default' | 'small';
}

const Badge: React.FC<BadgeProps> = ({ 
  children, 
  theme, 
  variant = 'default' 
}) => {
  return (
    <View style={[
      styles.badge,
      variant === 'small' && styles.smallBadge,
      {
        backgroundColor: theme === 'dark' 
          ? 'rgba(255,255,255,0.1)' 
          : designTokens.surfaces.light.sunken,
        borderWidth: theme === 'light' ? 1 : 0,
        borderColor: theme === 'light' ? designTokens.borders.light.subtle : 'transparent'
      }
    ]}>
      <Text style={[
        styles.badgeText,
        variant === 'small' && styles.smallBadgeText,
        {
          color: theme === 'dark'
            ? designTokens.text.secondaryDark
            : designTokens.text.primary
        }
      ]}>
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 24,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  smallBadgeText: {
    fontSize: 9,
    fontWeight: '400',
  },
});

export default Badge;