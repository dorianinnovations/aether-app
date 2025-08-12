/**
 * Floating Button Container - Dynamic floating button management
 * Intelligently positions floating buttons to avoid overlaps
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { spacing } from '../../tokens/spacing';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Floating button positions
export type FloatingPosition = 
  | 'bottom-right'
  | 'bottom-left' 
  | 'top-right'
  | 'top-left'
  | 'center-right'
  | 'center-left';

export interface FloatingButton {
  id: string;
  component: React.ReactNode;
  position: FloatingPosition;
  priority: number; // Higher priority gets preferred position
  offset?: { x?: number; y?: number };
  size?: { width: number; height: number };
}

interface FloatingButtonContextType {
  registerButton: (button: FloatingButton) => void;
  unregisterButton: (id: string) => void;
  updateButton: (id: string, updates: Partial<FloatingButton>) => void;
  getAvailablePosition: (preferredPosition: FloatingPosition, size: { width: number; height: number }) => { x: number; y: number };
}

const FloatingButtonContext = createContext<FloatingButtonContextType | null>(null);

export const useFloatingButtons = () => {
  const context = useContext(FloatingButtonContext);
  if (!context) {
    throw new Error('useFloatingButtons must be used within FloatingButtonProvider');
  }
  return context;
};

interface FloatingButtonProviderProps {
  children: React.ReactNode;
}

export const FloatingButtonProvider: React.FC<FloatingButtonProviderProps> = ({ children }) => {
  const [buttons, setButtons] = useState<Map<string, FloatingButton>>(new Map());

  const registerButton = useCallback((button: FloatingButton) => {
    setButtons(prev => new Map(prev).set(button.id, button));
  }, []);

  const unregisterButton = useCallback((id: string) => {
    setButtons(prev => {
      const newButtons = new Map(prev);
      newButtons.delete(id);
      return newButtons;
    });
  }, []);

  const updateButton = useCallback((id: string, updates: Partial<FloatingButton>) => {
    setButtons(prev => {
      const newButtons = new Map(prev);
      const existing = newButtons.get(id);
      if (existing) {
        newButtons.set(id, { ...existing, ...updates });
      }
      return newButtons;
    });
  }, []);

  const getPositionCoordinates = (position: FloatingPosition, size: { width: number; height: number }) => {
    const margin = spacing[4];
    
    switch (position) {
      case 'bottom-right':
        return { x: screenWidth - size.width - margin, y: screenHeight - size.height - 120 };
      case 'bottom-left':
        return { x: margin, y: screenHeight - size.height - 120 };
      case 'top-right':
        return { x: screenWidth - size.width - margin, y: 100 };
      case 'top-left':
        return { x: margin, y: 100 };
      case 'center-right':
        return { x: screenWidth - size.width - margin, y: screenHeight / 2 - size.height / 2 };
      case 'center-left':
        return { x: margin, y: screenHeight / 2 - size.height / 2 };
      default:
        return { x: screenWidth - size.width - margin, y: screenHeight - size.height - 120 };
    }
  };

  const getAvailablePosition = useCallback((preferredPosition: FloatingPosition, size: { width: number; height: number }) => {
    const baseCoords = getPositionCoordinates(preferredPosition, size);
    
    // Check for overlaps with existing buttons
    const existingButtons = Array.from(buttons.values());
    let finalCoords = baseCoords;
    
    for (const existing of existingButtons) {
      const existingSize = existing.size || { width: 48, height: 48 };
      const existingCoords = getPositionCoordinates(existing.position, existingSize);
      
      // Apply offsets
      if (existing.offset) {
        existingCoords.x += existing.offset.x || 0;
        existingCoords.y += existing.offset.y || 0;
      }
      
      // Check for overlap
      const overlap = !(
        finalCoords.x + size.width < existingCoords.x ||
        existingCoords.x + existingSize.width < finalCoords.x ||
        finalCoords.y + size.height < existingCoords.y ||
        existingCoords.y + existingSize.height < finalCoords.y
      );
      
      if (overlap) {
        // Adjust position to avoid overlap
        if (preferredPosition.includes('right')) {
          finalCoords.x = existingCoords.x - size.width - spacing[2];
        } else if (preferredPosition.includes('left')) {
          finalCoords.x = existingCoords.x + existingSize.width + spacing[2];
        }
        
        if (preferredPosition.includes('bottom')) {
          finalCoords.y = existingCoords.y - size.height - spacing[2];
        } else if (preferredPosition.includes('top')) {
          finalCoords.y = existingCoords.y + existingSize.height + spacing[2];
        }
      }
    }
    
    return finalCoords;
  }, [buttons]);

  const contextValue: FloatingButtonContextType = {
    registerButton,
    unregisterButton,
    updateButton,
    getAvailablePosition,
  };

  // Sort buttons by priority (higher priority first)
  const sortedButtons = Array.from(buttons.values()).sort((a, b) => b.priority - a.priority);

  return (
    <FloatingButtonContext.Provider value={contextValue}>
      {children}
      
      {/* Render floating buttons */}
      <View style={styles.floatingContainer} pointerEvents="box-none">
        {sortedButtons.map((button) => {
          const size = button.size || { width: 48, height: 48 };
          const position = getAvailablePosition(button.position, size);
          const finalPosition = {
            x: position.x + (button.offset?.x || 0),
            y: position.y + (button.offset?.y || 0),
          };

          return (
            <View
              key={button.id}
              style={[
                styles.floatingButton,
                {
                  left: finalPosition.x,
                  top: finalPosition.y,
                  width: size.width,
                  height: size.height,
                },
              ]}
              pointerEvents="box-none"
            >
              {button.component}
            </View>
          );
        })}
      </View>
    </FloatingButtonContext.Provider>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  floatingButton: {
    position: 'absolute',
    zIndex: 1001,
  },
});

export default FloatingButtonProvider;