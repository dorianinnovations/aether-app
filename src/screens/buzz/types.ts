/**
 * Type definitions for Buzz screen components
 */

export interface ThemeColors {
  primary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textTertiary?: string;
  surfaces: {
    base: string;
    elevated: string;
    sunken: string;
    highlight: string;
    shadow: string;
  };
  borders?: {
    default: string;
    muted: string;
    primary: string;
  };
  pageBackground: string;
}