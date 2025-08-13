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
  parameters: Record<string, unknown>;
  result?: unknown;
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
  variant?: 'default' | 'streaming' | 'error' | 'tool' | 'search-results' | 'invisible-user';
  metadata?: MessageMetadata;
  attachments?: MessageAttachment[];
  
  // Friend messaging fields
  messageId?: string; // Backend message ID for friend messages
  fromMe?: boolean; // True if message was sent by current user
  from?: string; // Username of sender (for friend messages)
  readAt?: string; // When message was read
  deliveredAt?: string; // When message was delivered
  status?: 'sent' | 'delivered' | 'read'; // Message status for UI
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
