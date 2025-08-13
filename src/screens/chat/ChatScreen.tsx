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
  // Removed unused Dimensions
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Platform,
  Keyboard,
  Easing,
  Modal,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

// Enhanced Components
import { EnhancedChatInput } from '../../design-system/components/molecules';
import EnhancedBubble from '../../design-system/components/molecules/EnhancedBubble';
import { HeaderMenu, SignOutModal, ArtistListeningModal, WalletModal, SwipeTutorialOverlay, SpotifyBanner, ChatFloatingActions } from '../../design-system/components/organisms';
import { AnimatedHamburger, NowPlayingIndicator, SpotifyLinkPrompt, TrioOptionsRing } from '../../design-system/components/atoms';
import { PageBackground, SwipeToMenu } from '../../design-system/components/atoms';
import SettingsModal from './SettingsModal';
import ConversationDrawer from '../../components/ConversationDrawer';
import { ShimmerText } from '../../design-system/components/atoms/ShimmerText';
import { WebSearchIndicator } from '../../design-system/components/atoms';
// Removed unused MessageStatus import
import TypingIndicator from '../../design-system/components/atoms/TypingIndicator';

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
import { useRealTimeMessaging } from '../../hooks/useRealTimeMessaging';
import { useFriendRequest } from '../../hooks/useFriendRequest';
import { useSpotifyLive } from '../../hooks/useSpotifyLive';
import { useSpotifyOAuth } from '../../hooks/useSpotifyOAuth';

// Types
import type { Message } from '../../types/chat';

// Services
import { AuthAPI, FriendsAPI, ConversationAPI } from '../../services/api';

// Utils
import { 
  createModalAnimationRefs, 
  // Removed unused animation utilities
  hideModalAnimation,
  type ModalAnimationRefs 
} from '../../utils/animations';
import { validateUsername, isValidMessageInput, formatMessageText, shouldStartTyping, shouldStopTyping } from '../../utils/chatUtils';



interface ChatScreenProps {
  route?: {
    params?: {
      friendUsername?: string;
    };
  };
}

// Removed unused useDimensions hook

