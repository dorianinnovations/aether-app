/**
 * Real-time Updates Hook
 * Server-Sent Events integration for live social feed updates
 */

import { useState, useEffect, useCallback } from 'react';
import type { Post } from '../types';

export interface UseRealTimeUpdatesProps {
  onPostAdded: (post: Post) => void;
  onPostUpdated: (postId: string, updates: Partial<Post>) => void;
  onPostRemoved: (postId: string) => void;
  enabled?: boolean;
}

export interface UseRealTimeUpdatesReturn {
  connected: boolean;
  lastUpdate: Date | null;
  connect: () => void;
  disconnect: () => void;
}

export const useRealTimeUpdates = ({
  onPostAdded,
  onPostUpdated,
  onPostRemoved,
  enabled = true,
}: UseRealTimeUpdatesProps): UseRealTimeUpdatesReturn => {
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  const connect = useCallback(() => {
    if (!enabled || connected) return;

    try {
      // Replace with actual SSE endpoint
      const source = new EventSource('/api/social/events');
      
      source.onopen = () => {
        setConnected(true);
        console.log('Social SSE connected');
      };

      source.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastUpdate(new Date());

          switch (data.type) {
            case 'post_added':
              onPostAdded(data.post);
              break;
            case 'post_updated':
              onPostUpdated(data.postId, data.updates);
              break;
            case 'post_removed':
              onPostRemoved(data.postId);
              break;
            default:
              console.log('Unknown SSE event type:', data.type);
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      source.onerror = (error) => {
        console.error('Social SSE error:', error);
        setConnected(false);
        
        // Attempt reconnection after 5 seconds
        setTimeout(() => {
          if (enabled) {
            connect();
          }
        }, 5000);
      };

      setEventSource(source);
    } catch (error) {
      console.error('Failed to establish SSE connection:', error);
    }
  }, [enabled, connected, onPostAdded, onPostUpdated, onPostRemoved]);

  const disconnect = useCallback(() => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
      setConnected(false);
      console.log('Social SSE disconnected');
    }
  }, [eventSource]);

  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  // Simulate real-time updates for demo purposes
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      // Simulate random updates
      const randomAction = Math.random();
      
      if (randomAction < 0.3) {
        // Simulate like update
        const postId = `post-${Math.floor(Math.random() * 20) + 1}`;
        const likes = Math.floor(Math.random() * 100);
        onPostUpdated(postId, { likes });
        setLastUpdate(new Date());
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [enabled, onPostUpdated]);

  return {
    connected,
    lastUpdate,
    connect,
    disconnect,
  };
};
