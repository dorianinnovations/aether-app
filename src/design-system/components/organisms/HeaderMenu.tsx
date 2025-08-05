/**
 * Aether Header Menu Component
 * Sophisticated menu with intricate animations from aether-mobile
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Animated, 
  Dimensions, 
  Easing,
  Modal 
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { designTokens, getThemeColors, getIconColor } from '../../tokens/colors';
import { getHeaderMenuShadow } from '../../tokens/shadows';
import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';
import { getGlassmorphicStyle } from '../../tokens/glassmorphism';
import { useTheme } from '../../../contexts/ThemeContext';
import { ThemeSelector } from '../molecules/ThemeSelector';
import { NotificationDot } from '../atoms/NotificationDot';

const { width: screenWidth } = Dimensions.get('window');

interface MenuAction {
  icon: React.ReactNode;
  label: string;
  key: string;
  requiresAuth?: boolean;
  isAuthAction?: boolean;
}

const getAllMenuActions = (theme: 'light' | 'dark'): MenuAction[] => [
  { 
    icon: <Feather name="arrow-left" size={16} color={getIconColor('profile', theme)} />, 
    label: 'Back', 
    key: 'back', 
    requiresAuth: false 
  },
  { 
    icon: <MaterialCommunityIcons name="chat-outline" size={16} color={getIconColor('chat', theme)} />, 
    label: 'Chat', 
    key: 'chat', 
    requiresAuth: false 
  },
  { 
    icon: <Feather name="rss" size={16} color={getIconColor('feed', theme)} />, 
    label: 'Feed', 
    key: 'feed', 
    requiresAuth: false 
  },
  { 
    icon: <Feather name="users" size={16} color={getIconColor('friends', theme)} />, 
    label: 'Friends List', 
    key: 'friends', 
    requiresAuth: false 
  },
  { 
    icon: <Feather name="user" size={16} color={getIconColor('profile', theme)} />, 
    label: 'Profile', 
    key: 'profile', 
    requiresAuth: false 
  },
  { 
    icon: <Feather name="settings" size={16} color={getIconColor('settings', theme)} />, 
    label: 'Settings', 
    key: 'settings', 
    requiresAuth: false 
  },
  { 
    icon: <Feather name="log-out" size={16} color={getIconColor('signout', theme)} />, 
    label: 'Sign Out', 
    key: 'sign_out', 
    requiresAuth: true,
    isAuthAction: true
  },
];

const getMenuActions = (theme: 'light' | 'dark', showAuthOptions: boolean = true, showBackButton: boolean = false): MenuAction[] => {
  const allActions = getAllMenuActions(theme);
  
  let filteredActions = allActions;
  
  // Filter out back button if not needed
  if (!showBackButton) {
    filteredActions = filteredActions.filter(action => action.key !== 'back');
  }
  
  if (showAuthOptions) {
    // Show all actions including auth actions when showAuthOptions is true
    return filteredActions;
  } else {
    // Hide auth-required actions when showAuthOptions is false
    return filteredActions.filter(action => !action.requiresAuth && !action.isAuthAction);
  }
};

interface HeaderMenuProps {
  visible: boolean;
  onClose: () => void;
  onAction: (key: string) => void;
  menuButtonPosition?: { x: number; y: number; width: number; height: number };
  showAuthOptions?: boolean;
  showBackButton?: boolean;
  potentialMatches?: number; // Number of potential matches for notification badge
}

export const HeaderMenu: React.FC<HeaderMenuProps> = ({ 
  visible, 
  onClose, 
  onAction, 
  menuButtonPosition,
  showAuthOptions = true,
  showBackButton = false,
  potentialMatches = 0,
}) => {
  const { theme, colors, toggleTheme } = useTheme();
  const menuActions = getMenuActions(theme, showAuthOptions, showBackButton);
  
  // State to prevent multiple rapid presses
  const [isAnimating, setIsAnimating] = useState(false);
  const [pressedIndex, setPressedIndex] = useState<number | null>(null);
  
  // Main menu animations
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(-8)).current;
  
  // Simple opacity animations for items
  const totalItems = menuActions.length + 1; // +1 for theme selector
  const itemAnims = useRef(Array.from({ length: totalItems }, () => ({
    opacity: new Animated.Value(0),
  }))).current;
  
  // Dynamic button press animations
  const buttonAnims = useRef(Array.from({ length: menuActions.length }, () => ({
    scale: new Animated.Value(1),
    opacity: new Animated.Value(1),
  }))).current;

  // Cleanup function to reset all animations
  const resetAnimations = useCallback(() => {
    scaleAnim.setValue(0);
    opacityAnim.setValue(0);
    translateYAnim.setValue(-8);
    
    itemAnims.forEach(anim => {
      anim.opacity.setValue(0);
    });
    
    buttonAnims.forEach(anim => {
      anim.scale.setValue(1);
      anim.opacity.setValue(1);
    });
    
    setIsAnimating(false);
    setPressedIndex(null);
  }, []);

  // Show animation
  const showMenu = useCallback(() => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    resetAnimations();
    
    // Instant container
    scaleAnim.setValue(1);
    opacityAnim.setValue(1);
    translateYAnim.setValue(0);
    
    // Single haptic
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Staggered opacity fade-in for items only
    itemAnims.slice(0, totalItems).forEach((anim, index) => {
      Animated.timing(anim.opacity, {
        toValue: 1,
        duration: 150,
        delay: index * 30,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    });
    
    // Set not animating after last item starts
    setTimeout(() => setIsAnimating(false), (totalItems - 1) * 30);
  }, [totalItems]);

  // Hide animation
  const hideMenu = useCallback(() => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    // Ultra-fast exit animation
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 80,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: -8,
        duration: 120,
        easing: Easing.bezier(0.55, 0.06, 0.68, 0.19),
        useNativeDriver: true,
      }),
      // Hide all items smoothly (only animate existing items)
      ...itemAnims.slice(0, totalItems).map(anim => 
        Animated.timing(anim.opacity, {
          toValue: 0,
          duration: 120,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        })
      ),
    ]).start(() => {
      resetAnimations();
    });
  }, []);

  // Effect to handle visibility changes
  useEffect(() => {
    if (visible) {
      showMenu();
    } else {
      hideMenu();
    }
  }, [visible]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetAnimations();
    };
  }, []);

  // Button press handler
  const handleMenuButtonPress = useCallback((actionKey: string, index: number) => {
    if (isAnimating || pressedIndex !== null) return;
    
    setPressedIndex(index);
    
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Use the passed index directly (it's already the correct index)
    if (index >= buttonAnims.length || !buttonAnims[index]) return;
    
    const scaleAnim = buttonAnims[index].scale;
    const opacityAnim = buttonAnims[index].opacity;
    
    // Fast press animation
    Animated.sequence([
      // Press down
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.96,
          duration: 60,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.8,
          duration: 60,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      // Release
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 80,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 80,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setPressedIndex(null);
      
      onAction(actionKey);
    });
  }, [onAction]);

  if (!visible) return null;

  // Calculate position based on menu button and header layout
  const menuWidth = 280;
  
  let menuRight, menuTop;
  
  // Normal positioning for other screens
  const rightMargin = 24;
  const topMargin = 123;
  
  menuRight = menuButtonPosition?.x 
    ? screenWidth - menuButtonPosition.x - menuButtonPosition.width + 10
    : rightMargin;
  menuTop = menuButtonPosition?.y 
    ? menuButtonPosition.y + menuButtonPosition.height + 10
    : topMargin;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Background overlay that handles dismissal */}
        <TouchableOpacity 
          style={styles.backgroundOverlay}
          activeOpacity={1} 
          onPress={onClose}
          disabled={isAnimating}
        >
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              {
                opacity: opacityAnim,
                backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.2)',
              }
            ]}
          />
        </TouchableOpacity>
        
        {/* Menu container positioned above overlay */}
        <Animated.View
          style={[
            styles.menuContainer,
            {
              backgroundColor: theme === 'light' ? designTokens.brand.surface : designTokens.brand.surfaceDark,
              borderWidth: 1,
              borderColor: theme === 'light' ? designTokens.borders.light.default : designTokens.borders.dark.default,
              ...getHeaderMenuShadow(theme),
              position: 'absolute',
              top: menuTop, right: menuRight,
              width: menuWidth,
              opacity: opacityAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: translateYAnim }
              ],
            }
          ]}
        >
        {/* Arrow pointing to menu button */}
        <View style={[
          styles.arrow,
          {
            borderBottomColor: theme === 'light' ? '#ffffff' : designTokens.brand.surfaceDark,
          }
        ]} />
        
        <View style={styles.menuContent}>
          {menuActions.map((action, index) => {
            return (
            <Animated.View
              key={action.key}
              style={[
                styles.menuButton,
                {
                  backgroundColor: pressedIndex === index 
                    ? (theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0, 0, 0, 0.08)')
                    : (theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0, 0, 0, 0.03)'),
                  borderColor: theme === 'dark' 
                    ? 'rgba(255,255,255,0.1)' 
                    : 'rgba(0, 0, 0, 0.08)',
                  opacity: itemAnims[index]?.opacity || 1,
                  transform: [
                    { scale: buttonAnims[index]?.scale || 1 },
                  ],
                }
              ]}
            >
              <TouchableOpacity
                style={styles.buttonTouchable}
                onPress={() => handleMenuButtonPress(action.key, index)}
                activeOpacity={0.8}
                disabled={isAnimating || pressedIndex !== null}
              >
                <View style={styles.iconContainer}>
                  {action.icon}
                  {/* Notification dot for connections */}
                  <NotificationDot 
                    visible={action.key === 'feed' && potentialMatches > 0}
                    color={designTokens.pastels.coral}
                    size={10}
                    glowIntensity="high"
                  />
                </View>
                <Text style={[
                  styles.menuButtonText,
                  typography.textStyles.bodyMedium,
                  { color: colors.text }
                ]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            </Animated.View>
            );
          })}
          
          {/* Theme Selector as Menu Button */}
          <Animated.View
            style={[
              styles.menuButton,
              {
                backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0, 0, 0, 0.03)',
                borderColor: theme === 'dark' 
                  ? 'rgba(255,255,255,0.1)' 
                  : 'rgba(0, 0, 0, 0.08)',
                opacity: itemAnims[menuActions.length] ? itemAnims[menuActions.length].opacity : 1,
              }
            ]}
          >
            <ThemeSelector />
          </Animated.View>
        </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  menuContainer: {
    borderRadius: 16,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    overflow: 'visible',
  },
  arrow: {
    position: 'absolute',
    top: -8,
    right: 16,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  menuContent: {
    paddingTop: spacing[2],
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    marginHorizontal: spacing[1],
    marginVertical: 2,
    paddingHorizontal: spacing[4],
    borderWidth: 1,
  },
  buttonTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    height: '100%',
  },
  iconContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: spacing[3],
    position: 'relative',
    justifyContent: 'center',
  },
  menuButtonText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
});

export default HeaderMenu;