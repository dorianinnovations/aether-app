/**
 * Aether Design System - Typography Tokens
 * Unified font system with Crimson Pro, Nunito, and Inter
 */

import { Platform } from 'react-native';

// Helper function to get font family with fallbacks
const getFontFamily = (fontName: string, fallback: string = 'System') => {
  return Platform.select({
    ios: fontName,
    android: fontName,
    default: fallback
  });
};

export const typography = {
  // Font Family System - Unified font system
  fonts: {
    // Modern Sans-Serif for Chat - Ultra Clean & Readable
    chatPrimary: 'Inter-Regular',           // Main chat text - designed for interfaces
    chatPrimaryMedium: 'Inter-Medium',      // Chat emphasis text
    chatPrimarySemiBold: 'Inter-SemiBold',  // Chat headers, usernames
    chatPrimaryBold: 'Inter-Bold',          // Chat strong emphasis
    
    // Alternative Chat Fonts
    chatSecondary: 'SF-Pro-Text',           // iOS system font alternative
    chatTertiary: 'Roboto-Regular',         // Android-friendly alternative
    chatTertiaryMedium: 'Roboto-Medium',    // Roboto emphasis
    
    // Humanist Sans-Serif for Warmth
    chatWarm: 'SourceSans3-Regular',        // Warmer feel for friendly messages
    chatWarmMedium: 'SourceSans3-Medium',   // Warm emphasis
    
    // Mozilla Text for headers and titles (clean monospace)
    heading: 'MozillaText_400Regular',
    headingMedium: 'MozillaText_500Medium',
    headingSemiBold: 'MozillaText_600SemiBold',
    headingBold: 'MozillaText_700Bold',
    
    // Nunito for reading and body text (sans-serif) - Legacy support
    body: 'Nunito-Regular',
    bodyMedium: 'Nunito-Medium',
    bodySemiBold: 'Nunito-SemiBold',
    bodyBold: 'Nunito-Bold',
    
    // Inter for misc text and UI elements (sans-serif)
    ui: 'Inter-Regular',
    uiMedium: 'Inter-Medium',
    uiSemiBold: 'Inter-SemiBold',
    uiBold: 'Inter-Bold',
    
    // JetBrains Mono (monospace) - for code, numbers, and techy displays
    mono: 'JetBrainsMono-Regular',
    monoMedium: 'JetBrainsMono-Medium',
    monoBold: 'JetBrainsMono-Bold',
    
    // Mozilla Headline - for distinctive headings and usernames
    mozillaHeadline: 'MozillaHeadline_400Regular',
    mozillaHeadlineMedium: 'MozillaHeadline_500Medium',
    mozillaHeadlineSemiBold: 'MozillaHeadline_600SemiBold',
    mozillaHeadlineBold: 'MozillaHeadline_700Bold',
    
    // Mozilla Text - clean monospace font with slashed zeros
    mozillaText: 'MozillaText_400Regular',
    mozillaTextMedium: 'MozillaText_500Medium',
    mozillaTextSemiBold: 'MozillaText_600SemiBold',
    mozillaTextBold: 'MozillaText_700Bold',
    
    // Fallback to system fonts
    system: 'System',
  },
  
  // Typography Scale (Based on 1.25 ratio - perfect harmony)
  scale: {
    xs: 12,   // Supporting text, timestamps
    sm: 14,   // Body text, descriptions
    base: 16, // Default text size
    lg: 16,   // Subheadings, important labels (reduced from 20)
    xl: 19,   // Section titles, screen headers (reduced from 24)
    '2xl': 26, // Page titles, hero text (reduced from 32)
    '3xl': 32, // Large display text (reduced from 40)
    '4xl': 38, // Extra large display (reduced from 48)
  },
  
  // Line Height System (Optimal readability ratios)
  lineHeights: {
    tight: 1.2,   // Headlines, titles
    normal: 1.5,  // Body text, default
    relaxed: 1.7, // Long-form content
    loose: 2.0,   // Extra spacing for emphasis
  },
  
  // Letter Spacing (Tighter for more compact feel)
  letterSpacing: {
    tighter: -0.8,
    tight: -0.4,
    normal: -0.1,
    wide: 0.1,
    wider: 0.25,
    widest: 0.5,
  },
  
  // Text Styles - Pre-composed combinations
  textStyles: {
    // Display Text (Large, impactful) - Crimson Pro - 20% smaller
    displayLarge: {
      fontSize: 38,
      fontFamily: getFontFamily('MozillaText_700Bold', 'monospace'),
      fontWeight: '700' as const,
      lineHeight: 46,
      letterSpacing: -0.8,
    },
    displayMedium: {
      fontSize: 32,
      fontFamily: getFontFamily('MozillaText_700Bold', 'monospace'),
      fontWeight: '700' as const,
      lineHeight: 38,
      letterSpacing: -0.4,
    },
    displaySmall: {
      fontSize: 26,
      fontFamily: getFontFamily('MozillaText_600SemiBold', 'monospace'),
      fontWeight: '600' as const,
      lineHeight: 30,
      letterSpacing: -0.1,
    },
    
    // Headlines (Screen titles, section headers) - Crimson Pro - 20% smaller
    headlineLarge: {
      fontSize: 19,
      fontFamily: getFontFamily('MozillaText_600SemiBold', 'monospace'),
      fontWeight: '600' as const,
      lineHeight: 25,
      letterSpacing: -0.1,
    },
    headlineMedium: {
      fontSize: 16,
      fontFamily: getFontFamily('MozillaText_500Medium', 'monospace'),
      fontWeight: '500' as const,
      lineHeight: 21,
      letterSpacing: -0.1,
    },
    headlineSmall: {
      fontSize: 14,
      fontFamily: getFontFamily('MozillaText_500Medium', 'monospace'),
      fontWeight: '500' as const,
      lineHeight: 20,
      letterSpacing: -0.1,
    },
    
    // Body Text (Main content) - Nunito
    bodyLarge: {
      fontSize: 16,
      fontFamily: getFontFamily('Nunito-Regular', 'sans-serif'),
      fontWeight: '400' as const,
      lineHeight: 24,
      letterSpacing: -0.1,
    },
    bodyMedium: {
      fontSize: 14,
      fontFamily: getFontFamily('Nunito-Regular', 'sans-serif'),
      fontWeight: '400' as const,
      lineHeight: 21,
      letterSpacing: -0.1,
    },
    bodySmall: {
      fontSize: 12,
      fontFamily: getFontFamily('Nunito-Regular', 'sans-serif'),
      fontWeight: '400' as const,
      lineHeight: 17,
      letterSpacing: -0.1,
    },
    
    // Backward compatibility aliases for textStyles access
    body: {
      fontSize: 16,
      fontFamily: getFontFamily('Nunito-Regular', 'sans-serif'),
      fontWeight: '400' as const,
      lineHeight: 24,
      letterSpacing: -0.1,
    },
    bodyBold: {
      fontSize: 16,
      fontFamily: getFontFamily('Nunito-Bold', 'sans-serif'),
      fontWeight: '700' as const,
      lineHeight: 24,
      letterSpacing: -0.1,
    },
    
    // Labels (Buttons, form labels) - Inter
    labelLarge: {
      fontSize: 16,
      fontFamily: getFontFamily('Inter-Medium', 'sans-serif'),
      fontWeight: '500' as const,
      lineHeight: 22,
      letterSpacing: 0.1,
    },
    labelMedium: {
      fontSize: 14,
      fontFamily: getFontFamily('Inter-Medium', 'sans-serif'),
      fontWeight: '500' as const,
      lineHeight: 20,
      letterSpacing: 0.1,
    },
    labelSmall: {
      fontSize: 12,
      fontFamily: getFontFamily('Inter-Medium', 'sans-serif'),
      fontWeight: '500' as const,
      lineHeight: 17,
      letterSpacing: 0.25,
    },
    
    // Captions (Supporting text, metadata) - Inter
    caption: {
      fontSize: 12,
      fontFamily: getFontFamily('Inter-Regular', 'sans-serif'),
      fontWeight: '400' as const,
      lineHeight: 16,
      letterSpacing: 0.1,
    },
    overline: {
      fontSize: 10,
      fontFamily: getFontFamily('Inter-Medium', 'sans-serif'),
      fontWeight: '500' as const,
      lineHeight: 15,
      letterSpacing: 0.5,
      textTransform: 'uppercase' as const,
    },
    
    // Enhanced Chat Text Styles - Modern, Clean & Highly Readable
    aiMessage: {
      fontSize: 16,
      fontFamily: getFontFamily('Inter-Regular', 'sans-serif'),
      fontWeight: '400' as const,
      lineHeight: 24,    // 1.5 ratio for optimal readability
      letterSpacing: -0.1,
    },
    aiMessageEmphasis: {
      fontSize: 16,
      fontFamily: getFontFamily('Inter-Medium', 'sans-serif'),
      fontWeight: '500' as const,
      lineHeight: 24,
      letterSpacing: -0.1,
    },
    userMessage: {
      fontSize: 16,
      fontFamily: getFontFamily('Inter-Regular', 'sans-serif'),
      fontWeight: '400' as const,
      lineHeight: 22,    // Slightly tighter for user bubbles
      letterSpacing: -0.05,
    },
    userMessageLarge: {
      fontSize: 17,
      fontFamily: getFontFamily('Inter-Medium', 'sans-serif'),
      fontWeight: '500' as const,
      lineHeight: 24,
      letterSpacing: -0.1,
    },
    // Modern chat alternatives
    chatMessageModern: {
      fontSize: 15,
      fontFamily: getFontFamily('SF-Pro-Text', 'sans-serif'),
      fontWeight: '400' as const,
      lineHeight: 22,
      letterSpacing: -0.05,
    },
    chatMessageWarm: {
      fontSize: 16,
      fontFamily: getFontFamily('SourceSans3-Regular', 'sans-serif'),
      fontWeight: '400' as const,
      lineHeight: 24,
      letterSpacing: -0.05,
    },
    
    // Responsive Chat Styles (for different screen sizes)
    chatSmallScreen: {
      fontSize: 15,  // Slightly smaller for small screens
      fontFamily: getFontFamily('Inter-Regular', 'sans-serif'),
      fontWeight: '400' as const,
      lineHeight: 22,
      letterSpacing: -0.05,
    },
    chatLargeScreen: {
      fontSize: 17,  // Slightly larger for large screens
      fontFamily: getFontFamily('Inter-Regular', 'sans-serif'),
      fontWeight: '400' as const,
      lineHeight: 26,
      letterSpacing: -0.1,
    },
    userBubbleSmall: {
      fontSize: 15,
      fontFamily: getFontFamily('Inter-Regular', 'sans-serif'),
      fontWeight: '400' as const,
      lineHeight: 21,
      letterSpacing: -0.03,
    },
    userBubbleLarge: {
      fontSize: 17,
      fontFamily: getFontFamily('Inter-Medium', 'sans-serif'),
      fontWeight: '500' as const,
      lineHeight: 24,
      letterSpacing: -0.08,
    },
    timestamp: {
      fontSize: 12,
      fontFamily: getFontFamily('Inter-Regular', 'sans-serif'),
      fontWeight: '400' as const,
      lineHeight: 16,
      letterSpacing: 0.15,
      opacity: 0.7,
    },
    timestampSmall: {
      fontSize: 11,
      fontFamily: getFontFamily('Inter-Regular', 'sans-serif'),
      fontWeight: '400' as const,
      lineHeight: 14,
      letterSpacing: 0.2,
      opacity: 0.6,
    },
    
    // Connection/Friends Text Styles
    connectionTitle: {
      fontSize: 14,
      fontFamily: getFontFamily('MozillaText_600SemiBold', 'monospace'),
      fontWeight: '600' as const,
      lineHeight: 18,
      letterSpacing: -0.1,
    },
    compatibilityScore: {
      fontSize: 19,
      fontFamily: getFontFamily('MozillaText_700Bold', 'monospace'),
      fontWeight: '700' as const,
      lineHeight: 23,
      letterSpacing: -0.4,
    },
    
    // Analytics/Insights Text Styles
    metricValue: {
      fontSize: 22,
      fontFamily: getFontFamily('MozillaText_700Bold', 'monospace'),
      fontWeight: '700' as const,
      lineHeight: 27,
      letterSpacing: -0.4,
    },
    metricLabel: {
      fontSize: 14,
      fontFamily: getFontFamily('Inter-Medium', 'sans-serif'),
      fontWeight: '500' as const,
      lineHeight: 20,
      letterSpacing: 0.1,
    },
    insightText: {
      fontSize: 15,
      fontFamily: getFontFamily('Nunito-Regular', 'sans-serif'),
      fontWeight: '400' as const,
      lineHeight: 24,
      letterSpacing: -0.1,
    },
    
    // Techy Number Styles - JetBrains Mono for numbers, stats, and prices
    techyNumberLarge: {
      fontSize: 28,
      fontFamily: getFontFamily('JetBrainsMono-Bold', 'monospace'),
      fontWeight: '700' as const,
      lineHeight: 32,
      letterSpacing: -0.5,
    },
    techyNumberMedium: {
      fontSize: 22,
      fontFamily: getFontFamily('JetBrainsMono-Bold', 'monospace'),
      fontWeight: '700' as const,
      lineHeight: 26,
      letterSpacing: -0.3,
    },
    techyNumberSmall: {
      fontSize: 18,
      fontFamily: getFontFamily('JetBrainsMono-Medium', 'monospace'),
      fontWeight: '600' as const,
      lineHeight: 22,
      letterSpacing: -0.2,
    },
    techyPrice: {
      fontSize: 24,
      fontFamily: getFontFamily('JetBrainsMono-Bold', 'monospace'),
      fontWeight: '700' as const,
      lineHeight: 28,
      letterSpacing: -0.4,
    },
    techyUsage: {
      fontSize: 20,
      fontFamily: getFontFamily('JetBrainsMono-Medium', 'monospace'),
      fontWeight: '600' as const,
      lineHeight: 24,
      letterSpacing: -0.2,
    },
    
    // Username display style - Inter for young, modern look
    username: {
      fontSize: 14,
      fontFamily: getFontFamily('Inter-SemiBold', 'sans-serif'),
      fontWeight: '600' as const,
      lineHeight: 18,
      letterSpacing: -0.1,
    },
    
    // Profile field hierarchy styles
    profileFieldLabelPrimary: {
      fontSize: 13,
      fontFamily: getFontFamily('Inter-SemiBold', 'sans-serif'),
      fontWeight: '600' as const,
      lineHeight: 16,
      letterSpacing: 0.2,
      textTransform: 'uppercase' as const,
    },
    profileFieldLabelSecondary: {
      fontSize: 12,
      fontFamily: getFontFamily('Inter-Medium', 'sans-serif'),
      fontWeight: '500' as const,
      lineHeight: 15,
      letterSpacing: 0.1,
      textTransform: 'uppercase' as const,
    },
    profileFieldValuePrimary: {
      fontSize: 18,
      fontFamily: getFontFamily('MozillaText_600SemiBold', 'monospace'),
      fontWeight: '600' as const,
      lineHeight: 24,
      letterSpacing: -0.2,
    },
    profileFieldValueSecondary: {
      fontSize: 15,
      fontFamily: getFontFamily('Nunito-Medium', 'sans-serif'),
      fontWeight: '500' as const,
      lineHeight: 21,
      letterSpacing: -0.1,
    },
    profileFieldValueTertiary: {
      fontSize: 14,
      fontFamily: getFontFamily('Nunito-Regular', 'sans-serif'),
      fontWeight: '400' as const,
      lineHeight: 20,
      letterSpacing: -0.05,
    },
  },
  
  // Direct access shortcuts (for backward compatibility)
  body: {
    fontSize: 16,
    fontFamily: getFontFamily('Nunito-Regular', 'sans-serif'),
    fontWeight: '400' as const,
    lineHeight: 24,
    letterSpacing: -0.1,
  },
  bodyBold: {
    fontSize: 16,
    fontFamily: getFontFamily('Nunito-Bold', 'sans-serif'),
    fontWeight: '700' as const,
    lineHeight: 24,
    letterSpacing: -0.1,
  },
  caption: {
    fontSize: 12,
    fontFamily: getFontFamily('Inter-Regular', 'sans-serif'),
    fontWeight: '400' as const,
    lineHeight: 16,
    letterSpacing: 0.1,
  },
  h3: {
    fontSize: 18,
    fontFamily: getFontFamily('CrimsonPro_600SemiBold', 'serif'),
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: -0.1,
  },
};

