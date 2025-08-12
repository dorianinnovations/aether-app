/**
 * BuzzScreen - Artist Discovery & Personalized Feed
 * Displays artist updates, releases, news, and personalized recommendations
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  RefreshControl,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

// Contexts
import { useTheme } from '../../contexts/ThemeContext';
import { useSettings } from '../../contexts/SettingsContext';

// Design System Components
import { PageBackground, SwipeToMenu } from '../../design-system/components/atoms';
import { Header, HeaderMenu } from '../../design-system/components/organisms';

// Design System Tokens
import { spacing } from '../../design-system/tokens/spacing';
import { typography } from '../../design-system/tokens/typography';
import { getThemeColors } from '../../design-system/tokens/colors';

// Hooks
import { useHeaderMenu } from '../../design-system/hooks';

// Types
import { NewsPost } from '../../types/social';

// API Services
import { FeedAPI, ArtistAPI, AnalyticsAPI, MemoryAPI } from '../../services/apiModules';
import type { FeedItem } from '../../services/apiModules/endpoints/feed';
import type { Artist } from '../../services/apiModules/endpoints/artists';
import type { InteractionTrackingData } from '../../services/apiModules/endpoints/analytics';

interface BuzzScreenProps {}

const BuzzScreen: React.FC<BuzzScreenProps> = () => {
  const { theme } = useTheme();
  const { settings } = useSettings();
  const colors = getThemeColors(theme);
  const navigation = useNavigation();
  
  // Artist Feed State
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [discoveredArtists, setDiscoveredArtists] = useState<Artist[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedType, setFeedType] = useState<'timeline' | 'releases' | 'news' | 'tours'>('timeline');
  const [error, setError] = useState<string | null>(null);
  const [isLiveData, setIsLiveData] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Header menu integration
  const { showHeaderMenu, setShowHeaderMenu, handleMenuAction, toggleHeaderMenu } = useHeaderMenu({
    screenName: 'buzz',
  });

  // Load personalized artist feed
  useEffect(() => {
    loadFeedData();
    loadDiscoveredArtists();
  }, []);

  const loadFeedData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      switch (feedType) {
        case 'releases':
          response = await FeedAPI.getReleases(20);
          break;
        case 'news':
          response = await FeedAPI.getNews(20);
          break;
        case 'tours':
          response = await FeedAPI.getTours(20);
          break;
        default:
          response = await FeedAPI.getTimeline({ limit: 20, priority: 'high' });
      }
      
      if (response.success && response.data) {
        setFeedItems(response.data);
        
        // Check if this is live data from new endpoints
        if ((response as any).meta?.isLive) {
          setIsLiveData(true);
          setLastUpdated((response as any).meta.lastUpdated);
        }
        
        // Track feed view (optional - don't fail if analytics fails)
        try {
          await AnalyticsAPI.trackInteraction({
            type: 'content_view',
            entityId: 'artist_feed',
            entityType: 'content',
            context: feedType
          });
        } catch (analyticsError) {
          console.warn('Analytics tracking failed (non-critical):', analyticsError);
        }
      } else {
        setError(response?.message || 'Failed to load feed');
      }
    } catch (err) {
      console.error('Error loading feed:', err);
      setError('Failed to load feed');
    } finally {
      setLoading(false);
    }
  }, [feedType]);

  const loadDiscoveredArtists = useCallback(async () => {
    try {
      const response = await ArtistAPI.discoverArtists({ limit: 5, based_on: 'preferences' });
      if (response.success && response.data) {
        setDiscoveredArtists(response.data);
      }
    } catch (err) {
      console.error('Error loading discovered artists:', err);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadFeedData(),
        loadDiscoveredArtists()
      ]);
    } catch (err) {
      console.error('Error refreshing feed:', err);
    } finally {
      setRefreshing(false);
    }
  }, [loadFeedData, loadDiscoveredArtists]);

  const handleFollowArtist = useCallback(async (artistId: string) => {
    try {
      const response = await ArtistAPI.followArtist(artistId);
      if (response.success) {
        // Store memory of following this artist
        await MemoryAPI.storeArtistInteraction(
          artistId, 
          discoveredArtists.find(a => a.id === artistId)?.name || 'Unknown Artist',
          'followed',
          'discovery_feed'
        );
        
        // Refresh discovered artists
        await loadDiscoveredArtists();
      }
    } catch (err) {
      console.error('Error following artist:', err);
    }
  }, [discoveredArtists, loadDiscoveredArtists]);

  const handleInteraction = useCallback(async (item: FeedItem, interactionType: string) => {
    try {
      // For live content, don't try to interact with stored data
      if (isLiveData) {
        console.log(`Live content interaction: ${interactionType} on ${item.title}`);
        // Could add haptic feedback here
        return;
      }
      
      // Track interaction with FeedAPI (only for stored content)
      await FeedAPI.interactWithUpdate(item.id, {
        type: interactionType as any,
        context: 'buzz_feed'
      });
      
      // Track interaction with Analytics
      await AnalyticsAPI.trackInteraction({
        type: 'content_interact',
        entityId: item.id,
        entityType: 'content',
        context: `${feedType}_${interactionType}`
      });
    } catch (err) {
      console.error('Error tracking interaction:', err);
    }
  }, [feedType, isLiveData]);

  // Quick function to follow test artists for demo
  const followTestArtists = useCallback(async () => {
    const testArtists = ['Drake', 'J. Cole', 'Kendrick Lamar', 'Travis Scott'];
    try {
      for (const artistName of testArtists) {
        await FeedAPI.followArtist(artistName);
      }
      // Refresh feed after following artists
      await loadFeedData();
    } catch (err) {
      console.error('Error following test artists:', err);
    }
  }, [loadFeedData]);

  const renderFeedItem = ({ item }: { item: FeedItem }) => {
    // Calculate dynamic properties based on content
    const hasLongTitle = (item.title?.length || 0) > 50;
    const hasLongContent = (item.content?.length || 0) > 150;
    const hasVeryLongContent = (item.content?.length || 0) > 250;
    
    // Dynamic card styling based on content length
    const dynamicCardStyle = {
      minHeight: hasVeryLongContent ? 180 : hasLongContent ? 150 : 120,
    };
    
    return (
    <TouchableOpacity 
      style={[
        styles.feedCard,
        dynamicCardStyle,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borders.default,
        }
      ]}
      onPress={() => handleInteraction(item, 'view')}
      activeOpacity={0.8}
    >
      {/* Priority indicator */}
      <View style={[
        styles.priorityIndicator,
        {
          backgroundColor: getTypeColor(item.type, theme),
        }
      ]} />
      
      {/* Artist image */}
      {item.artist?.image && (
        <Image 
          source={{ uri: item.artist.image }} 
          style={styles.artistImage}
          defaultSource={require('../../../assets/icon.png')}
        />
      )}
      
      {/* Feed content */}
      <View style={styles.feedContent}>
        {/* Artist name */}
        <Text style={[
          styles.artistName,
          typography.textStyles.labelMedium,
          { color: colors.primary }
        ]}>
          {item.artist.name}
        </Text>
        
        <Text style={[
          styles.feedTitle,
          hasLongTitle ? typography.textStyles.bodyLarge : typography.textStyles.headlineSmall,
          { 
            color: colors.text,
            lineHeight: hasLongTitle ? 20 : 24,
          }
        ]}
        numberOfLines={hasLongTitle ? 2 : 1} // Allow 2 lines for long titles
        >
          {item.title}
        </Text>
        
        <Text style={[
          styles.feedText,
          typography.textStyles.bodyMedium,
          { 
            color: colors.textSecondary,
            lineHeight: hasLongContent ? 20 : 22, // Tighter line height for long content
          }
        ]} 
        numberOfLines={hasVeryLongContent ? 5 : hasLongContent ? 4 : 3} // More lines for longer content
        >
          {item.content}
        </Text>
        
        <View style={styles.feedMeta}>
          <View style={styles.typeContainer}>
            <Text style={[
              styles.typeLabel,
              typography.textStyles.labelSmall,
              { color: colors.textMuted }
            ]}>
              {getTypeIcon(item.type)} {item.type.toUpperCase()}
            </Text>
            {item.source && (
              <Text style={[
                styles.source,
                typography.textStyles.labelSmall,
                { color: colors.textMuted }
              ]}>
                • {item.source}
              </Text>
            )}
          </View>
          
          <Text style={[
            styles.timestamp,
            typography.textStyles.labelSmall,
            { color: colors.textMuted }
          ]}>
            {formatTimestamp(item.publishedAt)}
          </Text>
        </View>
        
        {/* Interaction buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleInteraction(item, 'like')}
          >
            <Text style={[styles.actionText, { color: colors.primary }]}>♥ Like</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleInteraction(item, 'share')}
          >
            <Text style={[styles.actionText, { color: colors.primary }]}>↗ Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
    );
  };

  const renderDiscoveredArtist = ({ item }: { item: Artist }) => {
    const hasLongName = (item.name?.length || 0) > 15;
    
    return (
    <TouchableOpacity 
      style={[
        styles.artistCard,
        { backgroundColor: colors.surface, borderColor: colors.borders.default }
      ]}
      onPress={() => handleFollowArtist(item.id)}
    >
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.discoveryArtistImage} />
      )}
      <Text style={[
        styles.discoveryArtistName,
        hasLongName ? typography.textStyles.labelSmall : typography.textStyles.labelMedium,
        { color: colors.text }
      ]}
      numberOfLines={hasLongName ? 2 : 1}
      >
        {item.name}
      </Text>
      {item.genre && item.genre.length > 0 && (
        <Text style={[
          styles.discoveryGenre,
          typography.textStyles.labelSmall,
          { color: colors.textMuted }
        ]}>
          {item.genre[0]}
        </Text>
      )}
    </TouchableOpacity>
    );
  };

  const renderFeedTypeSelector = () => (
    <ScrollView 
      horizontal 
      style={styles.feedTypeSelector}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.feedTypeSelectorContent}
    >
      {[
        { key: 'timeline', label: 'For You', icon: '', color: theme === 'dark' ? '#FF6B6B' : '#FF3333' },
        { key: 'releases', label: 'New Releases', icon: '', color: theme === 'dark' ? '#FFB347' : '#FF8C00' },
        { key: 'news', label: 'Artist News', icon: '', color: theme === 'dark' ? '#4ECDC4' : '#00CED1' },
        { key: 'tours', label: 'Tours & Events', icon: '', color: theme === 'dark' ? '#A855F7' : '#8A2BE2' },
      ].map(({ key, label, icon, color }) => (
        <TouchableOpacity
          key={key}
          style={[
            styles.feedTypeButton,
            {
              backgroundColor: feedType === key ? color + '20' : 'transparent',
              borderColor: color,
              borderWidth: feedType === key ? 2 : 1,
            }
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setFeedType(key as any);
          }}
        >
          {icon && <Text style={styles.feedTypeIcon}>{icon}</Text>}
          <Text style={[
            styles.feedTypeLabel,
            {
              color: color,
              fontWeight: feedType === key ? '600' : '500'
            }
          ]}>
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderDiscoverySection = () => (
    discoveredArtists.length > 0 ? (
      <View style={styles.discoverySection}>
        <Text style={[
          styles.sectionTitle,
          typography.textStyles.headlineSmall,
          { color: colors.text }
        ]}>
          🎯 Discover New Artists
        </Text>
        <FlatList
          data={discoveredArtists}
          renderItem={renderDiscoveredArtist}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.discoveryList}
        />
      </View>
    ) : null
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={[
        styles.emptyTitle,
        typography.textStyles.headlineMedium,
        { color: colors.textMuted }
      ]}>
        {error ? '😔 Something went wrong' : '🎵 No updates yet'}
      </Text>
      <Text style={[
        styles.emptyDescription,
        typography.textStyles.bodyMedium,
        { color: colors.textMuted }
      ]}>
        {error ? 'Pull down to try again' : 'Follow some artists to see their latest updates here'}
      </Text>
      
      {!error && (
        <TouchableOpacity
          style={[styles.followButton, { backgroundColor: colors.primary }]}
          onPress={followTestArtists}
        >
          <Text style={[styles.followButtonText, { color: colors.surface }]}>
            Follow Top Artists (Drake, J. Cole, Kendrick)
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Re-fetch feed when feedType changes
  useEffect(() => {
    loadFeedData();
  }, [loadFeedData]);

  return (
    <SwipeToMenu onSwipeToMenu={toggleHeaderMenu}>
      <PageBackground theme={theme} variant="buzz">
      <SafeAreaView style={styles.container}>
        {/* Header with menu functionality */}
        <Header
          title="Buzz Feed"
          showBackButton={true}
          showMenuButton={true}
          onBackPress={() => navigation.goBack()}
          onMenuPress={toggleHeaderMenu}
          theme={theme}
          isMenuOpen={showHeaderMenu}
        />

        {/* Feed content */}
        <FlatList
          data={feedItems}
          renderItem={renderFeedItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListHeaderComponent={
            <>
              {renderFeedTypeSelector()}
              {renderDiscoverySection()}
            </>
          }
          ListEmptyComponent={!loading ? renderEmptyState : null}
          showsVerticalScrollIndicator={false}
        />

        {/* Header Menu */}
        <HeaderMenu
          visible={showHeaderMenu}
          onClose={() => setShowHeaderMenu(false)}
          onAction={handleMenuAction}
          showAuthOptions={true}
        />
      </SafeAreaView>
    </PageBackground>
    </SwipeToMenu>
  );
};

