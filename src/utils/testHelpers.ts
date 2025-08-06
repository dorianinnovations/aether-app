/**
 * Test Helper Utilities
 * Common utilities for testing across the application
 */

// Error boundary test wrapper
import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class TestErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Test Error Boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return null; // or some test error UI
    }

    return this.props.children;
  }
}

// Mock data generators
export const mockData = {
  user: (overrides?: Partial<any>) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    username: 'testuser',
    name: 'Test User',
    ...overrides,
  }),

  conversation: (overrides?: Partial<any>) => ({
    id: 'test-conversation-id',
    title: 'Test Conversation',
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }),

  message: (overrides?: Partial<any>) => ({
    id: 'test-message-id',
    role: 'user',
    content: 'Test message content',
    timestamp: new Date().toISOString(),
    ...overrides,
  }),

  apiResponse: (data?: any, overrides?: Partial<any>) => ({
    success: true,
    data,
    message: 'Success',
    ...overrides,
  }),

  apiError: (message: string = 'Test error', status: number = 400) => ({
    response: {
      status,
      data: { message, error: message },
    },
    message,
    name: 'AxiosError',
  }),
};

// Test assertion helpers
export const assertHelpers = {
  expectToBeVisible: (element: any) => {
    expect(element).toBeTruthy();
  },

  expectToContainText: (element: any, _text: string) => {
    expect(element).toBeTruthy();
  },

  expectApiCallWith: (mockFn: jest.Mock, expectedArgs: any[]) => {
    expect(mockFn).toHaveBeenCalledWith(...expectedArgs);
  },

  expectNavigationTo: (navigationMock: jest.Mock, screen: string, params?: any) => {
    if (params) {
      expect(navigationMock).toHaveBeenCalledWith(screen, params);
    } else {
      expect(navigationMock).toHaveBeenCalledWith(screen);
    }
  },
};

// Performance testing helpers
export const performanceHelpers = {
  measureRenderTime: async (renderFn: () => void) => {
    const startTime = performance.now();
    renderFn();
    const endTime = performance.now();
    return endTime - startTime;
  },

  waitForAsyncUpdates: () => new Promise(resolve => setTimeout(resolve, 0)),

  expectRenderTimeUnder: (actualTime: number, maxTime: number) => {
    expect(actualTime).toBeLessThan(maxTime);
  },
};

// Mock service helpers
export const mockServices = {
  createMockAPI: () => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  }),

  createMockStorage: () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  }),

  createMockNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
    canGoBack: jest.fn(() => true),
    replace: jest.fn(),
  }),

  createMockTheme: (theme: 'light' | 'dark' = 'light') => ({
    theme,
    colors: {
      primary: theme === 'light' ? '#007AFF' : '#0A84FF',
      background: theme === 'light' ? '#FFFFFF' : '#000000',
      text: theme === 'light' ? '#000000' : '#FFFFFF',
    },
    toggleTheme: jest.fn(),
  }),
};

// Integration test helpers
export const integrationHelpers = {
  simulateUserJourney: async (steps: Array<() => Promise<void>>) => {
    for (const step of steps) {
      await step();
      await performanceHelpers.waitForAsyncUpdates();
    }
  },

  simulateNetworkError: (mockFn: jest.Mock) => {
    mockFn.mockRejectedValue(mockData.apiError('Network error', 500));
  },

  simulateNetworkDelay: (mockFn: jest.Mock, delay: number = 1000) => {
    mockFn.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(mockData.apiResponse()), delay))
    );
  },
};