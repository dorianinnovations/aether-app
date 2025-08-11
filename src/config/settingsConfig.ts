// Settings Modal Configuration
// Extracted from SettingsModal.tsx for better organization and reusability

export type BackgroundType = 'blue' | 'white' | 'sage' | 'lavender' | 'cream' | 'mint' | 'pearl';

export interface SettingItem {
  key: string;
  label: string;
  value?: any;
  type: 'switch' | 'selector' | 'action';
  destructive?: boolean;
}

export interface SettingSection {
  title: string;
  icon: string;
  description: string;
  items: SettingItem[];
}

export interface SettingSections {
  appearance: SettingSection;
  accessibility: SettingSection;
  notifications: SettingSection;
  display: SettingSection;
  privacy: SettingSection;
}

// Rainbow pastel icon colors in proper descending order starting from red
export const getSettingsIconColor = (index: number): string => {
  const colors = [
    '#FF6B6B', // Red (pastel)
    '#FF8E6B', // Red-Orange (pastel)
    '#FFB366', // Orange (pastel)
    '#FFD93D', // Yellow (pastel)
    '#6BCF7F', // Green (pastel)
    '#4ECDC4', // Teal (pastel)
    '#45B7D1', // Sky Blue (pastel)
    '#667EEA', // Blue (pastel)
    '#764BA2', // Indigo (pastel)
    '#A8E6CF', // Mint Green (pastel)
    '#FFB3BA', // Pink (pastel)
    '#FFDFBA', // Peach (pastel)
    '#FFFFBA', // Light Yellow (pastel)
    '#BAFFC9', // Light Green (pastel)
    '#BAE1FF', // Light Blue (pastel)
    '#C7CEEA', // Lavender (pastel)
    '#F8B2E3', // Hot Pink (pastel)
    '#FFC0CB', // Classic Pink (pastel)
    '#E6E6FA', // Lavender Gray (pastel)
    '#F0E68C', // Khaki (pastel)
    '#DDA0DD', // Plum (pastel)
    '#98FB98', // Pale Green (pastel)
    '#F0F8FF', // Alice Blue (pastel)
    '#FFEFD5', // Papaya Whip (pastel)
  ];
  return colors[index % colors.length];
};

// Factory function to create settings sections with current state values
export const createSettingsSections = (settings: {
  theme: 'light' | 'dark';
  dynamicOptions: boolean;
  backgroundType: BackgroundType;
  highContrast: boolean;
  largeText: boolean;
  reduceMotion: boolean;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  keepScreenOn: boolean;
  showTimestamps: boolean;
  analyticsEnabled: boolean;
  autoSaveEnabled: boolean;
  autoLock: boolean;
}): SettingSections => ({
  appearance: {
    title: 'Appearance & Personalization',
    icon: 'sliders',
    description: 'Customize your visual experience with themes and dynamic options',
    items: [
      { key: 'theme', label: 'Use dark theme', value: settings.theme === 'dark', type: 'switch' },
      { key: 'dynamicOptions', label: 'Show dynamic interface elements', value: settings.dynamicOptions, type: 'switch' },
      { key: 'backgroundType', label: 'Choose background appearance', value: settings.backgroundType, type: 'selector' },
    ]
  },
  accessibility: {
    title: 'Accessibility & Comfort',
    icon: 'eye',
    description: 'Visual and interaction aids for better usability',
    items: [
      { key: 'highContrast', label: 'Increase text and button contrast', value: settings.highContrast, type: 'switch' },
      { key: 'largeText', label: 'Use larger text size', value: settings.largeText, type: 'switch' },
      { key: 'reduceMotion', label: 'Minimize animations and movement', value: settings.reduceMotion, type: 'switch' },
    ]
  },
  notifications: {
    title: 'Notifications & Alerts',
    icon: 'bell',
    description: 'Control push notifications, sounds, and haptic feedback',
    items: [
      { key: 'notifications', label: 'Show notifications', value: settings.notificationsEnabled, type: 'switch' },
      { key: 'sound', label: 'Play notification sounds', value: settings.soundEnabled, type: 'switch' },
      { key: 'haptics', label: 'Feel vibrations for interactions', value: settings.hapticsEnabled, type: 'switch' },
    ]
  },
  display: {
    title: 'Display & Screen',
    icon: 'monitor',
    description: 'Screen behavior and visual presentation settings',
    items: [
      { key: 'keepScreenOn', label: 'Prevent screen from sleeping', value: settings.keepScreenOn, type: 'switch' },
      { key: 'showTimestamps', label: 'Display message times', value: settings.showTimestamps, type: 'switch' },
    ]
  },
  privacy: {
    title: 'Privacy & Data Control',
    icon: 'shield',
    description: 'Manage your data, analytics, and privacy preferences',
    items: [
      { key: 'analytics', label: 'Help improve Aether', value: settings.analyticsEnabled, type: 'switch' },
      { key: 'autoSave', label: 'Automatically save conversations', value: settings.autoSaveEnabled, type: 'switch' },
      { key: 'autoLock', label: 'Lock app when inactive', value: settings.autoLock, type: 'switch' },
      { key: 'exportData', label: 'Download your data', type: 'action' },
      { key: 'clearData', label: 'Delete all app data', type: 'action', destructive: true },
    ]
  },
});