/**
 * Custom hook for managing header menu state and actions
 * Consolidates duplicate header menu logic across screens
 */

import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';

// Navigation type
type NavigationProp = {
  goBack: () => void;
  navigate: (screen: string) => void;
};

interface UseHeaderMenuOptions {
  screenName?: string;
  onSettingsPress?: () => void;
  onSignOut?: () => void;
}

export const useHeaderMenu = (options: UseHeaderMenuOptions = {}) => {
  const { screenName, onSettingsPress, onSignOut } = options;
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const navigation = useNavigation();
  const { toggleTheme } = useTheme();

  const handleMenuAction = (key: string) => {
    setShowHeaderMenu(false);
    
    switch (key) {
      case 'back':
        navigation.goBack();
        break;
      case 'profile':
        if (screenName !== 'profile') {
          (navigation as NavigationProp).navigate('Profile');
        }
        break;
      case 'chat':
        if (screenName !== 'chat') {
          (navigation as NavigationProp).navigate('Chat');
        }
        break;
      case 'friends':
        if (screenName !== 'friends') {
          (navigation as NavigationProp).navigate('Friends');
        }
        break;
      case 'feed':
        if (screenName !== 'feed') {
          (navigation as NavigationProp).navigate('Feed');
        }
        break;
      case 'settings':
        requestAnimationFrame(() => {
          onSettingsPress?.();
        });
        break;
      case 'theme_toggle':
        toggleTheme();
        break;
      case 'sign_out':
        // Defer to avoid useInsertionEffect warnings
        requestAnimationFrame(() => {
          onSignOut?.();
        });
        break;
      default:
        // Unknown menu action - could add proper error handling if needed
    }
  };

  const toggleHeaderMenu = () => {
    setShowHeaderMenu(!showHeaderMenu);
  };

  return {
    showHeaderMenu,
    setShowHeaderMenu,
    handleMenuAction,
    toggleHeaderMenu,
  };
};

export default useHeaderMenu;