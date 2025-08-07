/**
 * ConversationDrawer - Modular slide-out conversation history
 * Clean implementation with three labeled categories: Aether, Friends, Custom
 * Refactored for modularity and maintainability
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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { HeatmapTooltip } from '../design-system/components/organisms/HeatmapTooltip';
import { ConversationList } from './ConversationList';
import {
  useConversationTabs,
  useConversationData,
  useDrawerAnimation,
  useConversationEvents,
} from '../hooks';
import type { Conversation } from '../hooks/useConversationData';
import * as Haptics from 'expo-haptics';
import { designTokens, getThemeColors } from '../design-system/tokens/colors';
import { spacing } from '../design-system/tokens/spacing';
import { log } from '../utils/logger';

const { width: screenWidth } = Dimensions.get('window');

type FeatherIconNames = keyof typeof Feather.glyphMap;

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
  const [isAnimating, setIsAnimating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [longPressedId, setLongPressedId] = useState<string | null>(null);
  
  const [tooltip, setTooltip] = useState<{ visible: boolean; username: string; x: number; y: number } | null>(null);
  const itemRefs = useRef<{ [key: string]: View }>({});

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
    loadConversations,
    handleDeleteConversation,
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

  useEffect(() => {
    if (isVisible) {
      loadConversations(currentTab);
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
    if (isRefreshing || isLoading) return;
    
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      clearTabCache(currentTab);
      await loadConversations(currentTab, true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      log.error('Failed to refresh conversations:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, isLoading, currentTab, loadConversations, clearTabCache]);

  const handleTabTransitionWithAnimationState = useCallback((targetTab: number) => {
    handleTabTransition(targetTab, isAnimating);
  }, [handleTabTransition, isAnimating]);

  useEffect(() => {
    if (isVisible) {
      showDrawer(() => setIsAnimating(false));
    } else {
      hideDrawer(() => setIsAnimating(false));
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
  
  const handleHeatmapLongPress = (friend: { username: string }, conversationId: string) => {
    itemRefs.current[conversationId]?.measure((fx, fy, width, height, px, py) => {
      setTooltip({ visible: true, username: friend.username, x: px, y: py });
    });
  };

  const handleHeatmapPressOut = () => {
    setTooltip(null);
  };

  const handleConversationSelectAndClose = useCallback((conversation: any) => {
    onConversationSelect(conversation);
    onClose();
  }, [onConversationSelect, onClose]);
  
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
              backgroundColor: theme === 'light' ? designTokens.brand.surface : designTokens.surfaces.dark.elevated,
              borderRightWidth: 0.5,
              borderRightColor: theme === 'light' ? designTokens.borders.light.default : designTokens.borders.dark.default,
            }
          ]}
        >
          <SafeAreaView style={styles.drawerContent}>
            <View style={styles.contentWrapper}>
              <View style={[
                styles.header,
                { 
                  borderBottomColor: theme === 'dark' 
                    ? designTokens.borders.dark.subtle 
                    : designTokens.borders.light.subtle,
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
                            onPress={() => handleTabTransitionWithAnimationState(index)}
                            activeOpacity={0.9}
                            disabled={isAnimating}
                          >
                            <Feather 
                              name={tab.icon as FeatherIconNames} 
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
          
              <ConversationList
                conversations={conversations}
                currentTab={currentTab}
                tabs={tabs}
                currentConversationId={currentConversationId}
                theme={theme}
                isLoading={isLoading}
                isRefreshing={isRefreshing}
                isTabSwitching={isTabSwitching}
                isAnimating={isAnimating}
                longPressedId={longPressedId}
                onConversationSelect={handleConversationSelectAndClose}
                onDeleteConversation={handleDeleteConversationWithFeedback}
                onHeatmapLongPress={handleHeatmapLongPress}
                onHeatmapPressOut={handleHeatmapPressOut}
                onRefresh={handleRefresh}
                setLongPressedId={setLongPressedId}
                itemRefs={itemRefs}
              />
              
              <View 
                style={[
                  styles.bottomActionBar,
                  {
                    borderTopColor: theme === 'dark' 
                      ? designTokens.borders.dark.subtle 
                      : designTokens.borders.light.subtle,
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

        {tooltip && (
          <View style={{ position: 'absolute', left: tooltip.x, top: tooltip.y }}>
            <HeatmapTooltip
              visible={tooltip.visible}
              theme={theme}
              friendUsername={tooltip.username}
            />
          </View>
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
    borderTopRightRadius: 22,
    borderBottomRightRadius: 22,
    overflow: 'visible',
  },
  drawerContent: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
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
  specialTab: {},
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
});

export default ConversationDrawer;
