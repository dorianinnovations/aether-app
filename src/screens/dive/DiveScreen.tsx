/**
 * Dive Screen - Deep Music Discovery
 * A clean, minimal space for exploring music in new ways
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  StatusBar,
  Platform,
  Dimensions,
  SafeAreaView,
  Animated,
  PanResponder,
  Modal,
  ScrollView,
  Switch,
} from 'react-native';
import LottieView from 'lottie-react-native';
// Navigation removed - not used in current implementation
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { musicApi, TrackData } from '../../services/apiModules/endpoints/music';

// Design System
import { PageBackground, Slider } from '../../design-system/components/atoms';
import { HeaderMenu } from '../../design-system/components/organisms';
import { AnimatedHamburger, FloatingActionButton, FloatingButtonSeparator } from '../../design-system/components/atoms';
import { FloatingButtonBar } from '../../design-system/components/molecules';

// Design Tokens
import { designTokens } from '../../design-system/tokens/colors';
import { typography } from '../../design-system/tokens/typography';
import { spacing } from '../../design-system/tokens/spacing';

// Hooks
import { useTheme } from '../../contexts/ThemeContext';
import { useHeaderMenu } from '../../design-system/hooks';

// Types (removed unused ThemeColors import)

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Minimal witty loading messages
const loadingMessages = [
  'vibes incoming',
  'hunting gems',
  'sonic magic',
  'digging deep',
  'pure heat',
  "chef's kiss",
  'next banger',
  'taste test',
  'fire loading',
  'vibe check',
  'mood decoded',
];

const DiveScreen: React.FC = () => {
  const { colors: themeColors, theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const headerMenu = useHeaderMenu();

  // Map theme colors to expected format
  const colors = {
    ...themeColors,
    primary: designTokens.brand.primary,
    textTertiary: themeColors.textMuted,
    textPrimary: themeColors.text,
    textSecondary: themeColors.textSecondary || themeColors.textMuted,
    surfaces: {
      base: themeColors.surface,
      elevated: themeColors.surface,
      sunken: themeColors.background,
      highlight: designTokens.brand.primary + '10',
      shadow: isDarkMode ? '#00000040' : '#0000001A',
    },
    borders: {
      default: themeColors.borders?.default || designTokens.borders[theme].default,
      muted: themeColors.borders?.subtle || designTokens.borders[theme].subtle,
      primary: designTokens.brand.primary,
    },
    pageBackground: themeColors.background,
  };

  // State
  const [hamburgerOpen, setHamburgerOpen] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // Music discovery state
  const [currentTrack, setCurrentTrack] = useState<TrackData | null>(null);
  const [trackQueue, setTrackQueue] = useState<TrackData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  
  // User preferences state
  const [preferences, setPreferences] = useState({
    danceability: 0.7,
    energy: 0.8, 
    valence: 0.6,
    tempo: 0.5,
    acousticness: 0.3,
    instrumentalness: 0.2,
    speechiness: 0.1,
    loudness: 0.5
  });
  
  // Music feature ranges
  const [, setRanges] = useState({
    danceability: { min: 0.0, max: 1.0 },
    energy: { min: 0.0, max: 1.0 },
    valence: { min: 0.0, max: 1.0 },
    tempo: { min: 60, max: 200 },
    acousticness: { min: 0.0, max: 1.0 },
    instrumentalness: { min: 0.0, max: 1.0 },
    speechiness: { min: 0.0, max: 1.0 },
    loudness: { min: -30, max: 0 }
  });
  
  const [settings, setSettings] = useState({
    adaptiveLearning: true,
    explorationFactor: 0.2,
    diversityBoost: 0.1,
    hapticFeedback: true,
    animationSpeed: 1.0
  });
  
  // User music profile
  const [, setUserProfile] = useState<any>(null);
  
  // Simple animations
  const pan = useRef(new Animated.ValueXY()).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  // Revolutionary PanResponder with emotional feedback
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 15 || Math.abs(gestureState.dy) > 15;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        
        // Simple grab haptic
        if (settings.hapticFeedback) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        
        // Simple position tracking
        pan.setValue({ 
          x: dx, 
          y: dy * 0.1  // Minimal vertical movement
        });
        
        // Simple rotation based on direction
        const rotationValue = (dx / screenWidth) * 15;
        rotation.setValue(rotationValue);
      },
      onPanResponderRelease: (evt, gestureState) => {
        pan.flattenOffset();
        
        const { dx, vx } = gestureState;
        const threshold = screenWidth * 0.2;
        const velocity = Math.abs(vx);
        const isSignificantSwipe = Math.abs(dx) > threshold || velocity > 1.0;
        
        if (isSignificantSwipe) {
          const direction = dx > 0 ? 1 : -1;
          const isLove = direction > 0;
          
          // Submit feedback for current track
          if (currentTrack?.id) {
            const rating = isLove ? 0.8 : 0.2;
            submitFeedback(rating, currentTrack.id);
          }
          
          // Simple haptic feedback
          if (settings.hapticFeedback) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          
          // Quick exit animation - just slide off screen
          Animated.parallel([
            Animated.timing(pan.x, {
              toValue: screenWidth * 1.2 * direction,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            // Load next track immediately
            loadNextTrack();
            
            // Reset for next card
            pan.setValue({ x: 0, y: 0 });
            rotation.setValue(0);
            opacity.setValue(1);
            scale.setValue(1);
          });
        } else {
          // Quick snap back
          Animated.parallel([
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: true,
              tension: 300,
              friction: 10,
            }),
            Animated.spring(rotation, {
              toValue: 0,
              useNativeDriver: true,
              tension: 300,
              friction: 10,
            }),
          ]).start();
        }
      },
    })
  ).current;

  // Music discovery functions
  const discoverMusic = useCallback(async () => {
    try {
      setIsLoading(true);
      // Set a random loading message
      const randomMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
      setLoadingMessage(randomMessage);
      
      const response = await musicApi.discoverMusic({
        preferences,
        count: 5
      });
      
      if (response.songs && response.songs.length > 0) {
        // Use discovered tracks directly (ranking disabled until endpoint is stable)
        setTrackQueue(response.songs);
        setCurrentTrack(response.songs[0]);
      }
    } catch (error) {
      console.error('Failed to discover music:', error);
    } finally {
      setIsLoading(false);
    }
  }, [preferences]);
  
  const submitFeedback = useCallback(async (rating: number, trackId: string) => {
    try {
      await musicApi.submitFeedback({
        trackId,
        rating,
        feedback: rating > 0.5 ? 'loved_it' : 'disliked_it'
      });
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  }, []);
  
  const rankTracks = useCallback(async (tracks: TrackData[]) => {
    try {
      const response = await musicApi.rankTracks(tracks);
      return response.rankedTracks || tracks;
    } catch (error) {
      // Ranking is optional - if it fails, just return original tracks
      // Don't log error since this might be expected if endpoint doesn't exist
      return tracks; 
    }
  }, []);

  const loadNextTrack = useCallback(() => {
    if (trackQueue.length > 1) {
      const newQueue = trackQueue.slice(1);
      setTrackQueue(newQueue);
      setCurrentTrack(newQueue[0]);
      
      // Preload more tracks if running low
      if (newQueue.length <= 2) {
        discoverMusic();
      }
    } else {
      // Load new tracks
      discoverMusic();
    }
  }, [trackQueue, discoverMusic]);
  
  const updatePreferences = useCallback(async (newPreferences: any) => {
    try {
      await musicApi.updateWeights(newPreferences);
      setPreferences(newPreferences);
    } catch (error) {
      console.error('Failed to update music weights:', error);
      // Still update local state so UI remains responsive
      setPreferences(newPreferences);
    }
  }, []);
  
  const updateSettings = useCallback(async (newSettings: any) => {
    try {
      // Extract only the relevant fields for the API
      const apiSettings = {
        adaptiveLearning: newSettings.adaptiveLearning,
        explorationFactor: newSettings.explorationFactor,
        diversityBoost: newSettings.diversityBoost,
        feedbackSensitivity: newSettings.feedbackSensitivity || 0.5,
      };
      await musicApi.updatePreferences(apiSettings);
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to update discovery settings:', error);
      // Still update local state so UI remains responsive
      setSettings(newSettings);
    }
  }, []);

  // Range updates integrated with settings loading - function preserved for future use
  const updateRanges = useCallback(async (newRanges: any) => {
    try {
      await musicApi.updateRanges(newRanges);
      setRanges(newRanges);
    } catch (error) {
      console.error('Failed to update music ranges:', error);
    }
  }, [setRanges]);

  const loadUserProfile = useCallback(async () => {
    try {
      const response = await musicApi.getProfile();
      const profileData = response?.data || response;
      setUserProfile(profileData);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      // Profile loading is optional - continue without it
    }
  }, []);

  const loadUserSettings = useCallback(async () => {
    try {
      const response = await musicApi.getSettings();
      // Handle different possible response structures
      const profile = response?.data || response;
      
      if (profile) {
        // Update preferences from user profile with safe access
        if (profile.customWeights && typeof profile.customWeights === 'object') {
          setPreferences(prevPrefs => ({
            ...prevPrefs,
            ...profile.customWeights,
          }));
        }
        
        // Update ranges from user profile with safe access
        if (profile.featureRanges && typeof profile.featureRanges === 'object') {
          setRanges(profile.featureRanges);
        }
        
        // Update settings from user profile with safe access
        setSettings(prevSettings => ({
          ...prevSettings,
          adaptiveLearning: profile.adaptiveLearning ?? prevSettings.adaptiveLearning,
          explorationFactor: profile.explorationFactor ?? prevSettings.explorationFactor,
          diversityBoost: profile.diversityBoost ?? prevSettings.diversityBoost,
        }));
      }
    } catch (error) {
      console.error('Failed to load user settings:', error);
      // Continue with default settings - don't break the app
    }
  }, []);

  // Load initial music and user settings on mount
  useEffect(() => {
    // Load settings first, then music discovery
    loadUserSettings().finally(() => {
      discoverMusic();
    });
    
    // Load profile separately (optional)
    loadUserProfile();
  }, [loadUserSettings, loadUserProfile, discoverMusic]);

  // Reset hamburger animation when header menu closes
  useEffect(() => {
    if (!headerMenu.showHeaderMenu) {
      setHamburgerOpen(false);
    }
  }, [headerMenu.showHeaderMenu]);

  return (
    <PageBackground theme={theme} variant="dive">
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />

        {/* Main Content */}
        <View style={styles.content}>
          {/* Main Dive Card */}
          <View style={[styles.diveCard, { 
            backgroundColor: isDarkMode ? 'rgba(51, 51, 51, 0.8)' : 'rgba(255, 255, 255, 0.9)',
            borderColor: isDarkMode ? 'rgba(85, 85, 85, 0.6)' : 'rgba(221, 221, 221, 0.6)',
            shadowColor: isDarkMode ? '#000000' : '#000000',
          }]}>
            <Text style={[styles.diveTitle, { 
              color: isDarkMode ? '#FFFFFF' : '#1A1A1A',
              fontFamily: typography.fonts.mozillaHeadline,
            }]}>
              Discover Engine
            </Text>
            <Text style={[styles.diveSubtitle, { 
              color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(26, 26, 26, 0.8)',
              fontFamily: typography.fonts.mozillaText,
            }]}>
