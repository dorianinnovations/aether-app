import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, View } from 'react-native';
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
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const backgroundOpacity = React.useRef(new Animated.Value(isActive ? 1 : 0)).current;
  
  React.useEffect(() => {
    Animated.timing(backgroundOpacity, {
      toValue: isActive ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isActive, backgroundOpacity]);
  
  const textColor = isActive 
    ? (theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.primary)
    : (theme === 'dark' ? designTokens.text.secondaryDark : designTokens.text.secondary);
    
  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 16,
      bounciness: 6,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      speed: 16,
      bounciness: 6,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      disabled={disabled}
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
    >
      <Animated.View
        style={[
          styles.tabButton,
          {
            transform: [{ scale: scaleValue }],
          }
        ]}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            styles.activeBackground,
            {
              backgroundColor: theme === 'dark' 
                ? 'rgba(255,255,255,0.08)' 
                : 'rgba(0,0,0,0.04)',
              opacity: backgroundOpacity,
            }
          ]}
        />
        
        <View style={styles.content}>
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
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tabButton: {
    borderRadius: 10,
    minHeight: 44,
    position: 'relative',
    overflow: 'hidden',
  },
  activeBackground: {
    borderRadius: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    gap: spacing[2],
    minHeight: 44,
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