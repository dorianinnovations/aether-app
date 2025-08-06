/**
 * Error Boundary Component Tests
 * Tests for error handling and recovery
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { TestErrorBoundary } from '../../utils/testHelpers';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <Text testID="success">Success</Text>;
};

describe('Error Boundary', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('Error Handling', () => {
    it('should render children when no error occurs', () => {
      render(
        <TestErrorBoundary>
          <ThrowError shouldThrow={false} />
        </TestErrorBoundary>
      );

      expect(screen.getByTestId('success')).toBeTruthy();
    });

    it('should catch and handle errors from children', () => {
      render(
        <TestErrorBoundary>
          <ThrowError shouldThrow={true} />
        </TestErrorBoundary>
      );

      // Should not render the throwing component
      expect(screen.queryByTestId('success')).toBeNull();
      
      // Should have logged the error
      expect(consoleSpy).toHaveBeenCalledWith(
        'Test Error Boundary caught error:',
        expect.any(Error),
        expect.any(Object)
      );
    });

    it('should handle errors from nested components', () => {
      const NestedComponent = () => (
        <TestErrorBoundary>
          <Text>Outer component</Text>
          <ThrowError shouldThrow={true} />
        </TestErrorBoundary>
      );

      render(<NestedComponent />);

      // Should catch error from nested component
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('Error Recovery', () => {
    it('should reset error state when props change', () => {
      const { rerender } = render(
        <TestErrorBoundary>
          <ThrowError shouldThrow={true} />
        </TestErrorBoundary>
      );

      // Initially should catch error
      expect(screen.queryByTestId('success')).toBeNull();

      // Re-render with non-throwing component
      rerender(
        <TestErrorBoundary>
          <ThrowError shouldThrow={false} />
        </TestErrorBoundary>
      );

      // Should recover and render successfully
      expect(screen.getByTestId('success')).toBeTruthy();
    });
  });

  describe('Error Information', () => {
    it('should capture error details', () => {
      render(
        <TestErrorBoundary>
          <ThrowError shouldThrow={true} />
        </TestErrorBoundary>
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'Test Error Boundary caught error:',
        expect.objectContaining({
          message: 'Test error',
          name: 'Error'
        }),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      );
    });
  });

  describe('Multiple Errors', () => {
    it('should handle multiple errors in sequence', () => {
      const { rerender } = render(
        <TestErrorBoundary>
          <ThrowError shouldThrow={true} />
        </TestErrorBoundary>
      );

      expect(consoleSpy).toHaveBeenCalledTimes(1);

      // Re-render with another error
      rerender(
        <TestErrorBoundary>
          <ThrowError shouldThrow={true} />
        </TestErrorBoundary>
      );

      // Should handle the new error as well
      expect(consoleSpy).toHaveBeenCalledTimes(2);
    });
  });
});