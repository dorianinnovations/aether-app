import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import { typography } from '../../../../design-system/tokens/typography';
import { spacing } from '../../../../design-system/tokens/spacing';
import { type BackgroundType } from '../../../../config/settingsConfig';

interface BackgroundSelectorProps {
  backgroundType: BackgroundType;
  onBackgroundChange: (type: BackgroundType) => void;
  itemColor: string;
  theme: 'light' | 'dark';
  colors: {
    text: string;
  };
}

export const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({
  backgroundType,
  onBackgroundChange,
  itemColor,
  theme,
  colors,
}) => {
  return (
    <View style={styles.backgroundSelector}>
      <TouchableOpacity
        style={[
          styles.backgroundOption,
          {
            backgroundColor: backgroundType === 'blue' 
              ? `${itemColor}20` 
              : theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            borderColor: backgroundType === 'blue' 
              ? itemColor 
              : theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            borderWidth: backgroundType === 'blue' ? 2 : 1,
          }
        ]}
        onPress={() => onBackgroundChange('blue')}
      >
        <View style={[styles.gradientPreview, { backgroundColor: '#f2f8ff' }]} />
        <View style={{ marginLeft: spacing[2] }}>
          <Text style={[styles.backgroundOptionText, { 
            color: backgroundType === 'blue' ? itemColor : colors.text,
            fontWeight: backgroundType === 'blue' ? '600' : '400',
          }]}>Colors</Text>
          <Text style={[styles.backgroundSubtext, { 
            color: backgroundType === 'blue' ? itemColor : colors.text,
            opacity: 0.6,
          }]}>in light mode</Text>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.backgroundOption,
          {
            backgroundColor: backgroundType === 'white' 
              ? `${itemColor}20` 
              : theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            borderColor: backgroundType === 'white' 
              ? itemColor 
              : theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            borderWidth: backgroundType === 'white' ? 2 : 1,
          }
        ]}
        onPress={() => onBackgroundChange('white')}
      >
        <View style={[styles.whitePreview, { backgroundColor: '#ffffff' }]} />
        <View style={{ marginLeft: spacing[2] }}>
          <Text style={[styles.backgroundOptionText, { 
            color: backgroundType === 'white' ? itemColor : colors.text,
            fontWeight: backgroundType === 'white' ? '600' : '400',
          }]}>White</Text>
          <Text style={[styles.backgroundSubtext, { 
            color: backgroundType === 'white' ? itemColor : colors.text,
            opacity: 0.6,
          }]}>in light mode</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  backgroundSelector: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[2],
    flex: 1,
  },
  backgroundOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 44,
  },
  backgroundOptionText: {
    fontFamily: typography.fonts.body,
    fontSize: 13,
    letterSpacing: -0.1,
  },
  backgroundSubtext: {
    fontFamily: typography.fonts.body,
    fontSize: 11,
    letterSpacing: -0.1,
    marginTop: 1,
  },
  gradientPreview: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#f2f8ff',
  },
  whitePreview: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
});