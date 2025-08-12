/**
 * Aether - Settings Modal
 * Beautiful glassmorphic settings panel with brick-style buttons
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Switch,
  ScrollView,
  Dimensions,
  Alert,
  Share,
  // Removed unused Linking,
  Animated,
  Easing,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import Constants from 'expo-constants';

// Design System
// Removed unused getBorderStyle import
// Removed unused colorPatterns import
import { typography } from '../../design-system/tokens/typography';
import { spacing } from '../../design-system/tokens/spacing';
import { logger } from '../../utils/logger';
// Removed unused glassmorphic imports
// Removed unused Icon import

// Contexts
import { useTheme } from '../../contexts/ThemeContext';
import { useSettings } from '../../hooks/useSettings';

// Services
import { AuthAPI, TokenManager, ConversationAPI } from '../../services/api';
import SettingsStorage from '../../services/settingsStorage';

// Components
import { SignOutModal } from '../../design-system/components/organisms/SignOutModal';
import { AboutModal } from './components/settings/AboutModal';
import { SettingItemComponent } from './components/settings/SettingItem';
import { BackgroundSelector } from './components/settings/BackgroundSelector';

// Configuration
import { getSettingsIconColor, createSettingsSections, type BackgroundType } from '../../config/settingsConfig';

// Hooks
import { useSettingsModalAnimations } from '../../hooks/useSettingsModalAnimations';


const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onSignOut?: () => void;
  navigation?: any;
}


const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
  onSignOut,
  navigation,
}) => {
  const { theme, colors, toggleTheme } = useTheme();
  const { settings: globalSettings, updateSetting } = useSettings();
  // Local state for settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  // New settings
  const [reduceMotion, setReduceMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [autoLock, setAutoLock] = useState(true);
  const [backgroundType, setBackgroundType] = useState<BackgroundType>('blue');
  const [selectedModels, setSelectedModels] = useState<string[]>(['gpt5', 'gemini25pro', 'opus41']);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSubDrawer, setActiveSubDrawer] = useState<string | null>(null);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  
  // Animation system
  const animations = useSettingsModalAnimations(visible, activeSubDrawer, setActiveSubDrawer);
  const {
    subDrawerAnim,
    mainContentAnim,
    headerOpacity,
    accountSectionOpacity,
    categoriesSectionOpacity,
    quickActionsOpacity,
    accountButtonOpacity,
    categoryButtonAnims,
    quickActionAnims,
    subDrawerHeaderOpacity,
    subDrawerItemsOpacity,
    openSubDrawer,
    closeSubDrawer,
  } = animations;

  // Create settings sections with current state values
  const subDrawerSections = createSettingsSections({
    theme,
    backgroundType,
    highContrast,
    largeText,
    reduceMotion,
    notificationsEnabled,
    soundEnabled,
    hapticsEnabled,
    analyticsEnabled,
    autoSaveEnabled,
    autoLock,
    selectedModels,
  });
  
  
  // Removed unused style variables

  // Load settings and auth state on mount
  useEffect(() => {
    loadSettings();
    checkAuthState();
  }, []);

  // Sync local background type with global settings
  useEffect(() => {
    setBackgroundType(globalSettings.backgroundType);
  }, [globalSettings.backgroundType]);





  const loadSettings = async () => {
    try {
      const settings = await SettingsStorage.getAllSettings();
      setNotificationsEnabled(settings.notificationsEnabled);
      setAnimationsEnabled(settings.animationsEnabled);
      setAnalyticsEnabled(settings.analyticsEnabled);
      setAutoSaveEnabled(settings.autoSaveEnabled);
      setSoundEnabled(settings.soundEnabled);
      setHapticsEnabled(settings.hapticsEnabled);
      // New settings
      setReduceMotion(settings.reduceMotion);
      setHighContrast(settings.highContrast);
      setLargeText(settings.largeText);
      setAutoLock(settings.autoLock);
      setBackgroundType(settings.backgroundType || globalSettings.backgroundType);
      setSelectedModels(settings.selectedModels || ['gpt5', 'gemini25pro', 'opus41']);
    } catch (error) {
      logger.error('Failed to load settings:', error);
    }
  };

  const checkAuthState = async () => {
    try {
      const token = await TokenManager.getToken();
      const user = await TokenManager.getUserData();
      setIsSignedIn(!!token);
      setUserData(user);
    } catch (error) {
      logger.error('Error checking auth state:', error);
      setIsSignedIn(false);
      setUserData(null);
    }
  };

  const handleThemeToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleTheme();
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveSubDrawer(null);
    onClose();
  };


  const handleAdvancedSetting = async (setting: string, value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      switch (setting) {
        case 'notifications':
          setNotificationsEnabled(value);
          await SettingsStorage.setSetting('notificationsEnabled', value);
          break;
        case 'animations':
          setAnimationsEnabled(value);
          await SettingsStorage.setSetting('animationsEnabled', value);
          break;
        case 'analytics':
          setAnalyticsEnabled(value);
          await SettingsStorage.setSetting('analyticsEnabled', value);
          break;
        case 'autoSave':
          setAutoSaveEnabled(value);
          await SettingsStorage.setSetting('autoSaveEnabled', value);
          break;
        case 'sound':
          setSoundEnabled(value);
          await SettingsStorage.setSetting('soundEnabled', value);
          break;
        case 'haptics':
          setHapticsEnabled(value);
          await SettingsStorage.setSetting('hapticsEnabled', value);
          break;
        // New settings
        case 'reduceMotion':
          setReduceMotion(value);
          await SettingsStorage.setSetting('reduceMotion', value);
          break;
        case 'highContrast':
          setHighContrast(value);
          await SettingsStorage.setSetting('highContrast', value);
          break;
        case 'largeText':
          setLargeText(value);
          await SettingsStorage.setSetting('largeText', value);
          break;
        case 'autoLock':
          setAutoLock(value);
          await SettingsStorage.setSetting('autoLock', value);
          break;
        // Model settings
        case 'autoCheck':
          setSelectedModels(prevModels => {
            const updatedModels = value 
              ? [...prevModels.filter(m => m !== 'autoCheck'), 'autoCheck']
              : prevModels.filter(m => m !== 'autoCheck');
            SettingsStorage.setSetting('selectedModels', updatedModels);
            return updatedModels;
          });
          break;
        case 'gpt5':
        case 'gemini25pro':
        case 'opus41':
        case 'sonnetthinking':
        case 'llama4':
        case 'grok3':
        case 'deepseekr1':
        case 'mistralLarge2':
        case 'commandrplus':
        case 'qwen25max':
        case 'pixtralLarge':
        case 'gpt4o':
        case 'claude35sonnet':
        case 'gemini15pro':
          handleModelToggle(setting, value);
          break;
      }
    } catch (error) {
      logger.error(`Failed to save ${setting} setting:`, error);
    }
  };

  const handleBackgroundTypeSetting = async (backgroundType: BackgroundType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      setBackgroundType(backgroundType);
      await updateSetting('backgroundType', backgroundType);
    } catch (error) {
      logger.error('Failed to save backgroundType setting:', error);
    }
  };

  const handleModelToggle = async (modelKey: string, isEnabled: boolean) => {
    try {
      let updatedModels;
      if (isEnabled) {
        updatedModels = [...selectedModels, modelKey];
      } else {
        updatedModels = selectedModels.filter(model => model !== modelKey);
      }
      
      setSelectedModels(updatedModels);
      await SettingsStorage.setSetting('selectedModels', updatedModels);
    } catch (error) {
      logger.error('Failed to save model setting:', error);
    }
  };

  // Handle sub-drawer item interactions
  const handleSubDrawerItem = async (section: string, item: any) => {
    switch (item.type) {
      case 'switch':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (item.key === 'theme') {
          handleThemeToggle();
        } else {
          await handleAdvancedSetting(item.key, !item.value);
        }
        break;
      case 'selector':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await handleAdvancedSetting(item.key, item.value);
        break;
      case 'action':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (item.key === 'exportData') {
          handleDataExport();
        } else if (item.key === 'clearData') {
          handleClearData();
        }
        break;
    }
  };

  const handleSignOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShowSignOutModal(true);
  };

  const handleSignOutConfirm = async () => {
    try {
      setIsLoading(true);
      await AuthAPI.logout();
      setIsSignedIn(false);
      setUserData(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Close ALL modals first to prevent blocking touch events
      setShowSignOutModal(false);
      setShowAboutModal(false);
      onClose();
      
      // Small delay to ensure modal close animations complete
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Sign out and navigate to Auth stack
      if (navigation) {
        // Clear auth state after modals are closed
        if ((global as any).clearAuthState) {
          await (global as any).clearAuthState();
        }
      } else {
        onSignOut?.();
      }
    } catch (error) {
      logger.error('Sign out error:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
      throw error; // Re-throw to let SignOutModal handle error state
    } finally {
      setIsLoading(false);
    }
  };

  const handleDataExport = async () => {
    try {
      setIsLoading(true);
      const settingsData = await SettingsStorage.exportSettings();
      
      await Share.share({
        message: settingsData,
        title: 'Aether Settings Export',
      });
    } catch (error) {
      logger.error('Export error:', error);
      Alert.alert('Error', 'Failed to export settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your conversations and preferences. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear Data', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              
              // Delete conversations
              await ConversationAPI.deleteAllConversations();
              
              // Clear local settings
              await SettingsStorage.resetSettings();
              await loadSettings();
              
              Alert.alert(
                'Data Cleared',
                'All conversations and preferences have been permanently deleted.',
                [{ text: 'OK', style: 'default' }]
              );
              
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              
            } catch (error: any) {
              logger.error('Failed to clear data:', error);
              
              Alert.alert(
                'Error', 
                error.message || 'Failed to clear data. Please try again.',
                [{ text: 'OK', style: 'default' }]
              );
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  // Render main settings item (matching HeaderMenu style)
  const renderSettingsItem = (section: string, index: number) => {
    const sectionData = subDrawerSections[section as keyof typeof subDrawerSections];
    const itemColor = getSettingsIconColor(index);
    return (
      <TouchableOpacity
        style={[
          styles.settingsItem, 
          { 
            backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0, 0, 0, 0.08)',
            borderColor: theme === 'dark' 
              ? 'rgba(255,255,255,0.2)' 
              : 'rgba(0, 0, 0, 0.15)',
          }
        ]}
        onPress={() => openSubDrawer(section)}
        activeOpacity={0.8}
      >
        <View style={styles.iconContainer}>
          <Feather name={sectionData.icon as any} size={16} color={itemColor} />
        </View>
        <Text style={[
          styles.settingsTitle, 
          { color: colors.text }
        ]}>
          {sectionData.title}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render sub-drawer
  const renderSubDrawer = () => {
    if (!activeSubDrawer) return null;
    
    const sectionData = subDrawerSections[activeSubDrawer as keyof typeof subDrawerSections];
    const translateX = subDrawerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [screenWidth, 0],
    });

    return (
      <Animated.View 
        style={[
          styles.subDrawer, 
          { 
            backgroundColor: theme === 'dark' ? '#1a1a1a' : colors.surface,
            borderColor: colors.borders.default,
            transform: [{ translateX }] 
          }
        ]}
      >
        <Animated.View style={[
          styles.subDrawerHeader, 
          { 
            borderBottomColor: colors.borders.default,
            opacity: subDrawerHeaderOpacity 
          }
        ]}>
          <TouchableOpacity onPress={closeSubDrawer} style={styles.backButton}>
            <Feather name="arrow-left" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.subDrawerTitle, { color: colors.text }]}>
            {sectionData.title}
          </Text>
        </Animated.View>
        
        <Animated.ScrollView 
          style={[styles.subDrawerContent, { opacity: subDrawerItemsOpacity }]}
          contentContainerStyle={{ paddingBottom: spacing[6] }}
          showsVerticalScrollIndicator={false}
        >
          {sectionData.items.map((item, index) => {
            const itemColor = getSettingsIconColor(index + 12); // Offset to get different colors
            
            const handleSwitchPress = (key: string, value: boolean) => {
              if (key === 'theme') {
                handleThemeToggle();
              } else {
                handleAdvancedSetting(key, value);
              }
            };
            
            const handleActionPress = (key: string) => {
              handleSubDrawerItem(activeSubDrawer, item);
            };
            
            return (
              <SettingItemComponent
                key={item.key}
                item={item}
                itemColor={itemColor}
                theme={theme}
                colors={colors}
                onSwitchPress={handleSwitchPress}
                onActionPress={handleActionPress}
                onCheckboxPress={handleSwitchPress}
              >
                {/* Background selector - preserving critical background logic */}
                {item.type === 'selector' && item.key === 'backgroundType' && (
                  <BackgroundSelector
                    backgroundType={backgroundType}
                    onBackgroundChange={handleBackgroundTypeSetting}
                    itemColor={itemColor}
                    theme={theme}
                    colors={colors}
                  />
                )}
              </SettingItemComponent>
            );
          })}
        </Animated.ScrollView>
      </Animated.View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.modalBackdrop}>
        <TouchableOpacity 
          style={styles.backdropTouchable}
          onPress={handleClose}
          activeOpacity={1}
        />
        
        <Animated.View style={[
          styles.modalContainer, 
          { 
            backgroundColor: theme === 'dark' ? '#1a1a1a' : colors.surface,
            transform: [{ translateX: mainContentAnim }]
          }
        ]}>
          {/* Header */}
          <Animated.View style={[
            styles.modalHeader, 
            { 
              borderBottomColor: colors.borders.default,
              opacity: headerOpacity 
            }
          ]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Settings
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
            >
              <Feather name="x" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </Animated.View>

          {/* Settings Content */}
          <ScrollView 
            style={styles.settingsContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Account Section - Show first if signed in */}
            {isSignedIn && (
              <Animated.View style={[styles.accountSection, { opacity: accountSectionOpacity }]}>
                <Animated.View style={{ opacity: accountButtonOpacity }}>
                  <TouchableOpacity style={[
                    styles.accountItem, 
                    { 
                      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0, 0, 0, 0.08)',
                      borderColor: theme === 'dark' 
                        ? 'rgba(255,255,255,0.1)' 
                        : 'rgba(0, 0, 0, 0.08)',
                    }
                  ]}>
                  <View style={styles.iconContainer}>
                    <Feather name="user" size={16} color={getSettingsIconColor(0)} />
                  </View>
                  <View style={styles.accountInfo}>
                    <Text style={[styles.accountEmail, { color: colors.text }]}>
                      {userData?.email || 'Account'}
                    </Text>
                    <Text style={[styles.accountStatus, { color: colors.textMuted }]}>
                      Signed in
                    </Text>
                  </View>
                    <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
                      <Feather name="log-out" size={16} color="#ff4757" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                </Animated.View>
              </Animated.View>
            )}

            {/* Main Settings Categories */}
            <Animated.View style={[styles.categoriesSection, { opacity: categoriesSectionOpacity }]}>
              {Object.keys(subDrawerSections).map((section, index) => (
                <Animated.View key={section} style={{ opacity: categoryButtonAnims[index] }}>
                  {renderSettingsItem(section, index)}
                </Animated.View>
              ))}
            </Animated.View>

            {/* Quick Actions */}
            <Animated.View style={[styles.quickActionsSection, { opacity: quickActionsOpacity }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
              
              <Animated.View style={{ opacity: quickActionAnims[0] }}>
                <TouchableOpacity 
                  style={[styles.quickAction, { 
                    backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0, 0, 0, 0.08)',
                    borderColor: theme === 'dark' 
                      ? 'rgba(255,255,255,0.1)' 
                      : 'rgba(0, 0, 0, 0.08)',
                  }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.iconContainer}>
                    <Feather name="help-circle" size={16} color={getSettingsIconColor(10)} />
                  </View>
                  <Text style={[styles.quickActionText, { color: colors.text }]}>Help & Support</Text>
                </TouchableOpacity>
              </Animated.View>
              
              <Animated.View style={{ opacity: quickActionAnims[1] }}>
                <TouchableOpacity 
                  style={[styles.quickAction, { 
                    backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0, 0, 0, 0.08)',
                    borderColor: theme === 'dark' 
                      ? 'rgba(255,255,255,0.1)' 
                      : 'rgba(0, 0, 0, 0.08)',
                  }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowAboutModal(true);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.iconContainer}>
                    <Feather name="info" size={16} color={getSettingsIconColor(11)} />
                  </View>
                  <View style={styles.aboutQuickAction}>
                    <Text style={[styles.quickActionText, { color: colors.text }]}>About Aether</Text>
                    <Text style={[styles.versionText, { color: colors.textMuted }]}>
                      v{Constants.expoConfig?.version || '1.0.0'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </ScrollView>
          
          {/* Overlay when submenu is active */}
          {activeSubDrawer && (
            <Animated.View
              style={[
                styles.mainContentOverlay,
                {
                  opacity: subDrawerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.9],
                  }),
                }
              ]}
            >
              <TouchableOpacity
                style={StyleSheet.absoluteFillObject}
                activeOpacity={1}
                onPress={closeSubDrawer}
              />
            </Animated.View>
          )}
        </Animated.View>

        {/* Sub-drawer */}
        {renderSubDrawer()}
      </View>

      {/* About Modal */}
      <AboutModal
        visible={showAboutModal}
        onClose={() => setShowAboutModal(false)}
        theme={theme}
        colors={colors}
      />

      {/* Sign Out Modal */}
      <SignOutModal
        visible={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={handleSignOutConfirm}
        theme={theme}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
  },
  backdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  modalContainer: {
    width: screenWidth,
    height: screenHeight,
    padding: spacing[4],
    paddingLeft: spacing[6], // More inward
    paddingRight: spacing[6], // More inward
    paddingTop: 80, // More down from status bar/notch
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing[4],
    paddingLeft: spacing[2], // More inward
    paddingRight: spacing[2], // More inward
    paddingTop: spacing[3], // More down
    marginBottom: spacing[4],
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalTitle: {
    fontFamily: typography.fonts.headingSemiBold,
    fontWeight: '600',
    fontSize: 22,
  },
  closeButton: {
    padding: spacing[2],
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  settingsContent: {
    flex: 1,
  },
  
  mainContentOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  
  // Account Section
  accountSection: {
    marginBottom: spacing[4],
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 12,
    marginHorizontal: 0,
    marginVertical: 4,
    paddingHorizontal: spacing[4],
    borderWidth: 1,
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  accountInfo: {
    flex: 1,
  },
  accountEmail: {
    fontFamily: typography.fonts.body,
    fontSize: typography.scale.base,
    fontWeight: '600',
  },
  accountStatus: {
    fontFamily: typography.fonts.body,
    fontSize: typography.scale.sm,
    marginTop: 2,
  },
  signOutButton: {
    padding: spacing[2],
    borderRadius: 8,
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
  },
  
  // Categories Section
  categoriesSection: {
    marginBottom: spacing[4],
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 12,
    marginHorizontal: 0,
    marginVertical: 4,
    paddingHorizontal: spacing[4],
    borderWidth: 1,
  },
  iconContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: spacing[3],
  },
  settingsTitle: {
    fontFamily: typography.fonts.body,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  settingsSubtitle: {
    fontFamily: typography.fonts.body,
    fontSize: typography.scale.sm,
    marginTop: 2,
  },
  
  // Sub-drawer
  subDrawer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: screenWidth * 0.88,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  subDrawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    paddingTop: 62.5, // Fine-tuned alignment with main modal
    borderBottomWidth: 1,
  },
  backButton: {
    padding: spacing[2],
    marginRight: spacing[3],
  },
  subDrawerTitle: {
    fontFamily: typography.fonts.headingSemiBold,
    fontSize: typography.scale.xl,
    fontWeight: '600',
  },
  subDrawerContent: {
    flex: 1,
    padding: spacing[4],
  },
  
  
  // Quick Actions
  quickActionsSection: {
    marginTop: spacing[2],
  },
  sectionTitle: {
    fontFamily: typography.fonts.headingSemiBold,
    fontSize: typography.scale.lg,
    fontWeight: '600',
    marginBottom: spacing[3],
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 12,
    marginHorizontal: 0,
    marginVertical: 4,
    paddingHorizontal: spacing[4],
    borderWidth: 1,
  },
  quickActionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: {
    fontFamily: typography.fonts.body,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  aboutQuickAction: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  versionText: {
    fontFamily: typography.fonts.body,
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  
  // Model-specific styles
  modelItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing[2],
  },
  modelChevron: {
    padding: spacing[1],
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  
});

export default SettingsModal;
