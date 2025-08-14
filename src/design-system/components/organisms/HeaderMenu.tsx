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
import { PanGestureHandler, State as GestureState } from 'react-native-gesture-handler';
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
    icon: <Feather name="user-plus" size={16} color="#FF8A8A" />, 
    label: 'Add Friend', 
    key: 'add_friend', 
    requiresAuth: true,
    isAuthAction: false
  },
  { 
    icon: <Feather name="arrow-left" size={16} color="#FFB366" />, 
    label: 'Back', 
    key: 'back', 
    requiresAuth: false 
  },
  { 
    icon: <MaterialCommunityIcons name="chat-outline" size={16} color="#FFFF66" />, 
    label: 'Chat', 
    key: 'chat', 
    requiresAuth: true 
  },
  { 
    icon: <Feather name="compass" size={16} color="#B3FF66" />, 
    label: 'Discovery', 
    key: 'dive', 
    requiresAuth: true 
  },
  { 
    icon: <Feather name="user" size={16} color="#66FFFF" />, 
    label: 'Profile', 
    key: 'profile', 
    requiresAuth: true 
  },
  { 
    icon: <Feather name="settings" size={16} color="#66B3FF" />, 
    label: 'Settings', 
    key: 'settings', 
    requiresAuth: true 
  },
  { 
    icon: <Feather name="log-out" size={16} color="#B366FF" />, 
    label: 'Sign Out', 
    key: 'sign_out', 
    requiresAuth: true,
    isAuthAction: false
  },
  { 
    icon: <Feather name="credit-card" size={16} color="#FF66FF" />, 
    label: 'Wallet', 
    key: 'wallet', 
    requiresAuth: true,
    isAuthAction: false
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
  const [isDragging, setIsDragging] = useState(false);
  const [menuLayout, setMenuLayout] = useState<{y: number, height: number} | null>(null);
  const [itemLayouts, setItemLayouts] = useState<Array<{y: number, height: number}>>([]);
  
  // Animation for pressed state
  const pressedAnimation = useRef(new Animated.Value(0)).current;
  
  // Animation refs for each menu item (entrance)
  const itemAnimations = useRef(
    menuActions.map(() => new Animated.Value(0))
  ).current;
  
  // Individual opacity animations for each menu item
  const itemOpacityAnimations = useRef(
    menuActions.map(() => new Animated.Value(1))
  ).current;

  // Sequential fade-in animation when menu becomes visible
  useEffect(() => {
    if (visible) {
      // Reset all animations to 0
      itemAnimations.forEach(anim => anim.setValue(0));
      itemOpacityAnimations.forEach(anim => anim.setValue(1));
      
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
      itemOpacityAnimations.forEach(anim => anim.setValue(1));
    }
  }, [visible, menuActions.length]);

  // Animate pressed state in/out
  const animatePressedState = useCallback((show: boolean) => {
    Animated.timing(pressedAnimation, {
      toValue: show ? 1 : 0,
      duration: show ? 100 : 150,
      useNativeDriver: false,
      easing: show ? Easing.out(Easing.quad) : Easing.in(Easing.quad),
    }).start(() => {
      if (!show) setPressedIndex(null);
    });
  }, [pressedAnimation]);

  // Touch handlers with immediate feedback
  const handlePressIn = useCallback((index: number) => {
    if (isDragging) return; // Don't interfere with drag gestures
    
    setPressedIndex(index);
    animatePressedState(true);
    animateItemOpacities(index); // 🎨 Mind-blowing effect on tap too!
    
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [isDragging, animatePressedState, animateItemOpacities]);

  const handlePressOut = useCallback(() => {
    if (isDragging) return; // Don't interfere with drag gestures
    
    animatePressedState(false);
    resetItemOpacities(); // Reset all items to full opacity
  }, [isDragging, animatePressedState, resetItemOpacities]);

  const handlePress = useCallback((actionKey: string, index: number) => {
    if (isDragging) return; // Don't trigger on drag end
    
    // Medium haptic for actual press
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Call action immediately for quick tap response
    onAction(actionKey);
  }, [onAction, isDragging]);

  // Professional coordinate mapping - find which item is under the touch point
  const getMenuItemAtY = useCallback((gestureY: number) => {
    if (!menuLayout || itemLayouts.length === 0) return 0;
    
    // Convert gesture Y to menu-relative coordinates
    const relativeY = gestureY - menuLayout.y;
    
    // Find the closest item center rather than exact boundaries
    let closestIndex = 0;
    let closestDistance = Infinity;
    
    for (let i = 0; i < itemLayouts.length; i++) {
      const item = itemLayouts[i];
      const itemCenter = item.y + (item.height / 2);
      const distance = Math.abs(relativeY - itemCenter);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = i;
      }
    }
    
    return closestIndex;
  }, [menuLayout, itemLayouts]);

  // Measure menu container layout
  const onMenuLayout = useCallback((event: any) => {
    const { y, height } = event.nativeEvent.layout;
    setMenuLayout({ y, height });
  }, []);

  // Measure individual item layouts
  const onItemLayout = useCallback((index: number, event: any) => {
    const { y, height } = event.nativeEvent.layout;
    setItemLayouts(prev => {
      const newLayouts = [...prev];
      newLayouts[index] = { y, height };
      return newLayouts;
    });
  }, []);

  // Mind-blowing cascading fade effect
  const animateItemOpacities = useCallback((selectedIndex: number) => {
    menuActions.forEach((_, index) => {
      const distance = Math.abs(index - selectedIndex);
      const targetOpacity = distance === 0 ? 1 : 0.3 - (distance * 0.1); // Selected = 1, others fade based on distance
      const delay = distance * 30; // Stagger the fade
      
      Animated.timing(itemOpacityAnimations[index], {
        toValue: Math.max(0.1, targetOpacity), // Never fully invisible
        duration: 200 + (distance * 50), // Longer duration for distant items
        delay: delay,
        useNativeDriver: true,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94), // Smooth bezier curve
      }).start();
    });
  }, [menuActions, itemOpacityAnimations]);

  // Reset all items to full opacity
  const resetItemOpacities = useCallback(() => {
    const animations = itemOpacityAnimations.map((anim, index) => 
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        delay: index * 20, // Staggered fade back in
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      })
    );
    
    Animated.parallel(animations).start();
  }, [itemOpacityAnimations]);

  // Pan gesture handler - swipe to preview, release to navigate
  const onGestureEvent = useCallback((event: any) => {
    const { absoluteY, state } = event.nativeEvent;
    
    if (state === GestureState.BEGAN || state === GestureState.ACTIVE) {
      if (state === GestureState.BEGAN) {
        setIsDragging(true);
      }
      
      // Use absolute Y coordinate for accurate mapping
      const newIndex = getMenuItemAtY(absoluteY);
      
      if (newIndex !== pressedIndex) {
        setPressedIndex(newIndex);
        animateItemOpacities(newIndex); // 🎨 Preview effect during swipe
        if (pressedAnimation._value === 0) {
          animatePressedState(true);
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } else if (state === GestureState.END) {
      // Only navigate on END (finger lift), not CANCELLED
      setIsDragging(false);
      if (pressedIndex !== null) {
        const action = menuActions[pressedIndex];
        if (action) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onAction(action.key); // Navigate to selected option
        }
      }
      // Reset visual state
      resetItemOpacities();
      animatePressedState(false);
    } else if (state === GestureState.CANCELLED) {
      // Just reset visuals on cancel, don't navigate
      setIsDragging(false);
      resetItemOpacities();
      animatePressedState(false);
    }
  }, [pressedIndex, menuActions, onAction, animatePressedState, pressedAnimation, getMenuItemAtY, animateItemOpacities, resetItemOpacities]);

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
                backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.85)',
              }
            ]}
          />
        </TouchableOpacity>
        

        {/* Swipe gesture zone - LEFT of menu items */}
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onGestureEvent}
          shouldCancelWhenOutside={false}
        >
          <View
            style={[
              styles.gestureOverlay,
              {
                position: 'absolute',
                right: 120, // Left of the menu items
                bottom: 100,
                width: screenWidth * 0.5, // Wide swipe area
                height: 300,
                backgroundColor: 'transparent',
              }
            ]}
          />
        </PanGestureHandler>

        {/* Minimal vertical menu aligned to right */}
          <View
            style={[
              styles.menuContainer,
              {
                position: 'absolute',
                right: rightMargin,
                bottom: 120,
              }
            ]}
            onLayout={onMenuLayout}
          >
          {menuActions.map((action, index) => (
            <Animated.View
              key={action.key}
              style={[
                styles.menuItem,
                {
                  opacity: Animated.multiply(
                    itemAnimations[index], 
                    itemOpacityAnimations[index]
                  ), // Combine entrance and selection opacity
                }
              ]}
              onLayout={(event) => onItemLayout(index, event)}
            >
              <TouchableOpacity
                style={styles.menuItemTouchable}
                onPressIn={() => handlePressIn(index)}
                onPressOut={handlePressOut}
                onPress={() => handlePress(action.key, index)}
                activeOpacity={1}
              >
                {/* Animated background overlay */}
                <Animated.View
                  style={[
                    styles.menuItemPressed,
                    {
                      opacity: pressedIndex === index ? pressedAnimation : 0,
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: 0,
                      bottom: 0,
                    }
                  ]}
                />
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
          
          {/* Theme Toggle - Icon Only at Bottom */}
          <View style={styles.menuItem}>
            <TouchableOpacity
              style={styles.menuItemTouchable}
              onPress={() => handlePress('theme_toggle', menuActions.length)}
              activeOpacity={0.7}
              disabled={pressedIndex !== null}
            >
              <View style={styles.iconWrapper}>
                {theme === 'dark' ? 
                  <Feather name="sun" size={16} color="#ffffff" /> : 
                  <Feather name="moon" size={16} color="#ffffff" />
                }
              </View>
            </TouchableOpacity>
          </View>
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
    paddingRight: spacing[3],
    width: screenWidth - 32, // Full screen width minus margins
    justifyContent: 'flex-end',
  },
  menuItemPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
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
  gestureOverlay: {
    backgroundColor: 'transparent',
    zIndex: 1,
  },
});

export default HeaderMenu;