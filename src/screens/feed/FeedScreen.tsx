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
import { SocialProxyAPI } from '../../services/apiModules/endpoints/social';

// Card Layout Types
type CardLayout = 'classic' | 'modern' | 'minimal' | 'magazine' | 'artistic';
type ProfilePlacement = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-right' | 'inline';
type TextStyle = 'elegant' | 'casual' | 'bold' | 'compact';

interface CardPreferences {
  layout: CardLayout;
  profilePlacement: ProfilePlacement;
  textStyle: TextStyle;
  accentColor: string;
  showEngagement: boolean;
  showTimestamp: boolean;
  showLocation: boolean;
  cardCornerRadius: number;
  textSize: 'small' | 'medium' | 'large';
}

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
      
      if (timelineResponse.success && timelineResponse.timeline) {
        // Transform server activities to Post format for UI compatibility
        const transformedPosts: Post[] = timelineResponse.timeline
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
        console.warn('No timeline data available, using empty array');
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

  // Generate relationship-focused profile data with preferences
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
        gradient: ['#9F7AEA', '#667EEA'],
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
    
    const profiles = [
      { 
        name: 'Emma', 
        avatar: '👩‍🎓', 
        relationship: 'Family',
        relationshipDetail: 'Daughter • College Sophomore',
        location: 'University of Washington',
        color: '#FF6B6B',
        gradient: ['#FF6B6B', '#FF8E53'],
        preferences: {
          layout: 'artistic' as CardLayout,
          profilePlacement: 'bottom-right' as ProfilePlacement,
          textStyle: 'casual' as TextStyle,
          accentColor: '#FF6B6B',
          showEngagement: true,
          showTimestamp: true,
          showLocation: true,
          cardCornerRadius: 24,
          textSize: 'medium' as const
        }
      },
      { 
        name: 'Michael', 
        avatar: '👨‍💼', 
        relationship: 'Family',
        relationshipDetail: 'Son • 42 years old',
        location: 'Denver, CO',
        color: '#4ECDC4',
        gradient: ['#4ECDC4', '#44A08D'],
        preferences: {
          layout: 'classic' as CardLayout,
          profilePlacement: 'top-center' as ProfilePlacement,
          textStyle: 'bold' as TextStyle,
          accentColor: '#4ECDC4',
          showEngagement: true,
          showTimestamp: true,
          showLocation: true,
          cardCornerRadius: 16,
          textSize: 'large' as const
        }
      },
      { 
        name: 'Sarah', 
        avatar: '👩‍⚕️', 
        relationship: 'Friend',
        relationshipDetail: 'College roommate',
        location: 'Seattle, WA',
        color: '#45B7D1',
        gradient: ['#45B7D1', '#2196F3'],
        preferences: {
          layout: 'minimal' as CardLayout,
          profilePlacement: 'inline' as ProfilePlacement,
          textStyle: 'compact' as TextStyle,
          accentColor: '#45B7D1',
          showEngagement: false,
          showTimestamp: false,
          showLocation: true,
          cardCornerRadius: 12,
          textSize: 'small' as const
        }
      },
      { 
        name: 'Jake', 
        avatar: '👨‍🎮', 
        relationship: 'Friend',
        relationshipDetail: 'Gaming buddy from Discord',
        location: 'Online',
        color: '#96CEB4',
        gradient: ['#96CEB4', '#FFECD2'],
        preferences: {
          layout: 'magazine' as CardLayout,
          profilePlacement: 'top-right' as ProfilePlacement,
          textStyle: 'casual' as TextStyle,
          accentColor: '#96CEB4',
          showEngagement: true,
          showTimestamp: true,
          showLocation: false,
          cardCornerRadius: 28,
          textSize: 'medium' as const
        }
      },
      { 
        name: 'Lisa', 
        avatar: '👩‍🏫', 
        relationship: 'Acquaintance',
        relationshipDetail: 'Met at coffee shop',
        location: 'Portland, OR',
        color: '#FFEAA7',
        gradient: ['#FFEAA7', '#FEBF63'],
        preferences: {
          layout: 'modern' as CardLayout,
          profilePlacement: 'bottom-left' as ProfilePlacement,
          textStyle: 'elegant' as TextStyle,
          accentColor: '#FFEAA7',
          showEngagement: true,
          showTimestamp: true,
          showLocation: true,
          cardCornerRadius: 20,
          textSize: 'large' as const
        }
      },
    ];
    
    const hash = author.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0);
    return profiles[Math.abs(hash) % profiles.length];
  }, []);

  const renderPost = useCallback(({ item }: { item: Post }) => {
    const profile = getProfileMockup(item.author);
    const { preferences } = profile;
    
    // Get dynamic text sizes based on preferences
    const getTextSize = (base: number) => {
      switch (preferences.textSize) {
        case 'small': return base - 2;
        case 'large': return base + 2;
        default: return base;
      }
    };
    
    return (
      <View style={[styles.premiumCard, { 
        backgroundColor: themeColors.surface,
        borderColor: themeColors.borders.default,
        borderRadius: preferences.cardCornerRadius,
        marginVertical: preferences.layout === 'minimal' ? spacing[2] : spacing[4],
      }]}>
        {/* Header with profile */}
        <View style={[styles.premiumHeader, {
          backgroundColor: preferences.layout === 'magazine' ? `${profile.color}08` : 'transparent',
        }]}>
          <View style={[styles.profileSection, {
            backgroundColor: `${profile.color}08`,
            borderColor: `${profile.color}20`,
            flexDirection: preferences.profilePlacement === 'inline' ? 'row' : 'column',
            alignItems: preferences.profilePlacement === 'top-center' ? 'center' : 'flex-start',
          }]}>
            <View style={[styles.profileAvatar, {
              backgroundColor: `${profile.color}15`,
              borderColor: `${profile.color}30`,
              width: preferences.layout === 'minimal' ? 50 : 60,
              height: preferences.layout === 'minimal' ? 50 : 60,
              borderRadius: preferences.layout === 'artistic' ? 30 : 18,
              marginRight: preferences.profilePlacement === 'inline' ? spacing[3] : 0,
              marginBottom: preferences.profilePlacement === 'inline' ? 0 : spacing[2],
            }]}>
              <Text style={[styles.profileEmoji, {
                fontSize: preferences.layout === 'minimal' ? 24 : preferences.layout === 'artistic' ? 32 : 28
              }]}>{profile.avatar}</Text>
            </View>
            <View style={{
              flex: preferences.profilePlacement === 'inline' ? 1 : 0,
              alignItems: preferences.profilePlacement === 'top-center' ? 'center' : preferences.profilePlacement === 'top-right' ? 'flex-end' : 'flex-start',
            }}>
              <Text style={[{
                fontSize: getTextSize(18),
                fontFamily: preferences.textStyle === 'bold' ? 'Nunito-Bold' : preferences.textStyle === 'elegant' ? 'Nunito-Light' : 'Nunito-SemiBold',
                fontWeight: preferences.textStyle === 'bold' ? '700' : preferences.textStyle === 'elegant' ? '300' : '600',
                color: themeColors.text,
                marginBottom: spacing[1],
              }]}>
                {profile.name}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing[1] }}>
                <View style={[{
                  backgroundColor: profile.color,
                  paddingHorizontal: spacing[2],
                  paddingVertical: 2,
                  borderRadius: 8,
                  marginRight: spacing[2],
                }]}>
                  <Text style={[{
                    fontSize: getTextSize(10),
                    fontFamily: 'Nunito-SemiBold',
                    fontWeight: '600',
                    color: 'white',
                    textTransform: 'uppercase',
                  }]}>
                    {profile.relationship}
                  </Text>
                </View>
                <Text style={[{
                  fontSize: getTextSize(12),
                  fontFamily: 'Nunito-Regular',
                  color: themeColors.textMuted,
                }]}>
                  {profile.relationshipDetail}
                </Text>
              </View>
              {preferences.showLocation && (
                <Text style={[{
                  fontSize: getTextSize(12),
                  fontFamily: 'Nunito-Regular',
                  color: themeColors.textMuted,
                }]}>
                  {profile.location}
                </Text>
              )}
            </View>
          </View>
          {preferences.showTimestamp && (
            <View style={styles.timestampContainer}>
              <Text style={[styles.timestamp, { color: themeColors.textMuted }]}>
                {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          )}
        </View>

        {/* Content with enhanced expressiveness */}
        <View style={[styles.premiumContent, {
          paddingHorizontal: preferences.layout === 'minimal' ? spacing[4] : spacing[6],
          paddingBottom: preferences.layout === 'minimal' ? spacing[4] : spacing[6],
        }]}>
          <Text style={[{
            fontSize: getTextSize(16),
            lineHeight: getTextSize(preferences.textStyle === 'compact' ? 20 : preferences.textStyle === 'elegant' ? 26 : 24),
            fontFamily: preferences.textStyle === 'bold' ? 'Nunito-SemiBold' : 'Nunito-Regular',
            fontWeight: preferences.textStyle === 'bold' ? '600' : '400',
            color: themeColors.text,
          }]}>
            {item.title}
          </Text>
          
          {/* Add mood indicator based on content */}
          {(item.title.includes('🎉') || item.title.includes('✨') || item.title.includes('🌟')) && (
            <View style={[styles.moodIndicator, { backgroundColor: `${profile.color}15` }]}>
              <Text style={[styles.moodText, { color: profile.color }]}>Celebrating</Text>
            </View>
          )}
          {(item.title.includes('💪') || item.title.includes('🏆') || item.title.includes('CRUSHED')) && (
            <View style={[styles.moodIndicator, { backgroundColor: '#10B98115' }]}>
              <Text style={[styles.moodText, { color: '#10B981' }]}>Achievement</Text>
            </View>
          )}
          {(item.title.includes('🎨') || item.title.includes('🎭') || item.title.includes('INCREDIBLE')) && (
            <View style={[styles.moodIndicator, { backgroundColor: '#8B5CF615' }]}>
              <Text style={[styles.moodText, { color: '#8B5CF6' }]}>Creative</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        {preferences.showEngagement && (
          <View style={[styles.premiumFooter, { 
            borderTopColor: themeColors.borders.default,
            backgroundColor: `${themeColors.surface}F8`,
            borderBottomLeftRadius: preferences.cardCornerRadius,
            borderBottomRightRadius: preferences.cardCornerRadius,
          }]}>
            <View style={styles.engagementStats}>
              <TouchableOpacity 
                style={[styles.engagementButton, {
                  backgroundColor: item.userHasLiked ? '#FF6B6B15' : 'transparent'
                }]}
                onPress={() => handlePostReaction(item.id, 'like')}
              >
                <Feather 
                  name={item.userHasLiked ? "heart" : "heart"}
                  size={18} 
                  color={item.userHasLiked ? "#FF6B6B" : themeColors.textMuted} 
                />
                <Text style={[styles.engagementText, { 
                  color: item.userHasLiked ? "#FF6B6B" : themeColors.textMuted,
                  fontWeight: item.userHasLiked ? '600' : '400'
                }]}>
                  {item.likesCount}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.engagementButton}
                onPress={() => handlePostComment(item.id)}
              >
                <Feather name="message-circle" size={18} color={themeColors.textMuted} />
                <Text style={[styles.engagementText, { color: themeColors.textMuted }]}>
                  {item.commentsCount}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.engagementButton}
                onPress={() => handlePostShare(item.id)}
              >
                <Feather name="share" size={18} color={themeColors.textMuted} />
                <Text style={[styles.engagementText, { color: themeColors.textMuted }]}>
                  {item.sharesCount}
                </Text>
              </TouchableOpacity>
              
              {/* Engagement level indicator */}
              <View style={styles.engagementLevel}>
                {item.engagement === 'high' && (
                  <View style={[styles.engagementDot, { backgroundColor: '#10B981' }]} />
                )}
                {item.engagement === 'medium' && (
                  <View style={[styles.engagementDot, { backgroundColor: '#F59E0B' }]} />
                )}
                {item.engagement === 'low' && (
                  <View style={[styles.engagementDot, { backgroundColor: '#6B7280' }]} />
                )}
              </View>
            </View>
            <View style={[styles.priorityIndicator, { backgroundColor: profile.color }]} />
          </View>
        )}
      </View>
    );
  }, [themeColors, getProfileMockup]);

  // Helper functions for profile placement styles
  const getProfileSectionStyle = (placement: ProfilePlacement, layout: CardLayout) => {
    const baseStyle = {
      borderRadius: 16,
      padding: spacing[4],
      borderWidth: 1,
    };

    switch (placement) {
      case 'top-left':
        return { ...baseStyle, margin: spacing[4], marginBottom: spacing[2] };
      case 'top-center':
        return { ...baseStyle, margin: spacing[4], marginBottom: spacing[2], alignItems: 'center' as const };
      case 'top-right':
        return { ...baseStyle, margin: spacing[4], marginBottom: spacing[2], alignItems: 'flex-end' as const };
      case 'inline':
        return { ...baseStyle, flexDirection: 'row' as const, margin: spacing[4], marginBottom: spacing[2] };
      case 'bottom-left':
        return { ...baseStyle, position: 'absolute' as const, bottom: spacing[4], left: spacing[4], zIndex: 2 };
      case 'bottom-right':
        return { ...baseStyle, position: 'absolute' as const, bottom: spacing[4], right: spacing[4], zIndex: 2 };
      default:
        return baseStyle;
    }
  };

  const getProfileAvatarStyle = (placement: ProfilePlacement, layout: CardLayout) => {
    const baseSize = layout === 'minimal' ? 50 : 60;
    return {
      width: baseSize,
      height: baseSize,
      borderRadius: layout === 'artistic' ? baseSize / 2 : 18,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      borderWidth: 2,
      marginRight: placement === 'inline' ? spacing[3] : 0,
      marginBottom: placement === 'inline' ? 0 : spacing[2],
    };
  };

  const getProfileInfoStyle = (placement: ProfilePlacement, layout: CardLayout) => {
    if (placement === 'inline') {
      return { flex: 1 };
    }
    return { alignItems: placement.includes('center') ? 'center' as const : placement.includes('right') ? 'flex-end' as const : 'flex-start' as const };
  };

  const getProfileEmojiSize = (layout: CardLayout) => {
    switch (layout) {
      case 'minimal':
        return { fontSize: 24 };
      case 'artistic':
        return { fontSize: 32 };
      default:
        return { fontSize: 28 };
    }
  };

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
  // Premium Card Layout
  premiumCard: {
    marginHorizontal: spacing[4],
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  premiumHeader: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
    paddingBottom: spacing[4],
  },
  profileSection: {
    borderRadius: 16,
    padding: spacing[4],
    borderWidth: 1,
    marginBottom: spacing[3],
  },
  profileEmoji: {
    fontSize: 28,
  },
  timestampContainer: {
    alignItems: 'flex-end',
  },
  timestamp: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
  },
  premiumContent: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[6],
  },
  premiumFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderTopWidth: 1,
  },
  engagementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  // Mood and expressiveness indicators
  moodIndicator: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: 12,
    marginTop: spacing[3],
  },
  moodText: {
    fontSize: 12,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
  },
  engagementLevel: {
    marginLeft: spacing[2],
  },
  engagementDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  engagementStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2], // Tighter spacing for premium look
  },
  engagementStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  engagementText: {
    fontSize: 13, // Slightly larger
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
  },
  priorityIndicator: {
    width: 5, // Slightly wider
    height: 24, // Taller for premium feel
    borderRadius: 3, // More rounded
  },
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