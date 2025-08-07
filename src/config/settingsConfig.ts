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
    title: 'Appearance',
    icon: 'sliders',
    description: 'Theme and dynamic options',
    items: [
      { key: 'theme', label: 'Dark Mode', value: settings.theme === 'dark', type: 'switch' },
      { key: 'dynamicOptions', label: 'Dynamic Options', value: settings.dynamicOptions, type: 'switch' },
      { key: 'backgroundType', label: 'Background Style', value: settings.backgroundType, type: 'selector' },
    ]
  },
  accessibility: {
    title: 'Accessibility',
    icon: 'eye',
    description: 'Visual and interaction aids',
    items: [
      { key: 'highContrast', label: 'High Contrast', value: settings.highContrast, type: 'switch' },
      { key: 'largeText', label: 'Large Text', value: settings.largeText, type: 'switch' },
      { key: 'reduceMotion', label: 'Reduce Motion', value: settings.reduceMotion, type: 'switch' },
    ]
  },
  notifications: {
    title: 'Notifications',
    icon: 'bell',
    description: 'Push alerts, sounds, haptics',
    items: [
      { key: 'notifications', label: 'Push Notifications', value: settings.notificationsEnabled, type: 'switch' },
      { key: 'sound', label: 'Sound Effects', value: settings.soundEnabled, type: 'switch' },
      { key: 'haptics', label: 'Haptic Feedback', value: settings.hapticsEnabled, type: 'switch' },
    ]
  },
  display: {
    title: 'Display',
    icon: 'monitor',
    description: 'Screen and visual settings',
    items: [
      { key: 'keepScreenOn', label: 'Keep Screen On', value: settings.keepScreenOn, type: 'switch' },
      { key: 'showTimestamps', label: 'Show Timestamps', value: settings.showTimestamps, type: 'switch' },
    ]
  },
  privacy: {
    title: 'Privacy & Data',
    icon: 'shield',
    description: 'Analytics, backups, data control',
    items: [
      { key: 'analytics', label: 'Analytics', value: settings.analyticsEnabled, type: 'switch' },
      { key: 'autoSave', label: 'Auto-Save Chats', value: settings.autoSaveEnabled, type: 'switch' },
      { key: 'autoLock', label: 'Auto-Lock', value: settings.autoLock, type: 'switch' },
      { key: 'exportData', label: 'Export Data', type: 'action' },
      { key: 'clearData', label: 'Clear All Data', type: 'action', destructive: true },
    ]
  },
});