const ChatScreen: React.FC<ChatScreenProps> = ({ route }) => {
  const navigation = useNavigation();
  const { theme, colors } = useTheme();
  const { settings } = useSettings();
  // Removed unused screen width
  
  // Custom hooks
  const { greetingText, showGreeting, setShowGreeting } = useGreeting();
  const { greetingAnimY, greetingOpacity } = useKeyboardAnimation();

  const flatListRef = useRef<FlatList>(null);

  const scrollToBottom = (instant = false) => {
    if (flatListRef.current) {
      try {
        flatListRef.current.scrollToOffset({ 
          offset: 99999,
          animated: !instant // Instant when requested, animated otherwise
        });
      } catch (error) {
        // Silently handle errors
      }
    }
  };

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
  // Removed unused copy tooltip state
  const [, setShowTestTooltip] = useState(true);
  const [showSwipeTutorial, setShowSwipeTutorial] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [, setIsVoiceRecording] = useState(false);
  const [isChatInputFocused, setIsChatInputFocused] = useState(false);
  const [, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [extraPaddingBottom, setExtraPaddingBottom] = useState(0);
  const [showSpotifyLinkPrompt, setShowSpotifyLinkPrompt] = useState(false);
  const [showTrioOptions, setShowTrioOptions] = useState(false);
  const [trioOptions, setTrioOptions] = useState<Array<{id: string; text: string; type: 'background' | 'tracks' | 'personal'}>>([]);
  const inputContainerAnim = useRef(new Animated.Value(0)).current;
  const inputSlideAnim = useRef(new Animated.Value(0)).current;
  
  // Animation refs
  const tooltipOpacity = useRef(new Animated.Value(1)).current;
  // Removed unused tooltipScale
  const modalAnimationRefs = useRef<ModalAnimationRefs>(createModalAnimationRefs()).current;
  const headerAnim = useRef(new Animated.Value(1)).current;
  const floatingButtonsAnim = useRef(new Animated.Value(0)).current;

  // Settings modal state - simplified
  const [showSettings, setShowSettings] = useState(false);
  
  // SignOut modal state
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  
  // Wallet modal state
  const [showWalletModal, setShowWalletModal] = useState(false);
  
  // Conversation drawer state
  const [showConversationDrawer, setShowConversationDrawer] = useState(false);
  
  // Hamburger animation state
  const [hamburgerOpen, setHamburgerOpen] = useState(false);
  const [isAttachmentExpanded, setIsAttachmentExpanded] = useState(false);
  
  // Friend request management
  const friendRequest = useFriendRequest();
  
  // Spotify live data - increased interval to prevent rate limiting
  const { currentTrack, isLoading: spotifyLoading, error: spotifyError, isConnected: spotifyConnected } = useSpotifyLive(15000);
  
  // Spotify OAuth for connecting account
  const { connectToSpotify } = useSpotifyOAuth();
  
  // Delay showing Spotify link prompt for new users
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSpotifyLinkPrompt(true);
    }, 5000); // 5 second delay

    return () => clearTimeout(timer);
  }, []);

  
  const { ghostText } = useGhostTyping({
    isInputFocused: friendRequest.isInputFocused,
    inputText: friendRequest.friendUsername,
  });
  
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(undefined);
  const [currentFriendUsername, setCurrentFriendUsername] = useState<string | undefined>(
    route?.params?.friendUsername || undefined
  );
  const [showArtistModal, setShowArtistModal] = useState(false);
  const [artistData, setArtistData] = useState<{ id: string; name: string } | undefined>(undefined);

  // Message handling with streaming (must be after currentConversationId declaration)
  const {
    messages,
    isLoading,
    isStreaming,
    handleSend: handleMessageSend,
    handleMessagePress: _handleMessagePress, // eslint-disable-line @typescript-eslint/no-unused-vars
    // handleMessageLongPress,
    handleConversationSelect,
    handleHaltStreaming,
    setMessages,
    flatListRef: messagesRef,
  } = useMessages(() => setShowGreeting(false), currentConversationId, currentFriendUsername, flatListRef as React.RefObject<FlatList>, setCurrentConversationId);

  // Real-time messaging for friend conversations
  const {
    isConnected: isRealTimeConnected,
    typingUsers,
    startTyping: startRealTimeTyping,
    stopTyping: stopRealTimeTyping,
    markMessageAsRead: _markMessageAsRead, // eslint-disable-line @typescript-eslint/no-unused-vars
    markAllMessagesAsRead: _markAllMessagesAsRead, // eslint-disable-line @typescript-eslint/no-unused-vars
  } = useRealTimeMessaging({
    friendUsername: currentFriendUsername,
    onNewMessage: (data) => {
      // Handle incoming friend messages
      if (data.from === currentFriendUsername) {
        const newMessage: Message = {
          id: data.message.messageId,
          sender: 'user',
          message: data.message.content,
          timestamp: data.message.timestamp.toString(),
          messageId: data.message.messageId,
          fromMe: false,
          from: data.from,
          deliveredAt: data.message.timestamp.toString(),
          status: 'delivered'
        };
        
        setMessages(prev => [...prev, newMessage]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    onReadReceipt: (receipt) => {
      // Update message status when read receipt is received
      setMessages(prev => prev.map(msg => 
        msg.messageId === receipt.messageId 
          ? { ...msg, readAt: receipt.readAt.toString(), status: 'read' as const }
          : msg
      ));
    },
    autoConnect: !!currentFriendUsername  // Enable auto-connect for friend conversations
  });

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
      // Modal handling removed
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
    onWalletPress: () => {
      setShowWalletModal(true);
    },
    onSignOut: () => setShowSignOutModal(true),
    onAddFriend: friendRequest.handleAddFriendPress
  });

  // Handle route parameter changes for friend username
  useEffect(() => {
    if (route?.params?.friendUsername && route.params.friendUsername !== currentFriendUsername) {
      // Clear messages immediately when switching to friend to prevent bleed-through
      setMessages([]);
      setCurrentFriendUsername(route.params.friendUsername);
      setCurrentConversationId(undefined);
    }
  }, [route?.params?.friendUsername, currentFriendUsername, setMessages]);

  // Reset hamburger animation when header menu closes
  useEffect(() => {
    if (!showHeaderMenu) {
      setHamburgerOpen(false);
    }
  }, [showHeaderMenu]);

  // Slide floating buttons off screen when attachment is expanded, conversation drawer is active, trio options are shown, or chat input is focused
  useEffect(() => {
    Animated.timing(floatingButtonsAnim, {
      toValue: isAttachmentExpanded || showConversationDrawer || showTrioOptions || isChatInputFocused ? 100 : 0,
      duration: 200, // Slightly longer for smoother animation
      useNativeDriver: true,
    }).start();
  }, [isAttachmentExpanded, showConversationDrawer, showTrioOptions, isChatInputFocused, floatingButtonsAnim]);

  // Slide chat input down ONLY when trio options are shown (NOT when input is focused - that should move up for keyboard)
  useEffect(() => {
    Animated.timing(inputSlideAnim, {
      toValue: showTrioOptions ? 200 : 0, // Only slide down when trio is shown
      duration: 200, // Smoother animation timing
      useNativeDriver: true,
    }).start();
  }, [showTrioOptions, inputSlideAnim]);

  // Check if user should see swipe tutorial (new users only)
  useEffect(() => {
    const checkSwipeTutorial = async () => {
      try {
        const isNewUser = await AsyncStorage.getItem('isNewUser');
        const hasSeenTutorial = await AsyncStorage.getItem('hasSeenSwipeTutorial');
        
        // Show tutorial for new users who haven't seen it yet
        if (isNewUser === 'true' && !hasSeenTutorial) {
          // Show tutorial after a short delay for better UX
          setTimeout(() => {
            setShowSwipeTutorial(true);
          }, 1000);
        }
      } catch (error) {
        console.error('Error checking swipe tutorial status:', error);
      }
    };

    checkSwipeTutorial();
  }, []);

  // Handle tutorial completion
  const handleTutorialComplete = async () => {
    try {
      await AsyncStorage.setItem('hasSeenSwipeTutorial', 'true');
      await AsyncStorage.removeItem('isNewUser'); // Clear new user flag
      setShowSwipeTutorial(false);
    } catch (error) {
      console.error('Error saving swipe tutorial status:', error);
      setShowSwipeTutorial(false);
    }
  };

  // Add Friend modal visibility effect - fixed to prevent useInsertionEffect warnings
  useEffect(() => {
    if (friendRequest.showAddFriendModal && !friendRequest.shouldRenderAddFriendModal) {
      friendRequest.setShouldRenderAddFriendModal(true);
      // Fade in
      Animated.timing(friendRequest.addFriendModalOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    } else if (!friendRequest.showAddFriendModal && friendRequest.shouldRenderAddFriendModal) {
      // Fade out animation
      Animated.timing(friendRequest.addFriendModalOpacity, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
      
      // Delay unmounting to allow fade-out animation
      const timer = setTimeout(() => {
        friendRequest.setShouldRenderAddFriendModal(false);
      }, 300); // Match fade duration
      return () => clearTimeout(timer);
    }
  }, [friendRequest.showAddFriendModal, friendRequest.shouldRenderAddFriendModal]);

  // Settings modal logic removed - just use showSettings directly


  // Keyboard event listeners for proper scroll behavior (only for chat input)
  useEffect(() => {
    // Use keyboardWillShow/Hide for iOS for instant response, fallback to Did events for Android
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    
    const keyboardShowListener = Keyboard.addListener(showEvent, (e) => {
      setIsKeyboardVisible(true);
      setKeyboardHeight(e.endCoordinates.height);
      
      // Animate to keyboard position using native driver with faster animation
      Animated.spring(inputContainerAnim, {
        toValue: -(e.endCoordinates.height - 20),
        tension: 400, // Higher tension for snappier response
        friction: 30, // Higher friction for less bounce
        useNativeDriver: true,
      }).start();
      
    });

    const keyboardHideListener = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
      
      // Animate to hidden position using native driver with faster animation
      Animated.spring(inputContainerAnim, {
        toValue: 0,
        tension: 400, // Higher tension for snappier response
        friction: 30, // Higher friction for less bounce
        useNativeDriver: true,
      }).start();
    });

    return () => {
      keyboardShowListener?.remove();
      keyboardHideListener?.remove();
    };
  }, [isChatInputFocused]);

  // Scroll to bottom when input is focused and keyboard appears
  useEffect(() => {
    if (isChatInputFocused && keyboardHeight > 0) {
      // DISABLED - was interfering with user message positioning
      // setTimeout(() => {
      //   scrollToBottom();
      // }, 300);
    }
  }, [isChatInputFocused, keyboardHeight]);


  // Keep extra padding permanently - don't remove it
  // useEffect(() => {
  //   if (extraPaddingBottom > 0) {
  //     // Only remove padding when bot is completely idle (not loading AND not streaming)
  //     if (!isLoading && !isStreaming) {
  //       setTimeout(() => setExtraPaddingBottom(0), 1000); // Short delay after bot stops
  //     }
  //   }
  // }, [isLoading, isStreaming, extraPaddingBottom]);

  // Cleanup effect for rotation stability
  useEffect(() => {
    return () => {
      // Cleanup is now handled by the useFriendRequest hook
    };
  }, []);

  // Removed unused handlers and suggestions




  // Removed unused message press handler


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
    if (!isValidMessageInput(inputText, attachments)) return;
    
    // Store current values before clearing
    const currentText = inputText;
    const currentAttachments = [...attachments];
    
    // Stop typing indicator when sending
    if (currentFriendUsername) {
      stopRealTimeTyping();
    }
    
    // Dismiss keyboard immediately to prevent KeyboardAvoidingView positioning issues
    Keyboard.dismiss();
    
    // Clear input immediately
    setInputText('');
    setAttachments([]);
    
    if (currentAttachments.length > 0) {
      // Handle attachments - send message with attachments
      const messageText = formatMessageText(currentText) || "";
      handleMessageSend(messageText, currentAttachments);
    } else {
      // Send the message with the current input text
      handleMessageSend(formatMessageText(currentText));
    }
    
    // Adjust padding based on message length and account for loading state
    const messageLength = currentText.trim().length;
    let basePadding;
    
    if (messageLength <= 3) {
      basePadding = 500; // Very short messages (like "hey") need more padding
    } else if (messageLength <= 15) {
      basePadding = 350; // Short messages need less padding
    } else if (messageLength <= 50) {
      basePadding = 250; // Medium messages need even less padding  
    } else {
      basePadding = 200; // Long messages need minimal padding
    }
    
    // Add extra padding when bot is loading/streaming (Lottie animation takes space)
    const loadingPadding = (isLoading || isStreaming) ? 100 : 0;
    
    setExtraPaddingBottom(basePadding + loadingPadding);
    
    // Scroll to bottom after padding is applied
    setTimeout(() => scrollToBottom(), 200);
  };

  // Handle input focus/blur for tooltip fade
  const handleInputFocus = () => {
    setIsChatInputFocused(true);
    
    // Scroll to show bottom of last bot message when input is focused
    setTimeout(() => {
      if (flatListRef.current && messages.length > 0) {
        // Find the last bot message
        const lastBotMessageIndex = messages.map((msg, index) => ({ msg, index }))
          .reverse()
          .find(({ msg }) => msg.sender === 'aether')?.index;
        
        if (lastBotMessageIndex !== undefined) {
          try {
            // Scroll to show the bot message near the top, accounting for more messages
            const messageIndex = Math.max(0, lastBotMessageIndex - 1); // Show message before bot message too
            flatListRef.current.scrollToIndex({
              index: messageIndex,
              animated: true,
              viewPosition: 0.05 // Position even higher for longer conversations
            });
          } catch (error) {
            // Fallback to regular scroll to bottom
            scrollToBottom();
          }
        } else {
          // No bot message found, just scroll to bottom
          scrollToBottom();
        }
      }
    }, 100);
    
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
    
    // Stop typing when input loses focus
    if (currentFriendUsername) {
      stopRealTimeTyping();
    }
    
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

  // Handle text input changes for typing indicators
  const handleInputTextChange = (text: string) => {
    setInputText(text);
    
    // Send typing indicators for friend conversations
    if (shouldStartTyping(text, isRealTimeConnected, !!currentFriendUsername)) {
      startRealTimeTyping();
    } else if (shouldStopTyping(text, !!currentFriendUsername)) {
      stopRealTimeTyping();
    }
  };

  // Removed unused dynamic options handler


  // Generate smart trio options based on the last user message
  const generateTrioOptions = (lastUserMessage: string) => {
    // Simple pattern matching for demo - this will be replaced with smart backend endpoint
    const message = lastUserMessage.toLowerCase();
    const options: Array<{id: string; text: string; type: 'background' | 'tracks' | 'personal'}> = [];
    
    // Artist/musician pattern
    if (message.includes('artist') || message.includes('musician') || message.includes('singer') || message.includes('band')) {
      const artistMatch = message.match(/artist|musician|singer|band\s+(\w+(?:\s+\w+)*)/);
      const artistName = artistMatch ? artistMatch[1] : 'this artist';
      options.push(
        { id: '1', text: `${artistName}'s Background?`, type: 'background' },
        { id: '2', text: `${artistName}'s Top Tracks?`, type: 'tracks' },
        { id: '3', text: 'Why do I like this?', type: 'personal' }
      );
    }
    // Music/song pattern
    else if (message.includes('song') || message.includes('track') || message.includes('music') || message.includes('love') || message.includes('like')) {
      options.push(
        { id: '1', text: 'Song Background?', type: 'background' },
        { id: '2', text: 'Similar Artists?', type: 'tracks' },
        { id: '3', text: 'Why do I connect?', type: 'personal' }
      );
    }
    // Movie/film pattern
    else if (message.includes('movie') || message.includes('film') || message.includes('watched')) {
      options.push(
        { id: '1', text: 'Movie Details?', type: 'background' },
        { id: '2', text: 'Similar Films?', type: 'tracks' },
        { id: '3', text: 'What resonated?', type: 'personal' }
      );
    }
    // Book pattern
    else if (message.includes('book') || message.includes('read') || message.includes('author')) {
      options.push(
        { id: '1', text: 'Book Analysis?', type: 'background' },
        { id: '2', text: 'Author\'s Works?', type: 'tracks' },
        { id: '3', text: 'Personal Impact?', type: 'personal' }
      );
    }
    // Generic fallback
    else {
      options.push(
        { id: '1', text: 'Tell me more?', type: 'background' },
        { id: '2', text: 'Related topics?', type: 'tracks' },
        { id: '3', text: 'Why is this important?', type: 'personal' }
      );
    }
    
    return options;
  };

  // Handle trio button press
  const handleTrioPress = () => {
    // For testing - use mock data always
    const mockOptions = [
      { id: '1', text: 'Anna Luna\'s Background?', type: 'background' as const },
      { id: '2', text: 'Anna Luna\'s Top Tracks?', type: 'tracks' as const },
      { id: '3', text: 'Why do I love this?', type: 'personal' as const }
    ];
    
    setTrioOptions(mockOptions);
    setShowTrioOptions(true);
    
    // Original logic (commented for testing)
    // const lastUserMessage = messages.filter(msg => msg.sender === 'user').pop()?.message;
    // if (lastUserMessage) {
    //   const options = generateTrioOptions(lastUserMessage);
    //   setTrioOptions(options);
    //   setShowTrioOptions(true);
    // }
  };

  // Handle trio option selection
  const handleTrioOptionSelect = (option: {id: string; text: string; type: 'background' | 'tracks' | 'personal'}) => {
    // Convert the option text into a question and send it silently
    const questionText = option.text.endsWith('?') ? option.text : `${option.text}?`;
    handleMessageSend(questionText, [], true); // Send as silent query
    
    // Scroll to show the invisible user message + AI response
    setTimeout(() => scrollToBottom(), 200);
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
    <SwipeToMenu onSwipeToMenu={toggleHeaderMenu}>
      <PageBackground theme={theme} variant="chat">
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
          backgroundColor="transparent"
          translucent
        />

        {/* Spotify Banner - Show current track or link prompt */}
        <SpotifyBanner
          theme={theme}
          currentTrack={currentTrack || undefined}
          isConnected={spotifyConnected}
          showLinkPrompt={showSpotifyLinkPrompt}
          onTrackPress={(track) => {
            // Create silent question about the current song
            const silentQuery = `Search statistics about "${track.name}" by ${track.artist}${track.album ? ` from the album "${track.album}"` : ''} and provide interesting information about it like chart performance, background, or fun facts in a conversational answer.`;
            
            // Send the message silently (no user bubble shown)
            handleMessageSend(silentQuery, [], true); // Pass true for silent mode
            
            // Scroll to show the invisible user message + AI response
            setTimeout(() => scrollToBottom(), 200);
          }}
          onConnectPress={connectToSpotify}
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
              paddingBottom: isChatInputFocused 
                ? keyboardHeight + 80 + extraPaddingBottom // Focused + extra padding
                : 80 + extraPaddingBottom, // Default + extra padding
            }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="never"
          onScrollBeginDrag={() => {
            // Dismiss keyboard when user starts scrolling
            Keyboard.dismiss();
          }}
          ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
          onScroll={(event: any) => {
            // Simplified scroll handler without Animated.event
            const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
            const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
            setIsNearBottom(distanceFromBottom <= 50);
          }}
          ListFooterComponent={() => {
            // Show typing indicator for friend conversations
            const isTyping = currentFriendUsername && typingUsers[currentFriendUsername];
            return isTyping ? (
              <TypingIndicator
                username={currentFriendUsername!}
                theme={theme}
                visible={true}
              />
            ) : null;
          }}
        />

      </View>

      {/* Scroll to bottom button - hidden when near bottom */}
      {!isNearBottom && (
        <TouchableOpacity
          style={[
            styles.scrollToBottomButton,
            {
              backgroundColor: theme === 'dark' 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'rgba(0, 0, 0, 0.05)',
              borderColor: theme === 'dark' 
                ? 'rgba(255, 255, 255, 0.15)' 
                : 'rgba(0, 0, 0, 0.1)',
            }
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            scrollToBottom(false);
          }}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="chevron-down" 
            size={20} 
            color={theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.6)'} 
          />
        </TouchableOpacity>
      )}

      <Animated.View 
        style={[
          styles.inputContainer,
          {
            transform: [
              { translateY: inputContainerAnim },
              { translateY: inputSlideAnim }
            ],
          }
        ]}
      >
        
        <View style={[
          styles.chatInputWrapper,
          {
            backgroundColor: theme === 'dark' 
              ? 'rgb(20, 20, 20)' 
              : 'rgb(250, 250, 250)',
            borderTopWidth: 0.5,
            borderLeftWidth: 0.5,
            borderRightWidth: 0.5,
            borderTopColor: theme === 'dark' 
              ? 'rgba(255, 255, 255, 0.08)' 
              : 'rgba(0, 0, 0, 0.08)',
            borderLeftColor: theme === 'dark' 
              ? 'rgba(255, 255, 255, 0.08)' 
              : 'rgba(0, 0, 0, 0.08)',
            borderRightColor: theme === 'dark' 
              ? 'rgba(255, 255, 255, 0.08)' 
              : 'rgba(0, 0, 0, 0.08)',
            shadowOpacity: theme === 'dark' ? 0.4 : 0.15,
          }
        ]}>
          <EnhancedChatInput
            value={inputText}
            onChangeText={handleInputTextChange}
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
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onSwipeUp={() => setShowTestTooltip(true)}
            onAttachmentToggle={setIsAttachmentExpanded}
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

      {/* Wallet Modal */}
      <WalletModal
        visible={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onTierSelect={(tier) => {
          // Handle tier selection - could integrate with payment processing here
          console.log(`Selected tier: ${tier}`);
        }}
        currentTier="standard"
        usage={{
          gpt4o: 45,
          gpt5: 120,
          gpt5Limit: 150
        }}
      />
      
      <ConversationDrawer
        isVisible={showConversationDrawer}
        onClose={() => setShowConversationDrawer(false)}
        onFriendMessagePress={(friendUsername: string) => {
          // Handle friend message press from drawer - same logic as from friends screen
          setMessages([]);
          setCurrentConversationId(undefined);
          setCurrentFriendUsername(friendUsername);
          setShowConversationDrawer(false);
        }}
        onConversationSelect={(conversation) => {
          if (conversation.type === 'friend' && conversation.friendUsername) {
            // Handle friend conversation - ensure clean state
            logger.debug('Selecting friend conversation:', conversation.friendUsername);
            
            // Clear any existing conversation state
            setCurrentConversationId(undefined);
            setMessages([]);
            
            // Set friend username which will trigger useMessages useEffect
            setCurrentFriendUsername(conversation.friendUsername);
            setShowConversationDrawer(false);
          } else if (conversation.type === 'custom' && conversation._id.startsWith('orbit-')) {
            // Handle orbit/heatmap conversation - these are not chat conversations
            logger.debug('Orbit conversation selected, showing artist listening for:', conversation.friendUsername);
            setArtistData({ id: `spotify_${conversation.friendUsername}`, name: `${conversation.friendUsername}'s Music` });
            setShowArtistModal(true);
            setShowConversationDrawer(false);
          } else {
            // Handle AI conversation - clear messages immediately to prevent bleed-through
            setMessages([]);
            const conversationId = conversation._id;
            
            // Only handle valid conversation IDs (not friend- or orbit- prefixed ones)
            if (conversationId && !conversationId.startsWith('friend-') && !conversationId.startsWith('orbit-')) {
              setCurrentConversationId(conversationId);
              setCurrentFriendUsername(undefined);
              handleConversationSelect(conversation as any);
              setShowConversationDrawer(false);
            } else {
              // Invalid conversation ID, just clear state
              setCurrentConversationId(undefined);
              setCurrentFriendUsername(undefined);
              setShowConversationDrawer(false);
            }
          }
        }}
        onStartNewChat={handleStartNewChat}
        currentConversationId={currentConversationId}
        theme={theme}
        onAllConversationsCleared={() => {
          setMessages([]);
          setCurrentConversationId(undefined);
          setCurrentFriendUsername(undefined);
        }}
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
      {false && (
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
            onPress={() => {}}
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
                onPress={() => {}}
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
      {friendRequest.shouldRenderAddFriendModal && (
      <Modal
        visible={friendRequest.shouldRenderAddFriendModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => friendRequest.setShowAddFriendModal(false)}
      >
        <Animated.View style={[styles.overlay, { opacity: friendRequest.addFriendModalOpacity }]}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => friendRequest.setShowAddFriendModal(false)}
          />
          
          <Animated.View style={[
            styles.addFriendOverlay,
            {
              backgroundColor: theme === 'light' ? '#ffffff' : designTokens.brand.surfaceDark,
              borderWidth: 1,
              borderColor: theme === 'dark' ? designTokens.borders.dark.default : designTokens.borders.light.default,
              ...getHeaderMenuShadow(theme),
            }
          ]}>
            
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
                  transform: [{ translateX: friendRequest.shakeAnim }]
                }}
              >
                <TextInput
                  style={[
                    styles.friendInput,
                    {
                      color: friendRequest.validationError 
                        ? '#FF6B6B' 
                        : friendRequest.statusType === 'error' 
                          ? '#FF4444' 
                          : friendRequest.statusType === 'success' 
                            ? '#00DD44' 
                            : friendRequest.statusType === 'warning'
                              ? '#FFB366'
                              : (theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.primary),
                      backgroundColor: friendRequest.isSubmittingFriendRequest 
                        ? (theme === 'dark' ? '#2a2a2a' : '#f0f0f0')
                        : (theme === 'dark' ? '#1a1a1a' : '#f8f8f8'),
                      borderColor: friendRequest.validationError
                        ? '#FF6B6B'
                        : friendRequest.statusType === 'error' 
                          ? '#FF4444' 
                          : friendRequest.statusType === 'success' 
                            ? '#00DD44'
                            : friendRequest.statusType === 'warning'
                              ? '#FFB366'
                              : friendRequest.statusType === 'loading'
                                ? '#4A90E2'
                                : (theme === 'dark' ? designTokens.borders.dark.default : designTokens.borders.light.default),
                      borderWidth: (friendRequest.validationError || friendRequest.statusType) ? 2 : 1,
                    }
                  ]}
                  placeholder={friendRequest.validationError || friendRequest.statusMessage || ghostText}
                  placeholderTextColor={
                    friendRequest.validationError 
                      ? '#FF6B6B' 
                      : friendRequest.statusType === 'error' 
                        ? '#FF4444' 
                        : friendRequest.statusType === 'success' 
                          ? '#00BB44' 
                          : friendRequest.statusType === 'warning'
                            ? '#FF9933'
                            : friendRequest.statusType === 'loading'
                              ? '#4A90E2'
                              : (theme === 'dark' ? designTokens.text.mutedDark : designTokens.text.muted)
                  }
                  value={friendRequest.friendUsername}
                  onChangeText={(text) => {
                    friendRequest.setFriendUsername(text);
                    // Clear status and validation errors when user starts typing
                    if (friendRequest.statusMessage || friendRequest.validationError) {
                      friendRequest.clearStatus();
                    }
                    
                    // Real-time validation (only show after user stops typing)
                    if (text.trim().length > 0) {
                      const validation = validateUsername(text);
                      if (validation && text.trim().length >= 3) {
                        // Only show validation error for longer inputs to avoid annoying users
                        friendRequest.setValidationError(validation);
                      } else {
                        friendRequest.setValidationError('');
                      }
                    } else {
                      friendRequest.setValidationError('');
                    }
                  }}
                  onFocus={() => friendRequest.setIsInputFocused(true)}
                  onBlur={() => friendRequest.setIsInputFocused(false)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus={true}
                  keyboardAppearance={theme === 'dark' ? 'dark' : 'light'}
                  selectionColor={theme === 'dark' ? '#ffffff' : '#007AFF'}
                  cursorColor={theme === 'dark' ? '#ffffff' : '#007AFF'}
                  textAlign="center"
                  editable={!friendRequest.isSubmittingFriendRequest && !friendRequest.statusMessage} // Disable input while submitting or showing status
                />
              </Animated.View>
              
              <TouchableOpacity
                style={[
                  styles.addButton,
                  {
                    backgroundColor: friendRequest.isSubmittingFriendRequest 
                      ? (theme === 'dark' ? '#333333' : '#cccccc')
                      : friendRequest.statusType === 'success'
                        ? '#00AA44'
                        : friendRequest.statusType === 'error' || friendRequest.validationError
                          ? '#FF4444'
                          : friendRequest.statusType === 'warning'
                            ? '#FF9933'
                            : (theme === 'dark' ? '#0d0d0d' : designTokens.brand.primary),
                    borderColor: friendRequest.isSubmittingFriendRequest
                      ? (theme === 'dark' ? '#555555' : '#aaaaaa')
                      : (theme === 'dark' ? '#262626' : 'transparent'),
                    borderWidth: theme === 'dark' ? 1 : 0,
                    opacity: friendRequest.isSubmittingFriendRequest ? 0.7 : 1,
                    // Strong tight glow for dark mode, shadow for light mode
                    shadowColor: theme === 'dark' ? '#ffffff' : '#000000',
                    shadowOffset: { width: 0, height: theme === 'dark' ? 0 : 2 },
                    shadowOpacity: theme === 'dark' ? 0.4 : 0.3,
                    shadowRadius: theme === 'dark' ? 4 : 8,
                    elevation: theme === 'dark' ? 0 : 4,
                  }
                ]}
                onPress={friendRequest.handleAddFriendSubmit}
                activeOpacity={0.8}
                disabled={friendRequest.isSubmittingFriendRequest || !!friendRequest.validationError}
              >
                <Text style={[
                  styles.addButtonText,
                  { 
                    color: '#ffffff',
                    fontFamily: 'Nunito-SemiBold',
                    letterSpacing: -0.3,
                  }
                ]}>
                  {friendRequest.isSubmittingFriendRequest 
                    ? 'Sending...' 
                    : friendRequest.statusType === 'success'
                      ? 'Sent!'
                      : friendRequest.statusType === 'error' || friendRequest.validationError
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

      {/* Artist Listening Modal */}
      <ArtistListeningModal
        visible={showArtistModal}
        onClose={() => setShowArtistModal(false)}
        artistId={artistData?.id}
        artistName={artistData?.name}
        theme={theme}
      />

      {/* Swipe Tutorial Overlay for new users */}
      <SwipeTutorialOverlay
        visible={showSwipeTutorial}
        onClose={handleTutorialComplete}
        theme={theme}
      />

      {/* Trio Options Ring */}
      <TrioOptionsRing
        visible={showTrioOptions}
        onClose={() => setShowTrioOptions(false)}
        onOptionSelect={handleTrioOptionSelect}
        options={trioOptions}
        theme={theme}
      />

      {/* Floating Action Buttons */}
      <ChatFloatingActions
        theme={theme}
        slideAnimation={floatingButtonsAnim}
        visible={!showHeaderMenu}
        hamburgerOpen={hamburgerOpen}
        onTrioPress={handleTrioPress}
        onConversationsPress={() => setShowConversationDrawer(true)}
        onMenuPress={() => {
          setHamburgerOpen(!hamburgerOpen);
          setTimeout(() => {
            toggleHeaderMenu();
          }, 150); // Small delay to show animation before hiding buttons
        }}
      />

      </SafeAreaView>
    </PageBackground>
    </SwipeToMenu>
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
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderBottomLeftRadius: 0, // Keep bottom square to extend off screen
    borderBottomRightRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 16,
  },

  // Message Styles
  messageItem: {
    marginVertical: 8,
    width: '100%',
  },
  
  // Removed unused style definitions

  // Removed more unused styles
  
  // Removed unused scroll button styles


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
    fontFamily: 'mozilla text', // Mozilla text font
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
  
  // Removed unused search styles
  
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
  addFriendOverlay: {
    position: 'absolute',
    width: 320,
    borderRadius: 16,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[3],
    top: '30%',
    left: '50%',
    marginLeft: -160, // Half of width to center
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  arrow: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  arrowUp: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
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

  // Scroll to bottom button
  scrollToBottomButton: {
    position: 'absolute',
    bottom: 120, // Position above input area
    left: '50%', // Center horizontally
    marginLeft: -22, // Offset by half width (44/2)
    width: 44,
    height: 44,
    borderRadius: 22, // Perfectly circular
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1000,
  },

});

export default ChatScreen;