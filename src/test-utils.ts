import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { ThemeProvider } from './contexts/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';

// Mock API utilities
export const mockAPI = {
  auth: {
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    refreshToken: jest.fn(),
    login: jest.fn(),
    signup: jest.fn(),
  },
  chat: {
    sendMessage: jest.fn(),
    getConversations: jest.fn(),
    deleteConversation: jest.fn(),
  },
  metrics: {
    track: jest.fn(),
    getInsights: jest.fn(),
  },
  loginSuccess: jest.fn(),
  loginError: jest.fn(),
  signupSuccess: jest.fn(),
  signupError: jest.fn(),
  reset: jest.fn(),
};

// Mock metrics utilities
export const metricsUtils = {
  track: jest.fn(),
  measure: jest.fn((name: string, fn: () => any) => fn()),
  increment: jest.fn(),
  gauge: jest.fn(),
  histogram: jest.fn(),
  trackUserJourneyStep: jest.fn(),
  getTrackedMetrics: jest.fn(() => []),
  clearMetrics: jest.fn(),
  validateUserJourney: jest.fn(),
};

// User journey helpers for testing
export const userJourneyHelpers = {
  signIn: async (email: string, password: string) => {
    return { success: true, user: { email } };
  },
  signUp: async (email: string, password: string, username: string) => {
    return { success: true, user: { email, username } };
  },
  sendMessage: async (message: string) => {
    return { success: true, messageId: 'test-id' };
  },
  completeSignInFlow: jest.fn(),
  completeSignUpFlow: jest.fn(),
};

// General test utilities
export const testUtils = {
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  waitForAnimations: jest.fn((duration?: number) => Promise.resolve()),
  createMockNavigation: jest.fn(() => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
    canGoBack: jest.fn(() => true),
    replace: jest.fn(),
  })),
  createMockRoute: jest.fn(() => ({
    params: {},
    name: 'TestScreen',
  })),
  mockAsyncStorage: () => {
    const storage: { [key: string]: string } = {};
    return {
      getItem: jest.fn((key: string) => Promise.resolve(storage[key] || null)),
      setItem: jest.fn((key: string, value: string) => {
        storage[key] = value;
        return Promise.resolve();
      }),
      removeItem: jest.fn((key: string) => {
        delete storage[key];
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        Object.keys(storage).forEach(key => delete storage[key]);
        return Promise.resolve();
      }),
    };
  },
};

// Custom render function with providers
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return React.createElement(ThemeProvider, null,
    React.createElement(SettingsProvider, null, children)
  );
};

const customRender = (ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react-native';
export { customRender as render };