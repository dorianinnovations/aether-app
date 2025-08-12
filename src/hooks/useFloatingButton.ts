/**
 * Hook for managing individual floating buttons
 */

import { useEffect, useCallback } from 'react';
import { useFloatingButtons, FloatingButton, FloatingPosition } from '../design-system/components/organisms/FloatingButtonContainer';

interface UseFloatingButtonOptions {
  id: string;
  component: React.ReactNode;
  position?: FloatingPosition;
  priority?: number;
  offset?: { x?: number; y?: number };
  size?: { width: number; height: number };
  enabled?: boolean;
}

export const useFloatingButton = ({
  id,
  component,
  position = 'bottom-right',
  priority = 0,
  offset,
  size,
  enabled = true,
}: UseFloatingButtonOptions) => {
  const { registerButton, unregisterButton, updateButton } = useFloatingButtons();

  useEffect(() => {
    if (enabled) {
      const button: FloatingButton = {
        id,
        component,
        position,
        priority,
        offset,
        size,
      };
      registerButton(button);
    } else {
      unregisterButton(id);
    }

    return () => {
      unregisterButton(id);
    };
  }, [id, component, position, priority, offset, size, enabled, registerButton, unregisterButton]);

  const updatePosition = useCallback((newPosition: FloatingPosition) => {
    updateButton(id, { position: newPosition });
  }, [id, updateButton]);

  const updatePriority = useCallback((newPriority: number) => {
    updateButton(id, { priority: newPriority });
  }, [id, updateButton]);

  const updateOffset = useCallback((newOffset: { x?: number; y?: number }) => {
    updateButton(id, { offset: newOffset });
  }, [id, updateButton]);

  return {
    updatePosition,
    updatePriority,
    updateOffset,
  };
};

export default useFloatingButton;