/**
 * Theme Context Provider
 * Manages global theme state with safe initialization and no circular dependencies
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { getThemeColors } from '../design-system/tokens/colors';
import { SettingsStorage } from '../services/settingsStorage';
import { logger } from '../utils/logger';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  colors: ReturnType<typeof getThemeColors>;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const isDarkMode = await SettingsStorage.getSetting('darkMode', false);
        setTheme(isDarkMode ? 'dark' : 'light');
      } catch (error) {
        logger.warn('Failed to load theme preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  const toggleTheme = useCallback(async () => {
    try {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
      await SettingsStorage.setSetting('darkMode', newTheme === 'dark');
    } catch (error) {
      logger.warn('Failed to save theme preference:', error);
    }
  }, [theme]);

  // Get computed colors based on current theme - memoized to prevent infinite loops
  const colors = useMemo(() => getThemeColors(theme), [theme]);

  const value: ThemeContextType = useMemo(() => ({
    theme,
    colors,
    toggleTheme,
  }), [theme, colors, toggleTheme]);

  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;