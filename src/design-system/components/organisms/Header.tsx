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

// Icon types
type FeatherIconNames = keyof typeof Feather.glyphMap;
import { designTokens, getThemeColors, getStandardBorder } from '../../tokens/colors';
import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';
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
  style?: object;
  // Scroll-responsive props
  scrollY?: Animated.Value;
  isScrolled?: boolean;
  leftIcon?: React.ReactNode;
  onLeftPress?: () => void;
  rightIcon?: React.ReactNode;
  onRightPress?: () => void;
  _isVisible?: boolean;
  _scrollY?: Animated.Value;
  _isScrolled?: boolean;
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
  _isVisible = true,
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
  _scrollY,
  _isScrolled = false,
}) => {
  const themeColors = getThemeColors(theme as 'light' | 'dark');
  const navigation = useNavigation<any>();
  const [backPressed] = useState(false);
  // Removed unused _menuPressed
  const [conversationsPressed] = useState(false);
  const [analyticsPressed] = useState(false);

  // All animations removed to prevent useInsertionEffect warnings
  const [searchPressed] = useState(false);
  const [dynamicOptionsPressed] = useState(false);

  // Timeout refs for cleanup
  const buttonTimeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const menuTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Removed visibility animation

  // All header animations removed

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


  const handleBackPress = () => {
    onBackPress?.();
  };
  
  // Subtle anticipatory hamburger press handler
  const handleMenuPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onMenuPress?.();
  };
  
  const handleConversationsPress = () => {
    onConversationsPress?.();
  };
  
  const handleAnalyticsPress = () => {
    onQuickAnalyticsPress?.();
  };
  
  const handleSearchPress = () => {
    onSearchPress?.();
  };
  
  const handleDynamicOptionsPress = () => {
    onDynamicOptionsPress?.();
  };

  // Logo press handler - navigate to main chat screen
  const handleLogoPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      // Navigate to Chat screen (main screen for authenticated users)
      navigation.navigate('Chat');
    } catch {
      // Navigation to Chat failed silently
      // Fallback: use onTitlePress if provided
      onTitlePress?.();
    }
  };

  const renderButton = (
    iconName: string,
    iconLibrary: 'Feather' | 'MaterialCommunityIcons',
    color: string,
    onPress: () => void,
    isPressed: boolean
  ) => {
    const IconComponent = iconLibrary === 'Feather' ? Feather : MaterialCommunityIcons;
    
    return (
      <View>
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
      </View>
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
        handleBackPress,
        backPressed
      )}
      {shouldSplit && showConversationsButton && renderButton(
        'message-square',
        'Feather',
        theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.secondary,
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
              name={leftIcon as FeatherIconNames}
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
        handleDynamicOptionsPress,
        dynamicOptionsPressed
      )}
      {shouldSplit && showSearchButton && renderButton(
        'search',
        'Feather',
        theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.secondary,
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
        handleConversationsPress,
        conversationsPressed
      )}

      {!shouldSplit && showDynamicOptionsButton && renderButton(
        'layers',
        'Feather',
        theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.secondary,
        handleDynamicOptionsPress,
        dynamicOptionsPressed
      )}

      {!shouldSplit && showSearchButton && renderButton(
        'search',
        'Feather',
        theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.secondary,
        handleSearchPress,
        searchPressed
      )}

      {showQuickAnalyticsButton && renderButton(
        'lightning-bolt',
        'MaterialCommunityIcons',
        theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.secondary,
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
              name={rightIcon as FeatherIconNames}
              size={23}
              color={theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.secondary}
            />
          ) : (
            rightIcon
          )}
        </TouchableOpacity>
      )}

      {showMenuButton && (
        <View>
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
        </View>
      )}
    </View>
  );

  return (
    <View
      style={[
        styles.header,
        {
          ...getStandardBorder(theme),
          backgroundColor: theme === 'dark' ? designTokens.brand.surfaceDark : designTokens.brand.surface,
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
          <View style={[
            styles.searchContainer,
            {
              backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
              borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
              display: showSearch ? 'flex' : 'none',
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
          </View>

          {/* Title Container - Always rendered but animated */}
          <View style={[
            styles.titleContainer,
            {
              display: !showSearch ? 'flex' : 'none',
            }
          ]}>
            <TouchableOpacity
              onPress={title === 'Aether' ? handleLogoPress : onTitlePress}
              activeOpacity={0.7}
              disabled={showSearch}
            >
              <View style={styles.titleRow}>
                {title === 'Aether' ? (
                  <View style={styles.logoContainer}>
                    <Image
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
                    <Image
                      source={theme === 'dark' 
                        ? require('../../../../assets/images/aether-brand-logo-dark.webp')
                        : require('../../../../assets/images/aether-brand-logo-light.webp')
                      }
                      style={styles.brandLogoOverlay}
                      resizeMode="contain"
                    />
                  </View>
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
                <Text style={[
                  styles.subtitle,
                  typography.textStyles.caption,
                  { 
                    color: themeColors.textSecondary,
                  }
                ]}>
                  {subtitle}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Right Section */}
        {rightButtonsRender}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 20,
    left: spacing[5], // Reduced from spacing[6] to increase width by ~15%
    right: spacing[5], // Reduced from spacing[6] to increase width by ~15%
    zIndex: 100,
    borderRadius: 10,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2], // Reduced from spacing[3] to decrease height by ~30%
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[2], // Reduced to maintain proportions with reduced header padding
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
    height: 35, // Reduced from 50 to maintain proportions with smaller header
    width: 150,
    overflow: 'visible',
  },
  logo: {
    height: 35, // Reduced to match logoContainer height
    width: 150,
  },
  brandLogoOverlay: {
    position: 'absolute',
    height: 150,
    width: 150,
    top: -57, // Adjusted for new logo height (was -50, now -57 to maintain centering)
    left: 0,
    zIndex: 2,
    opacity: 0.9,
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