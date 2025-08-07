/**
 * Aether - Adaptive Chat Screen
 * The heart of Aether - AI that learns and adapts to your patterns
 */

import React, { useState, useRef, useEffect } from 'react';
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
  Platform,
  Keyboard,
  Easing,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

// Enhanced Components
import { EnhancedChatInput } from '../../design-system/components/molecules';
import EnhancedBubble from '../../design-system/components/molecules/EnhancedBubble';
import { Header, HeaderMenu, SignOutModal } from '../../design-system/components/organisms';
import { PageBackground } from '../../design-system/components/atoms/PageBackground';
import SettingsModal from './SettingsModal';
import ConversationDrawer from '../../components/ConversationDrawer';
import { ShimmerText } from '../../design-system/components/atoms/ShimmerText';
import { WebSearchIndicator } from '../../design-system/components/atoms';

// Design System
import { designTokens } from '../../design-system/tokens/colors';
import { getHeaderMenuShadow } from '../../design-system/tokens/shadows';

// Contexts
import { useTheme } from '../../contexts/ThemeContext';
import { useSettings } from '../../contexts/SettingsContext';
import { typography } from '../../design-system/tokens/typography';
import { spacing } from '../../design-system/tokens/spacing';
import { getGlassmorphicStyle } from '../../design-system/tokens/glassmorphism';
import { useHeaderMenu } from '../../design-system/hooks';
import { logger } from '../../utils/logger';

// Custom hooks
import { useGreeting } from '../../hooks/useGreeting';
import { useKeyboardAnimation } from '../../hooks/useKeyboardAnimation';
import { useMessages } from '../../hooks/useMessages';
import { useDynamicPrompts } from '../../hooks/useDynamicPrompts';
import { useWebSearch } from '../../hooks/useWebSearch';
import { useGhostTyping } from '../../hooks/useGhostTyping';

// Types
import type { Message } from '../../types/chat';

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



interface ChatScreenProps {
  route?: {
    params?: {
      friendUsername?: string;
    };
  };
}

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

