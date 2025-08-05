/**
 * UI and theming type definitions
 * Types for theme, design system, and UI components
 */

export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  borders: {
    default: string;
    subtle: string;
  };
}

export interface ThemeContextType {
  theme: 'light' | 'dark';
  colors: ThemeColors;
  toggleTheme: () => void;
}

// Icon Types
export type IconSize = 'small' | 'medium' | 'large' | 'xlarge';
export type IconName = string; // This would be expanded based on actual icon library

// Animation Types
export interface ModalAnimationRefs {
  fadeAnim: any; // Animated.Value
  scaleAnim: any; // Animated.Value
  slideAnim: any; // Animated.Value
}

// Hook Types
export interface UseKeyboardAnimationOptions {
  duration?: number;
  useNativeDriver?: boolean;
}

export interface UseKeyboardAnimationReturn {
  keyboardHeight: any; // Animated.Value
  keyboardVisible: boolean;
}

export interface UseDismissibleBannerOptions {
  autoHide?: boolean;
  hideDelay?: number;
}

export interface UseDismissibleBannerReturn {
  visible: boolean;
  show: () => void;
  hide: () => void;
  toggle: () => void;
}
