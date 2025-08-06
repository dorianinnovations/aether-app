/**
 * useTheme Hook Tests
 * Tests for theme management hook
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useTheme } from '../useTheme';
import { mockServices } from '../../utils/testHelpers';

// Mock AsyncStorage
const mockStorage = mockServices.createMockStorage();
jest.mock('@react-native-async-storage/async-storage', () => mockStorage);

describe('useTheme Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.getItem.mockResolvedValue(null);
  });

  describe('Initialization', () => {
    it('should initialize with default theme', async () => {
      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('light');
      expect(result.current.colors).toBeDefined();
      expect(typeof result.current.toggleTheme).toBe('function');
    });

    it('should load saved theme from storage', async () => {
      mockStorage.getItem.mockResolvedValue('dark');

      const { result } = renderHook(() => useTheme());
      
      await waitFor(() => {
        expect(result.current.theme).toBe('dark');
      });

      expect(mockStorage.getItem).toHaveBeenCalledWith('@aether_theme');
    });
  });

  describe('Theme Toggle', () => {
    it('should toggle from light to dark theme', async () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('dark');
      expect(mockStorage.setItem).toHaveBeenCalledWith('@aether_theme', 'dark');
    });

    it('should toggle from dark to light theme', async () => {
      mockStorage.getItem.mockResolvedValue('dark');

      const { result } = renderHook(() => useTheme());
      
      await waitFor(() => {
        expect(result.current.theme).toBe('dark');
      });

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('light');
      expect(mockStorage.setItem).toHaveBeenCalledWith('@aether_theme', 'light');
    });
  });

  describe('Color Values', () => {
    it('should provide correct colors for light theme', () => {
      const { result } = renderHook(() => useTheme());

      expect(result.current.colors.background).toBe('#FFFFFF');
      expect(result.current.colors.text).toBe('#000000');
      expect(result.current.colors.primary).toBeDefined();
    });

    it('should provide correct colors for dark theme', async () => {
      mockStorage.getItem.mockResolvedValue('dark');

      const { result } = renderHook(() => useTheme());
      
      await waitFor(() => {
        expect(result.current.theme).toBe('dark');
      });

      expect(result.current.colors.background).toBe('#000000');
      expect(result.current.colors.text).toBe('#FFFFFF');
      expect(result.current.colors.primary).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      mockStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const { result } = renderHook(() => useTheme());

      // Should fall back to default theme
      expect(result.current.theme).toBe('light');
    });

    it('should handle storage save errors', async () => {
      mockStorage.setItem.mockRejectedValue(new Error('Save error'));

      const { result } = renderHook(() => useTheme());

      // Should still update theme state even if storage fails
      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('dark');
    });
  });

  describe('Performance', () => {
    it('should not cause unnecessary re-renders', () => {
      const { result, rerender } = renderHook(() => useTheme());

      const initialColors = result.current.colors;
      const initialToggle = result.current.toggleTheme;

      rerender({});

      // Objects should be referentially equal for performance
      expect(result.current.colors).toBe(initialColors);
      expect(result.current.toggleTheme).toBe(initialToggle);
    });
  });
});