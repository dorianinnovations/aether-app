/**
 * Chat API Endpoints - Unified /social-chat Implementation
 * Single source of truth for all chat functionality
 */

import { API_BASE_URL } from '../core/client';
import { TokenManager } from '../utils/storage';
import type { ChatResponse } from '../core/types';
import { logger } from '../../../utils/logger';
import { openRouterService } from '../../openRouterService';

export const ChatAPI = {
  // Non-streaming social chat for compatibility (when streaming isn't needed)
  async sendMessage(prompt: string, _stream: boolean = false, attachments?: Array<{ uri: string; type: string; name?: string; mimeType?: string }>, conversationId?: string): Promise<ChatResponse> {
    try {
      const token = await TokenManager.getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Convert local file URIs to base64 for backend processing
      let processedAttachments = attachments || [];
      if (attachments && attachments.length > 0) {
        processedAttachments = await Promise.all(attachments.map(async (attachment) => {
          if (attachment.uri && attachment.uri.startsWith('file://')) {
            try {
              const response = await fetch(attachment.uri);
              const blob = await response.blob();
              const reader = new FileReader();
              
              const base64 = await new Promise<string>((resolve, reject) => {
                reader.onloadend = () => {
                  const result = reader.result as string;
                  resolve(result);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
              return {
                ...attachment,
                uri: base64
              };
            } catch (error) {
              logger.error('❌ Failed to convert file to base64:', error);
              return attachment;
            }
          }
          return attachment;
        }));
      }

      const requestBody = {
        message: prompt,
        stream: false,
        attachments: processedAttachments,
        ...(conversationId && { conversationId })
      };

      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        if (response.status === 0 || !response.status) {
          throw new Error('Request took too long, please try your message once more');
        }
        throw new Error('Request took too long, please try your message once more');
      }

      const data = await response.json();
      
      // Normalize response format
      const chatResponse: ChatResponse = {
        success: data.success || true,
        status: data.status || 'success',
        data: {
          response: data.response || data.content || '',
          tier: data.tier || 'social',
          responseTime: data.responseTime || 0,
          toolResults: data.toolResults,
          conversationId: data.conversationId,
        },
        content: data.response || data.content || '',
        metadata: {
          model: data.model,
          usage: data.usage,
          thinking: data.thinking,
          toolResults: data.toolResults,
          conversationId: data.conversationId,
        }
      };
      
      return chatResponse;
    } catch (error: any) {
      logger.error('Social chat error:', error);
      if (error.message === 'Network request failed' || error.code === 'NETWORK_ERROR') {
        throw new Error('Request took too long, please try your message once more');
      }
      throw error;
    }
  },

  // Simple social chat for Aether Server - using original working implementation
  async socialChat(message: string, conversationId?: string): Promise<{ success: boolean; response: string; thinking?: string; model?: string; usage?: unknown }> {
    const { api } = await import('../core/client');
    const response = await api.post('/chat', { 
      message,
      ...(conversationId && { conversationId })
    });
    return response.data;
  },

  // Streaming social chat for real-time responses - React Native compatible with XMLHttpRequest  
  streamSocialChat(message: string, attachments?: Array<{ uri: string; type: string; name?: string; mimeType?: string }>, conversationId?: string): AsyncGenerator<string | { metadata: unknown }, void, unknown> {
    
    return (async function* () {
      try {
        const token = await TokenManager.getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        // Convert local file URIs to base64 for backend processing
        let processedAttachments = attachments || [];
        if (attachments && attachments.length > 0) {
          processedAttachments = await Promise.all(attachments.map(async (attachment) => {
            if (attachment.type === 'image' && attachment.uri && attachment.uri.startsWith('file://')) {
              try {
                const response = await fetch(attachment.uri);
                const blob = await response.blob();
                const reader = new FileReader();
                
                const base64 = await new Promise<string>((resolve, reject) => {
                  reader.onloadend = () => {
                    const result = reader.result as string;
                    resolve(result);
                  };
                  reader.onerror = reject;
                  reader.readAsDataURL(blob);
                });
                return {
                  ...attachment,
                  uri: base64
                };
              } catch (error) {
                logger.error('❌ Failed to convert file to base64:', error);
                return attachment; // Return original if conversion fails
              }
            }
            return attachment;
          }));
        }

        // Use Promise to handle XMLHttpRequest with async generator
        const chunks = await new Promise<Array<string | { metadata: unknown }>>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          let lastProcessedLength = 0;
          let buffer = '';
          const allChunks: Array<string | { metadata: unknown }> = [];

          xhr.open('POST', `${API_BASE_URL}/chat`, true);
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);

          xhr.onreadystatechange = function() {
            if (xhr.readyState === 3 || xhr.readyState === 4) { // LOADING or DONE
              if (xhr.status === 200) {
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
                        resolve(allChunks);
                        return;
                      }

                      try {
                        const parsed = JSON.parse(data);
                        
                        // Handle content chunks
                        if (parsed.content) {
                          allChunks.push(parsed.content);
                        }
                        
                        // Handle metadata (tool results, search results, conversationId, etc.)
                        if (parsed.metadata || parsed.toolResults || parsed.sources || parsed.searchResults || parsed.conversationId) {
                          const metadata = {
                            ...parsed.metadata,
                            ...(parsed.toolResults && { toolResults: parsed.toolResults }),
                            ...(parsed.sources && { sources: parsed.sources }),
                            ...(parsed.searchResults && { searchResults: parsed.searchResults }),
                            ...(parsed.query && { query: parsed.query }),
                            ...(parsed.thinking && { thinking: parsed.thinking }),
                            ...(parsed.conversationId && { conversationId: parsed.conversationId }),
                          };
                          allChunks.push({ metadata });
                        }
                        
                      } catch (parseError) {
                        logger.debug('Failed to parse streaming data:', parseError, 'Data:', data);
                        // Skip invalid JSON but continue processing
                        continue;
                      }
                    }
                  }
                }

                if (xhr.readyState === 4) {
                  resolve(allChunks);
                }
              } else if (xhr.readyState === 4) {
                if (xhr.status === 0) {
                  reject(new Error('Request took too long, please try your message once more'));
                } else {
                  reject(new Error('Request took too long, please try your message once more'));
                }
              }
            }
          };

          xhr.onerror = () => reject(new Error('Request took too long, please try your message once more'));
          xhr.ontimeout = () => reject(new Error('Request took too long, please try your message once more'));
          xhr.timeout = 120000;
          const requestBody = { 
            message: message, 
            stream: true,
            attachments: processedAttachments,
            ...(conversationId && { conversationId })
          };
          
          xhr.send(JSON.stringify(requestBody));
        });

        // Yield chunks with minimal delay for faster streaming
        for (const chunk of chunks) {
          yield chunk;
          await new Promise(resolve => setTimeout(resolve, 10)); // Reduced delay for faster streaming
        }

      } catch (error) {
        logger.error('Streaming social chat error:', error);
        throw error;
      }
    })();
  },

  // Main streaming method - unified interface for all streaming needs
  streamMessage(message: string, attachments?: Array<{ uri: string; type: string; name?: string; mimeType?: string }>, conversationId?: string): AsyncGenerator<string | { metadata: unknown }, void, unknown> {
    return this.streamSocialChat(message, attachments, conversationId);
  },

  // StreamEngine compatibility - word-based streaming via StreamEngine
  async *streamMessageWords(prompt: string, attachments?: Array<{ uri: string; type: string; name?: string; mimeType?: string }>, conversationId?: string): AsyncGenerator<string | { text: string; metadata?: unknown }, void, unknown> {
    const { StreamEngine } = await import('../../StreamEngine');
    yield* StreamEngine.streamChat(prompt, '/social-chat', attachments, conversationId);
  },

  // AI-powered conversation title generation
  async generateConversationTitle(firstMessage: string): Promise<string> {
    try {
      // Generate title using OpenRouter's cheap AI
      const title = await openRouterService.generateConversationTitle(firstMessage);
      logger.debug('Generated conversation title:', title);
      return title;
    } catch (error) {
      logger.error('Failed to generate conversation title:', error);
      // Fallback to local title generation
      return this.createFallbackTitle(firstMessage);
    }
  },

  // Local fallback title generation
  createFallbackTitle(message: string): string {
    if (message.length <= 40) {
      return message.charAt(0).toUpperCase() + message.slice(1);
    }
    
    // Take first few words up to 40 characters
    const words = message.split(' ');
    let title = '';
    
    for (const word of words) {
      if ((title + ' ' + word).length > 37) break;
      title += (title ? ' ' : '') + word;
    }
    
    return title + '...';
  },

  // Update conversation title on the backend
  async updateConversationTitle(conversationId: string, title: string): Promise<boolean> {
    try {
      const { api } = await import('../core/client');
      const response = await api.put(`/conversations/${conversationId}/title`, { title });
      return response.data.success;
    } catch (error) {
      logger.error('Failed to update conversation title:', error);
      return false;
    }
  },

  // Generate conversation title using backend AI service
  async generateConversationTitleOnServer(conversationId: string, firstMessage: string): Promise<string | null> {
    try {
      const { api } = await import('../core/client');
      const response = await api.post(`/conversations/${conversationId}/generate-title`, { 
        firstMessage 
      });
      
      if (response.data.success) {
        logger.debug('Server generated title:', response.data.data.title);
        return response.data.data.title;
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to generate title on server:', error);
      return null;
    }
  },
};