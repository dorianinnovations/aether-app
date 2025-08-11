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
import { LinearGradient } from 'expo-linear-gradient';

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
  /** Whether to add a fade gradient at the bottom */
  addBottomFade?: boolean;
  /** Theme for the fade gradient */
  theme?: 'light' | 'dark';
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
  addBottomFade = false,
  theme = 'light',
}) => {

  const containerStyle: ViewStyle = {
    width: '100%',
    height,
    position: 'relative',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#F8F9FA',
    borderWidth: 3,
    borderBottomWidth: 0, // No border at bottom since it fades
    borderColor: 'transparent',
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
      {/* Neumorphic Banner Container - thinner */}
      <View style={{
        backgroundColor: theme === 'dark' ? '#0F0F0F' : '#FAFAFA',
        borderTopLeftRadius: 27,
        borderTopRightRadius: 27,
        padding: 3,
        shadowColor: theme === 'dark' ? '#000000' : '#000000',
        shadowOffset: {
          width: -2,
          height: -2,
        },
        shadowOpacity: theme === 'dark' ? 0.5 : 0.15,
        shadowRadius: 8,
        elevation: 0,
      }}>
        {/* Inner Elevated Banner */}
        <View style={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          shadowColor: theme === 'dark' ? '#FFFFFF' : '#FFFFFF',
          shadowOffset: {
            width: 1,
            height: 1,
          },
          shadowOpacity: theme === 'dark' ? 0.015 : 0.4,
          shadowRadius: 6,
          elevation: 0,
          overflow: 'hidden',
        }}>
          <TouchableOpacity
            style={{ 
              ...containerStyle, 
              overflow: 'hidden', 
              borderWidth: 0,
              shadowColor: theme === 'dark' ? '#000000' : '#000000',
              shadowOffset: {
                width: 0,
                height: 3,
              },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 6,
            }}
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

        {/* Bottom fade gradient for seamless blending */}
        {addBottomFade && (
          <LinearGradient
            colors={
              theme === 'dark' 
                ? ['transparent', 'rgba(15,15,15,0.4)', 'rgba(15,15,15,0.8)', 'rgba(15,15,15,1)']
                : ['transparent', 'rgba(250,250,250,0.4)', 'rgba(250,250,250,0.8)', 'rgba(250,250,250,1)']
            }
            locations={[0, 0.5, 0.8, 1]}
            style={styles.bottomFade}
          />
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
        </View>
      </View>

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
  bottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    zIndex: 5,
  },
});

export default BannerImage;