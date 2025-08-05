/**
 * Aether - Adaptive Chat Screen
 * The heart of Aether - AI that learns and adapts to your patterns
 */

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Animated,
  Alert,
  Text,
  Dimensions,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Easing,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import LottieView from 'lottie-react-native';

// Enhanced Components
import { EnhancedChatInput, ChatHeader } from '../../design-system/components/molecules';
import EnhancedBubble from '../../design-system/components/molecules/EnhancedBubble';
import BasicMarkdown from '../../design-system/components/atoms/BasicMarkdown';
import { Header, HeaderMenu, SignOutModal } from '../../design-system/components/organisms';
import { PageBackground } from '../../design-system/components/atoms/PageBackground';
import SettingsModal from './SettingsModal';
import ConversationDrawer from '../../components/ConversationDrawer';
import ScrollToBottomButton from '../../design-system/components/atoms/ScrollToBottomButton';
import Tooltip from '../../design-system/components/atoms/Tooltip';
import { ShimmerText } from '../../design-system/components/atoms/ShimmerText';
import { WebSearchIndicator } from '../../design-system/components/atoms';
import { WebSearchResult } from '../../design-system/components/molecules';

// Design System
import { designTokens, getThemeColors, getLoadingTextColor } from '../../design-system/tokens/colors';
import { getHeaderMenuShadow } from '../../design-system/tokens/shadows';

// Contexts
import { useTheme } from '../../contexts/ThemeContext';
import { useSettings } from '../../contexts/SettingsContext';
import { typography } from '../../design-system/tokens/typography';
import { spacing } from '../../design-system/tokens/spacing';
import { createNeumorphicContainer } from '../../design-system/tokens/shadows';
import { getGlassmorphicStyle } from '../../design-system/tokens/glassmorphism';
import Icon from '../../design-system/components/atoms/Icon';
import { useHeaderMenu } from '../../design-system/hooks';

// Custom hooks
import { useGreeting } from '../../hooks/useGreeting';
import { useKeyboardAnimation } from '../../hooks/useKeyboardAnimation';
import { useMessages } from '../../hooks/useMessages';
import { useDynamicPrompts } from '../../hooks/useDynamicPrompts';
import { useSimpleScroll } from '../../hooks/useSimpleScroll';
import { useWebSearch } from '../../hooks/useWebSearch';
import { useGhostTyping } from '../../hooks/useGhostTyping';

// Services
import { AuthAPI, FriendsAPI, ConversationAPI } from '../../services/api';

// Utils
import { 
  createModalAnimationRefs, 
  showModalAnimation, 
  hideModalAnimation, 
  createTooltipPressAnimation,
  type ModalAnimationRefs 
} from '../../utils/animations';

// Types
import { ToolCall } from '../../types';


interface ChatScreenProps {}

// Dynamic dimensions hook to handle rotation
const useDimensions = () => {
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));
  
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    
    return () => subscription?.remove();
  }, []);
  
  return dimensions;
};

