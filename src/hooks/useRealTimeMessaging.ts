/**
 * useRealTimeMessaging Hook
 * Manages real-time messaging features including typing indicators, read receipts, and live messages
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import realTimeMessaging, { 
  type MessageDelivery, 
  type MessageReadReceipt, 
  type TypingUpdate 
} from '../services/realTimeMessaging';
import { FriendsAPI } from '../services/api';
import { log } from '../utils/logger';

interface UseRealTimeMessagingOptions {
  friendUsername?: string;
  onNewMessage?: (message: MessageDelivery) => void;
  onReadReceipt?: (receipt: MessageReadReceipt) => void;
  onTypingUpdate?: (update: TypingUpdate) => void;
  autoConnect?: boolean;
}

interface TypingState {
  [username: string]: boolean;
}

export interface UseRealTimeMessagingReturn {
  // Connection state
  isConnected: boolean;
  connectionError: Error | null;
  
  // Typing indicators
  typingUsers: TypingState;
  startTyping: () => void;
  stopTyping: () => void;
  
  // Read receipts
  markMessageAsRead: (messageId: string) => Promise<void>;
  markAllMessagesAsRead: () => Promise<void>;
  
  // Connection management
  connect: () => Promise<boolean>;
  disconnect: () => void;
  
  // Conversation management
  joinConversation: (username: string) => void;
  leaveConversation: () => void;
}

export const useRealTimeMessaging = (
  options: UseRealTimeMessagingOptions = {}
): UseRealTimeMessagingReturn => {
  const {
    friendUsername,
    onNewMessage,
    onReadReceipt,
    onTypingUpdate,
    autoConnect = true
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingState>({});
  
  const currentFriend = useRef<string | null>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  // Handle connection events
  const handleConnect = useCallback(() => {
    setIsConnected(true);
    setConnectionError(null);
    log.debug('useRealTimeMessaging: Connected');
  }, []);

  const handleDisconnect = useCallback(() => {
    setIsConnected(false);
    setTypingUsers({});
    log.debug('useRealTimeMessaging: Disconnected');
  }, []);

  const handleConnectionError = useCallback((error: Error) => {
    setIsConnected(false);
    setConnectionError(error);
    log.error('useRealTimeMessaging: Connection error:', error);
  }, []);

  // Handle new messages
  const handleNewMessage = useCallback((data: MessageDelivery) => {
    log.debug('useRealTimeMessaging: New message received:', data);
    onNewMessage?.(data);
  }, [onNewMessage]);

  // Handle read receipts
  const handleReadReceipt = useCallback((data: MessageReadReceipt) => {
    log.debug('useRealTimeMessaging: Read receipt received:', data);
    onReadReceipt?.(data);
  }, [onReadReceipt]);

  // Handle typing updates
  const handleTypingUpdate = useCallback((data: TypingUpdate) => {
    log.debug('useRealTimeMessaging: Typing update:', data);
    
    setTypingUsers(prev => ({
      ...prev,
      [data.username]: data.isTyping
    }));
    
    // Clean up typing state after a delay if user stopped typing
    if (!data.isTyping) {
      setTimeout(() => {
        setTypingUsers(prev => {
          const newState = { ...prev };
          delete newState[data.username];
          return newState;
        });
      }, 1000);
    }
    
    onTypingUpdate?.(data);
  }, [onTypingUpdate]);

  // Connect to real-time messaging
  const connect = useCallback(async (): Promise<boolean> => {
    try {
      const connected = await realTimeMessaging.connect();
      return connected;
    } catch (error) {
      log.error('useRealTimeMessaging: Connect failed:', error);
      return false;
    }
  }, []);

  // Disconnect from real-time messaging
  const disconnect = useCallback(() => {
    realTimeMessaging.disconnect();
    currentFriend.current = null;
    
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
      typingTimeout.current = null;
    }
  }, []);

  // Join conversation room
  const joinConversation = useCallback((username: string) => {
    if (currentFriend.current && currentFriend.current !== username) {
      // Leave previous conversation
      realTimeMessaging.leaveConversation(currentFriend.current);
    }
    
    realTimeMessaging.joinConversation(username);
    currentFriend.current = username;
    
    log.debug(`useRealTimeMessaging: Joined conversation with ${username}`);
  }, []);

  // Leave current conversation
  const leaveConversation = useCallback(() => {
    if (currentFriend.current) {
      realTimeMessaging.leaveConversation(currentFriend.current);
      currentFriend.current = null;
    }
    
    // Stop any active typing
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
      typingTimeout.current = null;
    }
  }, []);

  // Start typing indicator
  const startTyping = useCallback(() => {
    if (!currentFriend.current) return;
    
    realTimeMessaging.startTyping(currentFriend.current);
    
    // Auto-stop typing after 8 seconds of no activity
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    
    typingTimeout.current = setTimeout(() => {
      stopTyping();
    }, 8000);
  }, []);

  // Stop typing indicator
  const stopTyping = useCallback(() => {
    if (!currentFriend.current) return;
    
    realTimeMessaging.stopTyping(currentFriend.current);
    
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
      typingTimeout.current = null;
    }
  }, []);

  // Mark specific message as read
  const markMessageAsRead = useCallback(async (messageId: string) => {
    if (!currentFriend.current) return;
    
    try {
      // Mark via Socket.IO for real-time update
      realTimeMessaging.markMessageAsRead(messageId, currentFriend.current);
      
      // Also mark via API for persistence
      await FriendsAPI.markMessagesAsRead(currentFriend.current, [messageId]);
      
    } catch (error) {
      log.error('useRealTimeMessaging: Error marking message as read:', error);
    }
  }, []);

  // Mark all messages in conversation as read
  const markAllMessagesAsRead = useCallback(async () => {
    if (!currentFriend.current) return;
    
    try {
      // Mark all via API (no specific message IDs)
      await FriendsAPI.markMessagesAsRead(currentFriend.current);
      
      log.debug(`useRealTimeMessaging: Marked all messages as read for ${currentFriend.current}`);
      
    } catch (error) {
      log.error('useRealTimeMessaging: Error marking all messages as read:', error);
    }
  }, []);

  // Setup event listeners
  useEffect(() => {
    realTimeMessaging.on('connect', handleConnect);
    realTimeMessaging.on('disconnect', handleDisconnect);
    realTimeMessaging.on('connect_error', handleConnectionError);
    realTimeMessaging.on('message:new', handleNewMessage);
    realTimeMessaging.on('message:read_receipt', handleReadReceipt);
    realTimeMessaging.on('typing:update', handleTypingUpdate);

    return () => {
      realTimeMessaging.off('connect', handleConnect);
      realTimeMessaging.off('disconnect', handleDisconnect);
      realTimeMessaging.off('connect_error', handleConnectionError);
      realTimeMessaging.off('message:new', handleNewMessage);
      realTimeMessaging.off('message:read_receipt', handleReadReceipt);
      realTimeMessaging.off('typing:update', handleTypingUpdate);
    };
  }, [
    handleConnect,
    handleDisconnect,
    handleConnectionError,
    handleNewMessage,
    handleReadReceipt,
    handleTypingUpdate
  ]);

  // Auto-connect and join conversation
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      if (autoConnect) {
        const connected = await connect();
        if (connected && mounted && friendUsername) {
          joinConversation(friendUsername);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
      leaveConversation();
    };
  }, [autoConnect, friendUsername, connect, joinConversation, leaveConversation]);

  // Handle friend username changes
  useEffect(() => {
    if (friendUsername && isConnected) {
      joinConversation(friendUsername);
    }
  }, [friendUsername, isConnected, joinConversation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveConversation();
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
    };
  }, [leaveConversation]);

  return {
    isConnected,
    connectionError,
    typingUsers,
    startTyping,
    stopTyping,
    markMessageAsRead,
    markAllMessagesAsRead,
    connect,
    disconnect,
    joinConversation,
    leaveConversation
  };
};