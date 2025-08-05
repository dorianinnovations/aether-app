/**
 * Aether Header Component
 * Sophisticated header with animations adapted from aether-mobile
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  StatusBar,
  Platform,
  TextInput,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { designTokens, getThemeColors, getStandardBorder } from '../../tokens/colors';
import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';
import { getGlassmorphicStyle } from '../../tokens/glassmorphism';
import { getNeumorphicStyle } from '../../tokens/shadows';
import { AnimatedHamburger } from '../atoms/AnimatedHamburger';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  showMenuButton?: boolean;
  showConversationsButton?: boolean;
  showQuickAnalyticsButton?: boolean;
  showSearchButton?: boolean;
  showDynamicOptionsButton?: boolean;
  onBackPress?: () => void;
  onMenuPress?: () => void;
  onConversationsPress?: () => void;
  onQuickAnalyticsPress?: () => void;
  onTitlePress?: () => void;
  onSearchPress?: () => void;
  onDynamicOptionsPress?: () => void;
  theme?: 'light' | 'dark';
  isVisible?: boolean;
  isMenuOpen?: boolean;
  showSearch?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  style?: any;
  // Scroll-responsive props
  scrollY?: Animated.Value;
  isScrolled?: boolean;
  leftIcon?: React.ReactNode;
  onLeftPress?: () => void;
  rightIcon?: React.ReactNode;
  onRightPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'Aether',
  subtitle,
  showBackButton = false,
  showMenuButton = true,
  showConversationsButton = false,
  showQuickAnalyticsButton = false,
  showSearchButton = false,
  showDynamicOptionsButton = false,
  onBackPress,
  onMenuPress,
  onConversationsPress,
  onQuickAnalyticsPress,
  onTitlePress,
  onSearchPress,
  onDynamicOptionsPress,
  theme = 'light',
  isVisible = true,
  isMenuOpen = false,
  showSearch = false,
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  style,
  leftIcon,
  onLeftPress,
  rightIcon,
  onRightPress,
  scrollY,
  isScrolled = false,
}) => {
  const themeColors = getThemeColors(theme as 'light' | 'dark');
  const navigation = useNavigation<any>();
  const [backPressed, setBackPressed] = useState(false);
  const [menuPressed, setMenuPressed] = useState(false);
  const [conversationsPressed, setConversationsPressed] = useState(false);
  const [analyticsPressed, setAnalyticsPressed] = useState(false);

  // Scroll-responsive animations
  const headerOpacity = useRef(new Animated.Value(isScrolled ? 0.95 : 1)).current;
  const titleScale = useRef(new Animated.Value(isScrolled ? 0.9 : 1)).current;
  const subtitleOpacity = useRef(new Animated.Value(isScrolled ? 0 : 1)).current;

  // Logo animation values
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const [logoAnimationComplete, setLogoAnimationComplete] = useState(false);

  // Logo animation sequence on component mount (only for Aether title)
  useEffect(() => {
    if (title === 'Aether' && !logoAnimationComplete) {
      // Reset animation values
      logoOpacity.setValue(0);

      // Start the animation sequence
      Animated.sequence([
        // Fade in (0-1.5s)
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        // Hold visible (1.5-3.5s) - 2 second pause
        Animated.delay(2000),
        // Fade out to 20% (3.5-4.5s)
        Animated.timing(logoOpacity, {
          toValue: 0.2,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setLogoAnimationComplete(true);
      });
    }
  }, [title, logoAnimationComplete]);

  // Animate header when scroll state changes
  useEffect(() => {
    const duration = 300;
    const config = {
      duration,
      useNativeDriver: false,
    };

    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: isScrolled ? 0.95 : 1,
        ...config,
        useNativeDriver: true,
      }),
      Animated.timing(titleScale, {
        toValue: isScrolled ? 0.9 : 1,
        ...config,
        useNativeDriver: true,
      }),
      Animated.timing(subtitleOpacity, {
        toValue: isScrolled ? 0 : 1,
        ...config,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isScrolled]);
  const [searchPressed, setSearchPressed] = useState(false);
  const [dynamicOptionsPressed, setDynamicOptionsPressed] = useState(false);

  // Animations
  const visibilityAnim = useRef(new Animated.Value(isVisible ? 1 : 0)).current;
  const backButtonScale = useRef(new Animated.Value(1)).current;
  const menuButtonScale = useRef(new Animated.Value(1)).current;
  const conversationsButtonScale = useRef(new Animated.Value(1)).current;
  const analyticsButtonScale = useRef(new Animated.Value(1)).current;
  const searchButtonScale = useRef(new Animated.Value(1)).current;
  const dynamicOptionsButtonScale = useRef(new Animated.Value(1)).current;
  const searchFadeAnim = useRef(new Animated.Value(0)).current;
  const titleFadeAnim = useRef(new Animated.Value(1)).current;

  // Timeout refs for cleanup
  const buttonTimeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const menuTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    Animated.timing(visibilityAnim, {
      toValue: isVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isVisible]);

  // Animate search/title transition
  useEffect(() => {
    if (showSearch) {
      // Fade out title, then fade in search
      Animated.sequence([
        Animated.timing(titleFadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(searchFadeAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Fade out search, then fade in title
      Animated.sequence([
        Animated.timing(searchFadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(titleFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showSearch]);

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      // Clear all button timeouts
      buttonTimeoutRefs.current.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      buttonTimeoutRefs.current.clear();
      
      // Clear menu timeout
      if (menuTimeoutRef.current) {
        clearTimeout(menuTimeoutRef.current);
      }
    };
  }, []);

  const createButtonPressHandler = (
    scaleAnim: Animated.Value,
    setPressed: (pressed: boolean) => void,
    buttonId: string,
    onPress?: () => void
  ) => () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();

    // Use requestAnimationFrame to avoid scheduling updates during render
    requestAnimationFrame(() => {
      setPressed(true);
      
      // Clear any existing timeout for this button
      const existingTimeout = buttonTimeoutRefs.current.get(buttonId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }
      
      // Set new timeout with cleanup tracking
      const timeoutId = setTimeout(() => {
        requestAnimationFrame(() => {
          setPressed(false);
          onPress?.();
        });
        buttonTimeoutRefs.current.delete(buttonId);
      }, 150);
      
      buttonTimeoutRefs.current.set(buttonId, timeoutId);
    });
  };

  const handleBackPress = createButtonPressHandler(backButtonScale, setBackPressed, 'back', onBackPress);
  
  // Subtle anticipatory hamburger press handler
  const handleMenuPress = () => {
    // Quick, subtle haptic for immediate responsiveness
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Animated.sequence([
      Animated.timing(menuButtonScale, {
        toValue: 0.95,
        duration: 40,
        useNativeDriver: true,
      }),
      Animated.spring(menuButtonScale, {
        toValue: 1,
        friction: 6,
        tension: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Use requestAnimationFrame to avoid scheduling updates during render
    requestAnimationFrame(() => {
      setMenuPressed(true);
      
      // Clear any existing menu timeout
      if (menuTimeoutRef.current) {
        clearTimeout(menuTimeoutRef.current);
      }
      
      // Set new timeout with cleanup tracking
      menuTimeoutRef.current = setTimeout(() => {
        requestAnimationFrame(() => {
          setMenuPressed(false);
          onMenuPress?.();
        });
      }, 80);
    });
  };
  
  const handleConversationsPress = createButtonPressHandler(conversationsButtonScale, setConversationsPressed, 'conversations', onConversationsPress);
  const handleAnalyticsPress = createButtonPressHandler(analyticsButtonScale, setAnalyticsPressed, 'analytics', onQuickAnalyticsPress);
  const handleSearchPress = createButtonPressHandler(searchButtonScale, setSearchPressed, 'search', onSearchPress);
  const handleDynamicOptionsPress = createButtonPressHandler(dynamicOptionsButtonScale, setDynamicOptionsPressed, 'dynamicOptions', onDynamicOptionsPress);

  // Logo press handler - navigate to main chat screen
  const handleLogoPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      // Navigate to Chat screen (main screen for authenticated users)
      navigation.navigate('Chat');
    } catch (error) {
      console.log('Navigation to Chat failed:', error);
      // Fallback: use onTitlePress if provided
      onTitlePress?.();
    }
  };

  const renderButton = (
    iconName: string,
    iconLibrary: 'Feather' | 'MaterialCommunityIcons',
    color: string,
    scale: Animated.Value,
    onPress: () => void,
    isPressed: boolean
  ) => {
    const IconComponent = iconLibrary === 'Feather' ? Feather : MaterialCommunityIcons;
    
    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onPress}
          activeOpacity={0.8}
        >
          <IconComponent
            name={iconName as any}
            size={23}
            color={color}
            style={{ opacity: isPressed ? 0.7 : 1 }}
          />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Count total buttons (INCLUDING menu button since it affects layout)
  const nonMenuButtonCount = [showBackButton, showConversationsButton, showQuickAnalyticsButton, showSearchButton, showDynamicOptionsButton].filter(Boolean).length;
  const totalButtons = showMenuButton ? nonMenuButtonCount + 1 : nonMenuButtonCount;
  const shouldSplit = totalButtons >= 2;

  // Left buttons (when splitting or when back button is present or when leftIcon is present)
  const leftButtonsRender = (shouldSplit || showBackButton || leftIcon) ? (
    <View style={styles.leftSection}>
      {showBackButton && renderButton(
        'arrow-left',
        'Feather',
        theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.secondary,
        backButtonScale,
        handleBackPress,
        backPressed
      )}
      {shouldSplit && showConversationsButton && renderButton(
        'message-square',
        'Feather',
        theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.secondary,
        conversationsButtonScale,
        handleConversationsPress,
        conversationsPressed
      )}
      {leftIcon && onLeftPress && (
        <TouchableOpacity
          style={styles.leftIconContainer}
          onPress={onLeftPress}
          activeOpacity={0.7}
        >
          {typeof leftIcon === 'string' ? (
            <Feather
              name={leftIcon as any}
              size={23}
              color={theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.secondary}
            />
          ) : (
            leftIcon
          )}
        </TouchableOpacity>
      )}
      {shouldSplit && showDynamicOptionsButton && renderButton(
        'layers',
        'Feather',
        theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.secondary,
        dynamicOptionsButtonScale,
        handleDynamicOptionsPress,
        dynamicOptionsPressed
      )}
      {shouldSplit && showSearchButton && renderButton(
        'search',
        'Feather',
        theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.secondary,
        searchButtonScale,
        handleSearchPress,
        searchPressed
      )}
    </View>
  ) : (
    <View style={styles.leftSpacer} />
  );

  // Right buttons (always includes menu, plus others when not splitting)
  const rightButtonsRender = (
    <View style={styles.rightSection}>
      {!shouldSplit && !showBackButton && showConversationsButton && renderButton(
        'message-square',
        'Feather',
        theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.secondary,
        conversationsButtonScale,
        handleConversationsPress,
        conversationsPressed
      )}

      {!shouldSplit && showDynamicOptionsButton && renderButton(
        'layers',
        'Feather',
        theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.secondary,
        dynamicOptionsButtonScale,
        handleDynamicOptionsPress,
        dynamicOptionsPressed
      )}

      {!shouldSplit && showSearchButton && renderButton(
        'search',
        'Feather',
        theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.secondary,
        searchButtonScale,
        handleSearchPress,
        searchPressed
      )}

      {showQuickAnalyticsButton && renderButton(
        'lightning-bolt',
        'MaterialCommunityIcons',
        theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.secondary,
        analyticsButtonScale,
        handleAnalyticsPress,
        analyticsPressed
      )}

      {rightIcon && onRightPress && (
        <TouchableOpacity
          style={styles.rightIconContainer}
          onPress={onRightPress}
          activeOpacity={0.7}
        >
          {typeof rightIcon === 'string' ? (
            <Feather
              name={rightIcon as any}
              size={23}
              color={theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.secondary}
            />
          ) : (
            rightIcon
          )}
        </TouchableOpacity>
      )}

      {showMenuButton && (
        <Animated.View style={{ transform: [{ scale: menuButtonScale }] }}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleMenuPress}
            activeOpacity={0.8}
          >
            <AnimatedHamburger
              isOpen={isMenuOpen}
              color={theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.secondary}
              size={23}
            />
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );

  return (
    <Animated.View
      style={[
        styles.header,
        {
          ...getStandardBorder(theme),
          opacity: Animated.multiply(visibilityAnim, headerOpacity),
          height: isScrolled ? 50 : 58,
          backgroundColor: theme === 'dark' ? designTokens.brand.surfaceDark : designTokens.brand.surface,
          transform: [{
            translateY: visibilityAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [-20, 0],
            }),
          }],
        },
        style,
      ]}
    >
      <View style={styles.content}>
        {/* Left Section */}
        {leftButtonsRender}
        
        {/* Center Section - Logo or Search */}
        <View style={styles.centerSection}>
          {/* Search Container - Always rendered but animated */}
          <Animated.View style={[
            styles.searchContainer,
            {
              backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
              borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
              opacity: searchFadeAnim,
              position: showSearch ? 'relative' : 'absolute',
              zIndex: showSearch ? 1 : 0,
            }
          ]}>
            <TextInput
              style={[styles.searchInput, { color: themeColors.text }]}
              value={searchQuery}
              onChangeText={onSearchChange}
              placeholder={searchPlaceholder}
              placeholderTextColor={themeColors.textMuted}
              autoFocus={showSearch}
              onBlur={() => {
                // Hide search when input loses focus
                onSearchPress?.();
              }}
            />
          </Animated.View>

          {/* Title Container - Always rendered but animated */}
          <Animated.View style={[
            styles.titleContainer,
            {
              opacity: titleFadeAnim,
              transform: [
                {
                  scale: Animated.multiply(
                    titleFadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                    titleScale
                  )
                }
              ],
              position: !showSearch ? 'relative' : 'absolute',
              zIndex: !showSearch ? 1 : 0,
            }
          ]}>
            <TouchableOpacity
              onPress={title === 'Aether' ? handleLogoPress : onTitlePress}
              activeOpacity={0.7}
              disabled={showSearch}
            >
              <View style={styles.titleRow}>
                {title === 'Aether' ? (
                  <Animated.View style={[
                    styles.logoContainer,
                    {
                      opacity: logoOpacity
                    }
                  ]}>
                    <Animated.Image
                      source={theme === 'dark' 
                        ? require('../../../../assets/images/aether-logo-dark-mode.webp')
                        : require('../../../../assets/images/aether-logo-light-mode.webp')
                      }
                      style={[styles.logo, { 
                        opacity: theme === 'dark' ? 0.5 : 0.2, 
                        transform: [{ rotate: '25deg' }, { scaleX: 2.0 }] 
                      }]}
                      resizeMode="contain"
                    />
                    <Animated.Image
                      source={theme === 'dark' 
                        ? require('../../../../assets/images/aether-brand-logo-dark.webp')
                        : require('../../../../assets/images/aether-brand-logo-light.webp')
                      }
                      style={styles.brandLogoOverlay}
                      resizeMode="contain"
                    />
                  </Animated.View>
                ) : (
                  <Text style={[
                    styles.title,
                    typography.textStyles.headlineMedium,
                    { color: themeColors.text }
                  ]}>
                    {title}
                  </Text>
                )}
              </View>
              {subtitle && (
                <Animated.Text style={[
                  styles.subtitle,
                  typography.textStyles.caption,
                  { 
                    color: themeColors.textSecondary,
                    opacity: subtitleOpacity,
                  }
                ]}>
                  {subtitle}
                </Animated.Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Right Section */}
        {rightButtonsRender}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 20,
    left: spacing[6],
    right: spacing[6],
    zIndex: 100,
    borderRadius: 10,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[3],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSpacer: {
    flex: 1,
  },
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing[3],
    overflow: 'visible',
  },
  titleContainer: {
    alignItems: 'center',
    overflow: 'visible',
    minHeight: 30,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    overflow: 'visible',
  },
  title: {
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  logoContainer: {
    position: 'relative',
    height: 50,
    width: 150,
    overflow: 'visible',
  },
  logo: {
    height: 50,
    width: 150,
  },
  brandLogoOverlay: {
    position: 'absolute',
    height: 150,
    width: 150,
    top: -50,
    left: 0,
    zIndex: 2,
    opacity: 0.9,
  },
  buildingText: {
    fontFamily: 'CrimsonPro-Bold',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -4.0,
    lineHeight: 20,
    textAlign: 'center',
    transform: [
      { perspective: -50 },
      { rotateX: '55deg' },
      { scaleY: 2.0 },
      { scaleX: 1.2 },
    ],
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 5 },
    textShadowRadius: 8,
    backgroundColor: 'transparent',
  },
  subtitle: {
    marginTop: 2,
    opacity: 0.7,
  },
  rightSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing[3],
  },
  iconButton: {
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 35,
    height: 35,
  },
  rightIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: spacing[3],
    height: 38,
    minWidth: 260,
    maxWidth: 300,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: -0.2,
  },
});

export default Header;