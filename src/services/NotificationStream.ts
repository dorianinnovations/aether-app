/**
 * Notification Stream Service
 * Manages Server-Sent Events (SSE) connection for real-time notifications
 */

import { TokenManager } from './api';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://aether-server-j5kh.onrender.com';

export interface NotificationEvent {
  type: 'message';
  data: any;
  timestamp: string;
}

export interface NotificationStreamOptions {
  onMessage?: (event: NotificationEvent) => void;
  onError?: (error: Error) => void;
  onOpen?: () => void;
  onClose?: () => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

class NotificationStreamService {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private options: NotificationStreamOptions = {};
  private isConnecting = false;

  /**
   * Connect to the notification stream
   */
  async connect(options: NotificationStreamOptions = {}): Promise<void> {
    this.options = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      ...options,
    };

    // Prevent multiple simultaneous connections
    if (this.isConnecting || this.eventSource) {
      return;
    }

    this.isConnecting = true;

    try {
      const token = await TokenManager.getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Note: React Native doesn't support EventSource natively
      // We'll use XMLHttpRequest for SSE streaming similar to chat streaming
      this.createSSEConnection(token);

    } catch (error) {
      this.isConnecting = false;
      this.options.onError?.(error as Error);
      this.scheduleReconnect();
    }
  }

  /**
   * Create SSE connection using XMLHttpRequest for React Native compatibility
   */
  private createSSEConnection(token: string): void {
    const xhr = new XMLHttpRequest();
    let lastProcessedLength = 0;
    let buffer = '';

    xhr.open('GET', `${API_BASE_URL}/notifications/stream`, true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('Accept', 'text/event-stream');

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 3 || xhr.readyState === 4) { // LOADING or DONE
        if (xhr.status === 200) {
          // Connection established
          if (this.isConnecting) {
            this.isConnecting = false;
            this.reconnectAttempts = 0;
            this.options.onOpen?.();
          }

          // Process new data
          const newData = xhr.responseText.slice(lastProcessedLength);
          lastProcessedLength = xhr.responseText.length;

          if (newData) {
            buffer += newData;
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmedLine = line.trim();
              if (!trimmedLine) continue;

              if (trimmedLine.startsWith('data: ')) {
                const data = trimmedLine.slice(6).trim();
                
                if (data === '[DONE]') {
                  this.handleDisconnect();
                  return;
                }

                try {
                  const event: NotificationEvent = JSON.parse(data);
                  this.options.onMessage?.(event);
                } catch (e) {
                }
              }
            }
          }

          // Handle connection close
          if (xhr.readyState === 4) {
            this.handleDisconnect();
          }
        } else if (xhr.readyState === 4) {
          // Connection failed
          this.isConnecting = false;
          this.options.onError?.(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
          this.handleDisconnect();
        }
      }
    };

    xhr.onerror = () => {
      this.isConnecting = false;
      this.options.onError?.(new Error('Network error'));
      this.handleDisconnect();
    };

    xhr.ontimeout = () => {
      this.isConnecting = false;
      this.options.onError?.(new Error('Request timeout'));
      this.handleDisconnect();
    };

    // No timeout for SSE - it's a long-running connection
    xhr.timeout = 0;

    // Store the XMLHttpRequest as our "eventSource" for disconnection
    this.eventSource = xhr as any;

    // Send the request
    xhr.send();
  }

  /**
   * Handle disconnection and potential reconnection
   */
  private handleDisconnect(): void {
    this.disconnect();
    this.options.onClose?.();
    this.scheduleReconnect();
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(): void {
    if (!this.options.reconnectInterval || 
        this.reconnectAttempts >= (this.options.maxReconnectAttempts || 10)) {
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectAttempts++;
    const delay = this.options.reconnectInterval * Math.min(this.reconnectAttempts, 5);
    
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect(this.options);
    }, delay);
  }

  /**
   * Disconnect from the notification stream
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.eventSource) {
      try {
        // If it's an XMLHttpRequest, abort it
        if ('abort' in this.eventSource) {
          (this.eventSource as any).abort();
        }
        // If it's an EventSource, close it
        if ('close' in this.eventSource) {
          this.eventSource.close();
        }
      } catch (error) {
      }
      this.eventSource = null;
    }

    this.isConnecting = false;
  }

  /**
   * Reset reconnection attempts
   */
  resetReconnectAttempts(): void {
    this.reconnectAttempts = 0;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.eventSource !== null && !this.isConnecting;
  }
}

// Export singleton instance
export const NotificationStream = new NotificationStreamService();

// Export for testing and advanced usage
export { NotificationStreamService };

/**
 * Usage Example:
 * 
 * import { NotificationStream } from './services/NotificationStream';
 * 
 * // Connect to notifications
 * NotificationStream.connect({
 *   onMessage: (event) => {
 *     console.log('Notification:', event);
 *     // Handle friend message notifications
 *     if (event.type === 'message') {
 *       // Handle friend message
 *     }
 *   },
 *   onError: (error) => {
 *     console.error('Notification error:', error);
 *   },
 *   onOpen: () => {
 *     console.log('Connected to notifications');
 *   },
 *   onClose: () => {
 *     console.log('Disconnected from notifications');
 *   },
 * });
 * 
 * // Disconnect when done
 * NotificationStream.disconnect();
 */