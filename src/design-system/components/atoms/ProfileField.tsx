/**
 * ProfileField Atom
 * Atomic design component for profile field display with edit capabilities
 */

import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';

export interface ProfileFieldProps {
  /** Field label */
  label: string;
  /** Field value to display or edit */
  value?: string;
  /** Placeholder text for empty fields or edit mode */
  placeholder?: string;
  /** Whether the field is in edit mode */
  editable?: boolean;
  /** Whether to show the field even when empty (for edit mode) */
  showWhenEmpty?: boolean;
  /** Whether this is a multiline text area */
  multiline?: boolean;
  /** Number of lines for multiline fields */
  numberOfLines?: number;
  /** Keyboard type for input */
  keyboardType?: TextInputProps['keyboardType'];
  /** Auto capitalize behavior */
  autoCapitalize?: TextInputProps['autoCapitalize'];
  /** Callback when value changes */
  onChangeText?: (text: string) => void;
  /** Custom styling for the container */
  style?: ViewStyle;
  /** Custom styling for the label */
  labelStyle?: TextStyle;
  /** Custom styling for the value/input */
  valueStyle?: TextStyle;
  /** Whether to use monospace font (for usernames, etc.) */
  monospace?: boolean;
  /** Icon or additional content to show next to the value */
  rightContent?: React.ReactNode;
  /** Icon name to show next to the label */
  icon?: string;
}

export const ProfileField: React.FC<ProfileFieldProps> = ({
  label,
  value,
  placeholder,
  editable = false,
  showWhenEmpty = false,
  multiline = false,
  numberOfLines = multiline ? 4 : 1,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  onChangeText,
  style,
  labelStyle,
  valueStyle,
  monospace = false,
  rightContent,
  icon,
}) => {
  const { colors } = useTheme();

  // Don't render empty fields unless explicitly told to or in edit mode
  if (!value && !showWhenEmpty && !editable) {
    return null;
  }

  const containerStyle: ViewStyle = {
    marginBottom: spacing[5],
    ...style,
  };

  const finalLabelStyle: TextStyle = {
    ...typography.textStyles.bodyMedium,
    fontWeight: '600',
    color: colors.textSecondary,
    ...labelStyle,
  };

  const finalValueStyle: TextStyle = {
    ...typography.textStyles.bodyLarge,
    color: colors.text,
    fontFamily: monospace ? 'monospace' : undefined,
    ...valueStyle,
  };

  const inputStyle: TextStyle = {
    ...finalValueStyle,
    borderWidth: 1,
    borderColor: colors.borders.default,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    minHeight: multiline ? 100 : 50,
    textAlignVertical: multiline ? 'top' : 'center',
  };

  return (
    <View style={containerStyle}>
      <View style={styles.labelContainer}>
        {icon && (
          <Feather 
            name={icon as any} 
            size={16} 
            color={colors.textSecondary} 
            style={styles.labelIcon}
          />
        )}
        <Text style={finalLabelStyle}>{label}</Text>
      </View>
      
      {editable ? (
        <TextInput
          style={inputStyle}
          value={value || ''}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          multiline={multiline}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
        />
      ) : (
        <View style={styles.valueContainer}>
          <Text style={finalValueStyle}>
            {value || placeholder || 'Not set'}
          </Text>
          {rightContent}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  labelIcon: {
    marginRight: spacing[2],
  },
});

export default ProfileField;