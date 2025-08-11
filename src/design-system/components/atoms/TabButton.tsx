import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, View, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { spacing } from '../../tokens/spacing';
import { designTokens } from '../../tokens/colors';

type FeatherIconNames = keyof typeof Feather.glyphMap;

interface TabButtonProps {
  label: string;
  icon?: FeatherIconNames;
  logo?: any;
  isActive: boolean;
  theme: 'light' | 'dark';
  onPress: () => void;
  disabled?: boolean;
}

const TabButton: React.FC<TabButtonProps> = ({
  label,
  icon,
  logo,
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
          {logo ? (
            <Image 
              source={logo}
              style={[
                styles.logoImage,
                { opacity: isActive ? 1 : 0.7 }
              ]}
              resizeMode="contain"
            />
          ) : icon && !label.includes('Friends') ? (
            <>
              <Feather 
                name={icon} 
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
            </>
          ) : icon ? (
            <Feather 
              name={icon} 
              size={18} 
              color={textColor}
            />
          ) : (
            <Text style={[
              styles.tabText,
              {
                color: textColor,
                fontWeight: isActive ? '600' : '500',
              }
            ]}>
              {label}
            </Text>
          )}
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
    fontWeight: '500',
    letterSpacing: -0.2,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  logoImage: {
    width: 32,
    height: 16,
  },
});

export default TabButton;