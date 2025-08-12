/**
 * EnhancedBubble - Proprietary Message Component
 * Features intelligent word-by-word streaming with fade animations
 * The KING of message bubbles
 */

import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  StyleSheet,
  Dimensions,
  PanResponder,
  Modal,
  Linking,
} from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';

// Icon types
type IoniconsIconNames = keyof typeof Ionicons.glyphMap;
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import LottieView from 'lottie-react-native';
import { designTokens, getThemeColors } from '../../tokens/colors';
import { typography } from '../../tokens/typography';
import { spacing, borderRadius } from '../../tokens/spacing';
import { ToolCall, Message, MessageAttachment } from '../../../types';
import BasicMarkdown from '../atoms/BasicMarkdown';
import { PhotoPreview } from './PhotoPreview';
import { ImagePreviewModal } from '../organisms/ImagePreviewModal';
import MessageStatus from '../atoms/MessageStatus';

const { width } = Dimensions.get('window');

interface ExtendedMessage extends Omit<Message, 'message'> {
  text?: string;
  message?: string;
  mood?: string;
  isSystem?: boolean;
  isStreaming?: boolean;
  personalityContext?: {
    communicationStyle: 'supportive' | 'direct' | 'collaborative' | 'encouraging';
    emotionalTone: 'supportive' | 'celebratory' | 'analytical' | 'calming';
    adaptedResponse: boolean;
    userMoodDetected?: string;
    responsePersonalization?: string;
  };
  aiInsight?: {
    pattern: string;
    suggestion: string;
    confidence: number;
  };
}

interface AnimatedMessageBubbleProps {
  message: ExtendedMessage;
  index: number;
  onSpeakMessage?: (text: string) => void;
  theme?: 'light' | 'dark';
  messageIndex?: number;
  onCopyMessage?: (text: string) => void;
  onReportMessage?: (message: Message) => void;
  onShareMessage?: (message: Message) => void;
  _index?: number;
  _onSpeakMessage?: (text: string) => void;
  _messageIndex?: number;
}

// Streaming text with live markdown support
const StreamingText: React.FC<{
  text: string;
  theme: 'light' | 'dark';
  isStreaming?: boolean;
}> = memo(({ text, theme, isStreaming = false }) => {
  const baseTextStyle = {
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.1,
    fontFamily: 'mozilla text', // Mozilla text font for AI messages
    fontWeight: '400' as '400',
    color: theme === 'dark' ? '#ffffff' : '#1a1a1a',
  };

  // Always apply markdown formatting, even during streaming
  // For streaming, we'll handle partial tokens gracefully
  if (text) {
    return (
      <View style={{ width: '100%' }}>
        <BasicMarkdown theme={theme} style={baseTextStyle}>
          {text + (isStreaming ? ' |' : '')}
        </BasicMarkdown>
      </View>
    );
  }

  // Fallback for empty text
  return (
    <View>
      <Text style={baseTextStyle}>
        {isStreaming ? '|' : ''}
      </Text>
    </View>
  );
});


