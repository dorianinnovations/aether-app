/**
 * ConversationDrawer - Simple slide-out conversation history
 * Clean implementation with three labeled categories: Aether, Friends, Connections
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
  Image,
  PanResponder,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { designTokens, getThemeColors } from '../design-system/tokens/colors';
import { spacing } from '../design-system/tokens/spacing';
import { typography } from '../design-system/tokens/typography';
import { getHeaderMenuShadow } from '../design-system/tokens/shadows';
import { getGlassmorphicStyle } from '../design-system/tokens/glassmorphism';
import { NotificationDot } from '../design-system/components/atoms/NotificationDot';
import { useConversationEvents } from '../hooks/useConversationEvents';
import { log } from '../utils/logger';
import api, { ApiUtils } from '../services/api';

const { width: screenWidth } = Dimensions.get('window');

interface Conversation {
  _id: string;
  title: string;
  lastActivity: string;
  messageCount: number;
  summary?: string;
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
  const [currentTab, setCurrentTab] = useState(0); // Start on Friends tab
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [pressedIndex, setPressedIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [longPressedId, setLongPressedId] = useState<string | null>(null);
  
  // Enhanced animations
  const slideAnim = useRef(new Animated.Value(-screenWidth * 0.85)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  
  // Item stagger animations for tabs and conversations
  const itemAnims = useRef(Array.from({ length: 20 }, () => ({
    opacity: new Animated.Value(0),
    translateY: new Animated.Value(10),
    scale: new Animated.Value(0.9),
  }))).current;
  
  // Button press animations
  const buttonAnims = useRef(Array.from({ length: 20 }, () => ({
    scale: new Animated.Value(1),
    opacity: new Animated.Value(1),
  }))).current;
  
  // Color beam animation - start at Friends (0)
  const colorBeamAnim = useRef(new Animated.Value(0)).current;
  const colorBeamColor = useRef(new Animated.Value(0)).current;
  
  const themeColors = getThemeColors(theme);

  // Real-time conversation events
  const { isConnected: isSSEConnected, eventCount } = useConversationEvents({
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
    
    onConversationDeleted: ({ conversationId }) => {
      log.debug('Real-time: Conversation deleted', conversationId);
      setConversations(prev => prev.filter(conv => conv._id !== conversationId));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    },
    
    onAllConversationsDeleted: ({ deletedCount }) => {
      log.debug('Real-time: All conversations deleted', deletedCount);
      setConversations([]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
    
    onMessageAdded: ({ conversationId, conversation }) => {
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

  // Load conversations from API
  const loadConversations = useCallback(async () => {
    if (currentTab !== 0) return; // Only load for Aether tab
    
    try {
      setIsLoading(true);
      const response = await ApiUtils.getRecentConversations(20, 1);
      if (response.success && response.data) {
        setConversations(response.data);
        log.debug('Loaded conversations:', response.data.length);
      }
    } catch (error) {
      log.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentTab]);

  // Load conversations when drawer opens or tab changes
  useEffect(() => {
    if (isVisible && currentTab === 0) {
      loadConversations();
    }
  }, [isVisible, currentTab, loadConversations]);

  // Delete conversation function
  const handleDeleteConversation = useCallback(async (conversationId: string) => {
    try {
      await ApiUtils.deleteConversation(conversationId);
      setConversations(prev => prev.filter(conv => conv._id !== conversationId));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      log.debug('Deleted conversation:', conversationId);
    } catch (error) {
      log.error('Failed to delete conversation:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, []);

  // Enhanced swipe gesture with proper state management and visual feedback
  const swipeOffset = useRef(new Animated.Value(0)).current;
  const isSwipeActive = useRef(false).current;
  
  const swipeStartX = useRef(0);
  const hasTriggered = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      
      onPanResponderGrant: (evt) => {
        swipeStartX.current = evt.nativeEvent.pageX;
        hasTriggered.current = false;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      
      onPanResponderMove: (evt) => {
        if (hasTriggered.current || isAnimating) return;
        
        const currentX = evt.nativeEvent.pageX;
        const deltaX = currentX - swipeStartX.current;
        
        if (Math.abs(deltaX) > 20) {
          hasTriggered.current = true;
          
          // Just alternate between 0 and 1 for now
          if (currentTab === 0) {
            setCurrentTab(1); // Friends -> Aether
            colorBeamAnim.setValue(1);
            colorBeamColor.setValue(1);
          } else {
            setCurrentTab(0); // Anything else -> Friends  
            colorBeamAnim.setValue(0);
            colorBeamColor.setValue(0);
          }
        }
      },
      
      onPanResponderRelease: () => {
        hasTriggered.current = false;
      },
    })
  ).current;
  
  // Centralized tab transition handler
  const handleTabTransition = useCallback((targetTab: number, direction: 'left' | 'right') => {
    console.log('handleTabTransition called:', targetTab, 'current:', currentTab, 'animating:', isAnimating);
    if (isAnimating || targetTab === currentTab) {
      console.log('BLOCKED: animating or same tab');
      return;
    }
    
    console.log('Setting tab to:', targetTab);
    setCurrentTab(targetTab);
    
    // Enhanced color beam animation with direction-aware easing
    Animated.parallel([
      Animated.timing(colorBeamAnim, {
        toValue: targetTab,
        duration: direction === 'left' ? 280 : 320, // Slightly faster for forward navigation
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        useNativeDriver: false,
      }),
      Animated.timing(colorBeamColor, {
        toValue: targetTab,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start();
    
    // Direction-specific haptic feedback
    const hapticIntensity = direction === 'left' 
      ? Haptics.ImpactFeedbackStyle.Medium 
      : Haptics.ImpactFeedbackStyle.Heavy;
    Haptics.impactAsync(hapticIntensity);
  }, [isAnimating, currentTab, colorBeamAnim, colorBeamColor]);
  
  // Rainbow sequence: red, orange, yellow, green, blue, purple
  const rainbowSequence = [
    designTokens.pastels.coral,   // Red-ish #FFA07A (closest to red in pastels)
    designTokens.pastels.orange,  // Orange #FFB347
    designTokens.pastels.yellow,  // Yellow #FFEB9C
    designTokens.pastels.green,   // Green #90EE90
    designTokens.pastels.blue,    // Blue #87CEEB
    designTokens.pastels.purple,  // Purple #D8BFD8
  ];

  const tabs = [
    { 
      label: 'Friends', 
      icon: 'users', 
      color: rainbowSequence[1], // Orange #FFB347
      iconColor: rainbowSequence[1], // Orange
      position: 'first' // Left side
    },
    { 
      label: 'Aether', 
      icon: 'logo', // Use logo webm instead of zap
      color: theme === 'dark' ? '#FFFFFF' : '#2D3748', // White or dark charcoal
      iconColor: theme === 'dark' ? '#FFFFFF' : '#2D3748', // White or dark charcoal
      isProprietary: true,
      position: 'center' // Center - main tab
    },
    { 
      label: 'Links', 
      icon: 'link-2', 
      color: rainbowSequence[2], // Yellow #FFEB9C
      iconColor: rainbowSequence[2], // Yellow
      position: 'third' // Right side
    }
  ];
  
  // Cleanup function to reset all animations
  const resetAnimations = useCallback(() => {
    slideAnim.setValue(-screenWidth * 0.85);
    overlayOpacity.setValue(0);
    scaleAnim.setValue(0.95);
    contentOpacity.setValue(0);
    swipeOffset.setValue(0);
    
    itemAnims.forEach(anim => {
      anim.opacity.setValue(0);
      anim.translateY.setValue(10);
      anim.scale.setValue(0.9);
    });
    
    buttonAnims.forEach(anim => {
      anim.scale.setValue(1);
      anim.opacity.setValue(1);
    });
    
    setIsAnimating(false);
    setPressedIndex(null);
  }, [swipeOffset]);

  // Premium smooth show animation
  const showDrawer = useCallback(() => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    resetAnimations();
    
    // Sophisticated luxury animation - smooth and precise
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 320,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1), // Material Design standard easing
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 200,
        delay: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Single refined haptic
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Subtle sequential fade-in for items
      const itemAnimations = itemAnims.slice(0, 10).map((anim, index) => 
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration: 200,
          delay: index * 12,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        })
      );
      
      Animated.stagger(12, itemAnimations).start(() => {
        setIsAnimating(false);
      });
    });
  }, []);

  // Premium smooth hide animation
  const hideDrawer = useCallback(() => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    // Elegant exit animation - smooth and refined
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -screenWidth * 0.85,
        duration: 260,
        easing: Easing.bezier(0.4, 0.0, 0.6, 1), // Smooth deceleration
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 220,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      resetAnimations();
    });
  }, []);

  // Effect to handle visibility changes
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
  
  const handleTabPress = useCallback((index: number) => {
    if (isAnimating || pressedIndex !== null) return;
    
    const direction = index > currentTab ? 'left' : 'right';
    handleTabTransition(index, direction);
    
    setPressedIndex(index);
    
    // Advanced button press animation with bounce and glow
    if (buttonAnims[index]) {
      const scaleAnim = buttonAnims[index].scale;
      const opacityAnim = buttonAnims[index].opacity;
      
      // Subtle ripple effect for other tabs
      tabs.forEach((_, tabIndex) => {
        if (tabIndex !== index && buttonAnims[tabIndex]) {
          Animated.timing(buttonAnims[tabIndex].scale, {
            toValue: 0.98,
            duration: 120,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }).start(() => {
            Animated.timing(buttonAnims[tabIndex].scale, {
              toValue: 1,
              duration: 140,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }).start();
          });
        }
      });
      
      // Refined button press animation - smooth and premium
      Animated.sequence([
        // Subtle press down
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 0.96,
            duration: 100,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.8,
            duration: 100,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        // Smooth return to normal
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 120,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 120,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        setPressedIndex(null);
      });
    }
  }, [isAnimating, pressedIndex, currentTab, handleTabTransition]);
  
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
  
  const renderConversationItem = ({ item, index }: { item: Conversation; index: number }) => {
    const animIndex = index + 3; // Offset for tabs
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
        case 2: // Links - Shared resources
          return {
            accentColor: tabConfig.color,
            icon: 'link',
            badge: '•',
            subtitle: item.summary || 'Shared resource'
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
      <Animated.View
        style={[
          styles.conversationItem,
          {
            backgroundColor: isSelected
              ? `${styling.accentColor}15`
              : (theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
            borderColor: isSelected
              ? `${styling.accentColor}40`
              : (theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'),
            borderLeftWidth: isSelected ? 3 : 1,
            borderLeftColor: isSelected ? styling.accentColor : 'transparent',
            ...getHeaderMenuShadow(theme),
            opacity: itemAnims[animIndex]?.opacity || 1,
            transform: [
              { translateY: itemAnims[animIndex]?.translateY || 0 },
              { scale: Animated.multiply(itemAnims[animIndex]?.scale || 1, buttonAnims[animIndex]?.scale || 1) },
            ],
          }
        ]}
      >
        <TouchableOpacity 
          style={[
            styles.conversationTouchable,
            longPressedId === item._id && { backgroundColor: `${styling.accentColor}20` }
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
          activeOpacity={0.8}
          disabled={isAnimating}
        >
          {/* Icon and content */}
          <View style={styles.conversationContent}>
            <View style={[
              styles.conversationIcon,
              { 
                backgroundColor: `${styling.accentColor}20`,
                borderColor: `${styling.accentColor}40`
              }
            ]}>
              <Feather 
                name={styling.icon as any} 
                size={16} // Increased from 14 to 16 to match larger icon container
                color={styling.accentColor} 
              />
            </View>
            
            <View style={styles.conversationText}>
              <Text style={[
                styles.conversationTitle,
                typography.textStyles.bodyMedium,
                { color: isSelected ? styling.accentColor : themeColors.text }
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
              { backgroundColor: `${styling.accentColor}25` }
            ]}>
              <Text style={[
                styles.badgeText,
                { color: styling.accentColor }
              ]}>
                {styling.badge}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  
  const getTabContent = () => {
    switch (currentTab) {
      case 0: // Aether - Real conversations
        return conversations;
      case 1: // Friends - Coming soon
        return [];
      case 2: // Links - Coming soon  
        return [];
      default:
        return conversations;
    }
  };
  
  const renderEmptyState = () => {
    const tabConfig = tabs[currentTab];
    const emptyMessages = [
      isLoading ? 'Loading conversations...' : 'Start your AI conversation journey',
      'Friends feature coming soon',
      'Link sharing coming soon'
    ];
    
    return (
      <View style={styles.emptyState}>
        <View style={[
          styles.emptyIcon,
          { 
            backgroundColor: `${tabConfig.color}15`,
            borderColor: `${tabConfig.color}30`
          }
        ]}>
          <Feather 
            name={tabConfig.icon as any} 
            size={28} 
            color={tabConfig.iconColor} 
          />
        </View>
        <Text style={[
          styles.emptyTitle,
          { color: tabConfig.color }
        ]}>
          {tabConfig.label}
        </Text>
        <Text style={[
          styles.emptyText,
          { color: theme === 'dark' ? '#666' : '#999' }
        ]}>
          {emptyMessages[currentTab]}
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
                backgroundColor: 'transparent',
              }
            ]}
          />
        </TouchableOpacity>

        {/* Enhanced Drawer */}
        <Animated.View
          style={[
            styles.drawer,
            {
              transform: [
                { translateX: slideAnim },
                { scale: scaleAnim }
              ],
              backgroundColor: theme === 'light' ? designTokens.brand.surface : designTokens.surfaces.dark.elevated,
              borderRightWidth: 1,
              borderRightColor: theme === 'light' ? designTokens.borders.light.default : designTokens.borders.dark.default,
              ...getHeaderMenuShadow(theme),
            }
          ]}
        >
          <SafeAreaView style={styles.drawerContent}>
            <Animated.View 
              style={[
                styles.contentWrapper,
                { 
                  opacity: contentOpacity,
                  // Remove the translateX transform - no more moving content
                }
              ]}
            >

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
                
                {/* Connection Status Indicator */}
                <View style={styles.connectionStatus}>
                  <View style={[
                    styles.connectionDot,
                    { 
                      backgroundColor: isSSEConnected 
                        ? (theme === 'dark' ? designTokens.semanticDark.success : designTokens.semantic.success)
                        : (theme === 'dark' ? designTokens.semanticDark.warning : designTokens.semantic.warning)
                    }
                  ]} />
                  <Text style={[
                    styles.connectionText,
                    { color: themeColors.textSecondary }
                  ]}>
                    {isSSEConnected ? 'Live' : 'Offline'} • {eventCount} events
                  </Text>
                </View>
                {/* Animated Color Beam */}
                <Animated.View style={[
                  styles.colorBeam,
                  {
                    backgroundColor: colorBeamColor.interpolate({
                      inputRange: [0, 1, 2],
                      outputRange: [
                        tabs[0].color, // Friends orange
                        tabs[1].color, // Aether charcoal/white
                        tabs[2].color, // Links yellow
                      ],
                      extrapolate: 'clamp',
                    }),
                    transform: [{
                      translateX: colorBeamAnim.interpolate({
                        inputRange: [0, 1, 2],
                        outputRange: [0, (screenWidth * 0.85 - 16) / 3 + 6, 2 * ((screenWidth * 0.85 - 16) / 3 + 6)], // Account for drawer width, padding, and 6px gaps
                        extrapolate: 'clamp',
                      })
                    }],
                    shadowColor: colorBeamColor.interpolate({
                      inputRange: [0, 1, 2],
                      outputRange: [
                        tabs[0].color,
                        tabs[1].color,
                        tabs[2].color,
                      ],
                      extrapolate: 'clamp',        
                    }),
                  }
                ]} />
                
                <View style={styles.tabs}>
                  {tabs.map((tab, index) => {
                    const isActive = index === currentTab;
                    const tabOpacity = itemAnims[index]?.opacity || new Animated.Value(1);
                    const tabScale = Animated.multiply(
                      itemAnims[index]?.scale || new Animated.Value(1), 
                      buttonAnims[index]?.scale || new Animated.Value(1)
                    );
                    
                    return (
                      <Animated.View
                        key={tab.label}
                        style={[
                          styles.specialTab,
                          {
                            opacity: tabOpacity,
                            transform: [
                              { translateY: itemAnims[index]?.translateY || 0 },
                              { scale: tabScale },
                            ],
                          }
                        ]}
                      >
                        <TouchableOpacity
                          style={[
                            styles.neumorphicTab,
                            {
                              backgroundColor: 'transparent', // No background for any tabs
                              shadowColor: 'transparent', // No shadows
                              shadowOffset: { width: 0, height: 0 },
                              shadowOpacity: 0,
                              shadowRadius: 0,
                              borderWidth: 0,
                            }
                          ]}
                          onPress={() => handleTabPress(index)}
                          activeOpacity={0.9}
                          disabled={isAnimating}
                        >
                          {/* Icon with special glow effect */}
                          <View style={[
                            styles.tabIconContainer,
                            {
                              backgroundColor: isActive ? `${tab.color}15` : 'transparent',
                            }
                          ]}>
                            {tab.icon === 'logo' ? (
                              // Actual Aether logo
                              <Image
                                source={theme === 'dark' 
                                  ? require('../../assets/images/aether-logo-dark-mode.webp')
                                  : require('../../assets/images/aether-logo-light-mode.webp')
                                }
                                style={[
                                  styles.tabLogo,
                                  {
                                    opacity: isActive ? 1 : 0.6,
                                  }
                                ]}
                                resizeMode="contain"
                              />
                            ) : (
                              <Feather 
                                name={tab.icon as any} 
                                size={14} 
                                color={isActive ? tab.iconColor : (theme === 'dark' ? '#888' : '#666')} 
                              />
                            )}
                          </View>
                          
                          {/* Compact label */}
                          <Text style={[
                            styles.specialTabText,
                            {
                              color: isActive ? tab.color : (theme === 'dark' ? '#999' : '#555'),
                              fontWeight: isActive ? '700' : '600',
                            }
                          ]}>
                            {tab.label}
                          </Text>
                          
                          {/* Active indicator dot */}
                          <NotificationDot 
                            visible={isActive}
                            color={tab.color}
                            size={4}
                            glowIntensity="high"
                            style={{ top: 1, right: 1 }}
                          />
                          
                        </TouchableOpacity>
                      </Animated.View>
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
              
              {/* Bottom Action Bar - Hero Style */}
              <Animated.View 
                style={[
                  styles.bottomActionBar,
                  {
                    borderTopColor: theme === 'dark' 
                      ? designTokens.borders.dark.subtle 
                      : designTokens.borders.light.subtle,
                    backgroundColor: 'transparent',
                    opacity: contentOpacity,
                  }
                ]}
              >
                {onStartNewChat && (
                  <TouchableOpacity
                    style={[
                      styles.heroButton,
                      styles.primaryHeroButton,
                      {
                        backgroundColor: tabs[currentTab].isProprietary
                          ? (theme === 'dark' ? '#4A5568' : '#2D3748') // Better contrast for Aether
                          : tabs[currentTab].color,
                        shadowColor: tabs[currentTab].color,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 8,
                        elevation: 4,
                      }
                    ]}
                    onPress={handleNewChat}
                    activeOpacity={0.8}
                    disabled={isAnimating}
                  >
                    <Feather name="plus" size={18} color="#ffffff" />
                    <Text style={styles.heroButtonText}>
                      New {tabs[currentTab].label}
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
                      borderColor: theme === 'dark' 
                        ? 'rgba(255,255,255,0.2)' 
                        : 'rgba(0, 0, 0, 0.15)',
                      borderWidth: 1,
                      shadowColor: theme === 'dark' ? '#ffffff' : '#000000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 6,
                      elevation: 2,
                    }
                  ]}
                  onPress={handleClose}
                  activeOpacity={0.8}
                  disabled={isAnimating}
                >
                  <Feather name="x" size={18} color={themeColors.text} />
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
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
    width: screenWidth * 0.85,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
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
    flexDirection: 'column',
    paddingHorizontal: spacing[1], // Further reduced for maximum width consistency
    paddingVertical: spacing[3],
    paddingTop: 50,
    borderBottomWidth: 1,
    borderTopRightRadius: 16,
  },
  tabs: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'stretch',
    width: '100%',
    position: 'relative',
  },
  colorBeam: {
    position: 'absolute',
    bottom: 0,
    left: 8, // Start slightly right in pixels
    width: (screenWidth * 0.85 - 32) / 3 - 4, // Tab width minus padding and slight reduction
    height: 2,
    borderRadius: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  specialTab: {
    flex: 1,
  },
  neumorphicTab: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 4,
    minHeight: 40,
    position: 'relative',
    borderWidth: 0,
    overflow: 'hidden',
  },
  tabIconContainer: {
    width: 16,
    height: 16,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  tabLogo: {
    width: 40,
    height: 20,
  },
  specialTabText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
    textTransform: 'uppercase',
    lineHeight: 10,
  },
  techyAccent: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 1.5,
    opacity: 0.8,
  },
  bottomActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[3], // Consistent padding for proper layout
    paddingVertical: spacing[3],
    paddingBottom: spacing[4],
    borderTopWidth: 1,
    borderBottomRightRadius: 16,
    gap: spacing[3], // Better spacing between buttons
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8, // Slightly more rounded for modern look
    overflow: 'hidden',
  },
  primaryHeroButton: {
    flex: 1,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2], // Use consistent spacing tokens
    gap: spacing[2],
    minHeight: 36, // Better touch target
  },
  secondaryHeroButton: {
    width: 36, // Match minHeight of primary button
    height: 36, // Square aspect ratio
  },
  heroButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    lineHeight: 14,
    textTransform: 'uppercase',
  },
  content: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 2, // Minimal padding for maximum card width
    paddingVertical: spacing[3],
    gap: 4,
  },
  conversationItem: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    marginHorizontal: 0,
  },
  conversationTouchable: {
    flex: 1,
  },
  conversationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4], // Increased from spacing[3] to spacing[4] for more content padding
    gap: spacing[3], // Increased gap for better spacing between elements
  },
  conversationIcon: {
    width: 32, // Increased from 28 to 32
    height: 32, // Increased from 28 to 32
    borderRadius: 16, // Adjusted for new size
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  conversationText: {
    flex: 1,
    gap: 2,
  },
  conversationTitle: {
    fontSize: 15, // Increased from 14 to 15
    fontWeight: '700',
    letterSpacing: -0.1,
    lineHeight: 18, // Increased line height proportionally
    textTransform: 'capitalize',
  },
  conversationMeta: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
    lineHeight: 13,
    textTransform: 'uppercase',
  },
  conversationBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.1,
    textAlign: 'center',
    lineHeight: 20,
  },
  connectionStatus: {
    position: 'absolute',
    top: 8,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 10,
  },
  connectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  connectionText: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
});

export default ConversationDrawer;