// Helper functions
const getTypeColor = (type: FeedItem['type'], theme: 'light' | 'dark'): string => {
  const colors = {
    release: theme === 'dark' ? '#4CAF50' : '#8BC34A',
    news: theme === 'dark' ? '#FF9800' : '#FFC107',
    tour: theme === 'dark' ? '#FF5722' : '#F44336',
    social: theme === 'dark' ? '#E91E63' : '#C2185B',
  };
  
  return colors[type] || colors.news;
};

const getTypeIcon = (type: FeedItem['type']): string => {
  const icons = {
    release: '🎶',
    news: '📰',
    tour: '🎤',
    social: '📱',
  };
  
  return icons[type] || '📰';
};

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingTop: 80, // Account for header
    paddingBottom: spacing[6],
    flexGrow: 1,
  },
  // Feed Type Selector
  feedTypeSelector: {
    marginBottom: spacing[4],
  },
  feedTypeSelectorContent: {
    paddingHorizontal: spacing[2],
    justifyContent: 'center',
    alignItems: 'center',
    flexGrow: 1,
  },
  feedTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    marginHorizontal: spacing[1],
    borderRadius: 6,
    borderWidth: 1,
  },
  feedTypeIcon: {
    fontSize: 16,
    marginRight: spacing[1],
  },
  feedTypeLabel: {
    fontSize: 12,
  },
  // Discovery Section
  discoverySection: {
    marginBottom: spacing[4],
  },
  sectionTitle: {
    marginBottom: spacing[3],
    paddingHorizontal: spacing[2],
  },
  discoveryList: {
    paddingHorizontal: spacing[2],
  },
  artistCard: {
    minWidth: 120,
    maxWidth: 140, // Allow slight expansion for longer names
    marginRight: spacing[3],
    padding: spacing[3],
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 140, // Ensure consistent minimum height
  },
  discoveryArtistImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: spacing[2],
  },
  discoveryArtistName: {
    textAlign: 'center',
    marginBottom: spacing[1],
    flexShrink: 1,
    lineHeight: 18,
  },
  discoveryGenre: {
    textAlign: 'center',
  },
  // Feed Items
  feedCard: {
    flexDirection: 'row',
    marginBottom: spacing[4],
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    minHeight: 120, // Minimum height
    alignItems: 'flex-start', // Align items to top for better layout
  },
  priorityIndicator: {
    width: 4,
    minHeight: '100%',
  },
  artistImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    margin: spacing[3],
    flexShrink: 0, // Prevent image from shrinking
  },
  feedContent: {
    flex: 1,
    padding: spacing[4],
    paddingLeft: spacing[2],
    minHeight: 100, // Ensure minimum content height
    justifyContent: 'space-between', // Distribute content evenly
  },
  artistName: {
    marginBottom: spacing[1],
    fontWeight: '600',
  },
  feedTitle: {
    marginBottom: spacing[2],
    flexShrink: 1, // Allow title to shrink if needed
  },
  feedText: {
    marginBottom: spacing[3],
    lineHeight: 22,
    flexShrink: 1, // Allow text to shrink if needed
  },
  feedMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeLabel: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  source: {
    marginLeft: spacing[2],
  },
  timestamp: {
    opacity: 0.8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  actionButton: {
    paddingVertical: spacing[1],
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[12],
  },
  emptyTitle: {
    marginBottom: spacing[2],
  },
  emptyDescription: {
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
    marginBottom: spacing[4],
  },
  followButton: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: 12,
    marginTop: spacing[2],
  },
  followButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default BuzzScreen;

// Re-export types for external use
export type { FeedItem, Artist };