Set your vibe, swipe for magic, tweak the formula, keep swiping—we're hunting for that one track you'll never get 
  tired of.            </Text>
          </View>

          {/* Revolutionary Mini Player Card */}
          <Animated.View 
            style={[
              styles.bottomCard, 
              {
                backgroundColor: isDarkMode ? 'rgba(51, 51, 51, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                borderColor: isDarkMode ? 'rgba(85, 85, 85, 0.6)' : 'rgba(221, 221, 221, 0.6)',
                shadowColor: isDarkMode ? '#000000' : '#000000',
                shadowOffset: { width: 0, height: -8 },
                shadowOpacity: 0.15,
                shadowRadius: 16,
                elevation: 8,
                transform: [
                  { translateX: pan.x },
                  { translateY: pan.y },
                  { scale: scale },
                  { 
                    rotate: rotation.interpolate({
                      inputRange: [-100, 100],
                      outputRange: ['-15deg', '15deg'],
                      extrapolate: 'clamp',
                    })
                  }
                ],
                opacity: opacity,
              }
            ]}
            {...panResponder.panHandlers}
          >
            <View style={styles.miniPlayer}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <LottieView
                    source={require('../../../assets/AetherSpinner.json')}
                    autoPlay
                    loop
                    style={styles.loadingSpinner}
                  />
                  <Text style={[styles.loadingText, {
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(26, 26, 26, 0.7)',
                    fontFamily: typography.fonts.mozillaText,
                  }]}>
                    {loadingMessage}
                  </Text>
                </View>
              ) : currentTrack ? (
                <>
                  <Text style={[styles.trackTitle, { 
                    color: isDarkMode ? '#FFFFFF' : '#1A1A1A',
                    fontFamily: typography.fonts.mozillaHeadline,
                  }]}>
                    {currentTrack.name}
                  </Text>
                  <Text style={[styles.trackArtist, { 
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(26, 26, 26, 0.6)',
                    fontFamily: typography.fonts.mozillaText,
                  }]}>
                    {currentTrack.artist}
                  </Text>
                  <Text style={[styles.trackAlbum, { 
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(26, 26, 26, 0.4)',
                    fontFamily: typography.fonts.mozillaText,
                  }]}>
                    {currentTrack.album}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.trackTitle, { 
                    color: isDarkMode ? '#FFFFFF' : '#1A1A1A',
                    fontFamily: typography.fonts.mozillaHeadline,
                  }]}>
                    Purple Rain
                  </Text>
                  <Text style={[styles.trackArtist, { 
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(26, 26, 26, 0.6)',
                    fontFamily: typography.fonts.mozillaText,
                  }]}>
                    Prince
                  </Text>
                  <Text style={[styles.trackAlbum, { 
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(26, 26, 26, 0.4)',
                    fontFamily: typography.fonts.mozillaText,
                  }]}>
                    Purple Rain
                  </Text>
                </>
              )}
            </View>
          </Animated.View>
        </View>

        {/* Floating Action Buttons - Conjoined Style */}
        <FloatingButtonBar
          theme={theme}
          slideAnimation={new Animated.Value(0)}
          visible={!headerMenu.showHeaderMenu}
        >
          {/* Settings Button */}
          <FloatingActionButton
            iconName="settings-outline"
            iconColor={theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)'}
            onPress={() => setShowSettingsModal(true)}
            theme={theme}
          />

          <FloatingButtonSeparator theme={theme} />

          {/* Menu/Hamburger Button */}
          <FloatingActionButton
            iconName="menu"
            onPress={() => {
              setHamburgerOpen(!hamburgerOpen);
              setTimeout(() => {
                headerMenu.open();
              }, 150);
            }}
            theme={theme}
          >
            <AnimatedHamburger
              isOpen={hamburgerOpen}
              color={theme === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)'}
              size={22}
            />
          </FloatingActionButton>
        </FloatingButtonBar>

        {/* Header Menu */}
        <HeaderMenu
          visible={headerMenu.showHeaderMenu}
          onClose={headerMenu.close}
          onAction={headerMenu.handleMenuAction}
        />

        {/* Full-Screen Settings Modal */}
        <Modal
          visible={showSettingsModal}
          animationType="slide"
          presentationStyle="fullScreen"
        >
          <SafeAreaView style={[styles.modalContainer, {
            backgroundColor: colors.pageBackground,
          }]}>
            <StatusBar
              barStyle={isDarkMode ? 'light-content' : 'dark-content'}
              backgroundColor="transparent"
              translucent
            />
            
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {
                color: colors.textPrimary,
                fontFamily: typography.fonts.mozillaHeadline,
              }]}>
                Settings
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowSettingsModal(false);
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={colors.textPrimary}
                />
              </TouchableOpacity>
            </View>

            {/* Settings Content */}
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              
              {/* Audio Settings */}
              <View style={[styles.settingsSection, {
                backgroundColor: isDarkMode ? 'rgba(51, 51, 51, 0.6)' : 'rgba(255, 255, 255, 0.8)',
                borderColor: isDarkMode ? 'rgba(85, 85, 85, 0.4)' : 'rgba(221, 221, 221, 0.4)',
              }]}>
                <Text style={[styles.sectionTitle, {
                  color: colors.textPrimary,
                  fontFamily: typography.fonts.mozillaText,
                }]}>
                  Music Taste
                </Text>
                <Slider
                  label="Rhythm & Groove"
                  description="How danceable and rhythmic you want your music"
                  value={preferences.danceability}
                  onValueChange={(value) => updatePreferences({ ...preferences, danceability: value })}
                  theme={theme}
                  colors={colors}
                  unit="%"
                />
                <Slider
                  label="Intensity & Power"
                  description="From chill vibes to high-energy bangers"
                  value={preferences.energy}
                  onValueChange={(value) => updatePreferences({ ...preferences, energy: value })}
                  theme={theme}
                  colors={colors}
                  unit="%"
                />
                <Slider
                  label="Mood & Vibe"
                  description="Happy uplifting tracks vs deep emotional songs"
                  value={preferences.valence}
                  onValueChange={(value) => updatePreferences({ ...preferences, valence: value })}
                  theme={theme}
                  colors={colors}
                  unit="%"
                />
                <Slider
                  label="Natural vs Electronic"
                  description="Acoustic instruments vs synthesized sounds"
                  value={preferences.acousticness}
                  onValueChange={(value) => updatePreferences({ ...preferences, acousticness: value })}
                  theme={theme}
                  colors={colors}
                  unit="%"
                />
              </View>

              {/* Discovery Settings */}
              <View style={[styles.settingsSection, {
                backgroundColor: isDarkMode ? 'rgba(51, 51, 51, 0.6)' : 'rgba(255, 255, 255, 0.8)',
                borderColor: isDarkMode ? 'rgba(85, 85, 85, 0.4)' : 'rgba(221, 221, 221, 0.4)',
              }]}>
                <Text style={[styles.sectionTitle, {
                  color: colors.textPrimary,
                  fontFamily: typography.fonts.mozillaText,
                }]}>
                  Discovery Settings
                </Text>
                <Slider
                  label="Adventure Mode"
                  description="How often to discover completely new styles"
                  value={settings.explorationFactor}
                  onValueChange={(value) => updateSettings({ ...settings, explorationFactor: value })}
                  theme={theme}
                  colors={colors}
                  unit="%"
                />
                <Slider
                  label="Genre Variety"
                  description="Mix different genres vs stay within favorites"
                  value={settings.diversityBoost}
                  onValueChange={(value) => updateSettings({ ...settings, diversityBoost: value })}
                  theme={theme}
                  colors={colors}
                  unit="%"
                />
                <View style={styles.settingRow}>
                  <Text style={[styles.settingLabel, { color: colors.textSecondary }]}>
                    Learn From My Taste
                  </Text>
                  <Switch
                    value={settings.adaptiveLearning}
                    onValueChange={(value) => updateSettings({ ...settings, adaptiveLearning: value })}
                    trackColor={{ 
                      false: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)', 
                      true: colors.primary 
                    }}
                    thumbColor={settings.adaptiveLearning ? '#ffffff' : '#f4f3f4'}
                  />
                </View>
              </View>

              {/* Interface Settings */}
              <View style={[styles.settingsSection, {
                backgroundColor: isDarkMode ? 'rgba(51, 51, 51, 0.6)' : 'rgba(255, 255, 255, 0.8)',
                borderColor: isDarkMode ? 'rgba(85, 85, 85, 0.4)' : 'rgba(221, 221, 221, 0.4)',
              }]}>
                <Text style={[styles.sectionTitle, {
                  color: colors.textPrimary,
                  fontFamily: typography.fonts.mozillaText,
                }]}>
                  Experience
                </Text>
                <View style={styles.settingRow}>
                  <Text style={[styles.settingLabel, { color: colors.textSecondary }]}>
                    Touch Feedback
                  </Text>
                  <Switch
                    value={settings.hapticFeedback}
                    onValueChange={(value) => setSettings({ ...settings, hapticFeedback: value })}
                    trackColor={{ 
                      false: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)', 
                      true: colors.primary 
                    }}
                    thumbColor={settings.hapticFeedback ? '#ffffff' : '#f4f3f4'}
                  />
                </View>
                <Slider
                  label="Interface Speed"
                  description="How fast animations and transitions feel"
                  value={settings.animationSpeed}
                  onValueChange={(value) => setSettings({ ...settings, animationSpeed: value })}
                  minimumValue={0.5}
                  maximumValue={2.0}
                  theme={theme}
                  colors={colors}
                  unit="x"
                />
              </View>

            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </PageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: Platform.OS === 'android' 
      ? (StatusBar.currentHeight || 0) + 10 
      : 20,
    paddingHorizontal: spacing.xl,
  },
  diveCard: {
    width: screenWidth * 0.92,
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: 16,
    borderWidth: 0.5,
    alignSelf: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  diveTitle: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  diveSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    letterSpacing: -0.3,
    lineHeight: 20,
  },
  bottomCard: {
    position: 'absolute',
    bottom: -50,
    left: 0,
    right: 0,
    height: screenHeight * 0.35,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl * 2,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 0.5,
    borderBottomWidth: 0,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  miniPlayer: {
    alignItems: 'flex-start',
    width: '100%',
  },
  trackTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  trackAlbum: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  
  
  // Settings Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingTop: Platform.OS === 'android' 
      ? (StatusBar.currentHeight || 0) + spacing.lg 
      : spacing.lg,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  settingsSection: {
    marginBottom: spacing.xl,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.lg,
    letterSpacing: -0.3,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '400',
    flex: 1,
    letterSpacing: -0.2,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  loadingSpinner: {
    width: 24,
    height: 24,
  },
  loadingText: {
    marginTop: spacing.xs,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});

export default DiveScreen;