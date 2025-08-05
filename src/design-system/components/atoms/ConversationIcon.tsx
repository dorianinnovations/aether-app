import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { designTokens } from '../../tokens/colors';

interface ConversationIconProps {
  icon: string;
  theme: 'light' | 'dark';
  size?: number;
  color?: string;
}

const ConversationIcon: React.FC<ConversationIconProps> = ({ 
  icon, 
  theme, 
  size = 16,
  color
}) => {
  const defaultColor = color || (theme === 'dark' 
    ? designTokens.text.secondaryDark 
    : designTokens.text.secondary);

  return (
    <View style={[
      styles.iconContainer,
      { 
        backgroundColor: theme === 'dark' 
          ? 'rgba(255,255,255,0.1)' 
          : 'rgba(0,0,0,0.05)',
        borderWidth: 1,
        borderColor: theme === 'light' 
          ? 'rgba(0,0,0,0.08)' 
          : 'rgba(255,255,255,0.1)',
      }
    ]}>
      <Feather 
        name={icon as any} 
        size={size}
        color={defaultColor} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ConversationIcon;