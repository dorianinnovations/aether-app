/**
 * Chat and messaging type definitions
 * Types for messages, conversations, and chat interactions
 */

export interface MessageAttachment {
  id: string;
  type: 'image' | 'document';
  name: string;
  uri: string;
  size: number;
  width?: number;
  height?: number;
  uploadStatus?: 'pending' | 'uploaded' | 'error';
  mimeType?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  parameters: any;
  result?: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface MessageMetadata {
  toolUsed?: string;
  toolCalls?: ToolCall[];
  confidence?: number;
  processingTime?: number;
  searchResults?: boolean;
  query?: string;
  sources?: Array<{
    title: string;
    url: string;
    domain: string;
  }>;
}

export interface Message {
  id: string;
  sender: 'user' | 'aether' | 'system';
  message: string;
  timestamp: string;
  variant?: 'default' | 'streaming' | 'error' | 'tool' | 'search-results';
  metadata?: MessageMetadata;
  attachments?: MessageAttachment[];
}

export interface Conversation {
  _id: string;
  userId: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

// Conversation Analysis Types
export interface ConversationContext {
  previousMessages: string[];
  currentEmotion?: string;
  conversationLength: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
}

export interface PromptOption {
  id: string;
  text: string;
  category: 'casual' | 'deep' | 'playful' | 'supportive';
  context?: string;
}
