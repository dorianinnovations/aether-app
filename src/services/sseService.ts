import { TokenManager } from './api';

export interface SSEEvent {
  type: string;
  data: any;
  timestamp: string;
}

export type SSEEventHandler = (event: SSEEvent) => void;

class SSEService {
  private abortController: AbortController | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private eventHandlers: Map<string, SSEEventHandler[]> = new Map();
  private isConnecting = false;
  private isManuallyDisconnected = false;
  private readyState = 0; // 0: CONNECTING, 1: OPEN, 2: CLOSED

  async connect(): Promise<void> {
    if (this.abortController || this.isConnecting) {
      return;
    }

    try {
      this.isConnecting = true;
      this.isManuallyDisconnected = false;
      this.readyState = 0; // CONNECTING

      const token = await TokenManager.getToken();
      if (!token) {
        console.error('SSE: No auth token available');
        return;
      }

      const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://aether-server-j5kh.onrender.com';
      const url = `${baseUrl}/events/stream`;

      // Create URL with auth token as query parameter
      const urlWithAuth = `${url}?token=${encodeURIComponent(token)}`;

      // Use fetch with streaming instead of EventSource
      this.abortController = new AbortController();
      
      const response = await fetch(urlWithAuth, {
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`SSE request failed: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      this.readyState = 1; // OPEN
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.isConnecting = false;

      // Read the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (!this.isManuallyDisconnected) {
          const { done, value } = await reader.read();
          
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const dataStr = line.slice(6); // Remove 'data: '
                if (dataStr.trim() === '') continue;
                
                const data: SSEEvent = JSON.parse(dataStr);
                this.handleEvent(data);
              } catch (error) {
                console.error('SSE: Failed to parse event data:', error);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

    } catch (error) {
      console.error('SSE: Failed to connect:', error);
      this.isConnecting = false;
      this.readyState = 2; // CLOSED
      
      if (!this.isManuallyDisconnected) {
        this.handleReconnect();
      }
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

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('SSE: Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;

    setTimeout(() => {
      this.disconnect();
      this.connect();
    }, this.reconnectDelay);

    // Exponential backoff
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000); // Max 30 seconds
  }

  disconnect(): void {
    this.isManuallyDisconnected = true;
    
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    
    this.readyState = 2; // CLOSED
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
    return this.readyState === 1; // OPEN = 1
  }

  getConnectionState(): string {
    switch (this.readyState) {
      case 0: // CONNECTING
        return 'connecting';
      case 1: // OPEN
        return 'connected';
      case 2: // CLOSED
        return 'disconnected';
      default:
        return 'unknown';
    }
  }
}

// Export singleton instance
export const sseService = new SSEService();
export default sseService;