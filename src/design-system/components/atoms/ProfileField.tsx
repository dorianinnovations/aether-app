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
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';

export type ProfileFieldType = 'text' | 'email' | 'url' | 'instagram' | 'twitter' | 'facebook' | 'spotify' | 'bio' | 'location' | 'displayName';

export interface ProfileFieldProps {
  /** Field label */
  label: string;
  /** Field value to display or edit */
  value?: string;
  /** Placeholder text for empty fields or edit mode */
  placeholder?: string;
  /** Field type for smart formatting and validation */
  fieldType?: ProfileFieldType;
  /** Whether the field is in edit mode */
  editable?: boolean;
  /** Whether to show the field even when empty (for edit mode) */
  showWhenEmpty?: boolean;
  /** Show as icon-first layout (icon + value, no label) */
  iconFirst?: boolean;
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
  /** Callback when input is focused */
  onInputFocus?: (inputRef: TextInput) => void;
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

// Smart formatting and validation utilities
const getFieldConfig = (fieldType?: ProfileFieldType) => {
  const configs = {
    url: {
      placeholder: 'https://yourwebsite.com',
      prefix: 'https://',
      keyboardType: 'url' as const,
      autoCapitalize: 'none' as const,
      validation: (text: string) => {
        if (!text) return { valid: true, formatted: text };
        let formatted = text.toLowerCase().trim();
        if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
          formatted = 'https://' + formatted;
        }
        return { valid: true, formatted };
      }
    },
    instagram: {
      placeholder: 'username',
      prefix: '@',
      keyboardType: 'default' as const,
      autoCapitalize: 'none' as const,
      validation: (text: string) => {
        if (!text) return { valid: true, formatted: text };
        let formatted = text.trim().toLowerCase().replace(/^@/, '');
        return { valid: /^[a-zA-Z0-9._]+$/.test(formatted), formatted };
      }
    },
    twitter: {
      placeholder: 'username',
      prefix: '@',
      keyboardType: 'default' as const,
      autoCapitalize: 'none' as const,
      validation: (text: string) => {
        if (!text) return { valid: true, formatted: text };
        let formatted = text.trim().toLowerCase().replace(/^@/, '');
        return { valid: /^[a-zA-Z0-9_]+$/.test(formatted), formatted };
      }
    },
    facebook: {
      placeholder: 'username',
      prefix: '',
      keyboardType: 'default' as const,
      autoCapitalize: 'none' as const,
      validation: (text: string) => {
        if (!text) return { valid: true, formatted: text };
        let formatted = text.trim().toLowerCase();
        return { valid: /^[a-zA-Z0-9.]+$/.test(formatted), formatted };
      }
    },
    spotify: {
      placeholder: 'https://open.spotify.com/user/username',
      prefix: 'https://open.spotify.com/',
      keyboardType: 'url' as const,
      autoCapitalize: 'none' as const,
      validation: (text: string) => {
        if (!text) return { valid: true, formatted: text };
        let formatted = text.toLowerCase().trim();
        if (!formatted.startsWith('https://open.spotify.com/')) {
          if (formatted.startsWith('spotify.com/') || formatted.startsWith('open.spotify.com/')) {
            formatted = 'https://' + formatted;
          } else if (!formatted.startsWith('http')) {
            formatted = 'https://open.spotify.com/' + formatted;
          }
        }
        return { valid: true, formatted };
      }
    },
    email: {
      placeholder: 'your@email.com',
      prefix: '',
      keyboardType: 'email-address' as const,
      autoCapitalize: 'none' as const,
      validation: (text: string) => {
        if (!text) return { valid: true, formatted: text };
        const formatted = text.trim().toLowerCase();
        const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formatted);
        return { valid, formatted };
      }
    },
    bio: {
      placeholder: 'Tell us about yourself...',
      prefix: '',
      keyboardType: 'default' as const,
      autoCapitalize: 'sentences' as const,
      validation: (text: string) => ({ valid: text.length <= 500, formatted: text })
    },
    location: {
      placeholder: 'City, Country',
      prefix: '',
      keyboardType: 'default' as const,
      autoCapitalize: 'words' as const,
      validation: (text: string) => ({ valid: true, formatted: text })
    },
    displayName: {
      placeholder: 'Your Display Name',
      prefix: '',
      keyboardType: 'default' as const,
      autoCapitalize: 'words' as const,
      validation: (text: string) => ({ valid: text.length <= 100, formatted: text })
    },
    text: {
      placeholder: '',
      prefix: '',
      keyboardType: 'default' as const,
      autoCapitalize: 'sentences' as const,
      validation: (text: string) => ({ valid: true, formatted: text })
    }
  };
  return configs[fieldType || 'text'];
};

// Helper to build platform URLs
const buildSocialUrl = (fieldType: ProfileFieldType, value: string): string | null => {
  if (!value) return null;
  
  switch (fieldType) {
    case 'instagram':
      return `https://instagram.com/${value}`;
    case 'twitter':
      return `https://x.com/${value}`;
    case 'facebook':
      return `https://facebook.com/${value}`;
    case 'spotify':
      return value.startsWith('http') ? value : `https://open.spotify.com/user/${value}`;
    case 'url':
      return value.startsWith('http') ? value : `https://${value}`;
    case 'email':
      return `mailto:${value}`;
    default:
      return null;
  }
};

// Get platform-specific icons
const getPlatformIcon = (fieldType: ProfileFieldType): string | null => {
  const icons = {
    instagram: 'instagram',
    twitter: 'twitter',
    facebook: 'facebook', 
    spotify: 'music',
    url: 'globe',
    email: 'mail'
  };
  return icons[fieldType as keyof typeof icons] || null;
};

