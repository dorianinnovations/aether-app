/**
 * Custom hook for managing message state and streaming logic
 */
import { useState, useEffect, useRef } from 'react';
import { FlatList, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { ChatAPI, ConversationAPI } from '../services/api';
import { Message, MessageAttachment, Conversation } from '../types';

interface UseMessagesReturn {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  handleSend: (inputText: string, attachments?: MessageAttachment[]) => Promise<void>;
  handleMessagePress: (message: Message) => Promise<void>;
  handleMessageLongPress: (message: Message) => void;
  handleConversationSelect: (conversation: Conversation) => Promise<void>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  flatListRef: React.RefObject<FlatList | null>;
}

export const useMessages = (onHideGreeting?: () => void, conversationId?: string): UseMessagesReturn => {
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
      // Save current messages to cache before switching
      if (currentConversationRef.current && messages.length > 0) {
        messageCache.current.set(currentConversationRef.current, [...messages]);
      }
      
      // Update current conversation reference
      currentConversationRef.current = conversationId;
      
      if (conversationId) {
        // Check cache first
        const cachedMessages = messageCache.current.get(conversationId);
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
          const conversation = await ConversationAPI.getConversation(conversationId, 500);
          
          if (conversation.messages && Array.isArray(conversation.messages)) {
            const convertedMessages: Message[] = conversation.messages.map((msg: { id: string; sender: string; message: string; timestamp: string; metadata?: unknown; attachments?: unknown }, index: number) => ({
              id: msg._id || `${conversationId}-${index}`,
              sender: msg.role === 'user' ? 'user' : 'aether',
              message: msg.content,
              timestamp: msg.timestamp,
              variant: 'default',
            }));
            
            // Cache the loaded messages
            messageCache.current.set(conversationId, convertedMessages);
            setMessages(convertedMessages);
            
            // Hide greeting when conversation is loaded
            if (onHideGreeting) {
              onHideGreeting();
            }
          }
        } catch (error) {
          console.error('Failed to load conversation messages:', error);
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
  }, [conversationId]);

  const handleSend = async (inputText: string, attachments: MessageAttachment[] = []) => {
    // Allow sending if there's text OR attachments
    if ((!inputText.trim() && attachments.length === 0) || isLoading) return;


    // Hide greeting on first message
    if (onHideGreeting) {
      onHideGreeting();
    }

    // Prepare message text for display (keep user input as-is)
    const displayText = inputText.trim();
    
    // Prepare prompt for API (include default prompt for attachment-only messages)
    const apiPrompt = displayText || (attachments.length > 0 ? "Please analyze this content." : "");
    
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      message: displayText,
      timestamp: new Date().toISOString(),
      attachments: attachments.length > 0 ? attachments : undefined,
    };


    // Add user message with optimistic update
    setMessages(prev => {
      const newMessages = [...prev, userMessage];
      // Update cache with new messages - use the passed conversationId parameter
      if (conversationId) {
        messageCache.current.set(conversationId, newMessages);
      }
      return newMessages;
    });
    setIsLoading(true);

    // Force immediate render cycle for better perceived performance
    await new Promise(resolve => setTimeout(resolve, 0));

    try {
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
        // Update cache with streaming message - use the passed conversationId parameter
        if (conversationId) {
          messageCache.current.set(conversationId, newMessages);
        }
        return newMessages;
      });
      
      // Start streaming with word animation
      let accumulatedText = '';
      let wordCount = 0;
      let messageMetadata: { toolResults?: unknown[]; toolUsed?: string; thinking?: string } | undefined = undefined;
      
      for await (const chunk of ChatAPI.streamSocialChat(apiPrompt, attachments)) {
        // Check if chunk is metadata object
        if (typeof chunk === 'object' && chunk !== null && 'metadata' in chunk) {
          messageMetadata = (chunk as any).metadata;
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
          } catch (e) {
            // Not valid JSON, treat as regular text
          }
        }
        
        // Server sends streaming text content
        const word = typeof chunk === 'string' ? chunk : (chunk as any).text;
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
          // Update cache with streaming updates - use the passed conversationId parameter
          if (conversationId) {
            messageCache.current.set(conversationId, updatedMessages);
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
                    messageMetadata.toolResults.map((toolResult: { name: string; parameters: unknown; result: unknown }, index: number) => ({
                      id: `tool-${index}-${Date.now()}`,
                      name: toolResult.tool,
                      parameters: { query: toolResult.query },
                      result: toolResult.data,
                      status: toolResult.success ? 'completed' : 'failed'
                    })) : (messageMetadata.searchResults && messageMetadata.sources ? 
                    [{
                      id: 'search-' + Date.now(),
                      name: 'insane_web_search',
                      parameters: { query: messageMetadata.query },
                      result: {
                        sources: messageMetadata.sources,
                        query: messageMetadata.query
                      },
                      status: 'completed'
                    }] : messageMetadata.toolCalls)
                } : msg.metadata
              }
            : msg
        );
        // Update cache with final message state - use the passed conversationId parameter
        if (conversationId) {
          messageCache.current.set(conversationId, finalMessages);
        }
        return finalMessages;
      });
      
      
      // Metadata processing complete
      
      // Refined haptic timing - trigger earlier for better UX
      const refinedHapticDelay = Math.min(300, Math.max(100, wordCount * 8)); // More responsive timing
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, refinedHapticDelay);

    } catch (error: unknown) {
      console.error('Chat Error:', error);
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        sender: 'system',
        message: `Error: ${error.message || 'Failed to send message'}`,
        timestamp: new Date().toISOString(),
        variant: 'error',
      };
      
      setMessages(prev => {
        const newMessages = [...prev, errorMessage];
        // Update cache with error message - use the passed conversationId parameter
        if (conversationId) {
          messageCache.current.set(conversationId, newMessages);
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
        console.error('Failed to copy to clipboard:', error);
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
    const conversationId = conversation._id || conversation.id || conversation.conversationId || conversation.objectId;
    
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
      const convertedMessages: Message[] = fullConversation.messages.map((msg: { id: string; sender: string; message: string; timestamp: string; metadata?: unknown; attachments?: unknown }, index: number) => ({
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
      console.error('Failed to load conversation:', error);
      
      let errorTitle = 'Error Loading Conversation';
      let errorMessage = 'Failed to load conversation. Please try again.';
      
      if (error.status === 401) {
        errorTitle = 'Authentication Required';
        errorMessage = 'Please sign in to load your conversation history.';
      } else if (error.status === 404) {
        errorTitle = 'Conversation Not Found';
        errorMessage = 'This conversation may have been deleted or is no longer available.';
      } else if (error.status === 403) {
        errorTitle = 'Access Denied';
        errorMessage = 'You do not have permission to access this conversation.';
      } else if (error.message?.includes('No messages found')) {
        errorTitle = 'Empty Conversation';
        errorMessage = 'This conversation has no messages yet.';
      } else if (error.message?.includes('timeout')) {
        errorTitle = 'Network Error';
        errorMessage = 'Network error, try again in a few minutes';
      } else if (error.status >= 500) {
        errorTitle = 'Server Error';
        errorMessage = 'The server is experiencing issues. Please try again later.';
      }
      
      Alert.alert(errorTitle, errorMessage, [{ text: 'OK', style: 'default' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    isLoading,
    isStreaming,
    handleSend,
    handleMessagePress,
    handleMessageLongPress,
    handleConversationSelect,
    setMessages,
    flatListRef,
  };
};