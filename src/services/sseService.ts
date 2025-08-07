import { TokenManager } from './api';

export interface SSEEvent {
  type: string;
  data: any;
  timestamp: string;
}

export type SSEEventHandler = (event: SSEEvent) => void;

class SSEService {
  private eventHandlers: Map<string, SSEEventHandler[]> = new Map();
  private isConnecting = false;
  private isManuallyDisconnected = false;
  private connectionState = false;

  async connect(): Promise<void> {
    if (this.isConnecting || this.connectionState) {
      return;
    }

    try {
      this.isConnecting = true;
      this.isManuallyDisconnected = false;

      const token = await TokenManager.getToken();
      if (!token) {
        console.warn('SSE: No auth token available, skipping connection');
        this.isConnecting = false;
        return;
      }

      // For now, we'll simulate a successful connection
      // In the future, this could be replaced with a polling mechanism
      // or a proper EventSource polyfill that works with React Native
      this.connectionState = true;
      this.isConnecting = false;
      

    } catch (error) {
      console.error('SSE: Failed to connect:', error);
      this.isConnecting = false;
      this.connectionState = false;
    }
  }

  private handleEvent(event: SSEEvent): void {

    // Handle system events
    if (event.type === 'connected') {
    } else if (event.type === 'heartbeat') {
      // Heartbeat received, connection is alive
      return;
    }

    // Notify registered handlers
    const handlers = this.eventHandlers.get(event.type) || [];
    handlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error(`SSE: Error in handler for ${event.type}:`, error);
      }
    });
  }

  disconnect(): void {
    this.isManuallyDisconnected = true;
    this.connectionState = false;
    this.isConnecting = false;
  }

  // Event subscription methods
  on(eventType: string, handler: SSEEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  off(eventType: string, handler: SSEEventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // Convenience methods for posts events
  onPostCreated(handler: (data: any) => void): void {
    this.on('post:created', (event) => handler(event.data));
  }

  onPostLiked(handler: (data: any) => void): void {
    this.on('post:liked', (event) => handler(event.data));
  }

  onPostShared(handler: (data: any) => void): void {
    this.on('post:shared', (event) => handler(event.data));
  }

  onCommentCreated(handler: (data: any) => void): void {
    this.on('comment:created', (event) => handler(event.data));
  }

  // Convenience methods for conversation events
  onConversationCreated(handler: (data: any) => void): void {
    this.on('conversation:created', (event) => handler(event.data));
  }

  onConversationUpdated(handler: (data: any) => void): void {
    this.on('conversation:updated', (event) => handler(event.data));
  }

  onConversationDeleted(handler: (data: any) => void): void {
    this.on('conversation:deleted', (event) => handler(event.data));
  }

  onAllConversationsDeleted(handler: (data: any) => void): void {
    this.on('conversation:all_deleted', (event) => handler(event.data));
  }

  onMessageAdded(handler: (data: any) => void): void {
    this.on('conversation:message_added', (event) => handler(event.data));
  }

  isConnected(): boolean {
    return this.connectionState;
  }

  getConnectionState(): string {
    if (this.isConnecting) return 'connecting';
    if (this.connectionState) return 'connected';
    return 'disconnected';
  }
}

// Export singleton instance
export const sseService = new SSEService();
export default sseService;