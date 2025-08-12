import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { typography } from '../../../../design-system/tokens/typography';
import { spacing } from '../../../../design-system/tokens/spacing';
import { type SettingItem } from '../../../../config/settingsConfig';

interface SettingItemProps {
  item: SettingItem;
  itemColor: string;
  theme: 'light' | 'dark';
  colors: {
    text: string;
    textMuted: string;
    surface: string;
    surfaces: {
      sunken: string;
    };
  };
  onSwitchPress: (key: string, value: boolean) => void;
  onActionPress: (key: string) => void;
  onCheckboxPress?: (key: string, value: boolean) => void;
  children?: React.ReactNode; // For custom content like background selector
}

export const SettingItemComponent: React.FC<SettingItemProps> = ({
  item,
  itemColor,
  theme,
  colors,
  onSwitchPress,
  onActionPress,
  onCheckboxPress,
  children,
}) => {
  const isBackgroundSelector = item.key === 'backgroundType';
  const isCheckboxOnly = item.type === 'checkbox';
  
  // Simple checkbox-only layout
  if (isCheckboxOnly) {
    return (
      <TouchableOpacity 
        style={styles.checkboxOnlyItem}
        activeOpacity={0.8}
        onPress={() => onCheckboxPress?.(item.key, !item.value)}
      >
        <Text style={[styles.checkboxOnlyLabel, { color: colors.text }]}>
          {item.label}
        </Text>
        <TouchableOpacity
          style={styles.checkOnlyContainer}
          onPress={() => onCheckboxPress?.(item.key, !item.value)}
        >
          {item.value && (
            <Feather name="check" size={16} color={itemColor} />
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }
  
  return (
    <TouchableOpacity 
      style={[
        isBackgroundSelector ? styles.backgroundSelectorItem : styles.subDrawerItem, 
        { 
          backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0, 0, 0, 0.03)',
          borderColor: theme === 'dark' 
            ? 'rgba(255,255,255,0.1)' 
            : 'rgba(0, 0, 0, 0.08)',
        }
      ]}
      activeOpacity={0.8}
      onPress={item.type === 'switch' ? () => onSwitchPress(item.key, !item.value) : 
               item.type === 'checkbox' ? () => onCheckboxPress?.(item.key, !item.value) : undefined}
    >
      <View style={styles.iconContainer}>
        {item.type === 'switch' && <Feather name="toggle-left" size={16} color={itemColor} />}
        {item.type === 'checkbox' && <Feather name="cpu" size={16} color={itemColor} />}
        {item.type === 'action' && <Feather name={(item as any).destructive ? "trash-2" : "download"} size={16} color={itemColor} />}
        {item.type === 'selector' && <Feather name="layers" size={16} color={itemColor} />}
      </View>
      
      <View style={isBackgroundSelector ? styles.backgroundSelectorContent : styles.subDrawerItemContent}>
        <Text style={[styles.subDrawerItemLabel, { color: colors.text }]}>
          {item.label}
        </Text>
        
        {item.type === 'switch' && (
          <Switch
            value={item.value as boolean}
            onValueChange={(value) => onSwitchPress(item.key, value)}
            trackColor={{ false: colors.surfaces.sunken, true: itemColor }}
            thumbColor={colors.surface}
          />
        )}
        
        {item.type === 'checkbox' && (
          <TouchableOpacity
            style={[
              styles.checkboxContainer,
              {
                borderColor: item.value ? itemColor : colors.textMuted,
                backgroundColor: item.value ? `${itemColor}20` : 'transparent',
              }
            ]}
            onPress={() => onCheckboxPress?.(item.key, !item.value)}
          >
            {item.value && (
              <Feather name="check" size={14} color={itemColor} />
            )}
          </TouchableOpacity>
        )}
        
        {item.type === 'action' && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              (item as any).destructive 
                ? { backgroundColor: 'rgba(255, 71, 87, 0.15)', borderWidth: 1, borderColor: 'rgba(255, 71, 87, 0.3)' }
                : { backgroundColor: `${itemColor}15`, borderWidth: 1, borderColor: `${itemColor}30` }
            ]}
            onPress={() => onActionPress(item.key)}
          >
            <Text style={[
              styles.actionButtonText,
              { color: (item as any).destructive ? '#ff4757' : itemColor }
            ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
        
        {/* Custom content for selectors like background type */}
        {item.type === 'selector' && children}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  subDrawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 80,
    borderRadius: 12,
    marginHorizontal: spacing[1],
    marginVertical: 2,
    paddingHorizontal: spacing[4],
    borderWidth: 1,
  },
  backgroundSelectorItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 120,
    borderRadius: 12,
    marginHorizontal: spacing[1],
    marginVertical: 2,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderWidth: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subDrawerItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
    minHeight: 80,
  },
  backgroundSelectorContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: 1,
    marginLeft: spacing[3],
  },
  subDrawerItemLabel: {
    fontFamily: typography.fonts.body,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.1,
    flex: 1,
  },
  actionButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 80,
    alignItems: 'center',
  },
  actionButtonText: {
    fontFamily: typography.fonts.body,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  checkboxContainer: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxOnlyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[1],
  },
  checkboxOnlyLabel: {
    fontFamily: typography.fonts.body,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.1,
    flex: 1,
  },
  checkOnlyContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});