/**
 * BannerImage Atom
 * Atomic design component for user banner images with upload/edit capabilities
 */

import React from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  ImageStyle,
  ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

export interface BannerImageProps {
  /** Image URI or null for placeholder */
  imageUri?: string | null;
  /** Height of the banner */
  height?: number;
  /** Whether the banner is in edit mode */
  editable?: boolean;
  /** Whether an upload is in progress */
  uploading?: boolean;
  /** Callback when banner is pressed (for upload/edit) */
  onPress?: () => void;
  /** Whether the banner can be deleted */
  showDeleteButton?: boolean;
  /** Callback when delete button is pressed */
  onDelete?: () => void;
  /** Custom style overrides */
  style?: ViewStyle;
  /** Custom image style overrides */
  imageStyle?: ImageStyle;
  /** Children to overlay on the banner */
  children?: React.ReactNode;
}

export const BannerImage: React.FC<BannerImageProps> = ({
  imageUri,
  height = 200,
  editable = false,
  uploading = false,
  onPress,
  showDeleteButton = false,
  onDelete,
  style,
  imageStyle,
  children,
}) => {

  const containerStyle: ViewStyle = {
    width: '100%',
    height,
    position: 'relative',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#F8F9FA',
    ...style,
  };

  const imageStyleFinal: ImageStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    ...imageStyle,
  };

  const deleteButtonStyle: ViewStyle = {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    zIndex: 10,
  };

  const editOverlayStyle: ViewStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  };

  return (
    <View style={{ overflow: 'visible', position: 'relative' }}>
      <TouchableOpacity
        style={{ ...containerStyle, overflow: 'hidden' }}
        onPress={editable ? onPress : undefined}
        disabled={uploading || !editable}
        activeOpacity={editable ? 0.8 : 1}
      >
        {/* Banner Image */}
        {imageUri && (
          <Image 
            source={{ uri: imageUri }} 
            style={imageStyleFinal}
            resizeMode="cover"
          />
        )}

        {/* Edit overlay when in edit mode */}
        {editable && (
          <View style={editOverlayStyle}>
            <Feather name="camera" size={24} color="white" />
            <Text style={styles.overlayText}>
              {imageUri ? 'Change Banner' : 'Add Banner'}
            </Text>
          </View>
        )}

        {/* Delete button */}
        {showDeleteButton && !uploading && imageUri && editable && (
          <TouchableOpacity 
            style={deleteButtonStyle}
            onPress={onDelete}
            activeOpacity={0.8}
          >
            <Feather name="x" size={16} color="white" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Overlay content (profile image, status indicators, etc.) - positioned outside of clipped banner */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  overlayText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default BannerImage;