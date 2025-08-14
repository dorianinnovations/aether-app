/**
 * OpenRouter AI Service
 * Ultra-cheap AI calls for conversation title generation using Llama 3.1 8B
 */

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface TitleGenerationOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

class OpenRouterService {
  private readonly baseURL = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly defaultModel = 'meta-llama/llama-3.1-8b-instruct'; // ~$0.18/1M tokens
  
  /**
   * Generate a conversation title from the first user message
   */
  async generateConversationTitle(
    firstMessage: string,
    options: TitleGenerationOptions = {}
  ): Promise<string> {
    const {
      temperature = 0.3,
      maxTokens = 20,
      model = this.defaultModel
    } = options;

    try {
      // Don't generate titles for very short messages
      if (firstMessage.length < 10) {
        return this.createFallbackTitle(firstMessage);
      }

      const prompt = this.createTitlePrompt(firstMessage);
      
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://aether-app.com', // Optional: for OpenRouter analytics
          'X-Title': 'Aether-App-Title-Generation', // Optional: for OpenRouter analytics
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: maxTokens,
          temperature,
          stop: ['\n', '.', '!', '?'] // Stop at natural ending points
        })
      });

      if (!response.ok) {
        console.warn('OpenRouter API error:', response.status, response.statusText);
        return this.createFallbackTitle(firstMessage);
      }

      const data: OpenRouterResponse = await response.json();
      const generatedTitle = data.choices[0]?.message?.content?.trim();

      if (!generatedTitle) {
        return this.createFallbackTitle(firstMessage);
      }

      // Clean up the generated title
      const cleanTitle = this.cleanGeneratedTitle(generatedTitle);
      
      // Log usage for monitoring (optional)
      if (data.usage) {
      }

      return cleanTitle;

    } catch (error) {
      console.error('Error generating conversation title:', error);
      return this.createFallbackTitle(firstMessage);
    }
  }

  /**
   * Create an optimized prompt for title generation
   */
  private createTitlePrompt(message: string): string {
    // Truncate very long messages to keep costs down
    const truncatedMessage = message.length > 200 ? message.substring(0, 200) + '...' : message;
    
    return `Create a concise 2-5 word title for this conversation starter. No quotes, no punctuation at the end:

"${truncatedMessage}"

Title:`;
  }

  /**
   * Clean and validate generated titles
   */
  private cleanGeneratedTitle(title: string): string {
    // Remove quotes, extra punctuation, and normalize
    let cleaned = title
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/[.!?]+$/, '') // Remove trailing punctuation
      .trim();

    // Ensure reasonable length (2-40 characters)
    if (cleaned.length < 2) {
      return 'New Chat';
    }
    
    if (cleaned.length > 40) {
      cleaned = cleaned.substring(0, 37) + '...';
    }

    // Capitalize first letter
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  /**
   * Create fallback title from the original message
   */
  private createFallbackTitle(message: string): string {
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
  }

  /**
   * Batch generate titles for multiple conversations (cost-efficient)
   */
  async generateBatchTitles(messages: string[]): Promise<string[]> {
    // For batch processing, we could optimize further by combining multiple requests
    // For now, process individually but with Promise.all for concurrency
    const titlePromises = messages.map(message => 
      this.generateConversationTitle(message)
    );
    
    return Promise.all(titlePromises);
  }
}

export const openRouterService = new OpenRouterService();
export default openRouterService;