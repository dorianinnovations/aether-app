import { TokenManager } from './api';
import EventSource from 'react-native-sse';

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

  private eventSource: EventSource | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  async connect(): Promise<void> {
    if (this.isConnecting || this.connectionState) {
      return;
    }

    try {
      this.isConnecting = true;
      this.isManuallyDisconnected = false;

      const token = await TokenManager.getToken();
      if (!token) {
        this.isConnecting = false;
        return;
      }

      const baseURL = 'https://aether-server-j5kh.onrender.com';
      const eventSourceUrl = `${baseURL}/notifications/stream`;

      // Create EventSource connection
      this.eventSource = new EventSource(eventSourceUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      this.eventSource.addEventListener('open', () => {
        this.connectionState = true;
        this.isConnecting = false;
        console.log('🔗 SSE connection established');
      });

      this.eventSource.addEventListener('message', (event: any) => {
        try {
          const data = JSON.parse(event.data);
          this.handleEvent({
            type: data.type,
            data: data.data,
            timestamp: data.timestamp || new Date().toISOString(),
          });
        } catch (error) {
          console.warn('Failed to parse SSE event:', error);
        }
      });

      this.eventSource.addEventListener('error', (error: any) => {
        console.warn('SSE connection error:', error);
        this.connectionState = false;
        this.isConnecting = false;
        
        // Auto-reconnect unless manually disconnected
        if (!this.isManuallyDisconnected) {
          this.reconnectTimeout = setTimeout(() => {
            this.connect();
          }, 5000);
        }
      });

    } catch (error) {
      this.isConnecting = false;
      this.connectionState = false;
      console.error('SSE connection failed:', error);
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
      }
    });
  }

  disconnect(): void {
    this.isManuallyDisconnected = true;
    this.connectionState = false;
    this.isConnecting = false;
    
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
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

  // Spotify event handlers
  onSpotifyTrackChange(handler: (data: any) => void): void {
    this.on('spotify:track_change', (event) => handler(event.data));
  }

  onSpotifyStatusUpdate(handler: (data: any) => void): void {
    this.on('spotify:status_update', (event) => handler(event.data));
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