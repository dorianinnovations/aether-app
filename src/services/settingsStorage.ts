/**
 * Settings Storage Service
 * Manages app settings persistence with AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage Keys mapping from camelCase to storage key
const SETTINGS_KEYS = {
  TEXTSIZE: '@aether_text_size',
  THEMEVARIANT: '@aether_theme_variant',
  DARKMODE: '@aether_dark_mode',
  NOTIFICATIONSENABLED: '@aether_notifications',
  ANIMATIONSENABLED: '@aether_animations',
  ANALYTICSENABLED: '@aether_analytics',
  AUTOSAVEENABLED: '@aether_auto_save',
  SOUNDENABLED: '@aether_sound',
  HAPTICSENABLED: '@aether_haptics',
  COLORFULBUBBLESENABLED: '@aether_colorful_bubbles',
  LANGUAGE: '@aether_language',
  FONTFAMILY: '@aether_font_family',
  // Accessibility
  REDUCEMOTION: '@aether_reduce_motion',
  HIGHCONTRAST: '@aether_high_contrast',
  LARGETEXT: '@aether_large_text',
  // Display
  KEEPSCREENON: '@aether_keep_screen_on',
  SHOWTIMESTAMPS: '@aether_show_timestamps',
  // System
  AUTOLOCK: '@aether_auto_lock',
  AUTOLOCKTIMEOUT: '@aether_auto_lock_timeout',
  // Background
  BACKGROUNDTYPE: '@aether_background_type',
  // Dynamic Options
  DYNAMICOPTIONS: '@aether_dynamic_options',
} as const;

// Default Settings
export const DEFAULT_SETTINGS = {
  textSize: 16,
  themeVariant: 'default',
  darkMode: false,
  notificationsEnabled: true,
  animationsEnabled: true,
  analyticsEnabled: true,
  autoSaveEnabled: true,
  soundEnabled: true,
  hapticsEnabled: true,
  colorfulBubblesEnabled: false,
  language: 'en',
  fontFamily: 'system',
  // Accessibility
  reduceMotion: false,
  highContrast: false,
  largeText: false,
  // Display
  keepScreenOn: false,
  showTimestamps: true,
  // System
  autoLock: true,
  autoLockTimeout: 300, // 5 minutes in seconds
  // Background
  backgroundType: 'blue' as 'blue' | 'white' | 'sage' | 'lavender' | 'cream' | 'mint' | 'pearl',
  // Dynamic Options
  dynamicOptions: false,
};

export type SettingsKey = keyof typeof DEFAULT_SETTINGS;
export type SettingsValue = string | number | boolean;

export class SettingsStorage {
  // Get a single setting
  static async getSetting<T extends SettingsValue>(
    key: SettingsKey, 
    defaultValue?: T
  ): Promise<T> {
    try {
      const upperKey = key.toUpperCase() as keyof typeof SETTINGS_KEYS;
      const storageKey = SETTINGS_KEYS[upperKey];
      if (!storageKey) {
        throw new Error(`Invalid settings key: ${key}`);
      }
      const value = await AsyncStorage.getItem(storageKey);
      
      if (value === null) {
        return (defaultValue ?? DEFAULT_SETTINGS[key]) as T;
      }
      
      // Parse based on expected type
      const defaultVal = defaultValue ?? DEFAULT_SETTINGS[key];
      if (typeof defaultVal === 'boolean') {
        return (value === 'true') as T;
      } else if (typeof defaultVal === 'number') {
        return Number(value) as T;
      } else {
        return value as T;
      }
    } catch (error) {
      return (defaultValue ?? DEFAULT_SETTINGS[key]) as T;
    }
  }

  // Set a single setting
  static async setSetting(key: SettingsKey, value: SettingsValue): Promise<void> {
    try {
      const upperKey = key.toUpperCase() as keyof typeof SETTINGS_KEYS;
      const storageKey = SETTINGS_KEYS[upperKey];
      if (!storageKey) {
        throw new Error(`Invalid settings key: ${key}`);
      }
      await AsyncStorage.setItem(storageKey, String(value));
    } catch (error) {
      throw error;
    }
  }

  // Get all settings
  static async getAllSettings(): Promise<typeof DEFAULT_SETTINGS> {
    try {
      const settings = { ...DEFAULT_SETTINGS };
      
      for (const key of Object.keys(DEFAULT_SETTINGS) as SettingsKey[]) {
        settings[key] = await this.getSetting(key);
      }
      
      return settings;
    } catch (error) {
      return DEFAULT_SETTINGS;
    }
  }

  // Update multiple settings
  static async updateSettings(updates: Partial<typeof DEFAULT_SETTINGS>): Promise<void> {
    try {
      const promises = Object.entries(updates).map(([key, value]) =>
        this.setSetting(key as SettingsKey, value)
      );
      
      await Promise.all(promises);
    } catch (error) {
      throw error;
    }
  }

  // Reset all settings to defaults
  static async resetSettings(): Promise<void> {
    try {
      const promises = Object.values(SETTINGS_KEYS).map(key =>
        AsyncStorage.removeItem(key)
      );
      
      await Promise.all(promises);
    } catch (error) {
      throw error;
    }
  }

  // Export settings as JSON
  static async exportSettings(): Promise<string> {
    try {
      const settings = await this.getAllSettings();
      return JSON.stringify(settings, null, 2);
    } catch (error) {
      throw error;
    }
  }

  // Import settings from JSON
  static async importSettings(settingsJson: string): Promise<void> {
    try {
      const settings = JSON.parse(settingsJson);
      
      // Validate settings keys
      const validKeys = Object.keys(DEFAULT_SETTINGS);
      const filteredSettings: any = {};
      
      for (const [key, value] of Object.entries(settings)) {
        if (validKeys.includes(key)) {
          filteredSettings[key] = value;
        }
      }
      
      await this.updateSettings(filteredSettings);
    } catch (error) {
      throw error;
    }
  }
}

export default SettingsStorage;