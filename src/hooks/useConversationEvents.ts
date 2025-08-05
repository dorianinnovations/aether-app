import { useEffect, useState, useCallback, useRef } from 'react';
import { sseService, SSEEvent } from '../services/sseService';
import { log } from '../utils/logger';

interface Conversation {
  _id: string;
  title: string;
  lastActivity: string;
  messageCount: number;
  summary?: string;
}

interface ConversationEventData {
  conversationId: string;
  message?: {
    _id: string;
    role: string;
    content: string;
    createdAt: string;
  };
  conversation?: Conversation;
  deletedCount?: number;
}

export interface UseConversationEventsProps {
  onConversationCreated?: (conversation: Conversation) => void;
  onConversationUpdated?: (conversation: Conversation) => void;
  onConversationDeleted?: (data: { conversationId: string; deletedCount: number }) => void;
  onAllConversationsDeleted?: (data: { deletedCount: number }) => void;
  onMessageAdded?: (data: ConversationEventData) => void;
  autoRefresh?: boolean;
}

export const useConversationEvents = ({
  onConversationCreated,
  onConversationUpdated,
  onConversationDeleted,
  onAllConversationsDeleted,
  onMessageAdded,
  autoRefresh = true
}: UseConversationEventsProps = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [eventCount, setEventCount] = useState(0);

  // Track connection state (reduced frequency to prevent overheating)
  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(sseService.isConnected());
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Reduced from 5s to 30s

    return () => clearInterval(interval);
  }, []);

  // Initialize SSE connection
  useEffect(() => {
    if (autoRefresh) {
      sseService.connect().catch((error) => {
        log.error('Failed to connect to SSE:', error);
      });
    }

    return () => {
      if (autoRefresh) {
        // Connection cleanup is handled by the event handlers useEffect
        sseService.disconnect();
      }
    };
  }, [autoRefresh]);

  // Register conversation event handlers using refs to prevent re-registration
  const handlersRef = useRef({
    onConversationCreated,
    onConversationUpdated,
    onConversationDeleted,
    onAllConversationsDeleted,
    onMessageAdded
  });

  // Update refs without causing re-renders
  useEffect(() => {
    handlersRef.current = {
      onConversationCreated,
      onConversationUpdated,
      onConversationDeleted,
      onAllConversationsDeleted,
      onMessageAdded
    };
  });

  // Register conversation event handlers once
  useEffect(() => {
    const handlers = {
      'conversation:created': (event: SSEEvent) => {
        log.debug('Conversation created event:', event.data);
        setEventCount(prev => prev + 1);
        handlersRef.current.onConversationCreated?.(event.data);
      },
      
      'conversation:updated': (event: SSEEvent) => {
        log.debug('Conversation updated event:', event.data);
        setEventCount(prev => prev + 1);
        handlersRef.current.onConversationUpdated?.(event.data);
      },
      
      'conversation:deleted': (event: SSEEvent) => {
        log.debug('Conversation deleted event:', event.data);
        setEventCount(prev => prev + 1);
        handlersRef.current.onConversationDeleted?.(event.data);
      },
      
      'conversation:all_deleted': (event: SSEEvent) => {
        log.debug('All conversations deleted event:', event.data);
        setEventCount(prev => prev + 1);
        handlersRef.current.onAllConversationsDeleted?.(event.data);
      },
      
      'conversation:message_added': (event: SSEEvent) => {
        log.debug('Message added to conversation event:', event.data);
        setEventCount(prev => prev + 1);
        handlersRef.current.onMessageAdded?.(event.data);
      }
    };

    // Register handlers
    Object.entries(handlers).forEach(([eventType, handler]) => {
      sseService.on(eventType, handler);
    });

    // Store handlers for cleanup
    const currentHandlers = handlers;

    // Cleanup function
    return () => {
      Object.entries(currentHandlers).forEach(([eventType, handler]) => {
        sseService.off(eventType, handler);
      });
    };
  }, []); // Empty dependency array - register once

  // Manual connection control
  const connect = useCallback(async () => {
    try {
      await sseService.connect();
      setIsConnected(sseService.isConnected());
    } catch (error) {
      log.error('Failed to connect to conversation events:', error);
    }
  }, []);

  const disconnect = useCallback(() => {
    sseService.disconnect();
    setIsConnected(false);
  }, []);

  const reconnect = useCallback(async () => {
    disconnect();
    setTimeout(() => {
      connect();
    }, 1000);
  }, [connect, disconnect]);

  return {
    isConnected,
    eventCount,
    connectionState: sseService.getConnectionState(),
    connect,
    disconnect,
    reconnect
  };
};

export default useConversationEvents;