import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Animated,
  Modal,
  Easing,
  TouchableOpacity,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { designTokens } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';
import { 
  ConversationTabBar, 
  ConversationItem, 
  ConversationEmptyState,
  ConversationActionBar 
} from '../molecules';
import { useConversationEvents } from '../../../hooks/useConversationEvents';
import { log } from '../../../utils/logger';
import { ConversationAPI, FriendsAPI } from '../../../services/api';

const { width: screenWidth } = Dimensions.get('window');

interface Conversation {
  _id: string;
  title: string;
  lastActivity: string;
  messageCount: number;
  summary?: string;
  type?: 'aether' | 'friend' | 'custom';
}

interface ConversationDrawerProps {
  isVisible: boolean;
  onClose: () => void;
  onConversationSelect: (conversation: Conversation) => void;
  onStartNewChat?: () => void;
  currentConversationId?: string;
  theme: 'light' | 'dark';
}

const ConversationDrawer: React.FC<ConversationDrawerProps> = ({
  isVisible,
  onClose,
  onConversationSelect,
  onStartNewChat,
  currentConversationId,
  theme,
}) => {
  const [currentTab, setCurrentTab] = useState(0);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [longPressedId, setLongPressedId] = useState<string | null>(null);
  
  const [conversationCache, setConversationCache] = useState<{
    [key: number]: { data: Conversation[], timestamp: number }
  }>({});
  const CACHE_DURATION = 30000;
  
  const slideAnim = useRef(new Animated.Value(-screenWidth * 0.85)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  
  // Removed unused themeColors

  const tabs = [
    { label: 'Aether', icon: 'message-circle' },
    { label: 'Friends', icon: 'users' },
    { label: 'Custom', icon: 'settings' }
  ];

  const eventHandlers = useRef({
    onConversationCreated: (conversation: Conversation) => {
      log.debug('Real-time: Conversation created', conversation);
      setConversations(prev => [conversation, ...prev]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    
    onConversationUpdated: (conversation: Conversation) => {
      log.debug('Real-time: Conversation updated', conversation);
      setConversations(prev => prev.map(conv => 
        conv._id === conversation._id ? { ...conv, ...conversation } : conv
      ));
    },
    
    onConversationDeleted: ({ conversationId }: { conversationId: string }) => {
      log.debug('Real-time: Conversation deleted', conversationId);
      setConversations(prev => prev.filter(conv => conv._id !== conversationId));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    },
    
    onAllConversationsDeleted: ({ deletedCount }: { deletedCount: number }) => {
      log.debug('Real-time: All conversations deleted', deletedCount);
      setConversations([]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
    
    onMessageAdded: ({ conversationId, conversation }: { conversationId: string; conversation?: Conversation }) => {
      log.debug('Real-time: Message added to conversation', conversationId);
      if (conversation) {
        setConversations(prev => {
          const existingIndex = prev.findIndex(conv => conv._id === conversationId);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = { ...updated[existingIndex], ...conversation };
            return updated;
          }
          return prev;
        });
      }
    }
  });

  const { } = useConversationEvents({
    ...eventHandlers.current,
    autoRefresh: isVisible
  });

  const loadConversations = useCallback(async (forceRefresh: boolean = false) => {
    try {
      if (!forceRefresh) {
        const cached = conversationCache[currentTab];
        if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
          setConversations(cached.data);
          log.debug(`Using cached data for tab ${currentTab}:`, cached.data.length);
          return;
        }
      }
      
      setIsLoading(true);
      let newConversations: Conversation[] = [];
      
      switch (currentTab) {
        case 0:
          try {
            const aetherResponse = await ConversationAPI.getRecentConversations(20);
            if (aetherResponse.conversations) {
              newConversations = aetherResponse.conversations;
              log.debug('Loaded Aether conversations:', newConversations.length);
            }
          } catch (error: any) {
            if (error.status === 404) {
              log.debug('No conversations found (404), showing empty state');
              newConversations = [];
            } else {
              throw error;
            }
          }
          break;
          
        case 1:
          try {
            const friendsResponse = await FriendsAPI.getFriendsList();
            if (friendsResponse.friends && Array.isArray(friendsResponse.friends)) {
              newConversations = friendsResponse.friends.map((friend: any) => ({
                _id: `friend-${friend.username}`,
                title: friend.displayName || friend.username,
                lastActivity: friend.lastSeen || 'Recently active',
                messageCount: 0,
                summary: `Chat with ${friend.displayName || friend.username}`,
                type: 'friend'
              }));
              log.debug('Loaded friend conversations:', newConversations.length);
            }
          } catch {
            log.debug('Friends API not available yet, showing empty state');
            newConversations = [];
          }
          break;
          
        case 2:
          newConversations = [];
          log.debug('Custom tab - feature coming soon');
          break;
          
        default:
          newConversations = [];
      }
      
      setConversationCache(prev => ({
        ...prev,
        [currentTab]: { data: newConversations, timestamp: Date.now() }
      }));
      setConversations(newConversations);
      
    } catch (error) {
      log.error('Failed to load conversations:', error);
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentTab, conversationCache, CACHE_DURATION]);

  useEffect(() => {
    if (isVisible) {
      loadConversations();
    }
  }, [isVisible, currentTab]);
  
  useEffect(() => {
    if (!isVisible) {
      const clearCacheTimer = setTimeout(() => {
        setConversationCache({});
        setConversations([]);
      }, 300000);
      return () => clearTimeout(clearCacheTimer);
    }
  }, [isVisible]);

  const handleDeleteConversation = useCallback(async (conversationId: string) => {
    try {
      await ConversationAPI.deleteConversation(conversationId);
      setConversations(prev => prev.filter(conv => conv._id !== conversationId));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      log.debug('Deleted conversation:', conversationId);
    } catch (error) {
      log.error('Failed to delete conversation:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, []);

  const handleTabTransition = useCallback((targetTab: number) => {
    if (isAnimating || targetTab === currentTab) return;
    
    setCurrentTab(targetTab);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [isAnimating, currentTab]);

  const resetAnimations = () => {
    slideAnim.setValue(-screenWidth * 0.85);
    overlayOpacity.setValue(0);
    setIsAnimating(false);
  };

  const showDrawer = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    resetAnimations();
    
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 320,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94), // Smooth cubic bezier
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0.5,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsAnimating(false);
    });
  };

  const hideDrawer = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -screenWidth * 0.85,
        duration: 280,
        easing: Easing.bezier(0.55, 0.06, 0.68, 0.19), // Sharp ease-in for exit
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 280,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      resetAnimations();
    });
  };

  useEffect(() => {
    if (isVisible) {
      showDrawer();
    } else {
      hideDrawer();
    }
  }, [isVisible]); // Only depend on isVisible prop

  useEffect(() => {
    return () => {
      resetAnimations();
    };
  }, []);
  
  const handleClose = useCallback(() => {
    if (isAnimating) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
  }, [isAnimating, onClose]);
  
  const handleNewChat = useCallback(() => {
    if (onStartNewChat && !isAnimating) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      onStartNewChat();
      onClose();
    }
  }, [onStartNewChat, isAnimating, onClose]);
  
  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <ConversationItem
      conversation={item}
      theme={theme}
      isSelected={item._id === currentConversationId}
      currentTab={currentTab}
      onPress={() => {
        if (isAnimating) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onConversationSelect(item);
        onClose();
      }}
      onLongPress={currentTab === 0 ? () => {
        if (isAnimating) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setLongPressedId(item._id);
        
        setTimeout(() => {
          setLongPressedId(null);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          handleDeleteConversation(item._id);
        }, 200);
      } : undefined}
      isHighlighted={longPressedId === item._id}
      disabled={isAnimating}
    />
  );
  
  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.overlayTouch}
          activeOpacity={1} 
          onPress={handleClose}
          disabled={isAnimating}
        >
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              {
                opacity: overlayOpacity,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
              }
            ]}
          />
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.drawer,
            {
              transform: [{ translateX: slideAnim }],
              backgroundColor: theme === 'light' 
                ? designTokens.brand.surface 
                : designTokens.surfaces.dark.elevated,
              borderRightWidth: 0.5,
              borderRightColor: theme === 'light' 
                ? designTokens.borders.light.default 
                : designTokens.borders.dark.default,
              shadowColor: theme === 'light' ? '#000' : '#fff',
              shadowOffset: theme === 'light' 
                ? { width: 4, height: 0 } 
                : { width: 0, height: 0 },
              shadowOpacity: theme === 'light' ? 0.15 : 0.3,
              shadowRadius: theme === 'light' ? 12 : 8,
              elevation: theme === 'light' ? 8 : 0,
            }
          ]}
        >
          <SafeAreaView style={styles.drawerContent}>
            <View style={styles.contentWrapper}>
              <View style={[
                styles.header,
                { 
                  backgroundColor: 'transparent'
                }
              ]}>
                <ConversationTabBar
                  tabs={tabs}
                  currentTab={currentTab}
                  theme={theme}
                  onTabPress={handleTabTransition}
                  disabled={isAnimating}
                />
              </View>
          
              <View style={styles.content}>
                <FlatList
                  data={conversations}
                  renderItem={renderConversationItem}
                  keyExtractor={(item) => item._id}
                  style={styles.list}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
                    <ConversationEmptyState
                      tab={tabs[currentTab]}
                      theme={theme}
                      isLoading={isLoading}
                    />
                  }
                  scrollEnabled={!isAnimating}
                />
              </View>
              
              <ConversationActionBar
                theme={theme}
                onNewChat={onStartNewChat ? handleNewChat : undefined}
                onClose={handleClose}
                disabled={isAnimating}
              />
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  overlayTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: screenWidth * 0.77,
    borderTopRightRadius: 22,
    borderBottomRightRadius: 22,
    overflow: 'visible',
  },
  drawerContent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    paddingTop: 18,
    borderTopRightRadius: 22,
  },
  content: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: spacing[2],
  },
});

export default ConversationDrawer;