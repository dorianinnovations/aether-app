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
  Modal,
  Easing
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { designTokens, getIconColor } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';
import { useTheme } from '../../../contexts/ThemeContext';
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
    label: 'Buzz', 
    key: 'buzz', 
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
    icon: <Feather name="credit-card" size={16} color={getIconColor('profile', theme)} />, 
    label: 'Wallet', 
    key: 'wallet', 
    requiresAuth: true,
    isAuthAction: false
  },
  { 
    icon: <Feather name="user-plus" size={16} color={getIconColor('profile', theme)} />, 
    label: 'Add Friend', 
    key: 'add_friend', 
    requiresAuth: true,
    isAuthAction: false
  },
  { 
    icon: theme === 'dark' ? <Feather name="sun" size={16} color="#ffffff" /> : <Feather name="moon" size={16} color="#ffffff" />, 
    label: theme === 'dark' ? 'Light' : 'Dark', 
    key: 'theme_toggle', 
    requiresAuth: false 
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
  const { theme, colors } = useTheme();
  
  // Memoize menu actions to prevent recalculation on every render
  const menuActions = React.useMemo(() => 
    getMenuActions(theme, showAuthOptions, showBackButton), 
    [theme, showAuthOptions, showBackButton]
  );
  
  // State to prevent multiple rapid presses
  const [pressedIndex, setPressedIndex] = useState<number | null>(null);
  
  // Animation refs for each menu item
  const itemAnimations = useRef(
    menuActions.map(() => new Animated.Value(0))
  ).current;

  // Sequential fade-in animation when menu becomes visible
  useEffect(() => {
    if (visible) {
      // Reset all animations to 0
      itemAnimations.forEach(anim => anim.setValue(0));
      
      // Create staggered animations from bottom to top (reverse order)
      const animations = menuActions.map((_, index) => {
        const reverseIndex = menuActions.length - 1 - index; // Bottom to top
        const animation = Animated.timing(itemAnimations[index], {
          toValue: 1,
          duration: 150,
          delay: reverseIndex * 50, // 50ms delay between each
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        });
        
        // Add haptic feedback when each item starts animating
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }, reverseIndex * 50); // Same delay as animation
        
        return animation;
      });
      
      // Start all animations in parallel
      Animated.parallel(animations).start();
    } else {
      // Reset animations when menu is hidden
      itemAnimations.forEach(anim => anim.setValue(0));
    }
  }, [visible, menuActions.length]);

  // Simplified button press handler
  const handleMenuButtonPress = useCallback((actionKey: string, index: number) => {
    if (pressedIndex !== null) return;
    
    setPressedIndex(index);
    
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Call action immediately
    setPressedIndex(null);
    onAction(actionKey);
  }, [onAction]);

  // Always render, use visible prop to control Modal visibility

  // Position menu on right side of screen
  const rightMargin = 16;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Background overlay that handles dismissal */}
        <TouchableOpacity 
          style={styles.backgroundOverlay}
          activeOpacity={1} 
          onPress={onClose}
        >
          <View
            style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.7)',
              }
            ]}
          />
        </TouchableOpacity>
        
        {/* Minimal vertical menu aligned to right */}
        <View
          style={[
            styles.menuContainer,
            {
              position: 'absolute',
              right: rightMargin,
              bottom: 200,
            }
          ]}
        >
          {menuActions.map((action, index) => (
            <Animated.View
              key={action.key}
              style={[
                styles.menuItem,
                {
                  opacity: itemAnimations[index],
                }
              ]}
            >
              <TouchableOpacity
                style={styles.menuItemTouchable}
                onPress={() => handleMenuButtonPress(action.key, index)}
                activeOpacity={0.7}
                disabled={pressedIndex !== null}
              >
                <Text style={[
                  styles.menuLabel,
                  { color: '#ffffff' }
                ]}>
                  {action.label}
                </Text>
                <View style={styles.iconWrapper}>
                  {action.icon}
                  <NotificationDot 
                    visible={action.key === 'feed' && potentialMatches > 0}
                    color={designTokens.pastels.coral}
                    size={8}
                    glowIntensity="high"
                  />
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
          
        </View>
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
    alignItems: 'flex-end',
  },
  menuItem: {
    marginVertical: spacing[2],
  },
  menuItemTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
    paddingLeft: spacing[3],
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
    marginRight: spacing[3],
    textAlign: 'right',
  },
  iconWrapper: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  themeSelectorWrapper: {
    paddingVertical: spacing[2],
    paddingLeft: spacing[3],
  },
});

export default HeaderMenu;