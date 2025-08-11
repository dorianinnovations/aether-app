/**
 * ProfileImage Atom
 * Atomic design component for user profile images with upload/edit capabilities
 */

import React from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ImageStyle,
  ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../contexts/ThemeContext';

export interface ProfileImageProps {
  /** Image URI or null for placeholder */
  imageUri?: string | null;
  /** Size of the profile image */
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  /** Whether the image is in edit mode */
  editable?: boolean;
  /** Whether an upload is in progress */
  uploading?: boolean;
  /** Callback when image is pressed (for upload/edit) */
  onPress?: () => void;
  /** Whether the image can be deleted */
  showDeleteButton?: boolean;
  /** Callback when delete button is pressed */
  onDelete?: () => void;
  /** Custom style overrides */
  style?: ViewStyle;
  /** Custom image style overrides */
  imageStyle?: ImageStyle;
}

const SIZES = {
  small: 40,
  medium: 80,
  large: 120,
  xlarge: 160,
} as const;

const DELETE_BUTTON_SIZES = {
  small: 16,
  medium: 20,
  large: 24,
  xlarge: 28,
} as const;

const EDIT_OVERLAY_SIZES = {
  small: 20,
  medium: 24,
  large: 32,
  xlarge: 40,
} as const;

export const ProfileImage: React.FC<ProfileImageProps> = ({
  imageUri,
  size = 'large',
  editable = false,
  uploading = false,
  onPress,
  showDeleteButton = false,
  onDelete,
  style,
  imageStyle,
}) => {
  const { colors, theme } = useTheme();
  
  const imageSize = SIZES[size];
  const deleteButtonSize = DELETE_BUTTON_SIZES[size];
  const editOverlaySize = EDIT_OVERLAY_SIZES[size];

  const containerStyle: ViewStyle = {
    width: imageSize + 8, // Add space for gradient border
    height: imageSize + 8,
    borderRadius: (imageSize + 8) / 2,
    position: 'relative',
    ...style,
  };

  // Neumorphic design with inset/outset shadows - thinner
  const neumorphicContainerStyle: ViewStyle = {
    width: imageSize + 8,
    height: imageSize + 8,
    borderRadius: (imageSize + 8) / 2,
    backgroundColor: theme === 'dark' ? '#0F0F0F' : '#FAFAFA',
    shadowColor: theme === 'dark' ? '#000000' : '#000000',
    shadowOffset: {
      width: -2,
      height: -2,
    },
    shadowOpacity: theme === 'dark' ? 0.4 : 0.12,
    shadowRadius: 6,
    elevation: 0,
  };

  const innerShadowStyle: ViewStyle = {
    width: imageSize + 4,
    height: imageSize + 4,
    borderRadius: (imageSize + 4) / 2,
    backgroundColor: theme === 'dark' ? '#0F0F0F' : '#FAFAFA',
    margin: 2,
    shadowColor: theme === 'dark' ? '#FFFFFF' : '#FFFFFF',
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: theme === 'dark' ? 0.02 : 0.6,
    shadowRadius: 4,
    elevation: 0,
    justifyContent: 'center',
    alignItems: 'center',
  };

  const imageContainerStyle: ViewStyle = {
    width: imageSize,
    height: imageSize,
    borderRadius: imageSize / 2,
    overflow: 'hidden',
    shadowColor: theme === 'dark' ? '#000000' : '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  };

  const baseImageStyle: ImageStyle = {
    width: imageSize,
    height: imageSize,
    borderRadius: imageSize / 2,
    ...imageStyle,
  };

  const placeholderStyle: ViewStyle = {
    ...baseImageStyle,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  };

  const editOverlayStyle: ViewStyle = {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: editOverlaySize,
    height: editOverlaySize,
    borderRadius: editOverlaySize / 2,
    backgroundColor: uploading ? colors.primary : 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  };

  const deleteButtonStyle: ViewStyle = {
    position: 'absolute',
    top: -4,
    right: -4,
    width: deleteButtonSize,
    height: deleteButtonSize,
    borderRadius: deleteButtonSize / 2,
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
    zIndex: 10,
  };

  const placeholderIconSize = Math.floor(imageSize * 0.4);

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={editable ? onPress : undefined}
      disabled={uploading || !editable}
      activeOpacity={editable ? 0.8 : 1}
    >
      {/* Neumorphic Outer Container - Creates "pressed in" effect */}
      <View style={neumorphicContainerStyle}>
        {/* Inner Shadow Ring - Creates depth */}
        <View style={innerShadowStyle}>
          {/* Image Container with subtle elevation */}
          <View style={imageContainerStyle}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={baseImageStyle} />
            ) : (
              <View style={placeholderStyle}>
                <Feather 
                  name="user" 
                  size={placeholderIconSize} 
                  color={colors.textSecondary} 
                />
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Edit overlay for editable mode */}
      {editable && (
        <View style={editOverlayStyle}>
          {uploading ? (
            <ActivityIndicator 
              size="small" 
              color="white" 
            />
          ) : (
            <Feather 
              name="camera" 
              size={Math.floor(editOverlaySize * 0.5)} 
              color="white" 
            />
          )}
        </View>
      )}

      {/* Delete button */}
      {showDeleteButton && !uploading && imageUri && (
        <TouchableOpacity 
          style={deleteButtonStyle}
          onPress={onDelete}
          activeOpacity={0.8}
        >
          <Feather 
            name="x" 
            size={Math.floor(deleteButtonSize * 0.6)} 
            color="white" 
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

export default ProfileImage;