export const ProfileField: React.FC<ProfileFieldProps> = ({
  label,
  value,
  placeholder,
  fieldType = 'text',
  editable = false,
  showWhenEmpty = false,
  iconFirst = false,
  multiline = false,
  numberOfLines = multiline ? 4 : 1,
  keyboardType,
  autoCapitalize,
  onChangeText,
  onInputFocus,
  style,
  labelStyle,
  valueStyle,
  monospace = false,
  rightContent,
  icon,
}) => {
  const { colors } = useTheme();
  const inputRef = React.useRef<TextInput>(null);
  const [inputValue, setInputValue] = React.useState(value || '');
  const [isValid, setIsValid] = React.useState(true);
  
  // Get field configuration for smart formatting
  const fieldConfig = getFieldConfig(fieldType);
  
  // Use field config defaults if not explicitly provided
  const finalKeyboardType = keyboardType || fieldConfig.keyboardType;
  const finalAutoCapitalize = autoCapitalize || fieldConfig.autoCapitalize;
  const finalPlaceholder = placeholder || fieldConfig.placeholder;

  // Sync input value with prop value
  React.useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Handle text change with smart formatting
  const handleTextChange = (text: string) => {
    const { valid, formatted } = fieldConfig.validation(text);
    setInputValue(formatted);
    setIsValid(valid);
    onChangeText?.(formatted);
  };

  // Handle focus with smart prefilling
  const handleFocus = () => {
    if (inputRef.current) {
      onInputFocus?.(inputRef.current);
    }
    
    // Auto-add prefix if field is empty and has a prefix
    if (!inputValue && fieldConfig.prefix && fieldType !== 'instagram' && fieldType !== 'twitter') {
      const prefilled = fieldConfig.prefix;
      setInputValue(prefilled);
      onChangeText?.(prefilled);
      // Set cursor position after prefix
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelection(prefilled.length, prefilled.length);
        }
      }, 100);
    }
  };

  // Don't render empty fields unless explicitly told to or in edit mode
  if (!value && !showWhenEmpty && !editable) {
    return null;
  }

  const containerStyle: ViewStyle = {
    marginBottom: spacing[2],
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
    borderColor: isValid ? colors.borders.default : '#ef4444',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    minHeight: multiline ? 100 : 50,
    textAlignVertical: multiline ? 'top' : 'center',
  };

  // Render prefix for social handles
  const renderPrefix = () => {
    if (!editable || !fieldConfig.prefix) return null;
    if (fieldType !== 'instagram' && fieldType !== 'twitter') return null;
    
    return (
      <View style={styles.prefixContainer}>
        <Text style={[styles.prefixText, { color: colors.textSecondary }]}>
          {fieldConfig.prefix}
        </Text>
      </View>
    );
  };

  // For icon-first layout, use platform icon instead of provided icon
  const displayIcon = iconFirst ? getPlatformIcon(fieldType) : icon;
  
  return (
    <View style={containerStyle}>
      {!iconFirst && (
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
      )}
      
      {editable ? (
        <View style={styles.inputContainer}>
          {renderPrefix()}
          <TextInput
            ref={inputRef}
            style={[
              inputStyle,
              renderPrefix() && styles.inputWithPrefix
            ]}
            value={inputValue}
            onChangeText={handleTextChange}
            onFocus={handleFocus}
            placeholder={finalPlaceholder}
            placeholderTextColor={colors.textSecondary}
            multiline={multiline}
            numberOfLines={numberOfLines}
            keyboardType={finalKeyboardType}
            autoCapitalize={finalAutoCapitalize}
            autoCorrect={fieldType === 'bio' || fieldType === 'displayName'}
            spellCheck={fieldType === 'bio' || fieldType === 'displayName'}
          />
          {!isValid && (
            <View style={styles.errorContainer}>
              <Feather name="alert-circle" size={12} color="#ef4444" />
              <Text style={[styles.errorText, { color: '#ef4444' }]}>Invalid format</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={iconFirst ? styles.iconFirstContainer : styles.valueContainer}>
          {iconFirst && displayIcon && (
            <Feather 
              name={displayIcon as any} 
              size={20} 
              color={colors.textSecondary} 
              style={styles.iconFirstIcon}
            />
          )}
          {buildSocialUrl(fieldType, value || '') ? (
            <TouchableOpacity
              onPress={() => {
                const url = buildSocialUrl(fieldType, value || '');
                if (url) {
                  Linking.openURL(url).catch(() => {
                    // Silently handle URL opening failure
                  });
                }
              }}
              activeOpacity={0.7}
              style={iconFirst ? styles.iconFirstLinkContainer : styles.linkContainer}
            >
              <Text style={finalValueStyle}>
                {value || placeholder || 'Not set'}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={finalValueStyle}>
              {value || placeholder || 'Not set'}
            </Text>
          )}
          {!iconFirst && rightContent}
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
  inputContainer: {
    position: 'relative',
  },
  prefixContainer: {
    position: 'absolute',
    left: spacing[4],
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  prefixText: {
    fontSize: 16,
    fontWeight: '500',
  },
  inputWithPrefix: {
    paddingLeft: spacing[8],
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[1],
    paddingHorizontal: spacing[2],
  },
  errorText: {
    fontSize: 12,
    marginLeft: spacing[1],
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconFirstContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  iconFirstIcon: {
    marginRight: spacing[3],
  },
  iconFirstLinkContainer: {
    flex: 1,
  },
});

export default ProfileField;