const ChatScreen: React.FC<ChatScreenProps> = ({ route }) => {
  const navigation = useNavigation();
  const { theme, colors } = useTheme();
  const { settings } = useSettings();
  const { width: SCREEN_WIDTH } = useDimensions();
  
  // Custom hooks
  const { greetingText, showGreeting, setShowGreeting } = useGreeting();
  const { greetingAnimY, greetingOpacity } = useKeyboardAnimation();

  const flatListRef = useRef<FlatList>(null);

  // Web search hook  
  const {
    searchResults,
    isSearching,
    searchQuery,
    shouldShowSearchIndicator,
    // clearSearch
  } = useWebSearch();

  
  // UI State
  const [inputText, setInputText] = useState('');
  const [, setShowCopyTooltip] = useState(false);
  const [, setShowTestTooltip] = useState(true);
  const [showDynamicOptionsModal, setShowDynamicOptionsModal] = useState(false);
  const [headerVisible] = useState(true);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [, setIsVoiceRecording] = useState(false);
  const [isChatInputFocused, setIsChatInputFocused] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const inputContainerAnim = useRef(new Animated.Value(0)).current;
  
  // Animation refs
  const tooltipOpacity = useRef(new Animated.Value(1)).current;
  const tooltipScale = useRef(new Animated.Value(1)).current;
  const modalAnimationRefs = useRef<ModalAnimationRefs>(createModalAnimationRefs()).current;
  const headerAnim = useRef(new Animated.Value(1)).current;

  // Settings modal state - simplified
  const [showSettings, setShowSettings] = useState(false);
  
  // SignOut modal state
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  
  // Conversation drawer state
  const [showConversationDrawer, setShowConversationDrawer] = useState(false);
  
  // Add Friend modal state
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [shouldRenderAddFriendModal, setShouldRenderAddFriendModal] = useState(false);
  const [friendUsername, setFriendUsername] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error' | 'warning' | 'loading' | null>(null);
  const [isSubmittingFriendRequest, setIsSubmittingFriendRequest] = useState(false);
  const [validationError, setValidationError] = useState('');
  const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shakeAnim = useRef<Animated.Value>(new Animated.Value(0)).current;
  const addFriendModalOpacity = useRef<Animated.Value>(new Animated.Value(1)).current;
  
  const { ghostText, isDismissing } = useGhostTyping({
    isInputFocused,
    inputText: friendUsername,
  });
  
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(undefined);
  const [currentFriendUsername, setCurrentFriendUsername] = useState<string | undefined>(
    route?.params?.friendUsername
  );

  // Message handling with streaming (must be after currentConversationId declaration)
  const {
    messages,
    isLoading,
    isStreaming,
    handleSend: handleMessageSend,
    handleMessagePress,
    // handleMessageLongPress,
    handleConversationSelect,
    handleHaltStreaming,
    setMessages,
    // flatListRef: messagesRef,
  } = useMessages(() => setShowGreeting(false), currentConversationId, currentFriendUsername);

  // Dynamic prompts hook for intelligent contextual options (after useMessages)
  const {
    prompts: dynamicPrompts,
    isAnalyzing: isAnalyzingContext,
    executePrompt,
    // refreshPrompts
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
    onSettingsPress: () => {
      setShowSettings(true);
    },
    onSignOut: () => setShowSignOutModal(true)
  });

  // Handle route parameter changes for friend username
  useEffect(() => {
    if (route?.params?.friendUsername && route.params.friendUsername !== currentFriendUsername) {
      setCurrentFriendUsername(route.params.friendUsername);
      setCurrentConversationId(undefined);
      setMessages([]); // Clear messages when switching to friend
    }
  }, [route?.params?.friendUsername, currentFriendUsername]);

  // Add Friend modal visibility effect - fixed to prevent useInsertionEffect warnings
  useEffect(() => {
    if (showAddFriendModal && !shouldRenderAddFriendModal) {
      setShouldRenderAddFriendModal(true);
      // Fade in
      Animated.timing(addFriendModalOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    } else if (!showAddFriendModal && shouldRenderAddFriendModal) {
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
  }, [showAddFriendModal, shouldRenderAddFriendModal]);

  // Settings modal logic removed - just use showSettings directly


  // Keyboard event listeners for proper scroll behavior (only for chat input)
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setIsKeyboardVisible(true);
      setKeyboardHeight(e.endCoordinates.height);
      
      // Animate to keyboard position using native driver
      Animated.timing(inputContainerAnim, {
        toValue: -(e.endCoordinates.height - 20),
        duration: 200,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        useNativeDriver: true,
      }).start();
      
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
      
      // Animate to hidden position using native driver
      Animated.timing(inputContainerAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        useNativeDriver: true,
      }).start();
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
  const [_suggestions] = useState([
    "How are you feeling today?",
    "Help me understand my patterns",
    "What can you tell me about myself?",
    "Show me my behavioral insights",
    "Find me connections with similar interests",
  ]);



  // Handle sending message - simplified wrapper
  const _handleSend = async () => {
    if ((!inputText.trim() && attachments.length === 0) || isLoading) return;
    
    // Store current values before clearing to prevent race conditions
    const currentText = inputText;
    const currentAttachments = [...attachments];
    
    // Clear input immediately without requestAnimationFrame to prevent keyboard avoiding view issues
    setInputText('');
    setAttachments([]);
    
    // Send with stored values to ensure message content integrity
    await handleMessageSend(currentText, currentAttachments);
  };

  // Handle suggestion press
  const _handleSuggestionPress = (_suggestion: string) => {
    setInputText(_suggestion);
  };

  // Handle settings press
  const _handleSettingsPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowSettings(true);
  };

  // Handle conversation history press
  const _handleConversationHistoryPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowConversationDrawer(true);
  };

  // Handle Add Friend press
  const handleAddFriendPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowAddFriendModal(true);
  };

  // Username validation function
  const validateUsername = (username: string): string | null => {
    if (!username.trim()) {
      return 'Username is required';
    }
    
    if (username.trim().length < 3) {
      return 'Username must be at least 3 characters';
    }
    
    if (username.trim().length > 20) {
      return 'Username cannot exceed 20 characters';
    }
    
    // Check for valid username pattern (alphanumeric, underscores, hyphens)
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username.trim())) {
      return 'Username can only contain letters, numbers, underscores, and hyphens';
    }
    
    return null; // Valid
  };

  // Clear status function
  const clearStatus = () => {
    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
      statusTimeoutRef.current = null;
    }
    setStatusMessage('');
    setStatusType(null);
    setValidationError('');
  };

  // Enhanced status display function
  const showStatus = (message: string, type: 'success' | 'error' | 'warning' | 'loading', duration: number = 3000) => {
    clearStatus();
    setStatusMessage(message);
    setStatusType(type);
    
    if (type !== 'loading' && duration > 0) {
      statusTimeoutRef.current = setTimeout(() => {
        clearStatus();
      }, duration);
    }
  };

  // Enhanced shake animation
  const performShakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 75, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 75, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 75, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 75, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 75, useNativeDriver: true }),
    ]).start();
  };

  // Handle Add Friend submission with comprehensive error handling
  const handleAddFriendSubmit = async () => {
    const username = friendUsername.trim();
    
    // Client-side validation
    const validationError = validateUsername(username);
    if (validationError) {
      setValidationError(validationError);
      performShakeAnimation();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    // Clear any previous validation errors
    setValidationError('');
    setIsSubmittingFriendRequest(true);
    showStatus('Sending friend request...', 'loading');
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const result = await FriendsAPI.addFriend(username);
      
      if (result && result.success) {
        // Success scenario
        setTimeout(async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 150);
        
        showStatus('Friend request sent successfully!', 'success', 2000);
        setFriendUsername('');
        
        // Auto-hide modal after success
        statusTimeoutRef.current = setTimeout(() => {
          setShowAddFriendModal(false);
          clearStatus();
        }, 1500);
        
      } else {
        // Handle various API error responses
        performShakeAnimation();
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        
        let errorMessage = 'Failed to send friend request';
        
        if (result?.error) {
          const error = result.error.toLowerCase();
          
          if (error.includes('already friends') || error.includes('friend already exists')) {
            errorMessage = 'You are already friends with this user';
            showStatus(errorMessage, 'warning', 4000);
          } else if (error.includes('request already sent') || error.includes('pending')) {
            errorMessage = 'Friend request already sent';
            showStatus(errorMessage, 'warning', 4000);
          } else if (error.includes('user not found') || error.includes('does not exist')) {
            errorMessage = 'User not found. Check the username and try again';
            showStatus(errorMessage, 'error', 4000);
          } else if (error.includes('cannot add yourself') || error.includes('self')) {
            errorMessage = 'You cannot add yourself as a friend';
            showStatus(errorMessage, 'warning', 3000);
          } else if (error.includes('blocked') || error.includes('restricted')) {
            errorMessage = 'Unable to send request to this user';
            showStatus(errorMessage, 'error', 4000);
          } else if (error.includes('limit') || error.includes('maximum')) {
            errorMessage = 'Friend request limit reached. Try again later';
            showStatus(errorMessage, 'warning', 4000);
          } else {
            errorMessage = result.error;
            showStatus(errorMessage, 'error', 4000);
          }
        } else {
          showStatus(errorMessage, 'error', 3000);
        }
      }
    } catch (error: unknown) {
      // Network and other errors
      performShakeAnimation();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      let errorMessage = 'Network error. Please try again.';
      
      const errorObj = error as { code?: string; message?: string; response?: { status: number } };
      if (errorObj.code === 'ECONNABORTED' || errorObj.message?.includes('timeout')) {
        errorMessage = 'Network error, try again in a few minutes';
      } else if (errorObj.code === 'NETWORK_ERROR' || errorObj.message?.includes('network')) {
        errorMessage = 'Network error, try again in a few minutes';
      } else if (errorObj.response?.status === 401) {
        errorMessage = 'Authentication failed. Please sign in again.';
      } else if (errorObj.response?.status === 429) {
        errorMessage = 'Too many requests. Please wait and try again.';
      } else if (errorObj.response?.status && errorObj.response.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (errorObj.message) {
        errorMessage = `Error: ${errorObj.message}`;
      }
      
      showStatus(errorMessage, 'error', 4000);
    } finally {
      setIsSubmittingFriendRequest(false);
    }
  };


  // Enhanced message press handler with tooltip
  const _handleMessagePressWithTooltip = async (_message: Message) => {
    await handleMessagePress(_message);
    setShowCopyTooltip(true);
  };


  // Enhanced handlers for new components
  // Note: handleMenuAction now provided by useHeaderMenu hook

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
  const _handleDynamicOptionsPress = () => {
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
        setCurrentFriendUsername(undefined); // Clear friend context
        setShowConversationDrawer(false);
        
        // Show success feedback
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        throw new Error('Failed to create conversation');
      }
    } catch (error) {
      logger.error('Error creating new conversation:', error);
      
      // Fallback to clearing current state
      setMessages([]);
      setCurrentConversationId(undefined);
      setCurrentFriendUsername(undefined); // Clear friend context
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
  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
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
                color: theme === 'dark' ? '#4d4d4dff' : '#8a8a8a',
              }}
              intensity="subtle"
              duration={3000}
              waveWidth="wide"
              enabled={true}
              animationMode="greeting-once"
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
          contentContainerStyle={[
            styles.messagesContainer,
            {
              // Dynamic padding bottom when keyboard/input is focused
              paddingBottom: isChatInputFocused 
                ? keyboardHeight + 120 // Keyboard height + input container height + buffer
                : 12, // Default padding when not focused
            }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: headerAnim } } }],
            { useNativeDriver: false }
          )}
        />

      </View>

      <Animated.View 
        style={[
          styles.inputContainer,
          {
            transform: [{ translateY: inputContainerAnim }],
          }
        ]}
      >
        
        <View style={[
          styles.chatInputWrapper,
          {
            backgroundColor: theme === 'dark' 
              ? 'rgba(20, 20, 20, 0.95)' 
              : 'rgba(250, 250, 250, 0.95)',
            borderTopWidth: 1,
            borderTopColor: theme === 'dark' 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'rgba(0, 0, 0, 0.1)',
          }
        ]}>
          <EnhancedChatInput
            value={inputText}
            onChangeText={setInputText}
            onSend={handleEnhancedSend}
            onVoiceStart={handleVoiceStart}
            onVoiceEnd={handleVoiceEnd}
            isLoading={isLoading}
            isStreaming={isStreaming}
            onHaltStreaming={handleHaltStreaming}
            theme={theme}
            placeholder={currentFriendUsername ? `Chatting with ${currentFriendUsername} •` : "What up?"}
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
      </Animated.View>
      
      {/* Settings Modal */}
      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        onSignOut={() => setShowSignOutModal(true)}
        navigation={navigation}
      />
      
      {/* SignOut Confirmation Modal */}
      <SignOutModal
        visible={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={async () => {
          try {
            await AuthAPI.logout();
            // Auth check in App.tsx will handle navigation automatically
            // Wait a bit for the auth state to propagate and navigation to occur
            // before closing the modal
            setTimeout(() => {
              setShowSignOutModal(false);
            }, 1000);
          } catch (error) {
            logger.error('Sign out error:', error);
            // Close immediately on error since the sign out failed
            setShowSignOutModal(false);
          }
        }}
        theme={theme}
      />
      
      <ConversationDrawer
        isVisible={showConversationDrawer}
        onClose={() => setShowConversationDrawer(false)}
        onConversationSelect={(conversation) => {
          if (conversation.type === 'friend' && conversation.friendUsername) {
            // Handle friend conversation
            setCurrentFriendUsername(conversation.friendUsername);
            setCurrentConversationId(undefined);
            // Clear messages for new friend conversation
            setMessages([]);
          } else {
            // Handle AI conversation
            const conversationId = conversation._id;
            setCurrentConversationId(conversationId);
            setCurrentFriendUsername(undefined);
            handleConversationSelect(conversation);
          }
        }}
        onStartNewChat={handleStartNewChat}
        currentConversationId={currentConversationId}
        theme={theme}
      />
      
      {/* Enhanced Header */}
      <Header
        title={currentFriendUsername ? currentFriendUsername : "Aether"}
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
                      color: validationError 
                        ? '#FF6B6B' 
                        : statusType === 'error' 
                          ? '#FF4444' 
                          : statusType === 'success' 
                            ? '#00DD44' 
                            : statusType === 'warning'
                              ? '#FFB366'
                              : (theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.primary),
                      backgroundColor: isSubmittingFriendRequest 
                        ? (theme === 'dark' ? '#2a2a2a' : '#f0f0f0')
                        : (theme === 'dark' ? '#1a1a1a' : '#f8f8f8'),
                      borderColor: validationError
                        ? '#FF6B6B'
                        : statusType === 'error' 
                          ? '#FF4444' 
                          : statusType === 'success' 
                            ? '#00DD44'
                            : statusType === 'warning'
                              ? '#FFB366'
                              : statusType === 'loading'
                                ? '#4A90E2'
                                : (theme === 'dark' ? designTokens.borders.dark.default : designTokens.borders.light.default),
                      borderWidth: (validationError || statusType) ? 2 : 1,
                    }
                  ]}
                  placeholder={validationError || statusMessage || ghostText}
                  placeholderTextColor={
                    validationError 
                      ? '#FF6B6B' 
                      : statusType === 'error' 
                        ? '#FF4444' 
                        : statusType === 'success' 
                          ? '#00BB44' 
                          : statusType === 'warning'
                            ? '#FF9933'
                            : statusType === 'loading'
                              ? '#4A90E2'
                              : (theme === 'dark' ? designTokens.text.mutedDark : designTokens.text.muted)
                  }
                  value={friendUsername}
                  onChangeText={(text) => {
                    setFriendUsername(text);
                    // Clear status and validation errors when user starts typing
                    if (statusMessage || validationError) {
                      clearStatus();
                    }
                    
                    // Real-time validation (only show after user stops typing)
                    if (text.trim().length > 0) {
                      const validation = validateUsername(text);
                      if (validation && text.trim().length >= 3) {
                        // Only show validation error for longer inputs to avoid annoying users
                        setValidationError(validation);
                      } else {
                        setValidationError('');
                      }
                    } else {
                      setValidationError('');
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
                  editable={!isSubmittingFriendRequest && !statusMessage} // Disable input while submitting or showing status
                />
              </Animated.View>
              
              <TouchableOpacity
                style={[
                  styles.addButton,
                  {
                    backgroundColor: isSubmittingFriendRequest 
                      ? (theme === 'dark' ? '#333333' : '#cccccc')
                      : statusType === 'success'
                        ? '#00AA44'
                        : statusType === 'error' || validationError
                          ? '#FF4444'
                          : statusType === 'warning'
                            ? '#FF9933'
                            : (theme === 'dark' ? '#0d0d0d' : designTokens.brand.primary),
                    borderColor: isSubmittingFriendRequest
                      ? (theme === 'dark' ? '#555555' : '#aaaaaa')
                      : (theme === 'dark' ? '#262626' : 'transparent'),
                    borderWidth: theme === 'dark' ? 1 : 0,
                    opacity: isSubmittingFriendRequest ? 0.7 : 1,
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
                disabled={isSubmittingFriendRequest || !!validationError}
              >
                <Text style={[
                  styles.addButtonText,
                  { 
                    color: '#ffffff',
                    fontFamily: 'Nunito-SemiBold',
                    letterSpacing: -0.3,
                  }
                ]}>
                  {isSubmittingFriendRequest 
                    ? 'Sending...' 
                    : statusType === 'success'
                      ? 'Sent!'
                      : statusType === 'error' || validationError
                        ? 'Try Again'
                        : 'Add Friend'
                  }
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
    // paddingBottom is now handled dynamically based on keyboard state
    gap: 0,
  },
  
  inputContainer: {
    position: 'absolute',
    bottom: -40,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  
  chatInputWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 200, // Extend well below viewport
    marginHorizontal: 0, // Extend to sides
    marginBottom: -150, // Pull down to extend below screen edge
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 0, // Keep bottom square to extend off screen
    borderBottomRightRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    bottom: 180,
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
    fontWeight: '400', // Regular weight for Poppins balance
    fontFamily: 'Poppins-Regular', // Poppins for luxury + readability balance
    letterSpacing: -0.2, // Adjusted for Poppins geometric spacing
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