const ChatScreen: React.FC<ChatScreenProps> = () => {
  const navigation = useNavigation();
  const { theme, colors, toggleTheme } = useTheme();
  const { settings } = useSettings();
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useDimensions();
  
  // Custom hooks
  const { greetingText, showGreeting, setShowGreeting } = useGreeting();
  const { keyboardHeight, greetingAnimY, greetingOpacity } = useKeyboardAnimation();

  // Simple scroll hook
  const { 
    flatListRef, 
    scrollToBottom, 
    gentleScrollDown, 
    handleScrollBegin, 
    handleScrollEnd,
    handleScroll,
    showScrollButton,
    buttonOpacity,
    isAtBottom
  } = useSimpleScroll();

  // Web search hook  
  const {
    searchResults,
    isSearching,
    searchQuery,
    shouldShowSearchIndicator,
    clearSearch
  } = useWebSearch();

  
  // UI State
  const [inputText, setInputText] = useState('');
  const [showCopyTooltip, setShowCopyTooltip] = useState(false);
  const [showTestTooltip, setShowTestTooltip] = useState(true);
  const [showDynamicOptionsModal, setShowDynamicOptionsModal] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [isChatInputFocused, setIsChatInputFocused] = useState(false);
  
  // Animation refs
  const tooltipOpacity = useRef(new Animated.Value(1)).current;
  const tooltipScale = useRef(new Animated.Value(1)).current;
  const modalAnimationRefs = useRef<ModalAnimationRefs>(createModalAnimationRefs()).current;
  const headerAnim = useRef(new Animated.Value(1)).current;

  // Settings modal state
  const [showSettings, setShowSettings] = useState(false);
  
  // Conversation drawer state
  const [showConversationDrawer, setShowConversationDrawer] = useState(false);
  
  // Add Friend modal state
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [shouldRenderAddFriendModal, setShouldRenderAddFriendModal] = useState(false);
  const [friendUsername, setFriendUsername] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error' | null>(null);
  const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shakeAnim = useRef<Animated.Value>(new Animated.Value(0)).current;
  const addFriendModalOpacity = useRef<Animated.Value>(new Animated.Value(1)).current;
  
  const { ghostText, isDismissing } = useGhostTyping({
    isInputFocused,
    inputText: friendUsername,
  });
  
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(undefined);

  // Message handling with streaming (must be after currentConversationId declaration)
  const {
    messages,
    isLoading,
    isStreaming,
    handleSend: handleMessageSend,
    handleMessagePress,
    handleMessageLongPress,
    handleConversationSelect,
    setMessages,
    flatListRef: messagesRef,
  } = useMessages(() => setShowGreeting(false), currentConversationId);

  // Dynamic prompts hook for intelligent contextual options (after useMessages)
  const {
    prompts: dynamicPrompts,
    isAnalyzing: isAnalyzingContext,
    executePrompt,
    refreshPrompts
  } = useDynamicPrompts({
    messages: messages.map(msg => ({
      id: msg.id,
      text: msg.message,
      sender: msg.sender === 'aether' ? 'ai' : msg.sender === 'system' ? 'ai' : msg.sender,
      timestamp: new Date(msg.timestamp).getTime()
    })),
    onPromptExecute: (promptText: string) => {
      // Execute the hidden prompt directly
      handleMessageSend(promptText);
      // Hide the modal after execution
      hideModalAnimation(modalAnimationRefs, () => setShowDynamicOptionsModal(false));
    },
    enabled: true,
    refreshInterval: 3
  });

  // Header menu hook
  const { showHeaderMenu, setShowHeaderMenu, handleMenuAction, toggleHeaderMenu } = useHeaderMenu({
    screenName: 'chat',
    onSettingsPress: () => setShowSettings(true),
    onSignOut: () => setShowSignOutModal(true)
  });

  // Add Friend modal visibility effect with delay
  useLayoutEffect(() => {
    if (showAddFriendModal) {
      setShouldRenderAddFriendModal(true);
      // Fade in
      Animated.timing(addFriendModalOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    } else {
      // Fade out animation
      Animated.timing(addFriendModalOpacity, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
      
      // Delay unmounting to allow fade-out animation
      const timer = setTimeout(() => {
        setShouldRenderAddFriendModal(false);
      }, 300); // Match fade duration
      return () => clearTimeout(timer);
    }
  }, [showAddFriendModal]);

  // Keyboard event listeners for proper scroll behavior (only for chat input)
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      // Only scroll to bottom if the chat input is focused
      if (isChatInputFocused) {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 150);
      }
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      // Optional: scroll adjustment when keyboard hides if needed
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, [isChatInputFocused]);

  // Cleanup effect for rotation stability
  useEffect(() => {
    return () => {
      // Clear any pending timeouts
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
    };
  }, []);

  // Smart suggestions based on context
  const [suggestions] = useState([
    "How are you feeling today?",
    "Help me understand my patterns",
    "What can you tell me about myself?",
    "Show me my behavioral insights",
    "Find me connections with similar interests",
  ]);



  // Handle sending message - simplified wrapper
  const handleSend = async () => {
    if ((!inputText.trim() && attachments.length === 0) || isLoading) return;
    
    // Store current values before clearing to prevent race conditions
    const currentText = inputText;
    const currentAttachments = [...attachments];
    
    // Clear input immediately without requestAnimationFrame to prevent keyboard avoiding view issues
    setInputText('');
    setAttachments([]);
    
    // Send with stored values to ensure message content integrity
    await handleMessageSend(currentText, currentAttachments);
    
    // Auto-scroll will be handled by the FlatList onContentSizeChange
  };

  // Handle suggestion press
  const handleSuggestionPress = (suggestion: string) => {
    setInputText(suggestion);
  };

  // Handle settings press
  const handleSettingsPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowSettings(true);
  };

  // Handle conversation history press
  const handleConversationHistoryPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowConversationDrawer(true);
  };

  // Handle Add Friend press
  const handleAddFriendPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowAddFriendModal(true);
  };

  // Clear status function
  const clearStatus = () => {
    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
      statusTimeoutRef.current = null;
    }
    setStatusMessage('');
    setStatusType(null);
  };

  // Handle Add Friend submission
  const handleAddFriendSubmit = async () => {
    if (!friendUsername.trim()) return;
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const result = await FriendsAPI.addFriend(friendUsername.trim());
      
      if (result && result.success) {
        // Success haptic and show success message
        setTimeout(async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 150);
        
        setStatusMessage('Request sent!');
        setStatusType('success');
        setFriendUsername('');
        
        // Auto-hide modal after success
        statusTimeoutRef.current = setTimeout(() => {
          setShowAddFriendModal(false);
          clearStatus();
        }, 1000);
      } else {
        // Error shake animation
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
        ]).start();
        
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setStatusMessage(result?.error || 'Failed to send request');
        setStatusType('error');
        
        // Auto-clear error message
        statusTimeoutRef.current = setTimeout(() => {
          clearStatus();
        }, 3000);
      }
    } catch (error) {
      // Error shake animation
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
      ]).start();
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setStatusMessage('Network error. Please try again.');
      setStatusType('error');
      
      // Auto-clear error message
      statusTimeoutRef.current = setTimeout(() => {
        clearStatus();
      }, 3000);
    }
  };


  // Enhanced message press handler with tooltip
  const handleMessagePressWithTooltip = async (message: any) => {
    await handleMessagePress(message);
    setShowCopyTooltip(true);
  };

  // Handle scroll to bottom button press
  const handleScrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  // Enhanced handlers for new components
  // Note: handleMenuAction now provided by useHeaderMenu hook

  const handleSignOut = async () => {
    try {
      await AuthAPI.logout();
      // Auth check in App.tsx will handle navigation automatically
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error; // Re-throw to let SignOutModal handle error state
    }
  };

  const handleVoiceStart = () => {
    setIsVoiceRecording(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleVoiceEnd = () => {
    setIsVoiceRecording(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Add voice processing logic here
  };

  const handleEnhancedSend = () => {
    if (!inputText.trim() && attachments.length === 0) return;
    
    // Store current values before clearing
    const currentText = inputText;
    const currentAttachments = [...attachments];
    
    // Dismiss keyboard immediately to prevent KeyboardAvoidingView positioning issues
    Keyboard.dismiss();
    
    // Clear input immediately
    setInputText('');
    setAttachments([]);
    
    if (currentAttachments.length > 0) {
      // Handle attachments - send message with attachments
      const messageText = currentText.trim() || "";
      handleMessageSend(messageText, currentAttachments);
    } else {
      // Send the message with the current input text
      handleMessageSend(currentText);
    }
  };

  // Handle input focus/blur for tooltip fade
  const handleInputFocus = () => {
    setIsChatInputFocused(true);
    
    // Smooth fade out with gentle easing
    Animated.timing(tooltipOpacity, {
      toValue: 0,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    
    // Delay scroll to bottom to allow keyboard to animate in first
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  };

  const handleInputBlur = () => {
    setIsChatInputFocused(false);
    
    // Smooth fade in with delay and gentle easing
    setTimeout(() => {
      Animated.timing(tooltipOpacity, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, 100);
  };

  // Handle dynamic options tooltip press
  const handleDynamicOptionsPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    createTooltipPressAnimation(tooltipScale);

    setTimeout(() => {
      setShowDynamicOptionsModal(true);
      showModalAnimation(modalAnimationRefs);
    }, 50);
  };

  // Modal hide handler
  const handleHideModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    hideModalAnimation(modalAnimationRefs, () => setShowDynamicOptionsModal(false));
  };

  // Handle creating a new conversation
  const handleStartNewChat = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Create a new conversation on the backend
      const response = await ConversationAPI.createConversation('New Chat');
      
      if (response.success && response.data) {
        // Clear current messages and set new conversation ID
        setMessages([]);
        setCurrentConversationId(response.data._id);
        setShowConversationDrawer(false);
        
        // Show success feedback
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        throw new Error('Failed to create conversation');
      }
    } catch (error) {
      console.error('Error creating new conversation:', error);
      
      // Fallback to clearing current state
      setMessages([]);
      setCurrentConversationId(undefined);
      setShowConversationDrawer(false);
      
      // Show error feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Error',
        'Failed to create new conversation. Starting fresh chat.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  // Render message item using EnhancedBubble for proper attachment support
  const renderMessage = ({ item, index }: { item: any; index: number }) => {
    return (
      <View style={styles.messageItem}>
        <EnhancedBubble
          message={item}
          index={index}
          theme={theme}
          messageIndex={index}
        />
      </View>
    );
  };

  return (
    <PageBackground theme={theme} variant="chat">
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
          backgroundColor="transparent"
          translucent
        />

        {/* Dynamic Greeting Banner */}
        {greetingText && showGreeting && (
          <Animated.View 
            style={[
              styles.greetingBanner,
              {
                transform: [{ translateY: greetingAnimY }],
                opacity: greetingOpacity,
              }
            ]}
          >
            <ShimmerText 
              style={{
                ...styles.greetingText,
                color: theme === 'dark' ? colors.text : '#5A5A5A',
              }}
              intensity="subtle"
              duration={3000}
              waveWidth="wide"
              enabled={true}
              animationMode="greeting-sequence"
            >
              {greetingText}
            </ShimmerText>
          </Animated.View>
        )}
      
      <View style={styles.chatArea}>
        {/* Web Search Indicator */}
        {shouldShowSearchIndicator && (
          <WebSearchIndicator
            isSearching={isSearching}
            searchQuery={searchQuery}
            resultCount={searchResults.length}
          />
        )}
        
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: headerAnim } } }],
            { 
              useNativeDriver: false,
              listener: handleScroll
            }
          )}
          onScrollBeginDrag={handleScrollBegin}
          onScrollEndDrag={handleScrollEnd}
          onContentSizeChange={gentleScrollDown}
        />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.inputContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        enabled={true}
      >
        <Animated.View 
          style={[
            styles.scrollToBottomButton,
            { opacity: buttonOpacity }
          ]}
          pointerEvents={showScrollButton ? 'auto' : 'none'}
        >
          <TouchableOpacity 
            onPress={scrollToBottom}
            activeOpacity={0.7}
          >
            <View style={[
              styles.scrollButtonCircle,
              { backgroundColor: theme === 'dark' ? '#2A2A2A' : '#ffffff' }
            ]}>
              <Text style={[
                styles.scrollButtonArrow,
                { color: theme === 'dark' ? '#ffffff' : '#444444' }
              ]}>
                ↓
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
        
        <View style={styles.chatInputWrapper}>
          <EnhancedChatInput
            value={inputText}
            onChangeText={setInputText}
            onSend={handleEnhancedSend}
            onVoiceStart={handleVoiceStart}
            onVoiceEnd={handleVoiceEnd}
            isLoading={isLoading}
            theme={theme}
            placeholder="What up?"
            nextMessageIndex={messages.length}
            voiceEnabled={false}
            enableFileUpload={true}
            maxAttachments={5}
            attachments={attachments}
            onAttachmentsChange={setAttachments}
            colorfulBubblesEnabled={settings.colorfulBubblesEnabled}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onSwipeUp={() => setShowTestTooltip(true)}
          />
        </View>
      </KeyboardAvoidingView>
      
      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        onSignOut={async () => {
          try {
            await AuthAPI.logout();
            // Auth check in App.tsx will handle navigation automatically
          } catch (error) {
            console.error('Sign out error:', error);
          }
        }}
        navigation={navigation}
      />
      
      <ConversationDrawer
        isVisible={showConversationDrawer}
        onClose={() => setShowConversationDrawer(false)}
        onConversationSelect={(conversation) => {
          handleConversationSelect(conversation);
          setCurrentConversationId(conversation._id);
        }}
        onStartNewChat={handleStartNewChat}
        currentConversationId={currentConversationId}
        theme={theme}
      />
      
      {/* Enhanced Header */}
      <Header
        title="Aether"
        showMenuButton={true}
        showConversationsButton={true}
        leftIcon="user-plus"
        onMenuPress={toggleHeaderMenu}
        onConversationsPress={() => setShowConversationDrawer(true)}
        onLeftPress={handleAddFriendPress}
        theme={theme}
        isVisible={headerVisible}
        isMenuOpen={showHeaderMenu}
      />
      
      {/* Header Menu */}
      <HeaderMenu
        visible={showHeaderMenu}
        onClose={() => {
          if (setShowHeaderMenu) {
            setShowHeaderMenu(false);
          }
        }}
        onAction={handleMenuAction}
        showAuthOptions={true}
        potentialMatches={5}
      />
      
      {/* Sign Out Modal */}
      <SignOutModal
        visible={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={handleSignOut}
        theme={theme}
        title="Sign Out"
        message="Are you sure you want to sign out of your account?"
        confirmText="Sign Out"
        cancelText="Cancel"
        variant="danger"
      />
      
      {/* Dynamic Options Modal */}
      {showDynamicOptionsModal && (
        <Animated.View 
          style={[
            styles.modalOverlay,
            {
              opacity: modalAnimationRefs.opacity,
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.modalBackdrop}
            onPress={handleHideModal}
            activeOpacity={1}
          />
          <View style={styles.modalPositioner}>
            <Animated.View style={[
              styles.dynamicOptionsModal,
              getGlassmorphicStyle('card', theme),
              {
                backgroundColor: theme === 'dark' ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                borderColor: colors.borders?.default || (theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
                opacity: modalAnimationRefs.opacity,
                transform: [
                  { scale: modalAnimationRefs.scale },
                  { translateY: modalAnimationRefs.translateY }
                ],
              }
            ]}>
              <Text style={[
                styles.modalTitle,
                {
                  color: colors.text,
                }
              ]}>
                Explore Further
              </Text>
              
              {/* Dynamic contextual prompts */}
              <View style={styles.optionsContainer}>
                {isAnalyzingContext ? (
                  <View style={styles.loadingContainer}>
                    <Text style={[
                      styles.loadingText,
                      {
                        color: colors.textSecondary,
                      }
                    ]}>
                      Analyzing conversation...
                    </Text>
                  </View>
                ) : dynamicPrompts.length > 0 ? (
                  dynamicPrompts.map((prompt, index) => {
                    // Color coding: red, yellow, green for first 3 options
                    const dotColors = ['#FF4757', '#FFA502', '#2ED573'];
                    const dotColor = dotColors[index % 3];
                    
                    return (
                      <TouchableOpacity
                        key={prompt.id}
                        style={[
                          styles.promptOption,
                          {
                            backgroundColor: theme === 'dark' 
                              ? 'rgba(255, 255, 255, 0.05)' 
                              : 'rgba(0, 0, 0, 0.03)',
                            borderColor: theme === 'dark' 
                              ? 'rgba(255, 255, 255, 0.1)' 
                              : 'rgba(0, 0, 0, 0.08)',
                          }
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          executePrompt(prompt.id);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={styles.promptHeader}>
                          <View style={[styles.colorDot, { backgroundColor: dotColor }]} />
                          <Text style={[
                            styles.promptText,
                            {
                              color: colors.text,
                            }
                          ]}>
                            {prompt.displayText}
                          </Text>
                        </View>
                        <Text style={[
                          styles.promptCategory,
                          {
                            color: colors.textMuted,
                          }
                        ]}>
                          {prompt.archetype}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <Text style={[
                    styles.placeholderText,
                    {
                      color: colors.textSecondary,
                    }
                  ]}>
                    Start a conversation to see contextual options
                  </Text>
                )}
              </View>
              
              <TouchableOpacity 
                style={[
                  styles.closeButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.borders?.default || (theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
                  }
                ]}
                onPress={handleHideModal}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.closeButtonText,
                  {
                    color: colors.text,
                  }
                ]}>
                  Close
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>
      )}

      {/* Add Friend Dropdown */}
      {shouldRenderAddFriendModal && (
      <Modal
        visible={shouldRenderAddFriendModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowAddFriendModal(false)}
      >
        <Animated.View style={[styles.overlay, { opacity: addFriendModalOpacity }]}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setShowAddFriendModal(false)}
          />
          
          <Animated.View style={[
            styles.dropdown,
            {
              left: 24,
              top: 123,
              backgroundColor: theme === 'light' ? '#ffffff' : designTokens.brand.surfaceDark,
              borderWidth: 1,
              borderColor: theme === 'dark' ? designTokens.borders.dark.default : designTokens.borders.light.default,
              ...getHeaderMenuShadow(theme),
            }
          ]}>
            {/* Arrow pointing to header button with border */}
            <View style={{ position: 'absolute', top: -9, left: 60 }}>
              {/* Border triangle (slightly larger) */}
              <View style={[
                styles.arrow,
                {
                  borderBottomColor: theme === 'dark' ? designTokens.borders.dark.default : designTokens.borders.light.default,
                  borderLeftWidth: 9,
                  borderRightWidth: 9,
                  borderBottomWidth: 9,
                }
              ]} />
              {/* Fill triangle (smaller, on top) */}
              <View style={[
                styles.arrow,
                {
                  borderBottomColor: theme === 'light' ? '#ffffff' : designTokens.brand.surfaceDark,
                  position: 'absolute',
                  top: 1,
                  left: -0.5,
                  borderLeftWidth: 8,
                  borderRightWidth: 8,
                  borderBottomWidth: 8,
                }
              ]} />
            </View>
            
            <View style={styles.dropdownContent}>
              <Text style={[
                styles.dropdownTitle,
                { 
                  color: theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.primary,
                  fontFamily: 'Nunito-SemiBold',
                  letterSpacing: -0.7,
                }
              ]}>
                Add a friend by username
              </Text>
              
              <Animated.View
                style={{
                  transform: [{ translateX: shakeAnim }]
                }}
              >
                <TextInput
                  style={[
                    styles.friendInput,
                    {
                      color: statusType === 'error' ? '#FF4444' : statusType === 'success' ? '#00AA44' : (theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.primary),
                      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f8f8f8',
                      borderColor: statusType === 'error' ? '#FF4444' : statusType === 'success' ? '#00AA44' : (theme === 'dark' ? designTokens.borders.dark.default : designTokens.borders.light.default),
                    }
                  ]}
                  placeholder={statusMessage || ghostText}
                  placeholderTextColor={statusType === 'error' ? '#FF4444' : statusType === 'success' ? '#00AA44' : (theme === 'dark' ? designTokens.text.mutedDark : designTokens.text.muted)}
                  value={friendUsername}
                  onChangeText={(text) => {
                    setFriendUsername(text);
                    // Clear status when user starts typing
                    if (statusMessage) {
                      clearStatus();
                    }
                  }}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardAppearance={theme === 'dark' ? 'dark' : 'light'}
                  selectionColor={theme === 'dark' ? '#ffffff' : '#007AFF'}
                  cursorColor={theme === 'dark' ? '#ffffff' : '#007AFF'}
                  textAlign="center"
                  editable={!statusMessage} // Disable input while showing status
                />
              </Animated.View>
              
              <TouchableOpacity
                style={[
                  styles.addButton,
                  {
                    backgroundColor: theme === 'dark' ? '#0d0d0d' : designTokens.brand.primary,
                    borderColor: theme === 'dark' ? '#262626' : 'transparent',
                    borderWidth: theme === 'dark' ? 1 : 0,
                    // Strong tight glow for dark mode, shadow for light mode
                    shadowColor: theme === 'dark' ? '#ffffff' : '#000000',
                    shadowOffset: { width: 0, height: theme === 'dark' ? 0 : 2 },
                    shadowOpacity: theme === 'dark' ? 0.4 : 0.3,
                    shadowRadius: theme === 'dark' ? 4 : 8,
                    elevation: theme === 'dark' ? 0 : 4,
                  }
                ]}
                onPress={handleAddFriendSubmit}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.addButtonText,
                  { 
                    color: theme === 'dark' ? '#ffffff' : '#ffffff',
                    fontFamily: 'Nunito-SemiBold',
                    letterSpacing: -0.3,
                  }
                ]}>
                  Add friend
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
      )}
      </SafeAreaView>
    </PageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Chat Layout
  chatArea: {
    flex: 1,
  },
  
  messagesList: {
    flex: 1,
    paddingHorizontal: 8,
  },
  
  messagesContainer: {
    paddingTop: Platform.OS === 'ios' ? 90 : 70,
    paddingBottom: 12,
    gap: 0,
  },
  
  inputContainer: {
    backgroundColor: 'transparent',
    paddingBottom: 80, // Lower the chat input further
  },
  
  chatInputWrapper: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    // Remove negative margin that might cause positioning issues
    marginBottom: 0,
  },

  // Message Styles
  messageItem: {
    marginVertical: 8,
    width: '100%',
  },
  
  userContainer: {
    alignItems: 'flex-end',
    width: '100%',
  },
  
  userBubble: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    maxWidth: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  
  userText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Nunito-Regular',
    fontWeight: '400',
  },
  
  botContainer: {
    alignItems: 'flex-start',
    width: '100%',
    paddingHorizontal: 2,
    paddingRight: 6,
  },
  
  botText: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Nunito-Regular',
    fontWeight: '400',
    maxWidth: '98%',
    flexShrink: 1,
  },

  lottieAnimation: {
    width: 76,
    height: 46,
    alignSelf: 'flex-start',
  },

  // Scroll to Bottom Button
  scrollToBottomButton: {
    position: 'absolute',
    bottom: 110,
    alignSelf: 'center',
    zIndex: 1000,
  },
  
  scrollButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  
  scrollButtonArrow: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Dynamic Greeting Banner
  greetingBanner: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    transform: [{ translateY: -12 }],
  },
  greetingText: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Nunito_400Regular',
    letterSpacing: -0.9,
    textAlign: 'center',
    maxWidth: 280,
    alignSelf: 'center',
  },

  // Dynamic Options Modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10000,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalPositioner: {
    position: 'absolute',
    bottom: 110, 
    left: 12,
    right: 12,
  },
  dynamicOptionsModal: {
    width: '92%', 
    alignSelf: 'center', 
    borderRadius: 8, 
    borderWidth: 1,
    padding: spacing[2],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    ...typography.textStyles.bodyMedium,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  optionsContainer: {
    minHeight: 80,
    paddingVertical: spacing[1],
    gap: spacing[1],
  },
  loadingContainer: {
    paddingVertical: spacing[4],
    alignItems: 'center',
  },
  loadingText: {
    ...typography.textStyles.caption,
    fontStyle: 'italic',
  },
  promptOption: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing[2],
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing[2],
  },
  promptText: {
    ...typography.textStyles.body,
    fontWeight: '600',
    flex: 1,
  },
  promptCategory: {
    ...typography.textStyles.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '500',
    opacity: 0.7,
  },
  placeholderText: {
    ...typography.textStyles.caption,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  closeButton: {
    marginTop: spacing[3],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  closeButtonText: {
    ...typography.textStyles.labelMedium,
    fontWeight: '500',
  },
  
  // Search Results Styles
  searchContainer: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
  },
  
  searchTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Nunito-SemiBold',
  },
  
  // Add Friend Dropdown Styles
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dropdown: {
    position: 'absolute',
    width: 280,
    borderRadius: 16,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    overflow: 'visible',
  },
  arrow: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  dropdownContent: {
    paddingTop: spacing[2],
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  friendInput: {
    width: '100%',
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing[3],
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  addButton: {
    width: '100%',
    height: 37,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

export default ChatScreen;