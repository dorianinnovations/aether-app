/**
 * Real-Time Messaging Service (Client)
 * Handles Socket.IO connection for typing indicators, read receipts, and live messaging
 */

import { io, Socket } from 'socket.io-client';
import { TokenManager } from './apiModules/utils/storage';
import { log } from '../utils/logger';

export interface MessageReadReceipt {
  messageId: string;
  readAt: Date;
  readBy: string;
}

export interface MessageDelivery {
  from: string;
  message: {
    messageId: string;
    content: string;
    timestamp: Date;
    fromMe: boolean;
  };
}

export interface TypingUpdate {
  conversationKey: string;
  username: string;
  isTyping: boolean;
}

interface RealTimeMessagingEvents {
  // Incoming events
  'message:new': (data: MessageDelivery) => void;
  'message:read_receipt': (data: MessageReadReceipt) => void;
  'typing:update': (data: TypingUpdate) => void;
  
  // Connection events
  'connect': () => void;
  'disconnect': () => void;
  'connect_error': (error: Error) => void;
}

class RealTimeMessagingService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private eventListeners: Map<keyof RealTimeMessagingEvents, Set<Function>> = new Map();
  private currentConversation: string | null = null;
  private typingTimeout: NodeJS.Timeout | null = null;
  
  constructor() {
    // Initialize empty event listener sets
    const events: (keyof RealTimeMessagingEvents)[] = [
      'message:new',
      'message:read_receipt', 
      'typing:update',
      'connect',
      'disconnect',
      'connect_error'
    ];
    
    events.forEach(event => {
      this.eventListeners.set(event, new Set());
    });
  }

  /**
   * Connect to the real-time messaging server
   */
  async connect(): Promise<boolean> {
    try {
      if (this.isConnected && this.socket) {
        log.debug('RealTimeMessaging: Already connected');
        return true;
      }

      const token = await TokenManager.getToken();
      if (!token) {
        log.warn('RealTimeMessaging: No auth token available');
        return false;
      }

      // Determine server URL based on environment
      const serverUrl = __DEV__ 
        ? 'https://aether-server-j5kh.onrender.com'  // Use production server for mobile app
        : 'https://aether-server-j5kh.onrender.com';

      this.socket = io(serverUrl, {
        auth: { token },
        timeout: 10000,
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true
      });

      return new Promise((resolve) => {
        if (!this.socket) {
          resolve(false);
          return;
        }

        // Connection success
        this.socket.on('connect', () => {
          log.debug('RealTimeMessaging: Connected to server');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emitEvent('connect');
          resolve(true);
        });

        // Connection error
        this.socket.on('connect_error', (error) => {
          log.error('RealTimeMessaging: Connection failed:', error.message);
          this.isConnected = false;
          this.emitEvent('connect_error', error);
          
          this.reconnectAttempts++;
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            log.warn('RealTimeMessaging: Max reconnection attempts reached');
            resolve(false);
          }
        });

        // Disconnection
        this.socket.on('disconnect', (reason) => {
          log.debug('RealTimeMessaging: Disconnected:', reason);
          this.isConnected = false;
          this.emitEvent('disconnect');
        });

        // Message events
        this.socket.on('message:new', (data: MessageDelivery) => {
          log.debug('RealTimeMessaging: New message received:', data.message.messageId);
          this.emitEvent('message:new', data);
        });

        this.socket.on('message:read_receipt', (data: MessageReadReceipt) => {
          log.debug('RealTimeMessaging: Read receipt received:', data.messageId);
          this.emitEvent('message:read_receipt', data);
        });

        this.socket.on('typing:update', (data: TypingUpdate) => {
          log.debug('RealTimeMessaging: Typing update:', data);
          this.emitEvent('typing:update', data);
        });
      });

    } catch (error) {
      log.error('RealTimeMessaging: Connection error:', error);
      return false;
    }
  }

  /**
   * Disconnect from the server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.currentConversation = null;
    
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }
  }

  /**
   * Join a conversation room for real-time updates
   */
  joinConversation(friendUsername: string): void {
    if (!this.isConnected || !this.socket) {
      log.warn('RealTimeMessaging: Not connected, cannot join conversation');
      return;
    }

    // Leave previous conversation if different
    if (this.currentConversation && this.currentConversation !== friendUsername) {
      this.leaveConversation(this.currentConversation);
    }

    this.socket.emit('conversation:join', { friendUsername });
    this.currentConversation = friendUsername;
    log.debug(`RealTimeMessaging: Joined conversation with ${friendUsername}`);
  }

  /**
   * Leave a conversation room
   */
  leaveConversation(friendUsername: string): void {
    if (!this.isConnected || !this.socket) return;

    this.socket.emit('conversation:leave', { friendUsername });
    
    if (this.currentConversation === friendUsername) {
      this.currentConversation = null;
    }
    
    // Stop typing when leaving
    this.stopTyping(friendUsername);
    
    log.debug(`RealTimeMessaging: Left conversation with ${friendUsername}`);
  }

  /**
   * Send typing indicator
   */
  startTyping(friendUsername: string): void {
    if (!this.isConnected || !this.socket) return;

    this.socket.emit('typing:start', { friendUsername });
    
    // Auto-stop typing after 10 seconds
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    
    this.typingTimeout = setTimeout(() => {
      this.stopTyping(friendUsername);
    }, 10000);

    log.debug(`RealTimeMessaging: Started typing to ${friendUsername}`);
  }

  /**
   * Stop typing indicator
   */
  stopTyping(friendUsername: string): void {
    if (!this.isConnected || !this.socket) return;

    this.socket.emit('typing:stop', { friendUsername });
    
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }

    log.debug(`RealTimeMessaging: Stopped typing to ${friendUsername}`);
  }

  /**
   * Mark message as read
   */
  markMessageAsRead(messageId: string, friendUsername: string): void {
    if (!this.isConnected || !this.socket) return;

    this.socket.emit('message:read', { messageId, friendUsername });
    log.debug(`RealTimeMessaging: Marked message ${messageId} as read`);
  }

  /**
   * Add event listener
   */
  on<T extends keyof RealTimeMessagingEvents>(
    event: T, 
    callback: RealTimeMessagingEvents[T]
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.add(callback as Function);
    }
  }

  /**
   * Remove event listener
   */
  off<T extends keyof RealTimeMessagingEvents>(
    event: T, 
    callback: RealTimeMessagingEvents[T]
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback as Function);
    }
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners<T extends keyof RealTimeMessagingEvents>(event?: T): void {
    if (event) {
      this.eventListeners.get(event)?.clear();
    } else {
      this.eventListeners.forEach(listeners => listeners.clear());
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    isConnected: boolean;
    currentConversation: string | null;
    reconnectAttempts: number;
  } {
    return {
      isConnected: this.isConnected,
      currentConversation: this.currentConversation,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * Emit event to all listeners
   */
  private emitEvent<T extends keyof RealTimeMessagingEvents>(
    event: T, 
    ...args: Parameters<RealTimeMessagingEvents[T]>
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          (callback as Function)(...args);
        } catch (error) {
          log.error(`RealTimeMessaging: Error in ${event} listener:`, error);
        }
      });
    }
  }
}

// Export singleton instance
export const realTimeMessaging = new RealTimeMessagingService();
export default realTimeMessaging;