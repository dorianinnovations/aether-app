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
import { getThemeColors } from '../design-system/tokens/colors';
import { spacing } from '../design-system/tokens/spacing';
import { typography } from '../design-system/tokens/typography';
import { Conversation } from '../hooks/useConversationData';
import { TabConfig } from '../hooks/useConversationTabs';

type FeatherIconNames = keyof typeof Feather.glyphMap;

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
  onHeatmapSelect: (friend: { username: string; displayName?: string }) => void;
  onRefresh: () => void;
  setLongPressedId: (id: string | null) => void;
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
  onHeatmapSelect,
  onRefresh,
  setLongPressedId,
}) => {
  const themeColors = getThemeColors(theme);

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const tabConfig = tabs[currentTab];
    const isSelected = item._id === currentConversationId;
    
    // Different styling based on tab type
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
          // Safely extract the last message text - handle object format
          let lastMessageText = '';
          if (typeof friendItem.lastMessage === 'string') {
            lastMessageText = friendItem.lastMessage;
          } else if (friendItem.lastMessage && typeof friendItem.lastMessage === 'object') {
            const msgObj = friendItem.lastMessage as Record<string, unknown>;
            lastMessageText = String(msgObj.content || msgObj.message || msgObj.text || '');
          }
          // Ensure we have a valid string
          lastMessageText = String(lastMessageText || '').trim();
          return {
            accentColor: tabConfig.color,
            icon: 'user',
            badge: friendItem.streak && friendItem.streak > 0 ? `🔥${friendItem.streak}` : '•',
            subtitle: lastMessageText || (friendItem.messageCount > 0 ? `${friendItem.messageCount} messages` : 'Tap to start chatting')
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
        style={[
          styles.conversationItem,
          {
            backgroundColor: isSelected
              ? (theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)')
              : 'transparent',
            borderLeftWidth: isSelected ? 2 : 0,
            borderLeftColor: isSelected ? themeColors.primary : 'transparent',
            borderWidth: 1,
            borderColor: theme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)',
          }
        ]}
      >
        <TouchableOpacity 
          style={[
            styles.conversationTouchable,
            longPressedId === item._id && { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
          ]}
          onPress={() => {
            if (isAnimating) return;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            
            // For Orbit tab (heatmap), show modal instead of selecting conversation
            if (currentTab === 2 && item.friendUsername) {
              onHeatmapSelect({
                username: item.friendUsername,
                displayName: item.displayName || item.title
              });
            } else {
              onConversationSelect(item);
            }
          }}
          onLongPress={() => {
            if (isAnimating || currentTab !== 0) return; // Only allow delete for Aether tab
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setLongPressedId(item._id);
            
            // Show delete confirmation after brief highlight
            setTimeout(() => {
              setLongPressedId(null);
              // Simple confirm dialog simulation with haptic feedback
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              onDeleteConversation(item._id);
            }, 200);
          }}
          delayLongPress={500}
          activeOpacity={0.85}
          disabled={isAnimating}
        >
          {/* Icon and content */}
          <View style={styles.conversationContent}>
            <View style={[
              styles.conversationIcon,
              { 
                backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                borderWidth: 1,
                borderColor: theme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)',
              }
            ]}>
              <Feather 
                name={styling.icon as FeatherIconNames} 
                size={16}
                color={themeColors.textSecondary} 
              />
            </View>
            
            <View style={styles.conversationText}>
              <Text style={[
                styles.conversationTitle,
                typography.textStyles.bodyMedium,
                { color: themeColors.text }
              ]}>
                {String(item.title || 'Untitled Conversation')}
              </Text>
              <Text style={[
                styles.conversationMeta,
                typography.textStyles.bodySmall,
                { color: themeColors.textSecondary }
              ]}>
                {String(styling.subtitle || '')}
              </Text>
            </View>
            
            {/* Badge and Chat Icon for Friends */}
            <View style={styles.conversationActions}>
              <View style={[
                styles.conversationBadge,
                { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }
              ]}>
                <Text style={[
                  styles.badgeText,
                  { color: themeColors.textSecondary }
                ]}>
                  {String(styling.badge || '')}
                </Text>
              </View>
              
              {/* Add chat icon for friend conversations */}
              {currentTab === 1 && (
                <View style={[
                  styles.chatIcon,
                  { 
                    backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                    borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  }
                ]}>
                  <Feather 
                    name="message-circle" 
                    size={12}
                    color={themeColors.textSecondary} 
                  />
                </View>
              )}
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
            delay={index * 100} // Stagger the animation slightly
          />
        ))}
      </View>
    );
  };
  
  const renderEmptyState = () => {
    const tabConfig = tabs[currentTab];
    const getEmptyMessage = () => {
      if (isLoading) return 'Loading conversations...';
      
      switch (currentTab) {
        case 0: return 'Start your first conversation with Aether';
        case 1: return 'Add friends from the chat screen to start messaging';
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
      {/* Custom Lottie Refresh Indicator */}
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
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item._id}
          style={styles.list}
          contentContainerStyle={[
            styles.listContent,
            isRefreshing && { paddingTop: 60 } // Add padding when refreshing to account for Lottie
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
    borderRadius: 8,
    overflow: 'hidden',
    marginHorizontal: spacing[3],
    marginVertical: spacing[1],
  },
  conversationTouchable: {
    flex: 1,
  },
  conversationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    gap: spacing[3],
  },
  conversationIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conversationText: {
    flex: 1,
    gap: 2,
  },
  conversationTitle: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 18,
    fontFamily: 'Poppins-SemiBold',
  },
  conversationMeta: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 14,
    fontFamily: 'Poppins-Regular',
  },
  conversationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  conversationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: 'Poppins-Medium',
  },
  chatIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
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
  
  // Skeleton loader styles
  skeletonContainer: {
    flex: 1,
    paddingVertical: spacing[2],
  },
});