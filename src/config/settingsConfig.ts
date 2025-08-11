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
  models: SettingSection;
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
  backgroundType: BackgroundType;
  highContrast: boolean;
  largeText: boolean;
  reduceMotion: boolean;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  analyticsEnabled: boolean;
  autoSaveEnabled: boolean;
  autoLock: boolean;
  selectedModels?: string[];
}): SettingSections => ({
  appearance: {
    title: 'Appearance',
    icon: 'sliders',
    description: 'Customize your visual experience with themes and backgrounds',
    items: [
      { key: 'theme', label: 'Use dark theme', value: settings.theme === 'dark', type: 'switch' },
      { key: 'backgroundType', label: 'Choose background appearance', value: settings.backgroundType, type: 'selector' },
    ]
  },
  accessibility: {
    title: 'Accessibility',
    icon: 'eye',
    description: 'Visual and interaction aids for better usability',
    items: [
      { key: 'highContrast', label: 'Increase text and button contrast', value: settings.highContrast, type: 'switch' },
      { key: 'largeText', label: 'Use larger text size', value: settings.largeText, type: 'switch' },
      { key: 'reduceMotion', label: 'Minimize animations and movement', value: settings.reduceMotion, type: 'switch' },
    ]
  },
  notifications: {
    title: 'Notifications',
    icon: 'bell',
    description: 'Control push notifications, sounds, and haptic feedback',
    items: [
      { key: 'notifications', label: 'Show notifications', value: settings.notificationsEnabled, type: 'switch' },
      { key: 'sound', label: 'Play notification sounds', value: settings.soundEnabled, type: 'switch' },
      { key: 'haptics', label: 'Feel vibrations for interactions', value: settings.hapticsEnabled, type: 'switch' },
    ]
  },
  models: {
    title: 'Models',
    icon: 'cpu',
    description: 'Select and prioritize AI models for different tasks',
    items: [
      { key: 'gpt5', label: 'GPT-5 - Latest OpenAI flagship model', value: settings.selectedModels?.includes('gpt5') ?? true, type: 'switch' },
      { key: 'gemini25pro', label: 'Gemini 2.5 Pro - Advanced reasoning model', value: settings.selectedModels?.includes('gemini25pro') ?? true, type: 'switch' },
      { key: 'opus41', label: 'Claude Opus 4.1 - Superior language understanding', value: settings.selectedModels?.includes('opus41') ?? true, type: 'switch' },
      { key: 'sonnetthinking', label: 'Sonnet Thinking - Enhanced logical reasoning', value: settings.selectedModels?.includes('sonnetthinking') ?? false, type: 'switch' },
      { key: 'llama3', label: 'Llama 3 - Open-source efficiency model', value: settings.selectedModels?.includes('llama3') ?? false, type: 'switch' },
    ]
  },
  privacy: {
    title: 'Privacy',
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