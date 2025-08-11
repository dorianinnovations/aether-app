/**
 * ConversationList - Revolutionary Inbox-Style List Component
 * Utility-focused rendering with exploration-encouraging patterns
 * Supports Aether conversations, friend connections, and group chats
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  RefreshControl,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  PanGestureHandler,
  State,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { LottieLoader, ConversationSkeleton } from '../design-system/components/atoms';
import { getThemeColors } from '../design-system/tokens/colors';
import { spacing } from '../design-system/tokens/spacing';
import { Conversation } from '../hooks/useConversationData';
import { TabConfig } from '../hooks/useConversationTabs';

type FeatherIconNames = keyof typeof Feather.glyphMap;

interface Friend {
  username: string;
  friendId?: string;
  name?: string;
  avatar?: string;
  status?: 'online' | 'offline' | 'away';
  lastSeen?: string;
  addedAt?: string;
  topInterests?: string[];
}

interface ConversationListProps {
  conversations: Conversation[];
  currentTab: number;
  tabs: TabConfig[];
  currentConversationId?: string;
  theme: 'light' | 'dark';
  isLoading: boolean;
  isLoadingMore?: boolean;
  hasMoreConversations?: boolean;
  isRefreshing: boolean;
  isTabSwitching: boolean;
  isAnimating: boolean;
  longPressedId: string | null;
  onConversationSelect: (conversation: Conversation) => void;
  onDeleteConversation: (conversationId: string) => void;
  onArtistListeningPress: (artist: { id: string; name: string }, itemId: string) => void;
  onArtistListeningClose: () => void;
  onRefresh: () => void;
  onLoadMore?: () => void;
  setLongPressedId: (id: string | null) => void;
  itemRefs: React.MutableRefObject<{ [key: string]: View }>;
  friends?: Friend[];
  onFriendMessagePress?: (friendUsername: string) => void;
  onFriendProfilePress?: (friendUsername: string) => void;
}

// Swipeable conversation item wrapper component
const SwipeableConversationItem: React.FC<{
  children: React.ReactNode;
  onDelete: () => void;
  theme: 'light' | 'dark';
  disabled?: boolean;
}> = ({ children, onDelete, theme, disabled = false }) => {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const performDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onDelete();
  };

  const gestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    { startX: number }
  >({
    onStart: (_, context) => {
      context.startX = translateX.value;
    },
    onActive: (event, context) => {
      // Only allow left swipe (negative translation) with maximum limit
      const maxSwipe = -60; // Limit how far left it can go
      const newTranslateX = Math.max(maxSwipe, Math.min(0, context.startX + event.translationX));
      translateX.value = newTranslateX;
    },
    onEnd: (event) => {
      const swipeThreshold = -30;
      const deleteThreshold = -50;

      if (event.translationX < deleteThreshold) {
        // Auto-delete
        runOnJS(performDelete)();
      } else if (event.translationX < swipeThreshold) {
        // Snap to reveal delete action
        translateX.value = withSpring(-60);
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      } else {
        // Snap back to original position
        translateX.value = withSpring(0);
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  const deleteButtonStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < -15 ? 1 : 0,
    transform: [
      { 
        translateX: translateX.value < -15 
          ? Math.max(-60, translateX.value + 60) 
          : 0 
      }
    ],
  }));

  return (
    <View style={styles.swipeContainer}>
      {/* Delete button background */}
      <Animated.View style={[styles.deleteBackground, deleteButtonStyle]}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={performDelete}
          activeOpacity={0.7}
        >
          <Feather name="trash-2" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>

      {/* Main content */}
      <PanGestureHandler onGestureEvent={gestureHandler} enabled={!disabled}>
        <Animated.View style={animatedStyle}>
          {children}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  currentTab,
  tabs,
  currentConversationId,
  theme,
  isLoading,
  isLoadingMore = false,
  hasMoreConversations = false,
  isRefreshing,
  isTabSwitching,
  isAnimating,
  longPressedId,
  onConversationSelect,
  onDeleteConversation,
  onArtistListeningPress,
  onRefresh,
  onLoadMore,
  setLongPressedId,
  itemRefs,
  friends = [],
  onFriendMessagePress,
  onFriendProfilePress,
}) => {
  const themeColors = getThemeColors(theme);

  // Utility function to format relative time
  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return 'Recently';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // Render utility-focused friend connection card
  const renderFriendItem = ({ item }: { item: Friend }) => {
    
    return (
      <TouchableOpacity
        style={[
          styles.inboxItem,
          styles.friendItem,
        ]}
        onPress={() => onFriendMessagePress?.(item.username)}
        activeOpacity={0.8}
      >
        <View style={styles.inboxItemHeader}>
          <View style={styles.inboxItemMeta}>
            {/* Friend Avatar */}
            <View style={[
              styles.inboxAvatar,
              styles.friendAvatar,
              {
                backgroundColor: theme === 'dark' 
                  ? 'rgba(255, 107, 107, 0.12)' 
                  : 'rgba(255, 107, 107, 0.08)',
                borderWidth: item.avatar ? 0 : 1,
                borderColor: theme === 'dark' 
                  ? 'rgba(255, 107, 107, 0.2)' 
                  : 'rgba(255, 107, 107, 0.15)',
              }
            ]}>
              {item.avatar ? (
                <Image
                  source={{ uri: item.avatar }}
                  style={styles.friendProfileImage}
                  resizeMode="cover"
                />
              ) : (
                <Feather name="user" size={16} color="#FF6B6B" />
              )}
            </View>
            
            <View style={styles.inboxItemInfo}>
              <Text style={[
                styles.inboxItemTitle,
                { color: themeColors.text }
              ]}>
                {item.name || item.username}
              </Text>
              
              <Text style={[
                styles.inboxItemStatus,
                { color: themeColors.textSecondary }
              ]}>
                @{item.username}
              </Text>
            </View>
          </View>
          
          <View style={styles.friendActions}>
            <TouchableOpacity
              style={styles.friendActionButton}
              onPress={() => onFriendProfilePress?.(item.username)}
              activeOpacity={0.7}
            >
              <Feather name="arrow-right" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Revolutionary utility-focused conversation item renderer
  const renderConversationItem = ({ item }: { item: Conversation }) => {
    
    // Get contextual styling based on channel type
    const getChannelStyling = () => {
      switch (currentTab) {
        case 0: // Aether AI Channel
          return {
            channelColor: theme === 'dark' ? '#8B8B8B' : '#666666',
            channelIcon: undefined,
            channelBg: theme === 'dark' ? 'rgba(139, 139, 139, 0.08)' : 'rgba(102, 102, 102, 0.06)',
            utilityText: `${item.messageCount} exchanges`,
            statusText: item.summary || 'AI conversation',
            timeAgo: formatTimeAgo(item.lastActivity),
          };
        case 1: // Friends Channel  
          return {
            channelColor: '#FF6B6B',
            channelIcon: 'heart',
            channelBg: theme === 'dark' ? 'rgba(255, 107, 107, 0.08)' : 'rgba(255, 107, 107, 0.06)',
            utilityText: 'Friend connection',
            statusText: 'Ready to chat',
            timeAgo: formatTimeAgo(item.lastActivity),
          };
        default:
          return {
            channelColor: themeColors.textSecondary,
            channelIcon: 'message-circle',
            channelBg: 'transparent',
            utilityText: 'Conversation',
            statusText: 'Active',
            timeAgo: formatTimeAgo(item.lastActivity),
          };
      }
    };
    
    const styling = getChannelStyling();
    
    const conversationContent = (
      <TouchableOpacity
        style={[
          styles.inboxItem,
          styles.conversationItem,
          {
            backgroundColor: 'transparent',
          }
        ]}
        onPress={() => {
          if (!isAnimating) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onConversationSelect(item);
          }
        }}
        onLongPress={() => {
          if (!isAnimating) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setLongPressedId(item._id);
          }
        }}
        activeOpacity={0.8}
        disabled={isAnimating}
        ref={(ref) => {
          if (ref) {
            itemRefs.current[item._id] = ref;
          }
        }}
      >
        <View style={styles.inboxItemHeader}>
          <View style={styles.inboxItemMeta}>
            
            <View style={styles.inboxItemInfo}>
              <View style={styles.inboxItemTitleRow}>
                <Text style={[
                  styles.inboxItemTitle,
                  { color: themeColors.text }
                ]} numberOfLines={1}>
                  {item.title || item.summary || (item.messages?.[0]?.content ? 
                    item.messages[0].content.slice(0, 40) + (item.messages[0].content.length > 40 ? '...' : '') :
                    `Chat ${formatTimeAgo(item.createdAt || item.lastActivity)}`
                  )}
                </Text>
                
                <Text style={[
                  styles.inboxItemTime,
                  { color: themeColors.textSecondary }
                ]}>
                  {styling.timeAgo}
                </Text>
              </View>
              
              
            </View>
          </View>
          
          <View style={styles.inboxItemActions}>
            {longPressedId === item._id && (
              <TouchableOpacity
                style={[
                  styles.inboxItemAction,
                  styles.deleteAction,
                  {
                    backgroundColor: theme === 'dark' 
                      ? 'rgba(255, 59, 48, 0.15)' 
                      : 'rgba(255, 59, 48, 0.12)',
                  }
                ]}
                onPress={() => {
                  onDeleteConversation(item._id);
                  setLongPressedId(null);
                }}
                activeOpacity={0.7}
              >
                <Feather name="trash-2" size={14} color="#FF3B30" />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[
                styles.inboxItemAction,
                {
                  backgroundColor: 'transparent',
                  borderWidth: 0,
                }
              ]}
              onPress={() => {
                if (!isAnimating) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onConversationSelect(item);
                }
              }}
              activeOpacity={0.7}
            >
              <Feather name="arrow-right" size={14} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );

    // Wrap conversation content with swipeable functionality
    return (
      <SwipeableConversationItem
        onDelete={() => onDeleteConversation(item._id)}
        theme={theme}
        disabled={isAnimating}
      >
        {conversationContent}
      </SwipeableConversationItem>
    );
  };

  const renderSkeletonLoader = () => {
    return (
      <View style={styles.skeletonContainer}>
        {[...Array(4)].map((_, index) => (
          <ConversationSkeleton 
            key={index} 
            delay={index * 100} 
          />
        ))}
      </View>
    );
  };
  
  const renderLoadMoreButton = () => {
    if (!hasMoreConversations || currentTab !== 0) return null;
    
    return (
      <View style={styles.loadMoreContainer}>
        <TouchableOpacity
          style={[
            styles.loadMoreButton,
            {
              backgroundColor: theme === 'dark' ? 'rgba(42, 42, 42, 0.8)' : 'rgba(248, 248, 248, 0.8)',
              borderWidth: 1,
              borderColor: theme === 'dark' ? '#3A3A3A' : '#E0E0E0',
            }
          ]}
          onPress={onLoadMore}
          disabled={isLoadingMore}
          activeOpacity={0.7}
        >
          {isLoadingMore ? (
            <LottieLoader size={16} style={{ width: 16, height: 16 }} />
          ) : (
            <Text style={[
              styles.loadMoreText,
              { color: themeColors.textSecondary }
            ]}>
              Load older conversations
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyState = () => {
    const tabConfig = tabs[currentTab];
    const getEmptyMessage = () => {
      if (isLoading) return 'Loading...';
      
      switch (currentTab) {
        case 0: return 'Start your first conversation with Aether';
        case 1: return 'Add friends to start messaging';
        default: return 'No conversations yet';
      }
    };
    
    const emptyMessage = getEmptyMessage();
    
    return (
      <View style={styles.emptyState}>
        {isLoading ? (
          <LottieLoader
            size={60}
            style={{ width: 60, height: 60 }}
          />
        ) : (
          <>
            <View style={styles.emptyIcon}>
              <Feather 
                name={tabConfig.icon as FeatherIconNames} 
                size={20} 
                color={themeColors.textSecondary} 
              />
            </View>
            <Text style={[
              styles.emptyTitle, 
              { color: themeColors.textSecondary }
            ]}>
              {emptyMessage}
            </Text>
          </>
        )}
      </View>
    );
  };

  // Data and render logic
  const getData = () => {
    return currentTab === 1 ? friends : conversations;
  };
  
  const handleRenderItem = ({ item }: { item: Friend | Conversation }) => {
    if (currentTab === 1) {
      return renderFriendItem({ item: item as Friend });
    } else {
      return renderConversationItem({ item: item as Conversation });
    }
  };

  return (
    <View style={styles.container}>
      {isRefreshing && (
        <View style={styles.refreshIndicator}>
          <LottieLoader size={24} style={{ width: 24, height: 24 }} />
        </View>
      )}
      
      {isTabSwitching ? (
        renderSkeletonLoader()
      ) : (
        <FlatList
          data={getData()}
          renderItem={handleRenderItem}
          keyExtractor={(item: Friend | Conversation) => {
            if (currentTab === 1) {
              // Friends
              const friend = item as Friend;
              return friend.username || friend.friendId || Math.random().toString();
            } else {
              // Conversations
              const conversation = item as Conversation;
              return conversation._id || Math.random().toString();
            }
          }}
          style={styles.list}
          contentContainerStyle={[
            styles.listContent,
            isRefreshing && { paddingTop: 60 } 
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderLoadMoreButton}
          scrollEnabled={!isAnimating}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="transparent"
              title=""
              colors={['transparent']}
              progressBackgroundColor="transparent"
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  refreshIndicator: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2],
  },
  
  // Minimal Inbox Item Styles
  inboxItem: {
    marginVertical: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  
  inboxItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  inboxItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing[2],
  },
  
  inboxAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  friendAvatar: {
    borderRadius: 16,
  },

  friendProfileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  
  inboxItemInfo: {
    flex: 1,
    gap: spacing[1],
  },
  
  inboxItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  inboxItemTitle: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    flex: 1,
  },
  
  inboxItemTime: {
    fontSize: 11,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    opacity: 0.6,
    marginLeft: 16,
  },
  
  inboxItemSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  
  statusIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  
  inboxItemStatus: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'Nunito-Regular',
    opacity: 0.7,
  },
  
  utilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing[1],
  },
  
  utilityText: {
    fontSize: 10,
    fontWeight: '400',
    fontFamily: 'Nunito-Regular',
    opacity: 0.6,
  },
  
  activityBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: 8,
  },
  
  activityBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  
  inboxItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  
  friendActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },

  friendActionButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  
  inboxItemAction: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  deleteAction: {
    borderColor: 'rgba(255, 59, 48, 0.2)',
  },
  
  // Friend-specific styles
  friendItem: {
    borderRadius: 20,
  },
  
  interestTags: {
    flexDirection: 'row',
    gap: spacing[1],
    marginTop: spacing[1],
  },
  
  interestTag: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },
  
  interestTagText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.3,
  },
  
  // Conversation-specific styles
  conversationItem: {
    borderRadius: 16,
  },
  
  // Legacy/Empty state styles
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[4],
    paddingTop: 40,
    paddingBottom: 80,
    gap: 16,
  },
  
  emptyIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  
  emptyTitle: {
    fontSize: 10,
    fontWeight: '400',
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
    opacity: 0.6,
  },
  
  skeletonContainer: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
    gap: spacing[2],
  },

  // Load More Button styles
  loadMoreContainer: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    alignItems: 'center',
  },
  
  loadMoreButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 140,
  },
  
  loadMoreText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    letterSpacing: -0.2,
  },

  // Swipe-to-delete styles
  swipeContainer: {
    position: 'relative',
    overflow: 'hidden',
  },

  deleteBackground: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 60,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    marginVertical: spacing[2],
    justifyContent: 'center',
    alignItems: 'center',
  },

  deleteButton: {
    width: 60,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});