// StreamContent - Simple streaming text with markdown support for non-streaming
const StreamContent: React.FC<{
  text: string | undefined;
  theme: 'light' | 'dark';
  messageId?: string;
  isStreaming?: boolean;
  metadata?: Message['metadata'];
}> = memo(({ text, theme, messageId, isStreaming, metadata }) => {
  const safeText = text || '';
  
  // Show Lottie animation for typing indicator or empty streaming message
  const isTypingMessage = messageId === 'typing';
  if (isTypingMessage || (isStreaming && !safeText.trim())) {
    return (
      <LottieView
        source={require('../../../../assets/AetherSpinner.json')}
        autoPlay
        loop
        style={styles.lottieAnimation}
      />
    );
  }
  
  // Use StreamingText for all bot messages (handles markdown when streaming completes)
  return (
    <View style={styles.botTextContainer}>
      <StreamingText 
        text={safeText}
        theme={theme}
        isStreaming={isStreaming}
      />
      {/* Show search results metadata for streaming search responses */}
      {metadata?.searchResults && metadata.sources && (
        <View style={styles.searchResultsContainer}>
          <Text style={[styles.searchResultsTitle, { color: theme === 'dark' ? '#a8d8ff' : '#8fc7ffff' }]}>
             Search Results for "{metadata.query}"
          </Text>
          {metadata.sources.map((source: { title: string; url: string; domain: string }, index: number) => (
            <View key={index} style={styles.sourceCard}>
              <Text style={[styles.sourceTitle, { color: theme === 'dark' ? '#ffffff' : '#333333' }]}>
                {source.title}
              </Text>
              <Text style={[styles.sourceDomain, { color: theme === 'dark' ? '#3b3b3bff' : '#202020ff' }]}>
                {source.domain}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Show tool call results if available (existing format) */}
      {metadata?.toolCalls && metadata.toolCalls.length > 0 && (
        <View style={styles.toolCallsContainer}>
          {metadata.toolCalls.map((toolCall: ToolCall, index: number) => (
            <View key={toolCall.id || index} style={[
              styles.toolCallCard,
              {
                backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 102, 204, 0.1)',
                borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 102, 204, 0.2)',
              }
            ]}>
              <Text style={[styles.toolCallName, { color: theme === 'dark' ? '#a8d8ff' : '#add6ffff' }]}>
                {toolCall.name === 'webSearchTool' ? 'Web Search Results' : toolCall.name.replace(/_/g, ' ')}
              </Text>
              {toolCall.status === 'completed' && toolCall.result ? (
                <View>
                  {/* Handle web search results specifically */}
                  {toolCall.name === 'webSearchTool' && (toolCall.result as any)?.structure?.results ? (
                    <View>
                      <Text style={[styles.searchQuery, { color: theme === 'dark' ? '#515151ff' : '#333333' }]}>
                        Query: "{(toolCall.result as any)?.structure?.query}"
                      </Text>
                      {((toolCall.result as any)?.structure?.results || []).map((result: { title: string; url: string; snippet: string; link?: string }, resultIndex: number) => (
                        <TouchableOpacity 
                          key={resultIndex} 
                          style={[
                            styles.searchResultItem,
                            {
                              backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 102, 204, 0.08)',
                              borderBottomColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 102, 204, 0.2)',
                              borderRadius: 8,
                              marginVertical: 4,
                              padding: 12,
                            }
                          ]}
                          onPress={() => {
                            const url = result.link || result.url;
                            if (url) {
                              Linking.openURL(url);
                            }
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.searchResultTitle, { color: theme === 'dark' ? '#ffffff' : '#333333' }]}>
                            {result.title}
                          </Text>
                          <Text style={[styles.searchResultSnippet, { color: theme === 'dark' ? '#cccccc' : '#323232' }]}>
                            {result.snippet}
                          </Text>
                          <Text style={[styles.searchResultLink, { color: theme === 'dark' ? '#a8d8ff' : '#0066cc' }]}>
                            {result.link || result.url}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <Text style={[styles.toolCallResult, { color: theme === 'dark' ? '#cccccc' : '#323232' }]}>
                      {typeof toolCall.result === 'string' ? toolCall.result : JSON.stringify(toolCall.result, null, 2) as React.ReactNode}
                    </Text>
                  )}
                </View>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </View>
  );
});

const EnhancedBubble: React.FC<AnimatedMessageBubbleProps> = memo(({
  message,
  _index,
  _onSpeakMessage,
  theme = 'light',
  _messageIndex = 0,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [isVisible, setIsVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<MessageAttachment | undefined>();
  const [showActionModal, setShowActionModal] = useState(false);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  
  const isUser = message.sender === 'user';
  // const _isSystem = message.isSystem || message.sender === 'system';
  const isStreaming = message.variant === 'streaming';

  // Action handlers
  const handleCopyMessage = useCallback(async () => {
    const textToCopy = message.text || message.message;
    if (textToCopy) {
      await Clipboard.setStringAsync(textToCopy);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [message.text, message.message]);

  const handleShare = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Render photo attachments using the working PhotoPreview component
  const renderPhotoAttachments = useCallback(() => {
    if (!message.attachments || message.attachments.length === 0) return null;

    const imageAttachments = message.attachments.filter(att => att.type === 'image');
    if (imageAttachments.length === 0) return null;

    const isUser = message.sender === 'user';

    return (
      <View style={isUser ? styles.photoAttachmentsContainer : styles.aiPhotoAttachmentsContainer}>
        {imageAttachments.map((attachment) => (
          <PhotoPreview
            key={attachment.id}
            attachment={attachment}
            isUser={isUser}
            onPress={() => handleImagePress(attachment)}
          />
        ))}
      </View>
    );
  }, [message.attachments, message.sender]);

  // Render document attachments 
  const renderDocumentAttachments = useCallback(() => {
    if (!message.attachments || message.attachments.length === 0) return null;

    const documentAttachments = message.attachments.filter(att => att.type === 'document');
    if (documentAttachments.length === 0) return null;

    const isUser = message.sender === 'user';
    const themeColors = getThemeColors(theme);

    const getFileIcon = (mimeType?: string): string => {
      if (!mimeType) return 'file';
      if (mimeType.includes('pdf')) return 'file-pdf';
      if (mimeType.includes('word') || mimeType.includes('document')) return 'file-word';
      if (mimeType.includes('text')) return 'file-alt';
      if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'file-excel';
      if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'file-powerpoint';
      return 'file';
    };

    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
    };

    return (
      <View style={[
        styles.documentAttachmentsContainer,
        { marginTop: spacing[2] }
      ]}>
        {documentAttachments.map((attachment) => (
          <View
            key={attachment.id}
            style={[
              styles.documentAttachmentBubble,
              {
                backgroundColor: isUser 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : themeColors.surface,
                borderColor: isUser 
                  ? 'rgba(255, 255, 255, 0.2)' 
                  : themeColors.borders.subtle,
              }
            ]}
          >
            <View style={[
              styles.documentIcon,
              {
                backgroundColor: attachment.mimeType?.includes('pdf') 
                  ? 'rgba(239, 68, 68, 0.1)'
                  : 'rgba(59, 130, 246, 0.1)'
              }
            ]}>
              <FontAwesome5
                name={getFileIcon(attachment.mimeType)}
                size={16}
                color={attachment.mimeType?.includes('pdf') 
                  ? designTokens.semantic.error
                  : designTokens.semantic.info
                }
              />
            </View>
            <View style={styles.documentInfo}>
              <Text
                style={[
                  styles.documentName,
                  typography.textStyles.caption,
                  { color: isUser ? 'rgba(255, 255, 255, 0.9)' : themeColors.text }
                ]}
                numberOfLines={1}
              >
                {attachment.name}
              </Text>
              <Text
                style={[
                  styles.documentSize,
                  typography.textStyles.caption,
                  { 
                    color: isUser ? 'rgba(255, 255, 255, 0.7)' : themeColors.textMuted,
                    fontSize: 10
                  }
                ]}
              >
                {formatFileSize(attachment.size)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  }, [message.attachments, message.sender, theme]);

  const handleReport = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleImagePress = useCallback((attachment: MessageAttachment) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedImage(attachment);
    setImageModalVisible(true);
  }, []);

  // Long press handler for both bot and user messages
  const handleLongPress = useCallback((event: { nativeEvent: { pageX?: number; pageY?: number; locationX: number; locationY: number } }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { pageX = 0, pageY = 0 } = event.nativeEvent;
    
    // Calculate modal width based on number of options
    const optionCount = isUser ? 2 : 3;
    const modalWidth = optionCount * 80;
    const modalX = Math.max(10, Math.min(pageX - modalWidth / 2, width - modalWidth - 10));
    
    setModalPosition({ x: modalX, y: pageY - 100 });
    setShowActionModal(true);
  }, [isUser]);

  // Action modal options - different for user vs bot messages
  const actionOptions = isUser 
    ? [
        { id: 'copy', label: 'Copy', icon: 'copy-outline' },
        { id: 'share', label: 'Share', icon: 'share-outline' },
      ]
    : [
        { id: 'copy', label: 'Copy', icon: 'copy-outline' },
        { id: 'share', label: 'Share', icon: 'share-outline' },
        { id: 'report', label: 'Report', icon: 'flag-outline' },
      ];

  const handleActionSelect = useCallback((actionId: string) => {
    setSelectedAction(actionId);
    
    switch (actionId) {
      case 'copy':
        handleCopyMessage();
        break;
      case 'share':
        handleShare();
        break;
      case 'report':
        handleReport();
        break;
    }
    
    setTimeout(() => {
      setShowActionModal(false);
      setSelectedAction(null);
    }, 200);
  }, [handleCopyMessage, handleShare, handleReport]);

  // Pan responder for drag-to-select functionality
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => showActionModal,
    onMoveShouldSetPanResponder: () => showActionModal,
    onPanResponderMove: (event) => {
      if (!showActionModal) return;
      
      const { locationX } = event.nativeEvent;
      const optionWidth = 80;
      
      // Calculate which option is being hovered
      const optionIndex = Math.floor(locationX / optionWidth);
      if (optionIndex >= 0 && optionIndex < actionOptions.length) {
        const hoveredAction = actionOptions[optionIndex].id;
        if (hoveredAction !== selectedAction) {
          setSelectedAction(hoveredAction);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      } else {
        setSelectedAction(null);
      }
    },
    onPanResponderRelease: () => {
      if (selectedAction) {
        handleActionSelect(selectedAction);
      } else {
        setShowActionModal(false);
      }
    },
  });

  // Format timestamp for display
  const formatTimestamp = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  }, []);

  // Show timestamp and actions for completed messages
  const showTimestampAndActions = !isStreaming && (message.text?.trim() || message.message?.trim() || (message.attachments && message.attachments.length > 0));

  // Animation on mount
  useEffect(() => {
    setIsVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // const themeColors = getThemeColors(theme as 'light' | 'dark');

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.messageContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          alignSelf: isUser ? 'flex-end' : 'flex-start',
        },
      ]}
    >
      <View>
        {isUser ? (
          // Optimized User messages
          <View style={styles.userMessageContainer}>
            <TouchableOpacity
              onLongPress={handleLongPress}
              activeOpacity={1}
              delayLongPress={300}
              style={styles.userTouchable}
            >
              <Animated.View style={[
                styles.userProfileBubble,
                theme === 'light' ? styles.userBubbleLight : styles.userBubbleDark
              ]}>
                {/* Apple-style abstract gradient border overlay */}
                <View style={[
                  styles.gradientBorderOverlay,
                  theme === 'light' ? styles.gradientLight : styles.gradientDark
                ]} />
                {/* Render photo attachments within the bubble */}
                {renderPhotoAttachments()}
                {/* Render document attachments within the bubble */}
                {renderDocumentAttachments()}
                {/* Message text */}
                {(message.text?.trim() || message.message?.trim()) && (
                  <Text style={[
                    styles.userMessageText,
                    theme === 'light' ? styles.userTextLight : styles.userTextDark,
                    (message.attachments?.length || 0) > 0 && styles.userTextWithAttachments
                  ]}>
                    {message.text || message.message}
                  </Text>
                )}
              </Animated.View>
            </TouchableOpacity>
            
            {/* Message status indicators for friend messages */}
            {(message.fromMe || message.status || message.readAt || message.deliveredAt) && (
              <MessageStatus
                status={message.status}
                readAt={message.readAt}
                deliveredAt={message.deliveredAt}
                timestamp={message.timestamp}
                theme={theme}
                showTimestamp={true}
              />
            )}
          </View>
        ) : (
          // Bot messages - no bubble, just animated text
          <TouchableOpacity 
            style={styles.botTextWrapper}
            onLongPress={handleLongPress}
            activeOpacity={1}
            delayLongPress={300}
          >
            <StreamContent 
              text={message.text || message.message}
              theme={theme}
              messageId={message.id}
              isStreaming={isStreaming}
              metadata={message.metadata}
            />
            {showTimestampAndActions && (
              <View style={styles.botMessageFooter}>
                <Text style={[
                  typography.textStyles.timestampSmall,
                  { 
                    color: theme === 'dark' ? '#888888' : '#666666',
                    fontFamily: 'mozilla text',
                    fontSize: 11,
                    letterSpacing: 0.2,
                    opacity: 0.6,
                  }
                ]}>
                  {formatTimestamp(message.timestamp)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
      
      {/* Image Preview Modal */}
      <ImagePreviewModal
        visible={imageModalVisible}
        onClose={() => setImageModalVisible(false)}
        attachment={selectedImage}
        theme={theme}
      />

      {/* Action Modal */}
      <Modal
        visible={showActionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowActionModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowActionModal(false)}
        >
          <View
            style={[
              styles.actionModal,
              {
                left: modalPosition.x,
                top: modalPosition.y,
                width: actionOptions.length * 80,
                backgroundColor: theme === 'dark' ? 'rgba(40, 40, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              }
            ]}
            {...panResponder.panHandlers}
          >
            {actionOptions.map((option, _index) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.actionOption,
                  {
                    backgroundColor: selectedAction === option.id 
                      ? (theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)')
                      : 'transparent',
                  }
                ]}
                onPress={() => handleActionSelect(option.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={option.icon as IoniconsIconNames}
                  size={20}
                  color={theme === 'dark' ? '#ffffff' : '#333333'}
                />
                <Text style={[
                  styles.actionLabel,
                  { color: theme === 'dark' ? '#ffffff' : '#333333' }
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  messageContainer: {
    marginBottom: 0,
    width: '100%',
  },
  userMessageContainer: {
    alignItems: 'flex-end',
    width: '100%',
  },
  userProfileBubble: {
    borderRadius: 14,        // Less rounded for cleaner look
    paddingHorizontal: 10,   // Tighter horizontal padding
    paddingVertical: 6,      // Minimal vertical padding
    maxWidth: width * 0.75,  // Slightly narrower for better readability
    alignSelf: 'flex-end',
    minHeight: 28,          // Compact minimum height
  },
  userMessageTextCompact: {
    fontSize: 16,
    lineHeight: 20,
  },
  botTextWrapper: {
    maxWidth: width * 0.92,  // Increased to allow more width
    alignSelf: 'flex-start',
    paddingRight: 12,        // Reduced right padding for more space
    paddingLeft: 2,          // Subtle left padding
  },
  botTextContainer: {
    flexDirection: 'column',
    paddingVertical: 2,      // Subtle vertical spacing
  },
  messageText: {
    // Enhanced typography for chat messages
    fontFamily: 'mozilla text',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
    letterSpacing: -0.05,
  },
  
  // Optimized user message styles
  userTouchable: {
    // Empty style for TouchableOpacity optimization
  },
  userMessageText: {
    fontFamily: 'mozilla text',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,          // Better line height for readability
    letterSpacing: -0.02,    // Subtle letter spacing for clean look
    textAlign: 'left',
    margin: 0,               // Remove any default margins
    padding: 0,              // Remove any default padding
  },
  userTextLight: {
    color: '#1a1a1a',
  },
  userTextDark: {
    color: '#ffffff',
  },
  userTextWithAttachments: {
    marginTop: 6,            // Better spacing when attachments are present
  },
  userBubbleLight: {
    backgroundColor: '#F5F5F7',
    borderRadius: 14,
    overflow: 'visible',      // Allow spike to show
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  userBubbleDark: {
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    overflow: 'visible',      // Allow spike to show
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 1,
  },
  
  
  // Apple-style abstract gradient border overlay
  gradientBorderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 14,
    pointerEvents: 'none',   // Don't interfere with touch
  },
  gradientLight: {
    // Abstract off-center gradient border for light mode
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    // Create the Apple-style gradient effect using multiple borders
    borderTopColor: 'rgba(0, 0, 0, 0.03)',
    borderRightColor: 'rgba(0, 0, 0, 0.08)',   // Stronger on right
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',  // Medium on bottom
    borderLeftColor: 'rgba(0, 0, 0, 0.02)',    // Subtle on left
    // Add inner glow effect
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: -0.5, height: -0.5 }, // Inner shadow simulation
    shadowOpacity: 1,
    shadowRadius: 0.5,
  },
  gradientDark: {
    // Abstract off-center gradient border for dark mode
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    // Create the Apple-style gradient effect for dark mode
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    borderRightColor: 'rgba(255, 255, 255, 0.12)', // Brighter on right
    borderBottomColor: 'rgba(255, 255, 255, 0.08)', // Medium on bottom
    borderLeftColor: 'rgba(255, 255, 255, 0.04)',   // Subtle on left
    // Add inner glow effect
    shadowColor: 'rgba(255, 255, 255, 0.1)',
    shadowOffset: { width: -0.5, height: -0.5 }, // Inner shadow simulation
    shadowOpacity: 1,
    shadowRadius: 0.5,
  },
  lottieAnimation: {
    width: 40,
    height: 40,
    alignSelf: 'flex-start',
    marginLeft: 0,
  },
  searchResultsContainer: {
    marginTop: spacing[2],
    padding: spacing[2],
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(20, 20, 20, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.3)',
  },
  searchResultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    letterSpacing: -0.05,
    marginBottom: spacing[2],
  },
  sourceCard: {
    marginBottom: spacing[1],
    paddingVertical: spacing[1],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(70, 70, 70, 0.1)',
  },
  sourceTitle: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    letterSpacing: -0.02,
    lineHeight: 18,
    marginBottom: 2,
  },
  sourceDomain: {
    fontSize: 11,
    fontFamily: 'mozilla text',
    letterSpacing: 0.1,
    opacity: 0.65,
    lineHeight: 14,
  },
  toolCallsContainer: {
    marginTop: spacing[2],
    gap: spacing[1],
  },
  toolCallCard: {
    padding: spacing[4],
    borderRadius: 20,
    backgroundColor: 'rgba(0, 102, 204, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.3)',
    alignItems: 'center',
  },
  toolCallName: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    letterSpacing: -0.05,
    marginBottom: spacing[1],
    textTransform: 'capitalize',
    alignSelf: 'flex-start',
  },
  toolCallResult: {
    fontSize: 13,
    fontFamily: 'mozilla text',
    lineHeight: 19,
    letterSpacing: -0.02,
  },
  searchQuery: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    letterSpacing: 0.05,
    marginBottom: spacing[2],
    fontStyle: 'italic',
  },
  searchResultItem: {
    marginBottom: spacing[3],
    paddingBottom: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 102, 204, 0.1)',
  },
  searchResultTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    letterSpacing: -0.05,
    marginBottom: spacing[1],
    lineHeight: 20,
  },
  searchResultSnippet: {
    fontSize: 13,
    fontFamily: 'mozilla text',
    lineHeight: 19,
    letterSpacing: -0.02,
    marginBottom: spacing[1],
  },
  searchResultLink: {
    fontSize: 12,
    fontFamily: 'mozilla text',
    letterSpacing: 0.1,
    textDecorationLine: 'underline',
    opacity: 0.75,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[2],
    paddingHorizontal: spacing[2],
    width: '100%',
  },
  botMessageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: spacing[1],
    marginTop: 0,
    marginBottom: 0,
    gap: spacing[2],
  },
  timestamp: {
    fontSize: 11,
    fontFamily: 'mozilla text',
    fontWeight: '400',
    letterSpacing: 0.2,
    opacity: 0.6,
    flex: 1,
    marginTop: 4,           // Better spacing from message text
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingLeft: spacing[2],
  },
  actionButton: {
    padding: spacing[1] / 2,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  // Photo attachment containers
  photoAttachmentsContainer: {
    gap: 6,
    alignItems: 'flex-end',
    marginBottom: 0,
  },
  aiPhotoAttachmentsContainer: {
    gap: 6,
    alignItems: 'flex-start',
    marginBottom: spacing[2],
  },

  // Document Attachment Styles
  documentAttachmentsContainer: {
    gap: spacing[2],
  },
  documentAttachmentBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[2],
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    gap: spacing[2],
  },
  documentIcon: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontWeight: '600',
    fontSize: 12,
    marginBottom: 2,
  },
  documentSize: {
    fontSize: 10,
    opacity: 0.8,
  },
  
  // Action Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  actionModal: {
    position: 'absolute',
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  actionOption: {
    width: 80,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  actionLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
    letterSpacing: 0.1,
    marginTop: 4,
    textAlign: 'center',
  },
  // New styles for raw tool results
  toolCallsHeader: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Nunito-SemiBold',
    marginBottom: spacing[2],
  },
  toolResultContent: {
    marginTop: spacing[1],
    padding: spacing[1],
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: borderRadius.xs,
  },
  toolResultText: {
    fontSize: 12,
    fontFamily: 'JetBrainsMono-Regular',
    lineHeight: 16,
  },
  sourceSnippet: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    marginTop: spacing[1],
    lineHeight: 16,
    opacity: 0.8,
  },
});

export default EnhancedBubble;