// Utility function to get text style with theme-aware colors
export const getTextStyle = (
  styleName: keyof typeof typography.textStyles,
  theme: 'light' | 'dark' = 'light',
  colorOverride?: string
) => {
  const baseStyle = typography.textStyles[styleName];
  const { getThemeColors } = require('./colors');
  const themeColors = getThemeColors(theme);
  
  return {
    ...baseStyle,
    color: colorOverride || themeColors.text,
  };
};

// Font loading configuration for Expo
export const fontConfig = {
  // Mozilla Text (monospace) - for headers and titles
  // Note: Mozilla Text fonts are loaded via Expo Google Fonts
  
  // Nunito (sans-serif) - for reading and body text
  'Nunito-Regular': require('../../../assets/fonts/Nunito-Regular.ttf'),
  'Nunito-Medium': require('../../../assets/fonts/Nunito-Medium.ttf'),
  'Nunito-SemiBold': require('../../../assets/fonts/Nunito-SemiBold.ttf'),
  'Nunito-Bold': require('../../../assets/fonts/Nunito-Bold.ttf'),
  
  // Inter (sans-serif) - for misc text and UI elements
  'Inter-Regular': require('../../../assets/fonts/Inter-Regular.ttf'),
  'Inter-Medium': require('../../../assets/fonts/Inter-Medium.ttf'),
  'Inter-SemiBold': require('../../../assets/fonts/Inter-SemiBold.ttf'),
  'Inter-Bold': require('../../../assets/fonts/Inter-Bold.ttf'),
  
  // Poppins (sans-serif) - modern geometric font for luxury + readability balance
  'Poppins-Regular': require('../../../assets/fonts/Poppins-Regular.ttf'),
  'Poppins-Medium': require('../../../assets/fonts/Poppins-Medium.ttf'),
  'Poppins-SemiBold': require('../../../assets/fonts/Poppins-SemiBold.ttf'),
  
  // Mozilla Headline - distinctive font for usernames and special headings
  'MozillaHeadline_400Regular': require('../../../node_modules/@expo-google-fonts/mozilla-headline/400Regular/MozillaHeadline_400Regular.ttf'),
  'MozillaHeadline_500Medium': require('../../../node_modules/@expo-google-fonts/mozilla-headline/500Medium/MozillaHeadline_500Medium.ttf'),
  'MozillaHeadline_600SemiBold': require('../../../node_modules/@expo-google-fonts/mozilla-headline/600SemiBold/MozillaHeadline_600SemiBold.ttf'),
  'MozillaHeadline_700Bold': require('../../../node_modules/@expo-google-fonts/mozilla-headline/700Bold/MozillaHeadline_700Bold.ttf'),
  
  // Mozilla Text fonts are loaded via Expo Google Fonts in App.tsx
};

export default typography;