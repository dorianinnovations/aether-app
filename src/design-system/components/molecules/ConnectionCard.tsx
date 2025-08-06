/**
 * Aether - ConnectionCard Component
 * Beautiful cards for displaying potential connections and relationships
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Image,
} from 'react-native';
import * as Haptics from 'expo-haptics';

// Design System
import { designTokens, getThemeColors, stateColors } from '../../tokens/colors';
import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';
import { createNeumorphicContainer } from '../../tokens/shadows';

interface ConnectionCardProps {
  id: string;
  name: string;
  avatar?: string;
  bannerImage?: string;
  bannerColor?: string;
  connectionType: string;
  connectionQualia?: {
    vibe: string;
    energy: string;
    resonance: string;
    timing: string;
  };
  sharedInterests: string[];
  distance?: string;
  lastSeen?: string;
  bio?: string;
  theme?: 'light' | 'dark';
  onPress?: () => void;
  onConnect?: () => void;
}

const ConnectionCard: React.FC<ConnectionCardProps> = ({
  _id,
  name,
  avatar,
  bannerImage,
  bannerColor,
  _connectionType,
  connectionQualia,
  sharedInterests,
  _distance,
  _lastSeen,
  _bio,
  theme = 'light',
  onPress,
  onConnect,
}) => {
  const themeColors = getThemeColors(theme);
  const connectionColor = stateColors.connection.soulResonance || designTokens.brand.primary;
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleConnectPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConnect?.();
  };

  // const _getConnectionTypeLabel = () => {
  //   return _connectionType
  //     .replace(/([A-Z])/g, ' $1')
  //     .replace(/^./, str => str.toUpperCase())
  //     .trim();
  // };

  const getQualiaIcon = () => {
    if (!connectionQualia || !connectionQualia.vibe) return '✨';
    
    const icons = {
      'Similar wavelength': '🌊',
      'Complementary energy': '⚡',
      'Shared curiosity': '🔍',
      'Creative spark': '✨',
      'Grounded connection': '🌿',
      'Intellectual resonance': '🧠',
      'Artistic alignment': '🎨',
      'Adventure sync': '🗺️',
      'Thoughtful exchange': '💭',
      'Kindred spirit': '🤝',
      'Fresh perspective': '🌅',
      'Warm energy': '☀️',
      'Deep roots': '🌳',
      'Gentle presence': '🕯️',
      'Bright spark': '🔥'
    };
    
    return icons[connectionQualia.vibe as keyof typeof icons] || '✨';
  };

  const getTimingIndicator = () => {
    if (!connectionQualia || !connectionQualia.timing) return 'Active member';
    
    const indicators = {
      'Just joined': 'New to the community',
      'Recently active': 'Active this week',
      'Regular presence': 'Consistent member',
      'Long-time member': 'Established presence',
      'Night owl': 'Often online evenings',
      'Early bird': 'Morning conversations',
      'Weekend warrior': 'Most active weekends',
      'Always around': 'Frequent contributor'
    };
    
    return indicators[connectionQualia.timing as keyof typeof indicators] || 'Active member';
  };

  // const _getDefaultBannerColor = () => {
  //   // Generate a beautiful gradient based on the user's name
  //   const bannerColors = [
  //     'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  //     'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  //     'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  //     'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  //     'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  //     'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  //     'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  //     'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  //   ];
  //   
  //   const hash = name.split('').reduce((a, b) => {
  //     a = ((a << 5) - a) + b.charCodeAt(0);
  //     return a & a;
  //   }, 0);
  //   
  //   return bannerColors[Math.abs(hash) % bannerColors.length];
  // };

  const getBannerStyle = () => {
    if (bannerImage) {
      return { backgroundColor: '#000' }; // Will be covered by image
    }
    
    if (bannerColor) {
      return { backgroundColor: bannerColor };
    }
    
    // Use a beautiful solid color fallback
    const solidColors = [
      '#667eea', '#f093fb', '#4facfe', '#43e97b', 
      '#fa709a', '#a8edea', '#ff9a9e', '#ffecd2'
    ];
    
    const hash = name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return { backgroundColor: solidColors[Math.abs(hash) % solidColors.length] };
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={[styles.card, createNeumorphicContainer(theme, 'elevated')]}>
          {/* Banner Section */}
          <View style={[styles.bannerContainer, getBannerStyle()]}>
            {bannerImage && (
              <Image 
                source={{ uri: bannerImage }} 
                style={styles.bannerImage}
                resizeMode="cover"
              />
            )}
            <View style={styles.bannerOverlay} />
            
            {/* Connection Qualia - positioned on banner */}
            <View style={styles.qualiaBanner}>
              <View style={styles.qualiaContainer}>
                <Text style={styles.qualiaIcon}>
                  {getQualiaIcon()}
                </Text>
                <Text style={[styles.qualiaVibe, { color: '#ffffff' }]}>
                  {connectionQualia?.vibe || 'New connection'}
                </Text>
              </View>
            </View>
          </View>

          {/* Compact Profile Section */}
          <View style={styles.compactProfileSection}>
            {/* Profile Photo - Left Aligned */}
            <View style={styles.leftProfilePhoto}>
              <View style={[styles.compactAvatarContainer, { backgroundColor: '#ffffff' }]}>
                {avatar ? (
                  <Image source={{ uri: avatar }} style={styles.compactAvatar} />
                ) : (
                  <View style={[styles.compactAvatarPlaceholder, { backgroundColor: connectionColor }]}>
                    <Text style={styles.compactAvatarText}>
                      {name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={[styles.statusDot, { backgroundColor: designTokens.semantic.success }]} />
              </View>
            </View>

            {/* Profile Info - Right Side */}
            <View style={styles.compactProfileInfo}>
              <Text style={[styles.compactName, { color: themeColors.text }]}>
                {name}
              </Text>
              <View style={styles.compactMeta}>
                <View style={[styles.energyBadge, { backgroundColor: themeColors.surfaces.sunken }]}>
                  <Text style={[styles.energyText, { color: themeColors.text }]}>
                    {connectionQualia?.energy || 'Friendly soul'}
                  </Text>
                </View>
                <Text style={[styles.timingText, { color: themeColors.textMuted }]}>
                  {getTimingIndicator()}
                </Text>
              </View>
              
              {/* Shared Interests - Inline */}
              <View style={styles.compactInterests}>
                {sharedInterests.slice(0, 2).map((interest, index) => (
                  <View key={index} style={[styles.compactInterestTag, { backgroundColor: themeColors.surfaces.sunken }]}>
                    <Text style={[styles.compactInterestText, { color: themeColors.text }]}>
                      {interest}
                    </Text>
                  </View>
                ))}
                {sharedInterests.length > 2 && (
                  <Text style={[styles.moreInterests, { color: themeColors.textMuted }]}>
                    +{sharedInterests.length - 2}
                  </Text>
                )}
              </View>
            </View>

            {/* Quick Action Button */}
            <TouchableOpacity
              style={[styles.quickConnectButton, { backgroundColor: connectionColor }]}
              onPress={handleConnectPress}
            >
              <Text style={styles.quickConnectText}>Connect</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    marginVertical: spacing[2],
    overflow: 'hidden',
  },

  // Banner Section - Much Shorter
  bannerContainer: {
    height: 60,
    position: 'relative',
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  qualiaBanner: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
    alignItems: 'flex-end',
  },
  qualiaContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  qualiaIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  qualiaVibe: {
    ...typography.textStyles.caption,
    fontWeight: '600',
    fontSize: 10,
    textAlign: 'center',
  },

  // Compact Profile Section
  compactProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    paddingTop: spacing[2],
  },

  // Left Profile Photo - Smaller
  leftProfilePhoto: {
    marginRight: spacing[3],
  },
  compactAvatarContainer: {
    position: 'relative',
    borderRadius: 30,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  compactAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  compactAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactAvatarText: {
    ...typography.textStyles.body,
    color: '#ffffff',
    fontWeight: '700',
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
  },

  // Profile Info - Compact
  compactProfileInfo: {
    flex: 1,
    marginRight: spacing[2],
  },
  compactName: {
    ...typography.textStyles.headlineSmall,
    fontWeight: '600',
    marginBottom: spacing[1],
  },
  compactMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
    gap: spacing[2],
  },
  energyBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: spacing[2],
  },
  energyText: {
    ...typography.textStyles.caption,
    fontWeight: '500',
    fontSize: 10,
  },
  timingText: {
    ...typography.textStyles.caption,
    fontSize: 10,
    fontStyle: 'italic',
    flex: 1,
  },
  compactInterests: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  compactInterestTag: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: 8,
  },
  compactInterestText: {
    ...typography.textStyles.caption,
    fontSize: 10,
    fontWeight: '500',
  },
  moreInterests: {
    ...typography.textStyles.caption,
    fontSize: 10,
    fontStyle: 'italic',
  },

  // Quick Connect Button
  quickConnectButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 12,
    minWidth: 70,
    alignItems: 'center',
  },
  quickConnectText: {
    ...typography.textStyles.caption,
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 11,
  },


});

export default ConnectionCard;