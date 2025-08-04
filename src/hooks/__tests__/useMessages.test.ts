/**
 * Tests for Web Search Result Processing - Delayed Display Logic
 */

// Mock setTimeout to control timing in tests
jest.useFakeTimers();

describe('Web Search Result Processing', () => {
  // Simulate the delayed search results logic
  function simulateDelayedSearchResults(messageMetadata: any, setMessages: any) {
    // First, complete the main response without web search
    setMessages((prev: any) => prev.map((msg: any) => 
      msg.variant === 'streaming' 
        ? { ...msg, variant: 'default' }
        : msg
    ));

    // If there are web search results, show them after delay
    if (messageMetadata?.toolResults?.some((tool: any) => tool.tool === 'webSearchTool')) {
      setTimeout(() => {
        const searchResultsMessage = {
          id: 'search-results-' + Date.now(),
          sender: 'aether',
          message: '',
          timestamp: new Date().toISOString(),
          variant: 'search-results',
          metadata: {
            toolCalls: messageMetadata.toolResults.map((toolResult: any, index: number) => ({
              id: `tool-${index}-${Date.now()}`,
              name: toolResult.tool,
              parameters: { query: toolResult.query },
              result: toolResult.data,
              status: toolResult.success ? 'completed' : 'failed'
            }))
          }
        };

        setMessages((prev: any) => [...prev, searchResultsMessage]);
      }, 800);
    }
  }

  it('should delay web search results after main response completes', () => {
    const mockSetMessages = jest.fn();
    
    // Mock streaming message
    const initialMessages = [
      { id: '1', sender: 'user', message: 'search for AI', variant: 'default' },
      { id: '2', sender: 'aether', message: 'AI is awesome!', variant: 'streaming' }
    ];
    
    mockSetMessages.mockImplementation((fn) => {
      const result = fn(initialMessages);
      return result;
    });

    // Mock web search metadata from logs
    const mockWebSearchMetadata = {
      toolResults: [
        {
          tool: 'webSearchTool',
          success: true,
          data: {
            structure: {
              query: 'search for AI',
              results: [
                {
                  title: 'AI in search',
                  snippet: 'Try a whole new way to search.',
                  link: 'https://search.google/ai-in-search/',
                  position: 1
                }
              ]
            }
          },
          query: 'search for AI'
        }
      ]
    };

    // Trigger the delayed search results logic
    simulateDelayedSearchResults(mockWebSearchMetadata, mockSetMessages);

    // First call should complete the streaming message
    expect(mockSetMessages).toHaveBeenCalledTimes(1);
    
    // Fast-forward the timer to trigger delayed search results
    jest.advanceTimersByTime(800);
    
    // Second call should add the search results message
    expect(mockSetMessages).toHaveBeenCalledTimes(2);
    
    // Verify the search results message structure
    const secondCall = mockSetMessages.mock.calls[1][0];
    const newMessages = secondCall([]);
    const searchMessage = newMessages[0];
    
    expect(searchMessage.variant).toBe('search-results');
    expect(searchMessage.sender).toBe('aether');
    expect(searchMessage.metadata.toolCalls).toHaveLength(1);
    expect(searchMessage.metadata.toolCalls[0].name).toBe('webSearchTool');
  });

  it('should not delay search results if no webSearchTool present', () => {
    const mockSetMessages = jest.fn();
    
    // Mock metadata without web search tools
    const mockMetadataWithoutSearch = {
      toolResults: [
        {
          tool: 'someOtherTool',
          success: true,
          data: { result: 'some data' },
          query: 'test'
        }
      ]
    };

    simulateDelayedSearchResults(mockMetadataWithoutSearch, mockSetMessages);

    // Should only call once to complete streaming, no delayed call
    expect(mockSetMessages).toHaveBeenCalledTimes(1);
    
    // Advance timers - should not trigger another call
    jest.advanceTimersByTime(1000);
    expect(mockSetMessages).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple web search tools in metadata', () => {
    const mockSetMessages = jest.fn();
    
    const mockMultipleSearchMetadata = {
      toolResults: [
        {
          tool: 'webSearchTool',
          success: true,
          data: { structure: { query: 'first search', results: [] } },
          query: 'first search'
        },
        {
          tool: 'webSearchTool',
          success: true,
          data: { structure: { query: 'second search', results: [] } },
          query: 'second search'
        }
      ]
    };

    simulateDelayedSearchResults(mockMultipleSearchMetadata, mockSetMessages);
    jest.advanceTimersByTime(800);

    // Should create a search results message with both tool calls
    const secondCall = mockSetMessages.mock.calls[1][0];
    const newMessages = secondCall([]);
    const searchMessage = newMessages[0];
    
    expect(searchMessage.metadata.toolCalls).toHaveLength(2);
    expect(searchMessage.metadata.toolCalls[0].name).toBe('webSearchTool');
    expect(searchMessage.metadata.toolCalls[1].name).toBe('webSearchTool');
  });

  it('should preserve failed web search tool status', () => {
    const mockSetMessages = jest.fn();
    
    const mockFailedSearchMetadata = {
      toolResults: [
        {
          tool: 'webSearchTool',
          success: false,
          data: null,
          query: 'failed search'
        }
      ]
    };

    simulateDelayedSearchResults(mockFailedSearchMetadata, mockSetMessages);
    jest.advanceTimersByTime(800);

    const secondCall = mockSetMessages.mock.calls[1][0];
    const newMessages = secondCall([]);
    const searchMessage = newMessages[0];
    
    expect(searchMessage.metadata.toolCalls[0].status).toBe('failed');
    expect(searchMessage.metadata.toolCalls[0].result).toBeNull();
  });
});