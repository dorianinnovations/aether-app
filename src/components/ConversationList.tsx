/**
 * ConversationList - Reusable conversation list component
 * Handles rendering of conversations with different types and actions
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LottieLoader, ConversationSkeleton } from '../design-system/components/atoms';
import { getThemeColors, designTokens } from '../design-system/tokens/colors';
import { spacing } from '../design-system/tokens/spacing';
import { typography } from '../design-system/tokens/typography';
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
  isRefreshing: boolean;
  isTabSwitching: boolean;
  isAnimating: boolean;
  longPressedId: string | null;
  onConversationSelect: (conversation: Conversation) => void;
  onDeleteConversation: (conversationId: string) => void;
  onHeatmapLongPress: (friend: { username: string }, conversationId: string) => void;
  onHeatmapPressOut: () => void;
  onRefresh: () => void;
  setLongPressedId: (id: string | null) => void;
  itemRefs: React.MutableRefObject<{ [key: string]: View }>;
  // Friends list props
  friends?: Friend[];
  onFriendMessagePress?: (friendUsername: string) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  currentTab,
  tabs,
  currentConversationId,
  theme,
  isLoading,
  isRefreshing,
  isTabSwitching,
  isAnimating,
  longPressedId,
  onConversationSelect,
  onDeleteConversation,
  onHeatmapLongPress,
  onHeatmapPressOut,
  onRefresh,
  setLongPressedId,
  itemRefs,
  friends = [],
  onFriendMessagePress,
}) => {
  const themeColors = getThemeColors(theme);

  // Render friend item (similar to FriendsScreen FriendCard)
  const renderFriendItem = ({ item }: { item: Friend }) => {
    return (
      <View
        style={[
          styles.friendCard,
          {
            backgroundColor: theme === 'dark' 
              ? designTokens.surfaces.dark.elevated 
              : designTokens.surfaces.light.elevated,
            borderColor: theme === 'dark' 
              ? designTokens.borders.dark.subtle 
              : designTokens.borders.light.subtle,
          }
        ]}
      >
        <View style={[
          styles.avatar,
          {
            backgroundColor: theme === 'dark' 
              ? designTokens.borders.dark.default 
              : designTokens.borders.light.default,
          }
        ]} />
        
        <View style={styles.friendInfo}>
          <Text style={[
            styles.friendName,
            { color: themeColors.text }
          ]}>
            {item.username}
          </Text>
          
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusDot,
              {
                backgroundColor: item.status === 'online' 
                  ? designTokens.semantic.success 
                  : item.status === 'away' 
                  ? designTokens.semantic.warning 
                  : designTokens.text.muted
              }
            ]} />
            <Text style={[
              styles.statusText,
              { color: themeColors.textSecondary }
            ]}>
              {item.status === 'online' ? 'Online' : 
               item.status === 'away' ? 'Away' : 
               item.lastSeen || 'Offline'}
            </Text>
          </View>
        </View>

        {/* Message Button */}
        {onFriendMessagePress && (
          <TouchableOpacity
            style={[
              styles.messageButton,
              {
                backgroundColor: theme === 'dark' 
                  ? designTokens.brand.surfaceDark 
                  : designTokens.brand.primary,
                borderColor: theme === 'dark' 
                  ? designTokens.borders.dark.default 
                  : 'transparent',
                borderWidth: theme === 'dark' ? 1 : 0,
              }
            ]}
            onPress={() => {
              if (isAnimating) return;
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onFriendMessagePress(item.username);
            }}
            activeOpacity={0.8}
            disabled={isAnimating}
          >
            <Feather
              name="message-circle"
              size={16}
              color={theme === 'dark' ? '#ffffff' : '#1a1a1a'}
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const tabConfig = tabs[currentTab];
    const isSelected = item._id === currentConversationId;
    
    const getTabSpecificStyling = () => {
      switch (currentTab) {
        case 0: // Aether - AI conversations
          return {
            accentColor: tabConfig.color,
            icon: 'message-circle',
            badge: `${item.messageCount}`,
            subtitle: item.summary || `${item.messageCount} messages`
          };
        case 1: // Friends - People
          const friendItem = item as Conversation & { streak?: number; lastMessage?: string | unknown };
          let lastMessageText = '';
          let lastMessageTime = '';
          
          if (typeof friendItem.lastMessage === 'string') {
            lastMessageText = friendItem.lastMessage;
          } else if (friendItem.lastMessage && typeof friendItem.lastMessage === 'object') {
            const msgObj = friendItem.lastMessage as Record<string, unknown>;
            lastMessageText = String(msgObj.content || msgObj.message || msgObj.text || '');
          }
          lastMessageText = String(lastMessageText || '').trim();
          
          // Format the last activity as a relative time
          if (item.lastActivity && item.lastActivity !== 'No messages yet' && item.lastActivity !== 'Recently active') {
            const lastDate = new Date(item.lastActivity);
            const now = new Date();
            const diffMs = now.getTime() - lastDate.getTime();
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMins = Math.floor(diffMs / (1000 * 60));
            
            if (diffMins < 1) {
              lastMessageTime = 'just now';
            } else if (diffMins < 60) {
              lastMessageTime = `${diffMins}m ago`;
            } else if (diffHours < 24) {
              lastMessageTime = `${diffHours}h ago`;
            } else if (diffDays < 7) {
              lastMessageTime = `${diffDays}d ago`;
            } else {
              lastMessageTime = lastDate.toLocaleDateString();
            }
          }
          
          let subtitle = '';
          if (lastMessageText) {
            subtitle = lastMessageText.length > 40 ? lastMessageText.substring(0, 40) + '...' : lastMessageText;
            if (lastMessageTime) {
              subtitle += ` • ${lastMessageTime}`;
            }
          } else if (friendItem.messageCount > 0) {
            subtitle = `${friendItem.messageCount} messages`;
            if (lastMessageTime) {
              subtitle += ` • ${lastMessageTime}`;
            }
          } else {
            subtitle = 'Tap to start chatting';
          }
          
          return {
            accentColor: tabConfig.color,
            icon: 'user',
            badge: friendItem.streak && friendItem.streak > 0 ? `🔥${friendItem.streak}` : '•',
            subtitle: subtitle
          };
        case 2: // Orbit - Heatmap conversations
          return {
            accentColor: tabConfig.color,
            icon: 'activity',
            badge: '•',
            subtitle: item.summary || 'Heatmap visualization'
          };
        default:
          return {
            accentColor: '#666',
            icon: 'file',
            badge: `${item.messageCount}`,
            subtitle: `${item.messageCount} messages`
          };
      }
    };
    
    const styling = getTabSpecificStyling();
    
    return (
      <View
        ref={(ref) => {
          if (ref) {
            itemRefs.current[item._id] = ref;
          }
        }}
        style={[
          styles.conversationItem,
          {
            backgroundColor: isSelected
              ? (theme === 'dark' ? themeColors.primary + '15' : themeColors.primary + '10')
              : (theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'),
            borderTopWidth: 0.5,
            borderRightWidth: 0.5,
            borderBottomWidth: 0.5,
            borderTopColor: theme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
            borderRightColor: theme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
            borderBottomColor: theme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
          }
        ]}
      >
        <TouchableOpacity 
          style={[
            styles.conversationTouchable,
            longPressedId === item._id && { 
              backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
              transform: [{ scale: 0.98 }]
            }
          ]}
          onPress={() => {
            if (isAnimating) return;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onConversationSelect(item);
          }}
          onLongPress={() => {
            if (isAnimating) return;
            if (currentTab === 1 && item.friendUsername) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              onHeatmapLongPress({ username: item.friendUsername }, item._id);
            } else if (currentTab === 0) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              setLongPressedId(item._id);
              setTimeout(() => {
                setLongPressedId(null);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                onDeleteConversation(item._id);
              }, 200);
            }
          }}
          onPressOut={() => {
            if (currentTab === 1) {
              onHeatmapPressOut();
            }
          }}
          delayLongPress={500}
          activeOpacity={0.85}
          disabled={isAnimating}
        >
          <View style={styles.conversationContent}>
            <View style={styles.conversationText}>
              <Text style={[
                styles.conversationTitle,
                typography.textStyles.bodyMedium,
                { color: themeColors.text }
              ]}>
                {currentTab === 1 && item.friendUsername && item.title 
                  ? String(item.title) 
                  : String(item.title || 'Untitled Conversation')}
              </Text>
              <Text style={[
                styles.conversationMeta,
                typography.textStyles.bodySmall,
                { color: themeColors.textSecondary }
              ]}>
                {String(styling.subtitle || '')}
              </Text>
            </View>
            
            <View style={styles.conversationActions}>
              {isSelected && (
                <View style={[
                  styles.selectedDot,
                  { backgroundColor: themeColors.primary }
                ]} />
              )}
              <View style={[
                styles.badgeContainer,
                { 
                  backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                }
              ]}>
                <Text style={[
                  styles.badgeText,
                  { color: themeColors.textSecondary }
                ]}>
                  {String(styling.badge || '')}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>
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
  
  const renderEmptyState = () => {
    const tabConfig = tabs[currentTab];
    const getEmptyMessage = () => {
      if (isLoading) return 'Loading...';
      
      switch (currentTab) {
        case 0: return 'Start your first conversation with Aether';
        case 1: return 'Add friends to start messaging';
        case 2: return 'View messaging heatmaps with friends';
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
            <View style={[
              styles.emptyIcon,
              { 
                backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.15)',
                borderWidth: 1,
                borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              }
            ]}>
              <Feather 
                name={tabConfig.icon as FeatherIconNames} 
                size={28} 
                color={themeColors.text} 
              />
            </View>
            <Text style={[
              styles.emptyTitle,
              { color: themeColors.text }
            ]}>
              {tabConfig.label}
            </Text>
            <Text style={[
              styles.emptyText,
              { color: themeColors.textSecondary }
            ]}>
              {emptyMessage}
            </Text>
          </>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {isRefreshing && (
        <View style={styles.refreshIndicator}>
          <LottieLoader
            size={40}
            style={{ width: 40, height: 40 }}
          />
        </View>
      )}
      
      {isTabSwitching ? (
        renderSkeletonLoader()
      ) : currentTab === 1 ? (
        // Friends tab
        <FlatList
          data={friends}
          renderItem={renderFriendItem}
          keyExtractor={(item: Friend) => item.username}
          style={styles.list}
          contentContainerStyle={[
            styles.listContent,
            isRefreshing && { paddingTop: 60 } 
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          scrollEnabled={!isAnimating}
          ItemSeparatorComponent={() => <View style={{ height: spacing[2] }} />}
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
      ) : (
        // Conversations tabs
        <FlatList
          data={conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item: Conversation) => item._id}
          style={styles.list}
          contentContainerStyle={[
            styles.listContent,
            isRefreshing && { paddingTop: 60 } 
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
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
    paddingVertical: spacing[2],
  },
  conversationItem: {
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: spacing[3],
    marginVertical: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  conversationTouchable: {
    flex: 1,
  },
  conversationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    gap: spacing[2],
    minHeight: 56,
  },
  conversationText: {
    flex: 1,
    gap: 2,
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    fontFamily: 'Inter-Medium',
    letterSpacing: -0.2,
  },
  conversationMeta: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 18,
    fontFamily: 'Inter-Regular',
    opacity: 0.65,
  },
  conversationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  badgeContainer: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: 'JetBrainsMono-Medium',
    letterSpacing: 0,
  },
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
    width: 64,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: 4,
    alignSelf: 'center',
  },
  emptyTitle: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: -0.3,
    marginBottom: 4,
    textAlign: 'center',
    alignSelf: 'center',
  },
  emptyText: {
    fontSize: 11,
    fontWeight: '400',
    fontFamily: 'Poppins-Regular',
    letterSpacing: -0.3,
    textAlign: 'center',
    lineHeight: 20,
    alignSelf: 'center',
    maxWidth: 200,
  },
  
  skeletonContainer: {
    flex: 1,
    paddingVertical: spacing[2],
  },
  
  // Friend card styles (from FriendsScreen)
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 68,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[5],
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: spacing[3],
    marginVertical: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: spacing[3],
  },
  friendInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  friendName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '400',
  },
  messageButton: {
    width: 84,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing[3],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
});
