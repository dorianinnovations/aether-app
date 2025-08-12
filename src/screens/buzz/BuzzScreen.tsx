/**
 * Buzz Screen - Music News Feed
 * A personalized feed of music news, releases, and trending content
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Animated,
  RefreshControl,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

// Components
import { PageBackground } from '../../design-system/components/atoms';
import { HeaderMenu } from '../../design-system/components/organisms';
import { AnimatedHamburger } from '../../design-system/components/atoms';
import FeedCard from './components/FeedCard';
import FeedModal from './components/FeedModal';
import FeedHeader from './components/FeedHeader';
import EmptyFeedState from './components/EmptyFeedState';
import SpotifyConnectPrompt from './components/SpotifyConnectPrompt';

// Design System
import { designTokens } from '../../design-system/tokens/colors';
import { typography } from '../../design-system/tokens/typography';
import { spacing } from '../../design-system/tokens/spacing';
import { getGlassmorphicStyle } from '../../design-system/tokens/glassmorphism';

// Hooks
import { useTheme } from '../../contexts/ThemeContext';
import { useHeaderMenu } from '../../design-system/hooks';
import { useFeedData } from './hooks/useFeedData';

// Types
import type { ThemeColors } from '../../types';
import type { FeedItem } from '../../services/apiModules/endpoints/feed';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type FeedTab = 'timeline' | 'releases' | 'news' | 'tours' | 'trending';

const BuzzScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors: themeColors, theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const headerMenu = useHeaderMenu();

  // Map theme colors to expected format for Buzz components
  const colors = {
    ...themeColors,
    primary: designTokens.brand.primary,
    textTertiary: themeColors.textMuted, // Use textMuted as textTertiary fallback
    surfaces: {
      base: themeColors.surface,
      elevated: themeColors.surface,
      sunken: themeColors.background,
      highlight: designTokens.brand.primary + '10',
      shadow: isDarkMode ? '#00000040' : '#0000001A',
    },
    borders: {
      default: themeColors.borders?.default || designTokens.borders[theme].default,
      muted: themeColors.borders?.subtle || designTokens.borders[theme].subtle,
      primary: designTokens.brand.primary,
    },
    pageBackground: themeColors.background,
  };
  
  // State
  const [activeTab, setActiveTab] = useState<FeedTab>('timeline');
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [hamburgerOpen, setHamburgerOpen] = useState(false);
  
  // Animations
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Feed data hook
  const {
    feedItems,
    loading,
    refreshing,
    error,
    hasSpotifyConnected,
    loadFeed,
    refreshFeed,
    markItemAsViewed,
    interactWithItem,
  } = useFeedData(activeTab);

  // Feed data loaded

  // Handle tab change
  const handleTabChange = useCallback((tab: FeedTab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  }, []);

  // Handle card press
  const handleCardPress = useCallback((item: FeedItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedItem(item);
    setIsModalVisible(true);
    markItemAsViewed(item.id);
  }, [markItemAsViewed]);

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setIsModalVisible(false);
    setTimeout(() => setSelectedItem(null), 300);
  }, []);

  // Handle interaction
  const handleInteraction = useCallback((item: FeedItem, type: 'like' | 'share' | 'save') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    interactWithItem(item.id, type);
  }, [interactWithItem]);


  // Reset hamburger animation when header menu closes
  useEffect(() => {
    if (!headerMenu.showHeaderMenu) {
      setHamburgerOpen(false);
    }
  }, [headerMenu.showHeaderMenu]);

  // Render feed item
  const renderFeedItem = useCallback(({ item }: { item: FeedItem }) => (
    <FeedCard
      item={item}
      onPress={() => handleCardPress(item)}
      onInteraction={(type) => handleInteraction(item, type)}
      colors={colors}
      isDarkMode={isDarkMode}
    />
  ), [handleCardPress, handleInteraction, colors, isDarkMode]);

  // Key extractor
  const keyExtractor = useCallback((item: FeedItem) => item.id, []);

  // List header component
  const ListHeaderComponent = useMemo(() => (
    <FeedHeader
      activeTab={activeTab}
      onTabChange={handleTabChange}
      colors={colors}
      isDarkMode={isDarkMode}
    />
  ), [activeTab, handleTabChange, colors, isDarkMode]);

  // Empty component
  const ListEmptyComponent = useMemo(() => {
    if (!hasSpotifyConnected) {
      return <SpotifyConnectPrompt colors={colors} isDarkMode={isDarkMode} />;
    }
    
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading your personalized feed...
          </Text>
        </View>
      );
    }

    return <EmptyFeedState colors={colors} isDarkMode={isDarkMode} />;
  }, [hasSpotifyConnected, loading, colors, isDarkMode]);

  // List footer component
  const ListFooterComponent = useMemo(() => {
    if (feedItems.length > 0 && !loading) {
      return (
        <View style={styles.footerContainer}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            You're all caught up! 🎵
          </Text>
        </View>
      );
    }
    return null;
  }, [feedItems.length, loading, colors.textMuted]);

  return (
    <PageBackground theme={theme} variant="buzz">
      <View style={[styles.container, { backgroundColor: 'transparent' }]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />
        

        {/* Feed List */}
        <FlatList
          data={feedItems}
          renderItem={renderFeedItem}
          keyExtractor={keyExtractor}
          ListHeaderComponent={ListHeaderComponent}
          ListEmptyComponent={ListEmptyComponent}
          ListFooterComponent={ListFooterComponent}
          contentContainerStyle={[
            styles.listContent,
            feedItems.length === 0 && styles.emptyListContent,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshFeed}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          initialNumToRender={5}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={Platform.OS === 'android'}
        />

        {/* Feed Modal */}
        {selectedItem && (
          <FeedModal
            item={selectedItem}
            visible={isModalVisible}
            onClose={handleModalClose}
            onInteraction={handleInteraction}
            colors={colors}
            isDarkMode={isDarkMode}
          />
        )}

        {/* Floating Hamburger Button */}
        {!headerMenu.showHeaderMenu && (
          <TouchableOpacity
            style={[
              styles.floatingButton,
              {
                backgroundColor: theme === 'dark' ? designTokens.surfaces.dark.elevated : designTokens.brand.surface,
                borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              }
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setHamburgerOpen(!hamburgerOpen);
              setTimeout(() => {
                headerMenu.open();
              }, 150); // Small delay to show animation before hiding button
            }}
            activeOpacity={0.8}
          >
            <AnimatedHamburger
              isOpen={hamburgerOpen}
              color={theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.secondary}
              size={22}
            />
          </TouchableOpacity>
        )}

        {/* Header Menu */}
        <HeaderMenu
          visible={headerMenu.showHeaderMenu}
          onClose={headerMenu.close}
          onAction={headerMenu.handleMenuAction}
        />
      </View>
    </PageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingTop: Platform.OS === 'android' 
      ? (StatusBar.currentHeight || 0) + 20 
      : 60, // Reduced padding since no header
    paddingBottom: spacing.xl * 2,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 3,
  },
  loadingText: {
    ...typography.body,
    marginTop: spacing.md,
  },
  footerContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  footerText: {
    ...typography.caption,
  },
  
  // Floating Button
  floatingButton: {
    position: 'absolute',
    bottom: 120, // Position above input area
    right: spacing[2], // Positioned on the right
    width: 50,
    height: 50,
    borderRadius: 12, // Less round corners
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    zIndex: 1000,
  },
});

export default BuzzScreen;