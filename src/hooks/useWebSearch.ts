/**
 * Custom hook for web search functionality
 * Handles web search state, results, and UI interactions
 */

import { useState, useCallback } from 'react';
import { WebSearchAPI, WebSearchResult, WebSearchResponse } from '../services/webSearchApi';

interface UseWebSearchReturn {
  searchResults: WebSearchResult[];
  isSearching: boolean;
  searchQuery: string;
  searchError: string | null;
  hasSearched: boolean;
  performSearch: (query: string, forceSearch?: boolean) => Promise<void>;
  clearSearch: () => void;
  shouldShowSearchIndicator: boolean;
}

export const useWebSearch = (): UseWebSearchReturn => {
  const [searchResults, setSearchResults] = useState<WebSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const performSearch = useCallback(async (query: string, forceSearch: boolean = false) => {
    if (!query.trim()) return;

    setIsSearching(true);
    setSearchQuery(query);
    setSearchError(null);
    setSearchResults([]);

    try {
      const response: WebSearchResponse = await WebSearchAPI.searchWeb(query, forceSearch);
      
      if (response.success) {
        setSearchResults(response.results);
        setHasSearched(true);
      } else {
        if (response.skipped) {
          // Search was skipped due to context filtering - this is normal
          setSearchError(null);
        } else {
          setSearchError(response.reason || 'Search failed');
        }
        setSearchResults([]);
      }
    } catch (error: any) {
      setSearchError(error.message || 'Search failed');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setSearchQuery('');
    setSearchError(null);
    setHasSearched(false);
    setIsSearching(false);
  }, []);

  const shouldShowSearchIndicator = isSearching || (hasSearched && searchResults.length > 0);

  return {
    searchResults,
    isSearching,
    searchQuery,
    searchError,
    hasSearched,
    performSearch,
    clearSearch,
    shouldShowSearchIndicator,
  };
};

export default useWebSearch;