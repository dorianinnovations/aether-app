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
  navigate: (screen: string, params?: any) => void;
};

interface UseHeaderMenuOptions {
  screenName?: string;
  onSettingsPress?: () => void;
  onSignOut?: () => void;
  onWalletPress?: () => void;
  onAddFriend?: () => void;
  onProfilePress?: () => void;
}

export const useHeaderMenu = (options: UseHeaderMenuOptions = {}) => {
  const { screenName, onSettingsPress, onSignOut, onWalletPress, onAddFriend, onProfilePress } = options;
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
        if (onProfilePress) {
          // Use custom profile handler (e.g., modal)
          requestAnimationFrame(() => {
            onProfilePress();
          });
        } else if (screenName !== 'profile') {
          // Fallback to navigation
          try {
            navigation.navigate('Profile' as never);
          } catch (error) {
          }
        }
        break;
      case 'chat':
        if (screenName !== 'chat') {
          try {
            navigation.navigate('Chat' as never);
          } catch (error) {
          }
        }
        break;
      case 'dive':
        if (screenName !== 'dive') {
          try {
            navigation.navigate('Dive' as never);
          } catch (error) {
          }
        }
        break;
      case 'wallet':
        requestAnimationFrame(() => {
          onWalletPress?.();
        });
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
      case 'add_friend':
        // Defer to avoid useInsertionEffect warnings
        requestAnimationFrame(() => {
          onAddFriend?.();
        });
        break;
      default:
        // Unknown menu action - could add proper error handling if needed
    }
  };

  const toggleHeaderMenu = () => {
    setShowHeaderMenu(!showHeaderMenu);
  };

  const open = () => {
    setShowHeaderMenu(true);
  };

  const close = () => {
    setShowHeaderMenu(false);
  };

  return {
    showHeaderMenu,
    setShowHeaderMenu,
    handleMenuAction,
    toggleHeaderMenu,
    open,
    close,
  };
};

export default useHeaderMenu;