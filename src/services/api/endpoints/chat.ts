/**
 * Chat API Endpoints
 * AI chat functionality, streaming, and file attachments
 */

import { api, API_BASE_URL } from '../core/client';
import { TokenManager } from '../utils/storage';
import type { ChatResponse } from '../core/types';

export const ChatAPI = {
  // Legacy method kept for compatibility - but streaming is the only supported mode
  async sendMessage(prompt: string, stream: boolean = true, attachments?: any[]): Promise<ChatResponse> {
    // Note: This is only used for photo fallback in StreamEngine
    // All regular chat uses streaming via streamMessageWords
    
    if (attachments && attachments.length > 0) {
      const formData = new FormData();
      formData.append('message', prompt);
      formData.append('stream', 'false'); // Force non-streaming for attachments (required for vision)
      
      attachments.forEach((attachment, index) => {
        if (attachment.type === 'image') {
          const imageFile = {
            uri: attachment.uri,
            type: attachment.mimeType || 'image/jpeg',
            name: attachment.name || `image_${index}.jpg`,
          } as any;
          
          formData.append('files', imageFile);
        } else if (attachment.type === 'document') {
          const docFile = {
            uri: attachment.uri,
            type: attachment.mimeType || 'application/octet-stream',
            name: attachment.name || `document_${index}`,
          } as any;
          
          formData.append('files', docFile);
        }
      });
      
      const response = await api.post<ChatResponse>('/ai/adaptive-chat', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Normalize response format for photo responses
      if (response.data.success && response.data.data) {
        const chatResponse: ChatResponse = {
          ...response.data,
          success: response.data.success,
          status: response.data.status || 'success',
          data: {
            response: response.data.data.response,
            tier: response.data.data.tier,
            responseTime: response.data.data.responseTime,
            toolResults: response.data.data.toolResults
          },
          content: response.data.data.response,
          metadata: {
            toolResults: response.data.data.toolResults,
            tier: response.data.data.tier,
            responseTime: response.data.data.responseTime,
          }
        };
        return chatResponse;
      }
      
      // Handle different response formats from vision API
      let content = '';
      let metadata: any = {};
      
      // Check various possible response structures
      if (response.data.success && response.data.data && response.data.data.response) {
        content = response.data.data.response;
        metadata = response.data.data;
      } else if ((response.data as any).content) {
        content = (response.data as any).content;
        metadata = response.data;
      } else if ((response.data as any).response) {
        content = (response.data as any).response;
        metadata = response.data;
      } else if (response.data.data && (response.data.data as any).content) {
        content = (response.data.data as any).content;
        metadata = response.data.data;
      } else if (typeof response.data === 'string') {
        content = response.data;
      }
      
      if (content) {
        const chatResponse: ChatResponse = {
          success: true,
          status: 'success',
          data: {
            response: content,
            tier: (metadata as any)?.tier || 'vision',
            responseTime: (metadata as any)?.responseTime || 0,
            toolResults: (metadata as any)?.toolResults,
          },
          content: content,
          metadata: metadata
        };
        return chatResponse;
      }
      
      // If we still don't have content, log the full response for debugging
      console.error('Unable to extract content from vision API response:', response.data);
      return response.data;
    }
    
    throw new Error('Non-streaming text messages not supported. Use streamMessageWords instead.');
  },

  // Fresh streaming implementation (stable)
  async *streamMessage(prompt: string, endpoint: string = '/ai/adaptive-chat', attachments?: any[]): AsyncGenerator<string, void, unknown> {
    const { StreamingService } = await import('../../streaming');
    yield* StreamingService.streamChat(prompt, endpoint, attachments);
  },

  // StreamEngine - Proprietary word-based streaming
  async *streamMessageWords(prompt: string, endpoint: string = '/ai/adaptive-chat', attachments?: any[]): AsyncGenerator<string | { text: string; metadata?: any }, void, unknown> {
    const { StreamEngine } = await import('../../StreamEngine');
    yield* StreamEngine.streamChat(prompt, endpoint, attachments);
  },

  // Simple social chat for Aether Server
  async socialChat(message: string): Promise<{ success: boolean; response: string; thinking?: string; model?: string; usage?: any }> {
    const response = await api.post('/social-chat', { message });
    return response.data;
  },

  // Streaming social chat for real-time responses - React Native compatible with XMLHttpRequest  
  streamSocialChat(message: string, attachments?: any[]): AsyncGenerator<string, void, unknown> {
    const self = this;
    
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
                console.log('🔄 Converting local file to base64:', attachment.name);
                // Use fetch to read the local file and convert to base64
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
                
                console.log('✅ Successfully converted to base64, size:', base64.length);
                return {
                  ...attachment,
                  uri: base64
                };
              } catch (error) {
                console.error('❌ Failed to convert file to base64:', error);
                return attachment; // Return original if conversion fails
              }
            }
            return attachment;
          }));
        }

        // Use Promise to handle XMLHttpRequest with async generator
        const chunks = await new Promise<string[]>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          let lastProcessedLength = 0;
          let buffer = '';
          const allChunks: string[] = [];

          xhr.open('POST', `${API_BASE_URL}/social-chat`, true);
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
                        if (parsed.content) {
                          allChunks.push(parsed.content);
                        }
                      } catch (e) {
                        // Skip invalid JSON
                        continue;
                      }
                    }
                  }
                }

                if (xhr.readyState === 4) {
                  resolve(allChunks);
                }
              } else if (xhr.readyState === 4) {
                reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText || 'Request failed'}`));
              }
            }
          };

          xhr.onerror = () => reject(new Error('Network error occurred during streaming'));
          xhr.ontimeout = () => reject(new Error('Request timed out'));
          xhr.timeout = 30000;
          const requestBody = { 
            message, 
            stream: true,
            attachments: processedAttachments
          };
          
          xhr.send(JSON.stringify(requestBody));
        });

        // Yield chunks with minimal delay for faster streaming
        for (const chunk of chunks) {
          yield chunk;
          await new Promise(resolve => setTimeout(resolve, 10)); // Reduced delay for faster streaming
        }

      } catch (error) {
        console.error('Streaming social chat error:', error);
        throw error;
      }
    })();
  },
};