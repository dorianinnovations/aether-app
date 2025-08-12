/**
 * SocialProfileSection Molecule
 * Component for displaying social profile data (mood, plans, Spotify, etc.)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';

export interface SocialProfile {
  currentStatus?: string;
  mood?: string;
  currentPlans?: string;
  currentProject?: string;
  interests?: string[];
  skills?: string[];
  currentlyReading?: string;
  favoriteQuote?: string;
  workingOn?: string;
  availableFor?: string;
  timezone?: string;
  languages?: string[];
  goals?: string[];
  spotify?: {
    connected: boolean;
    currentTrack?: {
      name: string;
      artist: string;
    };
    recentTracks?: Array<{
      name: string;
      artist: string;
    }>;
  };
}

export interface SocialProfileSectionProps {
  /** Social profile data */
  socialProfile?: SocialProfile;
  /** Custom styles */
  style?: ViewStyle;
}

interface ProfileCubeProps {
  icon: string;
  label: string;
  value?: string | string[];
  onPress: () => void;
  size: number;
  theme: 'light' | 'dark';
  colors: any;
}

const ProfileCube: React.FC<ProfileCubeProps> = ({
  icon,
  label,
  value,
  onPress,
  size,
  theme,
  colors,
}) => {
  const hasValue = value && (Array.isArray(value) ? value.length > 0 : value.trim() !== '');
  
  const cubeStyle: ViewStyle = {
    width: size,
    height: size,
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 0,
    borderColor: 'transparent',
    padding: spacing[2],
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  };

  const displayValue = Array.isArray(value) ? value[0] : value;
  const hasMore = Array.isArray(value) && value.length > 1;

  return (
    <TouchableOpacity 
      style={cubeStyle} 
      onPress={onPress}
      activeOpacity={0.8}
      disabled={!hasValue}
    >
      <View style={{ flex: 1, justifyContent: 'space-between', width: '100%' }}>
      </View>
    </TouchableOpacity>
  );
};

export const SocialProfileSection: React.FC<SocialProfileSectionProps> = ({
  socialProfile,
  style,
}) => {
  const { colors, theme } = useTheme();
  const [expandedField, setExpandedField] = useState<string | null>(null);

  if (!socialProfile) {
    return null;
  }

  const screenWidth = Dimensions.get('window').width;
  const cubeSize = (screenWidth - (spacing[5] * 2) - (spacing[3] * 2)) / 3;

  const handleCubePress = (fieldName: string, value?: string | string[]) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return;
    
    setExpandedField(expandedField === fieldName ? null : fieldName);
    // TODO: Could show a modal or expanded view here
  };

  const profileFields = [
    { key: 'currentStatus', icon: 'message-circle', label: 'Status', value: socialProfile.currentStatus },
    { key: 'mood', icon: 'smile', label: 'Mood', value: socialProfile.mood },
    { key: 'currentProject', icon: 'code', label: 'Project', value: socialProfile.currentProject },
    { key: 'interests', icon: 'heart', label: 'Interests', value: socialProfile.interests },
    { key: 'skills', icon: 'tool', label: 'Skills', value: socialProfile.skills },
    { key: 'currentlyReading', icon: 'book', label: 'Reading', value: socialProfile.currentlyReading },
    { key: 'workingOn', icon: 'cpu', label: 'Working On', value: socialProfile.workingOn },
    { key: 'availableFor', icon: 'calendar', label: 'Available For', value: socialProfile.availableFor },
    { key: 'languages', icon: 'globe', label: 'Languages', value: socialProfile.languages },
  ];

  const containerStyle: ViewStyle = {
    paddingHorizontal: spacing[5],
    ...style,
  };

  const gridStyle: ViewStyle = {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    justifyContent: 'space-between',
  };

  return (
    <View style={containerStyle}>
      <View style={gridStyle}>
        {profileFields.map((field) => (
          <ProfileCube
            key={field.key}
            icon={field.icon}
            label={field.label}
            value={field.value}
            onPress={() => handleCubePress(field.key, field.value)}
            size={cubeSize}
            theme={theme}
            colors={colors}
          />
        ))}
      </View>
    </View>
  );
};

// Styles defined inline for better component encapsulation

export default SocialProfileSection;