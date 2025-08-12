/**
 * SwipeToMenu - Global swipe gesture handler for header menu access
 * Detects swipe from right edge to open header menu on any screen
 */

import React, { useRef } from 'react';
import { View, Dimensions } from 'react-native';
import { 
  PanGestureHandler, 
  State as GestureState,
  PanGestureHandlerStateChangeEvent
} from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const EDGE_THRESHOLD = 50; // Distance from right edge to detect swipe (increased)
const SWIPE_THRESHOLD = 30; // Minimum swipe distance to trigger menu (reduced)
const VELOCITY_THRESHOLD = 100; // Minimum velocity to trigger menu (reduced)

interface SwipeToMenuProps {
  children: React.ReactNode;
  onSwipeToMenu: () => void;
  disabled?: boolean;
}

export const SwipeToMenu: React.FC<SwipeToMenuProps> = ({
  children,
  onSwipeToMenu,
  disabled = false,
}) => {
  const panRef = useRef(null);

  const handlePanStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    if (disabled) return;

    const { state, translationX, velocityX, absoluteX } = event.nativeEvent;
    
    if (state === GestureState.END || state === GestureState.CANCELLED) {
      // Check if gesture started from right edge
      const startX = absoluteX - translationX;
      const isFromRightEdge = startX >= (SCREEN_WIDTH - EDGE_THRESHOLD);
      
      if (!isFromRightEdge) {
        return;
      }

      // Check if swipe meets threshold criteria (swipe left from right edge)
      const isValidSwipe = Math.abs(translationX) > SWIPE_THRESHOLD || Math.abs(velocityX) > VELOCITY_THRESHOLD;
      const isLeftSwipe = translationX < 0;
      
      if (isValidSwipe && isLeftSwipe) {
        onSwipeToMenu();
      }
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <PanGestureHandler
        ref={panRef}
        onHandlerStateChange={handlePanStateChange}
        activeOffsetX={[-5, 5]} // Reduced sensitivity
        failOffsetY={[-50, 50]} // More tolerance for vertical movement
        enabled={!disabled}
        shouldCancelWhenOutside={false}
        minPointers={1}
        maxPointers={1}
      >
        <View style={{ flex: 1 }}>
          {children}
        </View>
      </PanGestureHandler>
    </View>
  );
};

export default SwipeToMenu;