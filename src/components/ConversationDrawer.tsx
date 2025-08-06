/**
 * ConversationDrawer - Simple slide-out conversation history
 * Clean implementation with three labeled categories: Aether, Friends, Custom
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Animated,
  Modal,
  Easing,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { designTokens, getThemeColors } from '../design-system/tokens/colors';
import { spacing } from '../design-system/tokens/spacing';
import { typography } from '../design-system/tokens/typography';
import { useConversationEvents } from '../hooks/useConversationEvents';
import { log } from '../utils/logger';
import { ConversationAPI, FriendsAPI } from '../services/api';

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
  const [currentTab, setCurrentTab] = useState(0); // Start on Aether tab
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [longPressedId, setLongPressedId] = useState<string | null>(null);
  
  // Cache conversations per tab to avoid unnecessary API calls
  const [conversationCache, setConversationCache] = useState<{
    [key: number]: { data: Conversation[], timestamp: number }
  }>({});
  const CACHE_DURATION = 30000; // 30 seconds
  
  // Simplified animations
  const slideAnim = useRef(new Animated.Value(-screenWidth * 0.85)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  
  // Tab fold-out animations
  const tabAnimations = useRef([
    new Animated.Value(1), // Aether
    new Animated.Value(1), // Friends  
    new Animated.Value(1), // Custom
  ]).current;
  
  const themeColors = getThemeColors(theme);

  // Memoize event handlers to prevent re-registration
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

  // Real-time conversation events with stable handlers - only when drawer is visible
  const { } = useConversationEvents({
    ...eventHandlers.current,
    autoRefresh: isVisible // Only connect SSE when drawer is visible
  });

  // Load conversations from API based on current tab with caching
  const loadConversations = useCallback(async (forceRefresh: boolean = false) => {
    try {
      // Check cache first unless force refresh
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
        case 0: // Aether - AI conversations
          try {
            const aetherResponse = await ConversationAPI.getRecentConversations(20);
            if (aetherResponse.conversations) {
              newConversations = aetherResponse.conversations;
              log.debug('Loaded Aether conversations:', newConversations.length);
              if (newConversations.length > 0) {
                log.debug('First conversation structure:', newConversations[0]);
              }
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
          
        case 1: // Friends - Convert friends list to conversation format
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
          
        case 2: // Custom - Placeholder for future implementation
          newConversations = [];
          log.debug('Custom tab - feature coming soon');
          break;
          
        default:
          newConversations = [];
      }
      
      // Update cache and state
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

  // Load conversations when drawer opens or tab changes
  useEffect(() => {
    if (isVisible) {
      loadConversations();
    }
  }, [isVisible, currentTab]);
  
  // Clear cache when drawer closes to save memory
  useEffect(() => {
    if (!isVisible) {
      // Clear old cache entries after 5 minutes of drawer being closed
      const clearCacheTimer = setTimeout(() => {
        setConversationCache({});
        setConversations([]);
      }, 300000);
      return () => clearTimeout(clearCacheTimer);
    }
  }, [isVisible]);

  // Delete conversation function
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

  
  
  // Simple opacity animation handler
  const animateTabPress = useCallback((tabIndex: number) => {
    const tabAnim = tabAnimations[tabIndex];
    
    // Simple opacity fade: quick fade out then back in
    Animated.sequence([
      Animated.timing(tabAnim, {
        toValue: 0.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(tabAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [tabAnimations]);

  // Simple tab transition handler
  const handleTabTransition = useCallback((targetTab: number) => {
    if (isAnimating || targetTab === currentTab) return;
    
    // Trigger fold-out animation
    animateTabPress(targetTab);
    
    setCurrentTab(targetTab);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [isAnimating, currentTab, animateTabPress]);


  const tabs = [
    { 
      label: 'Aether', 
      icon: 'message-circle', 
      color: themeColors.text,
      iconColor: themeColors.text,
    },
    { 
      label: 'Friends', 
      icon: 'users', 
      color: themeColors.textSecondary,
      iconColor: themeColors.textSecondary,
    },
    { 
      label: 'Custom', 
      icon: 'settings', 
      color: themeColors.textSecondary,
      iconColor: themeColors.textSecondary,
    }
  ];
  
  // Cleanup function to reset all animations
  const resetAnimations = useCallback(() => {
    slideAnim.setValue(-screenWidth * 0.85);
    overlayOpacity.setValue(0);
    // Reset tab animations
    tabAnimations.forEach(anim => anim.setValue(1));
  }, [tabAnimations]);

  // Simple show animation
  const showDrawer = useCallback(() => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0.5,
        duration: 250,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsAnimating(false);
    });
  }, [slideAnim, overlayOpacity]);

  // Simple hide animation
  const hideDrawer = useCallback(() => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -screenWidth * 0.85,
        duration: 300,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 300,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsAnimating(false);
      resetAnimations();
    });
  }, [slideAnim, overlayOpacity, resetAnimations]);

  // Effect to handle visibility changes - simplified to prevent useInsertionEffect warnings
  useEffect(() => {
    if (isVisible) {
      showDrawer();
    } else {
      hideDrawer();
    }
  }, [isVisible]);

  // Cleanup on unmount
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
  
  const renderConversationItem = ({ item }: { item: Conversation; index: number }) => {
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
          return {
            accentColor: tabConfig.color,
            icon: 'user',
            badge: item.lastActivity.includes('now') ? '•' : '•',
            subtitle: item.summary || item.lastActivity
          };
        case 2: // Custom - Custom conversations
          return {
            accentColor: tabConfig.color,
            icon: 'settings',
            badge: '•',
            subtitle: item.summary || 'Custom conversation'
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
            onConversationSelect(item);
            onClose();
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
              handleDeleteConversation(item._id);
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
                name={styling.icon as any} 
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
                {item.title || 'Untitled Conversation'}
              </Text>
              <Text style={[
                styles.conversationMeta,
                typography.textStyles.bodySmall,
                { color: themeColors.textSecondary }
              ]}>
                {styling.subtitle}
              </Text>
            </View>
            
            {/* Badge */}
            <View style={[
              styles.conversationBadge,
              { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }
            ]}>
              <Text style={[
                styles.badgeText,
                { color: themeColors.textSecondary }
              ]}>
                {styling.badge}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };
  
  const getTabContent = () => {
    return conversations;
  };
  
  const renderEmptyState = () => {
    const tabConfig = tabs[currentTab];
    const getEmptyMessage = () => {
      if (isLoading) return 'Loading...';
      
      switch (currentTab) {
        case 0: return 'Start your first conversation with Aether';
        case 1: return 'Add friends to start chatting';
        case 2: return 'Custom conversations coming soon';
        default: return 'No conversations yet';
      }
    };
    
    const emptyMessage = getEmptyMessage();
    
    return (
      <View style={styles.emptyState}>
        <View style={[
          styles.emptyIcon,
          { 
            backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.15)',
            borderWidth: 1,
            borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          }
        ]}>
          <Feather 
            name={tabConfig.icon as any} 
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
      </View>
    );
  };
  
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
        {/* Enhanced Overlay */}
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

        {/* Enhanced Drawer */}
        <Animated.View
          style={[
            styles.drawer,
            {
              transform: [{ translateX: slideAnim }],
              backgroundColor: theme === 'light' ? designTokens.brand.surface : designTokens.surfaces.dark.elevated,
              borderRightWidth: 0.5,
              borderRightColor: theme === 'light' ? designTokens.borders.light.default : designTokens.borders.dark.default,
              shadowColor: theme === 'light' ? '#000' : '#fff',
              shadowOffset: theme === 'light' ? { width: 4, height: 0 } : { width: 0, height: 0 },
              shadowOpacity: theme === 'light' ? 0.15 : 0.3,
              shadowRadius: theme === 'light' ? 12 : 8,
              elevation: theme === 'light' ? 8 : 0,
            }
          ]}
        >
          <SafeAreaView style={styles.drawerContent}>
            <View style={styles.contentWrapper}>

              {/* Enhanced Header with glassmorphic styling */}
              <View style={[
                styles.header,
                { 
                  borderBottomColor: theme === 'dark' 
                    ? designTokens.borders.dark.subtle 
                    : designTokens.borders.light.subtle,
                  backgroundColor: 'transparent'
                }
              ]}>
                
                
                <View style={styles.tabs}>
                  {tabs.map((tab, index) => {
                    const isActive = index === currentTab;
                    
                    return (
                      <View
                        key={tab.label}
                        style={[styles.specialTab, { flex: isActive ? 1 : 0 }]}
                      >
                        <Animated.View
                          style={{
                            opacity: tabAnimations[index]
                          }}
                        >
                          <TouchableOpacity
                            style={[
                              styles.neumorphicTab,
                              {
                                backgroundColor: isActive 
                                  ? (theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)')
                                  : 'transparent',
                                borderWidth: 1,
                                borderColor: isActive 
                                  ? (theme === 'light' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)')
                                  : 'transparent',
                                minWidth: isActive ? 'auto' : 40,
                                paddingHorizontal: isActive ? spacing[3] : spacing[2],
                              }
                            ]}
                            onPress={() => handleTabTransition(index)}
                            activeOpacity={0.9}
                            disabled={isAnimating}
                          >
                            <Feather 
                              name={tab.icon as any} 
                              size={16} 
                              color={isActive ? tab.iconColor : themeColors.textSecondary} 
                            />
                            
                            {isActive && (
                              <Text style={[
                                styles.specialTabText,
                                {
                                  color: tab.color,
                                  fontWeight: '600',
                                }
                              ]}>
                                {tab.label}
                              </Text>
                            )}
                          </TouchableOpacity>
                        </Animated.View>
                      </View>
                    );
                  })}
                </View>
              </View>
          
              {/* Enhanced Content */}
              <View style={styles.content}>
                <FlatList
                  data={getTabContent()}
                  renderItem={renderConversationItem}
                  keyExtractor={(item) => item._id}
                  style={styles.list}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={renderEmptyState}
                  scrollEnabled={!isAnimating}
                />
              </View>
              
              {/* Bottom Action Bar */}
              <View 
                style={[
                  styles.bottomActionBar,
                  {
                    borderTopColor: theme === 'dark' 
                      ? designTokens.borders.dark.subtle 
                      : designTokens.borders.light.subtle,
                    backgroundColor: 'transparent',
                  }
                ]}
              >
                {onStartNewChat && (
                  <TouchableOpacity
                    style={[
                      styles.heroButton,
                      styles.primaryHeroButton,
                      {
                        backgroundColor: theme === 'dark' 
                          ? 'rgba(255,255,255,0.1)' 
                          : 'rgba(0, 0, 0, 0.08)',
                        borderWidth: 1,
                        borderColor: theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)',
                      }
                    ]}
                    onPress={handleNewChat}
                    activeOpacity={0.92}
                    disabled={isAnimating}
                  >
                    <Feather name="plus" size={18} color={themeColors.text} />
                    <Text style={[styles.heroButtonText, { color: themeColors.text }]}>
                      New Chat
                    </Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={[
                    styles.heroButton,
                    styles.secondaryHeroButton,
                    {
                      backgroundColor: theme === 'dark' 
                        ? 'rgba(255,255,255,0.1)' 
                        : 'rgba(0, 0, 0, 0.08)',
                      borderWidth: 1,
                      borderColor: theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)',
                    }
                  ]}
                  onPress={handleClose}
                  activeOpacity={0.92}
                  disabled={isAnimating}
                >
                  <Feather name="x" size={18} color={themeColors.text} />
                </TouchableOpacity>
              </View>
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
    borderBottomWidth: 0.5,
    borderTopRightRadius: 22,
  },
  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    gap: 8,
  },
  specialTab: {
    // Dynamic flex handled inline
  },
  neumorphicTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2],
    borderRadius: 10,
    minHeight: 36,
    gap: spacing[2],
  },
  specialTabText: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: -0.3,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
  },
  bottomActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    paddingBottom: spacing[2],
    borderTopWidth: 0.5,
    borderBottomRightRadius: 16,
    gap: spacing[2],
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
  primaryHeroButton: {
    flex: 1,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[1],
    gap: spacing[2],
    minHeight: 36,
  },
  secondaryHeroButton: {
    width: 40,
    height: 36,
  },
  heroButtonText: {
    color: '#787878',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',
    letterSpacing: -0.3,
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
});

export default ConversationDrawer;