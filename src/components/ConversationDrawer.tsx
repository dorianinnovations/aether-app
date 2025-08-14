/**
 * ConversationDrawer - Revolutionary Inbox-Style Conversation Interface
 * Utility-focused design that encourages exploration with unconventional patterns
 * Three distinct channels: Aether AI, Friends Network, and Group Chats
 * Features layered navigation, contextual actions, and immersive interaction patterns
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Animated,
  Modal,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { ArtistListeningModal } from '../design-system/components/organisms/ArtistListeningModal';
import { SignOutModal } from '../design-system/components/organisms/SignOutModal';
import { PublicUserProfileModal } from '../design-system/components/organisms/PublicUserProfileModal';
import { ConversationList } from './ConversationList';
import { FadedBorder } from './FadedBorder';
import {
  useConversationTabs,
  useConversationData,
  useDrawerAnimation,
  useConversationEvents,
} from '../hooks';
import type { Conversation } from '../hooks/useConversationData';
import * as Haptics from 'expo-haptics';
import { getThemeColors } from '../design-system/tokens/colors';
import { spacing, borderRadius, neumorphicSpacing } from '../design-system/tokens/spacing';
import { log } from '../utils/logger';
import { FriendsAPI } from '../services/api';
import { UserAPI } from '../services/apiModules/endpoints/user';

const { width: screenWidth } = Dimensions.get('window');

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

interface ConversationDrawerProps {
  isVisible: boolean;
  onClose: () => void;
  onConversationSelect: (conversation: Conversation) => void;
  onStartNewChat?: () => void;
  currentConversationId?: string;
  theme: 'light' | 'dark';
  onFriendMessagePress?: (friendUsername: string) => void;
  onAllConversationsCleared?: () => void;
  onAddFriend?: () => void;
}

const ConversationDrawer: React.FC<ConversationDrawerProps> = ({
  isVisible,
  onClose,
  onConversationSelect,
  onStartNewChat,
  currentConversationId,
  theme,
  onFriendMessagePress,
  onAllConversationsCleared,
  onAddFriend,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [modalVisible, setModalVisible] = useState(isVisible);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [longPressedId, setLongPressedId] = useState<string | null>(null);
  
  const [artistModal, setArtistModal] = useState<{ visible: boolean; artistId: string; artistName: string; x: number; y: number } | null>(null);
  const itemRefs = useRef<{ [key: string]: View }>({});

  // Friends state
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  
  const newChatButtonAnim = useRef(new Animated.Value(0)).current;

  // Clear all modal state
  const [clearAllModal, setClearAllModal] = useState<{ visible: boolean; type: 'conversations' | 'friends' } | null>(null);
  
  // Profile modal state
  const [profileModal, setProfileModal] = useState<{ visible: boolean; username?: string } | null>(null);

  const themeColors = getThemeColors(theme);
  
  
  const {
    currentTab,
    isTabSwitching,
    tabs,
    tabAnimations,
    handleTabTransition,
    resetTabAnimations,
  } = useConversationTabs(theme);
  
  const {
    conversations,
    isLoading,
    isLoadingMore,
    hasMoreConversations,
    loadConversations,
    loadMoreConversations,
    handleDeleteConversation,
    handleDeleteAllConversations,
    clearCache,
    clearTabCache,
    setConversations,
  } = useConversationData();
  
  const {
    slideAnim,
    overlayOpacity,
    showDrawer,
    hideDrawer,
    resetAnimations,
  } = useDrawerAnimation();

  useConversationEvents({
    onConversationCreated: (conversation) => {
      log.debug('Real-time: Conversation created', conversation);
      setConversations(prev => [conversation, ...prev]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onConversationUpdated: (conversation) => {
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
      onAllConversationsCleared?.();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
    onMessageAdded: ({ conversationId, conversation }: { conversationId: string; conversation?: any }) => {
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
    },
    autoRefresh: isVisible
  });

  // Fetch friends list
  const fetchFriends = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setFriendsLoading(true);
      }
      
      const { TokenManager } = await import('../services/api');
      const token = await TokenManager.getToken();
      if (!token) return;

      const response = await FriendsAPI.getFriendsList();
      
      if (response.success && response.friends) {
        setFriends(response.friends);
      } else if (response.success && response.data && response.data.friends) {
        setFriends(response.data.friends);
      } else if (Array.isArray(response)) {
        setFriends(response);
      } else {
        setFriends([]);
      }
    } catch (error) {
      log.error('Error fetching friends:', error);
      setFriends([]);
    } finally {
      setFriendsLoading(false);
      if (isRefresh) {
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    if (isVisible) {
      if (currentTab === 1) {
        // Friends tab - fetch friends
        fetchFriends();
      } else {
        // Other tabs - load conversations
        loadConversations(currentTab);
      }
    }
  }, [isVisible, currentTab, loadConversations]);
  
  useEffect(() => {
    if (!isVisible) {
      const clearCacheTimer = setTimeout(() => {
        clearCache();
      }, 300000);
      return () => clearTimeout(clearCacheTimer);
    }
  }, [isVisible, clearCache]);

  const handleDeleteConversationWithFeedback = useCallback(async (conversationId: string) => {
    const success = await handleDeleteConversation(conversationId);
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [handleDeleteConversation]);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing || isLoading || friendsLoading) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      if (currentTab === 1) {
        // Friends tab - refresh friends
        await fetchFriends(true);
      } else {
        // Other tabs - refresh conversations
        setIsRefreshing(true);
        clearTabCache(currentTab);
        await loadConversations(currentTab, true);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      log.error('Failed to refresh:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, isLoading, friendsLoading, currentTab, loadConversations, clearTabCache, fetchFriends]);

  const handleTabTransitionWithAnimationState = useCallback((targetTab: number) => {
    handleTabTransition(targetTab, isAnimating);
  }, [handleTabTransition, isAnimating]);

  // Animate new chat button based on current tab
  useEffect(() => {
    if (currentTab === 0) {
      // Aether tab - show new chat button
      Animated.timing(newChatButtonAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Friends tab - hide new chat button
      Animated.timing(newChatButtonAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [currentTab, newChatButtonAnim]);

  useEffect(() => {
    if (isVisible) {
      setModalVisible(true);
      showDrawer(() => setIsAnimating(false));
    } else {
      hideDrawer(() => {
        setIsAnimating(false);
        setModalVisible(false);
      });
    }
  }, [isVisible, showDrawer, hideDrawer]);

  useEffect(() => {
    return () => {
      resetAnimations();
      resetTabAnimations();
    };
  }, [resetAnimations, resetTabAnimations]);

  
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
  
  const handleArtistListeningPress = (artist: { id: string; name: string }, itemId: string) => {
    itemRefs.current[itemId]?.measure((fx, fy, width, height, px, py) => {
      setArtistModal({ visible: true, artistId: artist.id, artistName: artist.name, x: px, y: py });
    });
  };

  const handleArtistListeningClose = () => {
    setArtistModal(null);
  };

  const handleConversationSelectAndClose = useCallback((conversation: any) => {
    onConversationSelect(conversation);
    onClose();
  }, [onConversationSelect, onClose]);

  const handleClearAllConversations = useCallback(() => {
    if (currentTab === 0) {
      // Clear Aether conversations
      setClearAllModal({ visible: true, type: 'conversations' });
    } else if (currentTab === 1) {
      // Clear friends list
      setClearAllModal({ visible: true, type: 'friends' });
    }
  }, [currentTab]);

  const handleClearAllConfirm = useCallback(async () => {
    if (!clearAllModal) return;

    try {
      if (clearAllModal.type === 'conversations') {
        const success = await handleDeleteAllConversations();
        if (success) {
          onAllConversationsCleared?.();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      } else if (clearAllModal.type === 'friends') {
        // Clear local friends state
        setFriends([]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      log.error('Failed to clear all:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setClearAllModal(null);
    }
  }, [clearAllModal, handleDeleteAllConversations]);

  const handleClearAllCancel = useCallback(() => {
    setClearAllModal(null);
  }, []);

  const handleFriendProfilePress = useCallback((username: string) => {
    setProfileModal({ visible: true, username });
  }, []);

  const handleProfileModalClose = useCallback(() => {
    setProfileModal(null);
  }, []);

  const handleAddFriendPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose(); // Hide the conversation drawer first
    setTimeout(() => {
      onAddFriend?.(); // Then trigger modal after drawer closes
    }, 100);
  }, [onAddFriend, onClose]);


  const handleFetchProfile = useCallback(async (username: string) => {
    try {
      const response = await UserAPI.getPublicProfile(username);
    
    // Transform API response to match our component interface
    if (response && typeof response === 'object' && 'data' in response) {
      const data = (response as any).data;
      
      // Backend returns badges directly in data.badges
      const badges = data.badges || [];
      
      // Transform badges to ensure proper structure
      const transformedBadges = badges.map((badge: any) => ({
        id: badge.id || badge._id || Math.random().toString(),
        badgeType: badge.badgeType,
        isVisible: badge.isVisible !== false
      }));
      
      return {
        profile: {
          email: data.user?.email || '',
          username: data.user?.username || username,
          displayName: data.user?.displayName || data.user?.name || username,
          bio: data.user?.bio || '',
          location: data.user?.location || '',
          website: data.user?.website || '',
          socialLinks: data.user?.socialLinks || {},
          profilePicture: data.profilePicture,
          bannerImage: data.bannerImage,
          badges: transformedBadges,
        },
        socialProfile: data.socialProfile || undefined,
      };
    }
    
    // Fallback transformation
    return {
      profile: {
        email: '',
        username: username,
        displayName: username,
        bio: '',
        location: '',
        website: '',
        socialLinks: {},
        profilePicture: undefined,
        bannerImage: undefined,
        badges: [],
      },
      socialProfile: undefined,
    };
    } catch (error: unknown) {
      console.error('Error fetching profile:', error);
      // Return basic profile data on error
      return {
        profile: {
          email: '',
          username: username,
          displayName: username,
          bio: 'Profile unavailable',
          location: '',
          website: '',
          socialLinks: {},
          profilePicture: undefined,
          bannerImage: undefined,
          badges: [],
        },
        socialProfile: undefined,
      };
    }
  }, []);
  

  return (
    <Modal
      visible={modalVisible}
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
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
              }
            ]}
          />
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.drawer,
            {
              transform: [{ translateX: slideAnim }],
              backgroundColor: theme === 'light' ? '#F8F8F8' : '#151515',
              borderRightWidth: 0.5,
              borderColor: theme === 'light' ? '#E0E0E0' : '#3A3A3A',
            }
          ]}
        >
          <SafeAreaView style={styles.drawerContent}>
            <View style={styles.contentWrapper}>
              {/* Minimal Header */}
              <View style={[
                styles.inboxHeader,
                {
                  backgroundColor: 'transparent',
                }
              ]}>
                {/* Minimal Title */}
                <View style={styles.inboxTitleSection}>
                  <Text style={[
                    styles.inboxTitle,
                    { color: themeColors.text }
                  ]}>
                    Chats
                  </Text>
                  <Text style={[
                    styles.inboxCount,
                    { color: themeColors.textSecondary }
                  ]}>
                    {conversations.length + friends.length}
                  </Text>
                </View>
                
                
                {/* Faded Border Below Tabs */}
                <FadedBorder theme={theme} />
                
              </View>
          
              <ConversationList
                conversations={conversations}
                currentTab={currentTab}
                tabs={tabs}
                currentConversationId={currentConversationId}
                theme={theme}
                isLoading={currentTab === 1 ? friendsLoading : isLoading}
                isLoadingMore={isLoadingMore}
                hasMoreConversations={hasMoreConversations && currentTab === 0}
                isRefreshing={isRefreshing}
                isTabSwitching={isTabSwitching}
                isAnimating={isAnimating}
                longPressedId={longPressedId}
                onConversationSelect={handleConversationSelectAndClose}
                onDeleteConversation={handleDeleteConversationWithFeedback}
                onArtistListeningPress={handleArtistListeningPress}
                onArtistListeningClose={handleArtistListeningClose}
                onRefresh={handleRefresh}
                onLoadMore={() => loadMoreConversations(currentTab)}
                setLongPressedId={setLongPressedId}
                itemRefs={itemRefs}
                friends={friends}
                onFriendMessagePress={onFriendMessagePress}
                onFriendProfilePress={handleFriendProfilePress}
              />
              
              {/* Action Buttons - Right Edge */}
              <View style={styles.actionButtonsStack}>

                {/* Action Buttons */}
                <View style={styles.actionButtonsContainer}>
                  {/* Primary action */}
                  <Animated.View
                    style={{
                      opacity: newChatButtonAnim,
                      transform: [{
                        translateY: newChatButtonAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-20, 0]
                        })
                      }]
                    }}
                    pointerEvents={currentTab === 0 ? 'auto' : 'none'}
                  >
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        styles.primaryActionButton,
                        {
                          backgroundColor: theme === 'dark' ? 'rgba(42, 42, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)',
                          borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)',
                        }
                      ]}
                      onPress={handleNewChat}
                      activeOpacity={0.7}
                      disabled={isAnimating || currentTab !== 0}
                    >
                      <Feather name="plus" size={18} color={themeColors.text} />
                    </TouchableOpacity>
                  </Animated.View>
                  {currentTab === 1 && (
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        styles.primaryActionButton,
                        {
                          backgroundColor: theme === 'dark' ? 'rgba(42, 42, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)',
                          borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)',
                        }
                      ]}
                      onPress={handleAddFriendPress}
                      activeOpacity={0.7}
                      disabled={isAnimating}
                    >
                      <Feather name="user-plus" size={18} color={themeColors.text} />
                    </TouchableOpacity>
                  )}


                  {/* Trash */}
                  {(currentTab === 0 && conversations.length > 0) || (currentTab === 1 && friends.length > 0) ? (
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        {
                          backgroundColor: theme === 'dark' ? 'rgba(25, 25, 25, 0.8)' : 'rgba(240, 240, 240, 0.9)',
                          borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                        }
                      ]}
                      onPress={handleClearAllConversations}
                      activeOpacity={0.7}
                    >
                      <Feather name="trash-2" size={16} color="#FF6B6B" />
                    </TouchableOpacity>
                  ) : null}

                </View>
              </View>

              {/* Bottom Tab Bar Background */}
              <View style={[
                styles.bottomTabBackground,
                {
                  backgroundColor: theme === 'dark' ? 'rgba(30, 30, 30, 0.95)' : 'rgba(240, 240, 240, 0.95)',
                  borderColor: themeColors.borders.default,
                }
              ]} />

              {/* Bottom Tab Bar */}
              <View style={[
                styles.bottomTabBar,
                {
                  backgroundColor: 'transparent',
                  borderTopColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                }
              ]}>
                {tabs.map((tab, index) => {
                  const isActive = index === currentTab;
                  const tabProgress = tabAnimations[index];
                  
                  return (
                    <Animated.View
                      key={tab.label}
                      style={[
                        styles.bottomTabButton,
                        { opacity: tabProgress }
                      ]}
                    >
                      <TouchableOpacity
                        style={[
                          styles.bottomTabTouch,
                          {
                            backgroundColor: isActive
                              ? (theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)')
                              : 'transparent',
                            borderColor: isActive
                              ? (theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)')
                              : (theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'),
                          }
                        ]}
                        onPress={() => handleTabTransitionWithAnimationState(index)}
                        activeOpacity={0.6}
                        disabled={isAnimating}
                      >
                        <View style={styles.bottomTabContent}>
                          {tab.logo ? (
                            <Image 
                              source={tab.logo}
                              style={[
                                styles.bottomTabLogo,
                                { opacity: isActive ? 1 : 0.6 }
                              ]}
                              resizeMode="contain"
                            />
                          ) : tab.icon ? (
                            <Feather 
                              name={tab.icon as any}
                              size={18}
                              color={isActive ? themeColors.text : themeColors.textSecondary}
                            />
                          ) : null}
                          <Text style={[
                            styles.bottomTabText,
                            {
                              color: isActive ? themeColors.text : themeColors.textSecondary,
                              fontWeight: isActive ? '600' : '400',
                            }
                          ]}>
                            {tab.label}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>
            </View>
          </SafeAreaView>
          
        </Animated.View>

        {artistModal && (
          <ArtistListeningModal
            visible={artistModal.visible}
            theme={theme}
            artistId={artistModal.artistId}
            artistName={artistModal.artistName}
            onClose={handleArtistListeningClose}
          />
        )}

        {clearAllModal && (
          <SignOutModal
            visible={clearAllModal.visible}
            theme={theme}
            title={clearAllModal.type === 'conversations' ? 'Clear All Conversations' : 'Clear All Friends'}
            message={clearAllModal.type === 'conversations' 
              ? 'This will permanently delete all your conversations with Aether. This action cannot be undone.'
              : 'This will remove all friends from your list. This action cannot be undone.'
            }
            confirmText="Clear All"
            cancelText="Cancel"
            icon="trash"
            iconLibrary="Feather"
            variant="danger"
            onConfirm={handleClearAllConfirm}
            onClose={handleClearAllCancel}
            loadingTitle=""
            loadingMessage=""
          />
        )}

        {profileModal && (
          <PublicUserProfileModal
            visible={profileModal.visible}
            username={profileModal.username}
            onClose={handleProfileModalClose}
            onFetchProfile={handleFetchProfile}
          />
        )}


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
    width: screenWidth * 0.85,
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderTopRightRadius: borderRadius.xl,
    borderBottomRightRadius: 12,
  },
  drawerContent: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
  },
  // Minimal Header Styles
  inboxHeader: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    paddingTop: spacing[4],
    gap: spacing[6],
  },
  inboxTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing[2],
  },
  inboxTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'MozillaText_600SemiBold',
    letterSpacing: -0.8,
    textAlign: 'left',
  },
  inboxCount: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    opacity: 0.6,
  },
  // Badge text styling handled by getTextStyle
  
  // Action Buttons Stack (Right Side)
  actionButtonsStack: {
    position: 'absolute',
    right: spacing[2],
    bottom: 90,
    zIndex: 10,
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: spacing[2],
  },
  
  // Bottom Tab Bar Background
  bottomTabBackground: {
    position: 'absolute',
    bottom: -43,
    left: 0,
    right: 0,
    height: 119,
    borderTopWidth: 0.5,
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  
  // Bottom Tab Bar
  bottomTabBar: {
    position: 'absolute',
    bottom: -20,
    left: 0,
    right: 0,
    height: 80,
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 15,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  bottomTabButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomTabTouch: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 100,
  },
  bottomTabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  bottomTabLogo: {
    width: 24,
    height: 18,
  },
  bottomTabText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  
  // Action Buttons
  actionButtonsContainer: {
    flexDirection: 'column',
    gap: 8,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    width: 44,
    borderRadius: 8,
    borderWidth: 0.5,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  primaryActionButton: {
    // All buttons now same size - no overrides needed
  },
});

export default ConversationDrawer;
