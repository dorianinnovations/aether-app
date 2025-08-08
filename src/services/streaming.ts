/**
 * Fresh Streaming Service - React Native compatible 
 * Backend sends: data: {"content":"text","tier":"core","cognitiveEngineActive":true}
 * Backend ends with: data: [DONE]
 */

import { TokenManager } from './api';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://aether-server-j5kh.onrender.com';

export class StreamingService {
  /**
   * React Native compatible streaming using XMLHttpRequest 
   */
  static async *streamChat(
    prompt: string,
    endpoint: string = '/social-chat',
    attachments?: any[],
    conversationId?: string
  ): AsyncGenerator<string, void, unknown> {
    
    // For photo attachments, fall back to non-streaming (as per backend)
    if (attachments && attachments.length > 0) {
      const { ChatAPI } = await import('./api');
      const response = await ChatAPI.sendMessage(prompt, false, attachments, conversationId);
      yield (response as any).content || '';
      return;
    }
    
    const token = await TokenManager.getToken();
    const url = `${API_BASE_URL}${endpoint}`;
    
    const chunks: (string | { metadata: any })[] = [];
    let completed = false;
    let buffer = '';
    let processedChunks = 0;
    
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept', 'text/event-stream');
    xhr.setRequestHeader('Cache-Control', 'no-cache');
    
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    
    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.LOADING || xhr.readyState === XMLHttpRequest.DONE) {
        const newData = xhr.responseText.slice(buffer.length);
        buffer = xhr.responseText;
        
        if (newData) {
          const lines = newData.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              
              if (data === '[DONE]') {
                completed = true;
                continue;
              }
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  chunks.push(parsed.content);
                } else if (parsed.metadata) {
                  // Handle tool results/metadata - store for later access
                  chunks.push({ metadata: parsed.metadata });
                }
              } catch (e) {
              }
            }
          }
        }
        
        if (xhr.readyState === XMLHttpRequest.DONE) {
          completed = true;
        }
      }
    };
    
    xhr.onerror = () => {
      completed = true;
    };
    
    xhr.ontimeout = () => {
      completed = true;
    };
    
    xhr.timeout = 120000;
    xhr.send(JSON.stringify({ 
      message: prompt, 
      stream: true,
      ...(conversationId && { conversationId })
    }));
    
    // Yield chunks as they arrive with small delay for better UX
    while (!completed || processedChunks < chunks.length) {
      if (processedChunks < chunks.length) {
        const chunk = chunks[processedChunks++];
        // Only yield string chunks, skip metadata objects
        if (typeof chunk === 'string') {
          yield chunk;
        }
        
        // Small delay between chunks for visible streaming effect
        await new Promise(resolve => setTimeout(resolve, 15));
      } else {
        // Wait for more chunks
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  }
}

export default StreamingService;