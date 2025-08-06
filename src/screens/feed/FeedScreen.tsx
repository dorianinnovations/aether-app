/**
 * Aether - Feed Screen
 * Living portfolios of friends, family, and acquaintances
 * AI-crafted feed showing availability, plans, and current life updates
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  Animated,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// Types
import type { SocialCard, HangoutRequest } from '../../types/social';
import { PostsAPI, type Post } from '../../services/postsApi';
import { SocialProxyAPI } from '../../services/apiModules';

// Import component types
import { PostCard, type CardLayout, type ProfilePlacement, type TextStyle, type CardPreferences, type ProfileMockup } from './components';

// Design System
import { PageBackground } from '../../design-system/components/atoms/PageBackground';
import { Header, HeaderMenu } from '../../design-system/components/organisms';
import { LottieLoader } from '../../design-system/components/atoms/LottieLoader';
import { SocialCard as SocialCardComponent } from '../../design-system/components/molecules/SocialCard';
import { useHeaderMenu } from '../../design-system/hooks';

// Hooks & Services
import { useTheme } from '../../hooks/useTheme';
import { useSocialCards } from '../../hooks/useSocialCards';

// Tokens
import { getThemeColors, getCyclingPastelColor, designTokens } from '../../design-system/tokens/colors';
import { spacing } from '../../design-system/tokens/spacing';
import { typography } from '../../design-system/tokens/typography';

interface FeedScreenProps {
  navigation: any;
}

const FeedScreen: React.FC<FeedScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);
  const {
    cards,
    loading,
    error,
    refreshing,
    refreshCards,
    sendHangoutRequest,
    updateUserStatus,
    updateAvailability,
  } = useSocialCards();

  const [hangoutModalVisible, setHangoutModalVisible] = useState(false);
  const [selectedCard, setSelectedCard] = useState<SocialCard | null>(null);
  const [hangoutMessage, setHangoutMessage] = useState('');
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  // Animation refs for status modal
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const modalTranslateY = useRef(new Animated.Value(Dimensions.get('window').height)).current;

  // Header menu hook
  const { showHeaderMenu, setShowHeaderMenu, handleMenuAction, toggleHeaderMenu } = useHeaderMenu({
    screenName: 'feed',
    onSettingsPress: () => setStatusModalVisible(true),
  });

  // Animate modal when visibility changes
  useEffect(() => {
    if (statusModalVisible) {
      // Show animation
      Animated.parallel([
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(modalTranslateY, {
          toValue: 0,
          tension: 300,
          friction: 20,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Hide animation
      Animated.parallel([
        Animated.timing(modalOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(modalTranslateY, {
          toValue: Dimensions.get('window').height,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [statusModalVisible]);

  const handleCardPress = useCallback((card: SocialCard) => {
    // Navigate to detailed card view or expand inline
    console.log('Card pressed:', card.name);
    // TODO: Navigate to detailed profile view
  }, []);

  const handleHangoutRequest = useCallback((card: SocialCard) => {
    setSelectedCard(card);
    setHangoutModalVisible(true);
  }, []);

  const handleSendHangoutRequest = async () => {
    if (!selectedCard) return;
    
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      await sendHangoutRequest(
        selectedCard.userId,
        selectedCard.availability.hangoutPreference || 'any',
        hangoutMessage
      );
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success!', `Hangout request sent to ${selectedCard.name}`);
      
      setHangoutModalVisible(false);
      setSelectedCard(null);
      setHangoutMessage('');
    } catch (error) {
      console.error('Error sending hangout request:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to send hangout request');
    }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus.trim()) return;
    
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Create post using the server API
      const response = await SocialProxyAPI.createPost(newStatus, 'friends');
      console.log('Post created successfully:', response);
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStatusModalVisible(false);
      setNewStatus('');
      
      // Refresh feed to show new post
      await loadPosts();
      refreshCards();
      
    } catch (error) {
      console.error('Error creating post:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to create post');
    }
  };

  const loadPosts = useCallback(async () => {
    try {
      setPostsLoading(true);
      console.log('Loading posts from timeline...');
      
      // Load real timeline data from server
      const timelineResponse = await SocialProxyAPI.getTimeline();
      console.log('Timeline data received:', timelineResponse);
      
      // Handle nested response structure (data.timeline vs timeline)
      const timeline = timelineResponse.data?.timeline || timelineResponse.timeline;
      const success = timelineResponse.data?.success || timelineResponse.success;
      
      if (success && timeline && Array.isArray(timeline)) {
        console.log('Timeline activities found:', timeline.length);
        console.log('Activity types:', timeline.map((a: any) => a.type));
        
        // Transform server activities to Post format for UI compatibility
        const transformedPosts: Post[] = timeline
          .filter((activity: any) => activity.type === 'post')
          .map((activity: any) => ({
            id: activity._id,
            title: activity.content?.text || '',
            content: '',
            author: activity.user?.username || 'Unknown',
            time: activity.createdAt,
            community: 'feed',
            likesCount: activity.reactions?.length || 0,
            commentsCount: activity.comments?.length || 0,
            sharesCount: 0, // Not implemented in server yet
            userHasLiked: false, // TODO: Check if current user has reacted
            badge: 'post',
            engagement: activity.reactions?.length > 5 ? 'high' : activity.reactions?.length > 2 ? 'medium' : 'low',
            comments: activity.comments || []
          }));
        
        setPosts(transformedPosts);
        console.log('Posts loaded from timeline:', transformedPosts.length);
      } else {
        console.warn('No timeline data available:', { success, timeline: !!timeline, isArray: Array.isArray(timeline) });
        setPosts([]);
      }
    } catch (error) {
      console.error('Error loading posts from timeline:', error);
      // Fall back to empty array instead of mock data
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  }, []);

  // Load posts on mount
  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleModalClose = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStatusModalVisible(false);
  };

  const handleToolPress = async (tool: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Implement tool functionality
    console.log(`${tool} tool pressed`);
  };

  const handlePostReaction = async (postId: string, reactionType: 'like' | 'love' | 'laugh' | 'curious' | 'relate') => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      console.log(`Reacting to post ${postId} with ${reactionType}`);
      
      await SocialProxyAPI.reactToActivity(postId, reactionType);
      
      // Update local post state to reflect the reaction
      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
          const newLikesCount = post.userHasLiked ? post.likesCount - 1 : post.likesCount + 1;
          return {
            ...post,
            userHasLiked: !post.userHasLiked,
            likesCount: newLikesCount,
            engagement: newLikesCount > 5 ? 'high' : newLikesCount > 2 ? 'medium' : 'low'
          };
        }
        return post;
      }));

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error reacting to post:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handlePostComment = async (postId: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      console.log(`Opening comments for post ${postId}`);
      // TODO: Implement comment modal or navigate to comments screen
      Alert.alert('Comments', 'Comment functionality coming soon!');
    } catch (error) {
      console.error('Error opening comments:', error);
    }
  };

  const handlePostShare = async (postId: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      console.log(`Sharing post ${postId}`);
      // TODO: Implement sharing functionality
      Alert.alert('Share', 'Share functionality coming soon!');
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  const handleScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const shouldBeScrolled = scrollY > 50; // Header shrinks after scrolling 50px
    
    if (shouldBeScrolled !== isScrolled) {
      setIsScrolled(shouldBeScrolled);
    }
  };

  const renderSocialCard = useCallback(({ item }: { item: SocialCard }) => (
    <SocialCardComponent
      card={item}
      onPress={handleCardPress}
      onHangoutRequest={handleHangoutRequest}
    />
  ), [handleCardPress, handleHangoutRequest]);

  // Generate profile data with real usernames + consistent colors
  const getProfileMockup = useCallback((author: string) => {
    // Special case for current user
    if (author === 'You') {
      return { 
        name: 'You', 
        avatar: '⭐', 
        relationship: 'You',
        relationshipDetail: 'Your profile',
        location: 'Home',
        color: '#9F7AEA',
        gradient: ['#9F7AEA', '#667EEA'] as [string, string],
        preferences: {
          layout: 'modern' as CardLayout,
          profilePlacement: 'top-left' as ProfilePlacement,
          textStyle: 'elegant' as TextStyle,
          accentColor: '#9F7AEA',
          showEngagement: true,
          showTimestamp: true,
          showLocation: true,
          cardCornerRadius: 20,
          textSize: 'medium' as const
        }
      };
    }

    // Generate consistent avatar and color for real usernames
    const avatars = ['👤', '🙂', '😊', '👨‍💻', '👩‍💻', '🎭', '🎨', '🎵', '🌟', '⚡', '🔥', '💎', '🌈', '🚀', '✨'];
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#A8E6CF', '#FFB6C1', '#87CEEB', '#DDA0DD', '#F0E68C', '#FFA07A', '#98FB98', '#87CEFA', '#F5DEB3', '#D3D3D3'];
    
    const hash = author.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0);
    const avatarIndex = Math.abs(hash) % avatars.length;
    const colorIndex = Math.abs(hash * 2) % colors.length;
    const color = colors[colorIndex];
    
    // Generate consistent layout preferences based on username
    const layouts: CardLayout[] = ['modern', 'classic', 'minimal', 'magazine', 'artistic'];
    const placements: ProfilePlacement[] = ['top-left', 'top-center', 'inline'];
    const textStyles: TextStyle[] = ['elegant', 'casual', 'bold'];
    
    return { 
      name: author, // Use the actual username
      avatar: avatars[avatarIndex], 
      relationship: 'Friend',
      relationshipDetail: 'Connected on Aether',
      location: 'Unknown',
      color,
      gradient: [color, color] as [string, string],
      preferences: {
        layout: layouts[Math.abs(hash * 3) % layouts.length],
        profilePlacement: placements[Math.abs(hash * 4) % placements.length],
        textStyle: textStyles[Math.abs(hash * 5) % textStyles.length],
        accentColor: color,
        showEngagement: true,
        showTimestamp: true,
        showLocation: false, // Don't show location for real users by default
        cardCornerRadius: 16 + (Math.abs(hash * 6) % 3) * 4, // 16, 20, or 24
        textSize: 'medium' as const
      }
    };
  }, []);

  const renderPost = useCallback(({ item }: { item: Post }) => {
    const profile = getProfileMockup(item.author);
    
    return (
      <PostCard
        post={item}
        profile={profile}
        onLike={(postId) => handlePostReaction(postId, 'like')}
        onComment={handlePostComment}
        onShare={handlePostShare}
      />
    );
  }, [getProfileMockup, handlePostReaction, handlePostComment, handlePostShare]);

  // Note: Helper functions moved to component implementations

  // Combine and sort feed data
  const combinedFeedData = React.useMemo(() => {
    const feedItems: Array<{type: 'post' | 'social', data: Post | SocialCard, timestamp: Date}> = [];
    
    // Add posts
    posts.forEach(post => {
      feedItems.push({
        type: 'post',
        data: post,
        timestamp: new Date(post.time)
      });
    });

    // Add social cards
    cards.forEach(card => {
      feedItems.push({
        type: 'social',
        data: card,
        timestamp: new Date(card.lastUpdated)
      });
    });

    // Sort by timestamp (newest first)
    const sortedItems = feedItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    console.log('Combined feed data:', {
      posts: posts.length,
      cards: cards.length,
      total: sortedItems.length,
      items: sortedItems.map(item => `${item.type}: ${item.type === 'post' ? (item.data as Post).title : (item.data as SocialCard).name}`)
    });
    
    return sortedItems;
  }, [posts, cards]);

  const renderFeedItem = useCallback(({ item }: { item: typeof combinedFeedData[0] }) => {
    if (item.type === 'post') {
      return renderPost({ item: item.data as Post });
    } else {
      return renderSocialCard({ item: item.data as SocialCard });
    }
  }, [renderPost, renderSocialCard]);


  const renderEmptyState = () => {
    console.log('Rendering empty state. Posts:', posts.length, 'Cards:', cards.length, 'Combined:', combinedFeedData.length);
    return (
      <View style={styles.emptyContainer}>
        <Feather name="edit-3" size={64} color={themeColors.textMuted} />
        <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
          Ready to Share?
        </Text>
        <Text style={[styles.emptySubtitle, { color: themeColors.textMuted }]}>
          Tap the create button to share your first post with friends
        </Text>
      </View>
    );
  };

  const renderHangoutModal = () => (
    <Modal
      visible={hangoutModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setHangoutModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
          <Text style={[styles.modalTitle, { color: themeColors.text }]}>
            Hangout with {selectedCard?.name}
          </Text>
          
          <TextInput
            style={[styles.messageInput, { 
              backgroundColor: themeColors.background,
              color: themeColors.text,
              borderColor: themeColors.borders.default
            }]}
            placeholder="Add a message (optional)"
            placeholderTextColor={themeColors.textMuted}
            value={hangoutMessage}
            onChangeText={setHangoutMessage}
            multiline
            numberOfLines={3}
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton, { borderColor: themeColors.borders.default }]}
              onPress={() => setHangoutModalVisible(false)}
            >
              <Text style={[styles.modalButtonText, { color: themeColors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.sendButton, { backgroundColor: '#10b981' }]}
              onPress={handleSendHangoutRequest}
            >
              <Text style={[styles.modalButtonText, { color: 'white' }]}>Send Request</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderStatusModal = () => {
    const characterCount = newStatus.length;
    const maxCharacters = 280;
    const isOverLimit = characterCount > maxCharacters;
    const isNearLimit = characterCount > maxCharacters * 0.8;
    
    return (
      <Modal
        visible={statusModalVisible}
        transparent
        animationType="none"
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <Animated.View style={[styles.modalOverlay, { opacity: modalOpacity }]}>
          <Animated.View style={[
            styles.postModalContent, 
            { 
              backgroundColor: themeColors.surface,
              borderColor: themeColors.borders.default,
              transform: [{ translateY: modalTranslateY }]
            }
          ]}>
            {/* Header */}
            <View style={[styles.postModalHeader, { borderBottomColor: themeColors.borders.default }]}>
              <Text style={[styles.postModalTitle, { color: themeColors.text }]}>
                New Post
              </Text>
              <View style={styles.headerButtons}>
                <TouchableOpacity 
                  onPress={handleModalClose}
                  style={[styles.closeButton, { 
                    backgroundColor: theme === 'dark' ? '#5C2E2E' : '#FED7D7',
                    borderColor: theme === 'dark' ? '#F56565' : '#E53E3E'
                  }]}
                >
                  <Feather name="x" size={20} color={theme === 'dark' ? '#F56565' : '#C53030'} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.postButton, 
                    { 
                      backgroundColor: newStatus.trim() && !isOverLimit 
                        ? (theme === 'dark' ? '#2D5A4A' : '#A7F3D0') // Green colors
                        : 'rgba(148, 163, 184, 0.3)', // Soft gray with opacity
                      opacity: newStatus.trim() && !isOverLimit ? 1 : 0.6,
                      borderColor: newStatus.trim() && !isOverLimit 
                        ? (theme === 'dark' ? '#34D399' : '#10B981') 
                        : themeColors.borders.default
                    }
                  ]}
                  onPress={handleUpdateStatus}
                  disabled={!newStatus.trim() || isOverLimit}
                >
                  <Feather 
                    name="arrow-right" 
                    size={18} 
                    color={newStatus.trim() && !isOverLimit ? (theme === 'dark' ? '#34D399' : '#047857') : themeColors.textMuted} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Profile Section */}
            <View style={styles.postProfileSection}>
              <View style={styles.profileAvatar}>
                <Feather name="user" size={20} color={themeColors.textMuted} />
              </View>
              <View style={styles.postInputContainer}>
                <TextInput
                  style={[styles.postInput, { 
                    color: themeColors.text,
                  }]}
                  placeholder="Craft a new post"
                  placeholderTextColor={themeColors.textMuted}
                  selectionColor={theme === 'dark' ? 'white' : '#64748b'}
                  cursorColor={theme === 'dark' ? 'white' : '#64748b'}
                  value={newStatus}
                  onChangeText={setNewStatus}
                  multiline
                  autoFocus
                  maxLength={maxCharacters + 50} // Allow slight overflow for warning
                />
              </View>
            </View>

            {/* Tools & Character Count */}
            <View style={[styles.postToolsSection, { borderTopColor: themeColors.borders.default }]}>
              <View style={styles.postTools}>
                <TouchableOpacity 
                  style={styles.toolButton}
                  onPress={() => handleToolPress('image')}
                >
                  <Feather name="image" size={22} color={getCyclingPastelColor(1, theme)} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.toolButton}
                  onPress={() => handleToolPress('emoji')}
                >
                  <Feather name="smile" size={22} color={getCyclingPastelColor(2, theme)} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.toolButton}
                  onPress={() => handleToolPress('location')}
                >
                  <Feather name="map-pin" size={22} color={getCyclingPastelColor(3, theme)} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.characterCountContainer}>
                {characterCount > 0 && (
                  <>
                    <View style={styles.characterCountWrapper}>
                      <View 
                        style={[
                          styles.characterCountCircle,
                          { 
                            borderColor: isOverLimit 
                              ? 'rgba(239, 68, 68, 0.8)' // Soft red
                              : isNearLimit 
                                ? 'rgba(245, 158, 11, 0.8)' // Soft amber
                                : getCyclingPastelColor(4, theme) // Rainbow pastel
                          }
                        ]}
                      >
                        <View 
                          style={[
                            styles.characterCountFill,
                            { 
                              backgroundColor: isOverLimit 
                                ? 'rgba(247, 138, 138, 0.8)' 
                                : isNearLimit 
                                  ? 'rgba(244, 205, 138, 0.8)' 
                                  : `${getCyclingPastelColor(4, theme)}80`, // Rainbow pastel with opacity
                              transform: [{ 
                                rotate: `${Math.min(360, (characterCount / maxCharacters) * 360)}deg` 
                              }]
                            }
                          ]}
                        />
                      </View>
                      {isNearLimit && (
                        <Text style={[
                          styles.characterCountText,
                          { color: isOverLimit 
                              ? 'rgba(237, 143, 143, 0.9)' 
                              : 'rgba(238, 201, 137, 0.9)' 
                          }
                        ]}>
                          {maxCharacters - characterCount}
                        </Text>
                      )}
                    </View>
                  </>
                )}
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    );
  };

  // REMOVED: Old dating-focused empty state


  return (
    <PageBackground theme={theme} variant="dashboard">
      <SafeAreaView style={styles.container}>
        <Header
          title="Aether"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
          showMenuButton={true}
          onMenuPress={toggleHeaderMenu}
          theme={theme}
          isScrolled={isScrolled}
          isMenuOpen={showHeaderMenu}
        />

        <View style={styles.content}>
          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <LottieLoader size="medium" />
              <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
                Loading your social environment...
              </Text>
            </View>
          ) : error && !refreshing ? (
            <View style={styles.errorContainer}>
              <Feather name="wifi-off" size={48} color={themeColors.textMuted} />
              <Text style={[styles.errorTitle, { color: themeColors.text }]}>
                Connection Error
              </Text>
              <Text style={[styles.errorSubtitle, { color: themeColors.textMuted }]}>
                {error}
              </Text>
              <TouchableOpacity 
                style={[styles.retryButton, { backgroundColor: themeColors.primary }]}
                onPress={refreshCards}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={combinedFeedData}
              renderItem={renderFeedItem}
              keyExtractor={(item) => `${item.type}-${item.type === 'post' ? (item.data as Post).id : (item.data as SocialCard).id}`}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={renderEmptyState}
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing || postsLoading}
                  onRefresh={() => {
                    refreshCards();
                    loadPosts();
                  }}
                  tintColor={themeColors.text}
                />
              }
              style={styles.flatList}
            />
          )}
        </View>

        {renderHangoutModal()}
        {renderStatusModal()}
      </SafeAreaView>

      {/* Header Menu */}
      <HeaderMenu
        visible={showHeaderMenu}
        onClose={() => setShowHeaderMenu(false)}
        onAction={handleMenuAction}
        showAuthOptions={false}
      />

      {/* Floating New Post Button */}
      <TouchableOpacity
        onPress={() => setStatusModalVisible(true)}
        activeOpacity={0.8}
        style={[styles.fab, { 
          backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.8)',
          borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)',
          shadowColor: theme === 'dark' ? '#000000' : '#000000',
        }]}
      >
        <Feather 
          name="edit-3" 
          size={18} 
          color={theme === 'dark' ? '#FFFFFF' : '#333333'}
        />
      </TouchableOpacity>
    </PageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: spacing[12],
  },
  flatList: {
    flex: 1,
  },
  listContent: {
    paddingTop: spacing[3],
    paddingBottom: spacing[8],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingTop: spacing[16],
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: spacing[4],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing[32],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[8],
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'Nunito-SemiBold',
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'Nunito-Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  errorSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing[6],
  },
  retryButton: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: 24,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingTop: 260,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    padding: spacing[3],
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  messageInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing[3],
    marginBottom: spacing[4],
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],

  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing[2],
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  sendButton: {
    // backgroundColor set dynamically
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // New Post Modal Styles
  postModalContent: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '75%',
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 15,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  postModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  closeButton: {
    padding: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: 8,
    borderWidth: 1,
  },
  postModalTitle: {
    fontSize: 20,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
    flex: 1,
    textAlign: 'left',
    marginRight: spacing[6], // Offset for close button
    marginLeft: spacing[4],
  },
  postButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  postButtonText: {
    fontSize: 15,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
  },
  postProfileSection: {
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  postInputContainer: {
    flex: 1,
  },
  postInput: {
    fontSize: 18,
    fontFamily: 'Nunito-Regular',
    lineHeight: 26,
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: spacing[2],
  },
  postToolsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderTopWidth: 1,
  },
  postTools: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  toolButton: {
    padding: spacing[2],
    marginLeft: spacing[3],
  },
  characterCountContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  characterCountWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  characterCountCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  characterCountFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '50%',
    height: '100%',
    transformOrigin: 'right center',
  },
  characterCountText: {
    position: 'absolute',
    fontSize: 11,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
    top: 25,
  },
  // Note: Premium card layout styles moved to PostCard component
  // Floating Action Button
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 64,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    zIndex: 1000,
  },
});

export default FeedScreen;