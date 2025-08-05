import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { spacing } from '../../tokens/spacing';
import { designTokens } from '../../tokens/colors';

interface TabButtonProps {
  label: string;
  icon: string;
  isActive: boolean;
  theme: 'light' | 'dark';
  onPress: () => void;
  disabled?: boolean;
}

const TabButton: React.FC<TabButtonProps> = ({
  label,
  icon,
  isActive,
  theme,
  onPress,
  disabled = false
}) => {
  const textColor = isActive 
    ? (theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.primary)
    : (theme === 'dark' ? designTokens.text.secondaryDark : designTokens.text.secondary);

  return (
    <TouchableOpacity
      style={styles.tabButton}
      onPress={onPress}
      activeOpacity={0.9}
      disabled={disabled}
    >
      <Feather 
        name={icon as any} 
        size={16} 
        color={textColor}
      />
      
      <Text style={[
        styles.tabText,
        {
          color: textColor,
          fontWeight: isActive ? '600' : '500',
        }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
    borderRadius: 8,
    minHeight: 14,
    gap: spacing[2],
  },
  tabText: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: -0.3,
    fontFamily: 'Nunito',
    textAlign: 'center',
  },
});

export default TabButton;