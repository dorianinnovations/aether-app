/**
 * Custom hook for managing message state and streaming logic
 */
import { useState, useEffect, useRef } from 'react';
import { FlatList, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { ChatAPI, ConversationAPI, FriendsAPI } from '../services/api';
import { Message, MessageAttachment, Conversation } from '../types';
import { logger } from '../utils/logger';


interface UseMessagesReturn {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  handleSend: (inputText: string, attachments?: MessageAttachment[]) => Promise<void>;
  handleMessagePress: (message: Message) => Promise<void>;
  handleMessageLongPress: (message: Message) => void;
  handleConversationSelect: (conversation: Conversation) => Promise<void>;
  handleHaltStreaming: () => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  flatListRef: React.RefObject<FlatList | null>;
}

export const useMessages = (onHideGreeting?: () => void, conversationId?: string, friendUsername?: string): UseMessagesReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  
  // Conversation-specific message cache
  const messageCache = useRef<Map<string, Message[]>>(new Map());
  const currentConversationRef = useRef<string | undefined>(conversationId);

  // Track streaming state without legacy scroll logic
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const streaming = lastMessage.variant === 'streaming';
      setIsStreaming(streaming);
    } else {
      setIsStreaming(false);
    }
  }, [messages]);

  // Handle conversation switching with caching
  useEffect(() => {
    const handleConversationSwitch = async () => {
      // Store previous conversation info before updating
      const previousConversation = currentConversationRef.current;
      const previouslyHadFriendUsername = previousConversation && previousConversation.startsWith('friend-');
      const previouslyHadConversationId = previousConversation && !previousConversation.startsWith('friend-');
      
      // Save current messages to cache before switching
      if (previousConversation && messages.length > 0) {
        messageCache.current.set(previousConversation, [...messages]);
      }
      
      // Update current conversation reference - only if we have valid values
      const newConversationKey = (friendUsername && friendUsername !== 'undefined') ? `friend-${friendUsername}` : conversationId;
      currentConversationRef.current = newConversationKey;
      
      // Clear messages immediately when switching between conversation types to prevent bleed-through
      const nowHasFriendUsername = !!(friendUsername && friendUsername !== 'undefined');
      const nowHasConversationId = !!conversationId;
      
      if ((previouslyHadFriendUsername && nowHasConversationId) || 
          (previouslyHadConversationId && nowHasFriendUsername) ||
          (!previousConversation && (nowHasFriendUsername || nowHasConversationId))) {
        setMessages([]);
      }
      
      if (conversationId || (friendUsername && friendUsername !== 'undefined')) {
        const cacheKey = (friendUsername && friendUsername !== 'undefined') ? `friend-${friendUsername}` : conversationId!;
        
        // Check cache first
        const cachedMessages = messageCache.current.get(cacheKey);
        if (cachedMessages && cachedMessages.length > 0) {
          setMessages(cachedMessages);
          if (onHideGreeting) {
            onHideGreeting();
          }
          return;
        }
        
        // Load from server if not cached
        try {
          setIsLoading(true);
          
          if (friendUsername) {
            // Load friend conversation
            try {
              const friendConversation = await FriendsAPI.getDirectMessages(friendUsername, 1, 25);
              
              if (friendConversation.success && friendConversation.conversation?.messages && Array.isArray(friendConversation.conversation.messages)) {
                const convertedMessages: Message[] = friendConversation.conversation.messages.map((msg: any, index: number) => ({
                  id: msg.messageId || `${friendUsername}-${index}`,
                  sender: msg.fromMe ? 'user' : msg.from,
                  message: msg.content,
                  timestamp: msg.timestamp,
                  variant: 'default',
                  // Friend messaging specific fields
                  messageId: msg.messageId,
                  fromMe: msg.fromMe,
                  from: msg.from,
                  readAt: msg.readAt,
                  deliveredAt: msg.deliveredAt,
                  status: msg.status,
                }));
                
                // Cache the loaded messages
                messageCache.current.set(cacheKey, convertedMessages);
                setMessages(convertedMessages);
                
                // Hide greeting when conversation is loaded
                if (onHideGreeting) {
                  onHideGreeting();
                }
              } else {
                // No messages yet or API not implemented
                setMessages([]);
                if (onHideGreeting) {
                  onHideGreeting();
                }
              }
            } catch (messagingError) {
              // Start with empty conversation
              setMessages([]);
              if (onHideGreeting) {
                onHideGreeting();
              }
            }
          } else {
            // Load AI conversation
            const conversation = await ConversationAPI.getConversation(conversationId!, 500);
            
            if (conversation.messages && Array.isArray(conversation.messages)) {
              const convertedMessages: Message[] = conversation.messages.map((msg: any, index: number) => ({
                id: msg._id || `${conversationId}-${index}`,
                sender: msg.role === 'user' ? 'user' : 'aether',
                message: msg.content,
                timestamp: msg.timestamp,
                variant: 'default',
              }));
              
              // Cache the loaded messages
              messageCache.current.set(cacheKey, convertedMessages);
              setMessages(convertedMessages);
              
              // Hide greeting when conversation is loaded
              if (onHideGreeting) {
                onHideGreeting();
              }
            }
          }
        } catch (error) {
          logger.error('Failed to load conversation messages:', error);
          // Don't show error - just leave messages as is
        } finally {
          setIsLoading(false);
        }
      } else {
        // No conversation selected - clear messages
        setMessages([]);
      }
    };
    
    handleConversationSwitch();
  }, [conversationId, friendUsername]);

  const handleSend = async (inputText: string, attachments: MessageAttachment[] = []) => {
    // Allow sending if there's text OR attachments
    if ((!inputText.trim() && attachments.length === 0) || isLoading) return;

    logger.debug('📨 Sending message:', { inputText, attachments: attachments.length, conversationId, friendUsername });

    // Hide greeting on first message
    if (onHideGreeting) {
      onHideGreeting();
    }

    // Prepare message text for display (keep user input as-is)
    const displayText = inputText.trim();
    
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      message: displayText,
      timestamp: new Date().toISOString(),
      attachments: attachments.length > 0 ? attachments : undefined,
      // Friend messaging fields
      ...((friendUsername && friendUsername !== 'undefined') && {
        fromMe: true,
        from: 'user',
        status: 'sent' as const,
        deliveredAt: new Date().toISOString(),
      }),
    };

    // Determine cache key - validate friendUsername is not undefined
    const cacheKey = (friendUsername && friendUsername !== 'undefined') ? `friend-${friendUsername}` : conversationId;

    // Add user message with optimistic update
    setMessages(prev => {
      const newMessages = [...prev, userMessage];
      // Update cache with new messages
      if (cacheKey) {
        messageCache.current.set(cacheKey, newMessages);
      }
      return newMessages;
    });
    setIsLoading(true);

    // Force immediate render cycle for better perceived performance
    await new Promise(resolve => setTimeout(resolve, 0));

    try {
      if (friendUsername && friendUsername !== 'undefined') {
        // Handle friend messaging - direct message, no streaming
        try {
          const response = await FriendsAPI.sendDirectMessage(friendUsername, displayText);
          
          if (response && response.success) {
            logger.debug('✅ Friend message sent successfully!');
            
            // Update message status to delivered with messageId from server
            if (response.data?.messageId) {
              setMessages(prev => prev.map(msg => 
                msg.id === userMessage.id 
                  ? { ...msg, messageId: response.data.messageId, status: 'delivered' as const }
                  : msg
              ));
            }
            
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } else {
            throw new Error(response?.error || 'Failed to send message to friend');
          }
        } catch (messagingError) {
          logger.warn('Friend messaging endpoint not available:', (messagingError as Error).message);
          // For now, just show as sent locally (this would need proper implementation)
          logger.debug('✅ Friend message queued locally (messaging endpoint not implemented)');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        // Handle AI chat with streaming
        let activeConversationId = conversationId;
        if (!activeConversationId) {
          logger.debug('🆕 No conversation ID, creating new conversation...');
          try {
            const newConversationResponse = await ConversationAPI.createConversation('New Chat');
            if (newConversationResponse.success && newConversationResponse.data) {
              activeConversationId = newConversationResponse.data._id;
              logger.debug('✅ Created new conversation:', activeConversationId);
            }
          } catch (error) {
            logger.error('❌ Error creating conversation:', error);
          }
        }

        // Prepare prompt for API (include default prompt for attachment-only messages)
        const apiPrompt = displayText || (attachments.length > 0 ? "Please analyze this content." : "");
        
        // Create streaming message
        const streamingMessage: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'aether',
          message: '',
          timestamp: new Date().toISOString(),
          variant: 'streaming',
          metadata: {
            confidence: 0.95,
          },
        };

        setMessages(prev => {
          const newMessages = [...prev, streamingMessage];
          // Update cache with streaming message
          if (cacheKey) {
            messageCache.current.set(cacheKey, newMessages);
          }
          return newMessages;
        });
        
        // Start streaming with word animation
        let accumulatedText = '';
        let wordCount = 0;
        let messageMetadata: { toolResults?: unknown[]; toolUsed?: string; thinking?: string } | undefined = undefined;
        
        // Use the ChatAPI streaming method directly
        for await (const chunk of ChatAPI.streamSocialChat(apiPrompt, attachments)) {
          // Temporary debug logging
          if (typeof chunk === 'object' || (typeof chunk === 'string' && (chunk.includes('sources') || chunk.includes('toolResults')))) {
            console.log('🐞 DEBUG: Processing chunk type:', typeof chunk);
            console.log('🐞 DEBUG: Chunk content:', chunk);
          }
          
          // Check if chunk is metadata object
          if (typeof chunk === 'object' && chunk !== null && 'metadata' in chunk) {
            console.log('🐞 DEBUG: Found wrapped metadata:', chunk);
            messageMetadata = (chunk as { metadata: Record<string, unknown> }).metadata;
            continue;
          }
          
          // Check if chunk is a direct metadata object (not wrapped)
          if (typeof chunk === 'object' && chunk !== null && (
            (chunk as any).toolResults || 
            (chunk as any).sources || 
            (chunk as any).searchResults ||
            (chunk as any).query
          )) {
            messageMetadata = chunk as Record<string, unknown>;
            continue;
          }
          
          // Fallback: Check if chunk is stringified metadata (legacy format)
          if (typeof chunk === 'string' && chunk.startsWith('{"metadata":')) {
            try {
              const parsed = JSON.parse(chunk);
              if (parsed.metadata) {
                messageMetadata = parsed.metadata;
                continue;
              }
            } catch {
              // Not valid JSON, treat as regular text
            }
          }
          
          // Check if chunk is stringified object that should be metadata
          if (typeof chunk === 'string' && (chunk.includes('toolResults') || chunk.includes('searchResults') || chunk.includes('sources'))) {
            try {
              const parsed = JSON.parse(chunk);
              if (parsed.toolResults || parsed.searchResults || parsed.sources) {
                messageMetadata = parsed;
                continue;
              }
            } catch {
              // Not valid JSON, treat as regular text
            }
          }
          
          // Server sends streaming text content
          const word = typeof chunk === 'string' ? chunk : (chunk as { text?: string }).text || '';
          
          // Skip empty words and don't add metadata objects as text
          if (!word || word.trim() === '' || typeof chunk === 'object') {
            continue;
          }
          
          // Add space before word if we already have content (except for punctuation)
          if (accumulatedText && word && !word.match(/^[.,!?;:]/)) {
            accumulatedText += ' ';
          }
          accumulatedText += word;
          wordCount++;
          
          // Update the streaming message while keeping streaming variant
          setMessages(prev => {
            const updatedMessages = prev.map(msg => 
              msg.id === streamingMessage.id 
                ? { ...msg, message: accumulatedText, variant: 'streaming' as const, timestamp: new Date().toISOString() }
                : msg
            );
            // Update cache with streaming updates
            if (cacheKey) {
              messageCache.current.set(cacheKey, updatedMessages);
            }
            return updatedMessages;
          });
        }
        
        // Mark as complete with metadata if available
        setMessages(prev => {
          const finalMessages = prev.map(msg => 
            msg.id === streamingMessage.id 
              ? { 
                  ...msg, 
                  variant: 'default' as const,
                  metadata: messageMetadata ? {
                    ...msg.metadata,
                    ...messageMetadata,
                    // Convert tool results format if needed
                    toolCalls: messageMetadata.toolResults ? 
                      messageMetadata.toolResults.map((toolResult: any, index: number) => ({
                        id: `tool-${index}-${Date.now()}`,
                        name: toolResult.tool || toolResult.name,
                        parameters: { query: toolResult.query || toolResult.parameters },
                        result: toolResult.data || toolResult.result,
                        status: toolResult.success ? 'completed' : 'failed'
                      })) : ((messageMetadata as any).searchResults && (messageMetadata as any).sources ? 
                      [{
                        id: 'search-' + Date.now(),
                        name: 'insane_web_search',
                        parameters: { query: (messageMetadata as any).query },
                        result: {
                          sources: (messageMetadata as any).sources,
                          query: (messageMetadata as any).query
                        },
                        status: 'completed'
                      }] : (messageMetadata as any).toolCalls)
                  } : msg.metadata
                }
              : msg
          );
          // Update cache with final message state
          if (cacheKey) {
            messageCache.current.set(cacheKey, finalMessages);
          }
          return finalMessages;
        });
        
        logger.debug('✅ AI message sent successfully!', { 
          wordCount, 
          conversationId,
          hasMetadata: !!messageMetadata 
        });
        
        // Refined haptic timing - trigger earlier for better UX
        const refinedHapticDelay = Math.min(300, Math.max(100, wordCount * 8));
        setTimeout(() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, refinedHapticDelay);
      }

    } catch (error: unknown) {
      logger.error('Chat Error:', error);
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        sender: 'system',
        message: `Error: ${(error as any)?.message || 'Failed to send message'}`,
        timestamp: new Date().toISOString(),
        variant: 'error',
      };
      
      setMessages(prev => {
        const newMessages = [...prev, errorMessage];
        // Update cache with error message
        if (cacheKey) {
          messageCache.current.set(cacheKey, newMessages);
        }
        return newMessages;
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle message actions - instant copy to clipboard with improved haptic timing
  const handleMessagePress = async (message: Message) => {
    // Immediate haptic feedback for better responsiveness
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (message.message && message.message.trim()) {
      try {
        await Clipboard.setStringAsync(message.message);
        // Success haptic after copy completes
        setTimeout(() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 50);
      } catch (error) {
        logger.error('Failed to copy to clipboard:', error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  // Keep long press for metadata viewing (Aether messages only) with improved haptic timing
  const handleMessageLongPress = (message: Message) => {
    // Immediate haptic feedback on long press start
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (message.sender === 'aether' && message.metadata) {
      // Show message details
      Alert.alert(
        'Message Details',
        `Processing Time: ${message.metadata.processingTime}ms\nConfidence: ${(message.metadata.confidence || 0) * 100}%${message.metadata.toolUsed ? `\nTool Used: ${message.metadata.toolUsed}` : ''}`,
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  // Handle conversation selection
  const handleConversationSelect = async (conversation: Conversation) => {
    // Check if we have a valid conversation ID first - try multiple potential fields
    const conversationId = (conversation as any)._id || (conversation as any).id || (conversation as any).conversationId || (conversation as any).objectId;
    
    try {
      setIsLoading(true);
      
      
      if (!conversationId) {
        throw new Error('Conversation ID is missing from conversation object');
      }
      
      // Handle demo conversations
      if (conversationId.startsWith('demo-')) {
        const demoMessages: Message[] = [
          {
            id: 'demo-welcome',
            sender: 'aether',
            message: `This is a demo of the "${conversation.title}" conversation. Sign in to access your real conversation history and continue chatting!`,
            timestamp: new Date().toISOString(),
            variant: 'default',
          }
        ];
        
        setMessages(demoMessages);
        // Cache demo messages using the extracted conversationId
        messageCache.current.set(conversationId, demoMessages);
        
        // Hide greeting for demo conversations too
        if (onHideGreeting) {
          onHideGreeting();
        }
        
        return;
      }
      
      // Load the full conversation from server with max allowed messages (500)
      const fullConversation = await ConversationAPI.getConversation(conversationId, 500);
      
      // Ensure we have messages
      if (!fullConversation.messages || !Array.isArray(fullConversation.messages)) {
        throw new Error('No messages found in conversation response');
      }
      
      // Convert server messages to app format
      const convertedMessages: Message[] = fullConversation.messages.map((msg: any, index: number) => ({
        id: msg._id || `${conversationId}-${index}`,
        sender: msg.role === 'user' ? 'user' : 'aether',
        message: msg.content,
        timestamp: msg.timestamp,
        variant: 'default',
      }));
      
      // Replace current messages with loaded conversation and cache them using the extracted conversationId
      setMessages(convertedMessages);
      messageCache.current.set(conversationId, convertedMessages);
      
      // Hide greeting when conversation is loaded (same as when sending a message)
      if (onHideGreeting) {
        onHideGreeting();
      }
      
    } catch (error: unknown) {
      logger.error('Failed to load conversation:', error);
      
      let errorTitle = 'Error Loading Conversation';
      let errorMessage = 'Failed to load conversation. Please try again.';
      
      if ((error as any).status === 401) {
        errorTitle = 'Authentication Required';
        errorMessage = 'Please sign in to load your conversation history.';
      } else if ((error as any).status === 404) {
        errorTitle = 'Conversation Not Found';
        errorMessage = 'This conversation may have been deleted or is no longer available.';
      } else if ((error as any).status === 403) {
        errorTitle = 'Access Denied';
        errorMessage = 'You do not have permission to access this conversation.';
      } else if ((error as any).message?.includes('No messages found')) {
        errorTitle = 'Empty Conversation';
        errorMessage = 'This conversation has no messages yet.';
      } else if ((error as any).message?.includes('timeout')) {
        errorTitle = 'Network Error';
        errorMessage = 'Network error, try again in a few minutes';
      } else if ((error as any).status >= 500) {
        errorTitle = 'Server Error';
        errorMessage = 'The server is experiencing issues. Please try again later.';
      }
      
      Alert.alert(errorTitle, errorMessage, [{ text: 'OK', style: 'default' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHaltStreaming = () => {
    // For now, just stop the loading states
    // TODO: Implement proper stream cancellation in ChatAPI
    logger.info('🛑 Halting streaming...');
    setIsStreaming(false);
    setIsLoading(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  return {
    messages,
    isLoading,
    isStreaming,
    handleSend,
    handleMessagePress,
    handleMessageLongPress,
    handleConversationSelect,
    handleHaltStreaming,
    setMessages,
    flatListRef,
  };
};