/**
 * Web Search API Service
 * Handles web search requests with intelligent context filtering
 */

import { api } from './api';

export interface WebSearchResult {
  title: string;
  snippet: string;
  url: string;
  source?: string;
  position?: number;
  relevanceScore?: number;
}

export interface WebSearchResponse {
  success: boolean;
  query: string;
  results: WebSearchResult[];
  totalResults?: number;
  searchTime?: number;
  analysis?: string;
  skipped?: boolean;
  reason?: string;
}

export const WebSearchAPI = {
  /**
   * Perform web search through AI chat endpoint
   * Uses the existing chat infrastructure to trigger web search tool
   */
  async searchWeb(query: string, forceSearch: boolean = false): Promise<WebSearchResponse> {
    try {
      // Use the existing AI chat endpoint which has web search capabilities
      const response = await api.post('/ai/adaptive-chat', {
        message: forceSearch ? `[FORCE_SEARCH] ${query}` : query,
        tools: ['web_search'],
        stream: false
      });

      // Extract web search results from tool results
      const toolResults = response.data?.data?.toolResults || [];
      const webSearchResult = toolResults.find((tool: any) => 
        tool.tool === 'webSearchTool' || tool.tool === 'web_search'
      );

      if (!webSearchResult) {
        return {
          success: false,
          query,
          results: [],
          reason: 'Web search tool was not triggered'
        };
      }

      if (webSearchResult.data?.structure?.skipped) {
        return {
          success: false,
          query,
          results: [],
          skipped: true,
          reason: webSearchResult.data.structure.reason
        };
      }

      const structure = webSearchResult.data?.structure || {};
      
      return {
        success: webSearchResult.success,
        query: structure.query || query,
        results: structure.results || [],
        totalResults: structure.totalResults,
        searchTime: structure.searchTime,
        analysis: structure.analysis
      };

    } catch (error: any) {
      
      return {
        success: false,
        query,
        results: [],
        reason: error.message || 'Web search failed'
      };
    }
  },

  /**
   * Check if a query should trigger web search
   */
  shouldTriggerSearch(query: string): boolean {
    const searchTriggers = [
      /(?:search|find|look up|google|bing)\s+(?:for\s+)?(.+)/i,
      /(?:what'?s|latest|recent|current|news about|happening with)\s+(.+)/i,
      /(?:when|where|who|what|how|why)\s+(?:is|are|was|were|did|does|do)\s+(.+)/i,
      /(?:what is|define|meaning of|explain)\s+(.+)/i,
      /(?:statistics|data|numbers|facts about)\s+(.+)/i,
      /(?:compare|difference between|vs|versus)\s+(.+)/i
    ];

    const noSearchPatterns = [
      /^(?:hello|hi|hey|thanks|thank you|ok|okay|yes|no|maybe)$/i,
      /^(?:how are you|good morning|good afternoon|good evening)$/i,
      /^(?:i think|i feel|i believe|in my opinion).*$/i,
      /^(?:can you help|could you|would you|please).*(?:with|me).*$/i
    ];

    // Check if it should NOT trigger search
    for (const pattern of noSearchPatterns) {
      if (pattern.test(query.trim())) {
        return false;
      }
    }

    // Check if it should trigger search
    for (const pattern of searchTriggers) {
      if (pattern.test(query)) {
        return true;
      }
    }

    // Check for search keywords
    const searchKeywords = [
      'current', 'latest', 'recent', 'news', 'update', 'today', 'now',
      'price', 'cost', 'statistics', 'data', 'facts', 'compare', 'vs',
      'who is', 'what is', 'when did', 'where is', 'how to'
    ];

    return searchKeywords.some(keyword => 
      query.toLowerCase().includes(keyword)
    );
  }
};

export default WebSearchAPI;