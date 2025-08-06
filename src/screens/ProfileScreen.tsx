import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// Design System
import { PageBackground } from '../design-system/components/atoms/PageBackground';
import { LottieLoader } from '../design-system/components/atoms/LottieLoader';
import { Header, HeaderMenu, SignOutModal } from '../design-system/components/organisms';
import { SpotifyIntegration } from '../design-system/components/molecules';
import SettingsModal from './chat/SettingsModal';
import { useTheme } from '../contexts/ThemeContext';
import { useHeaderMenu } from '../design-system/hooks';
import { typography } from '../design-system/tokens/typography';
import { spacing } from '../design-system/tokens/spacing';
import { logger } from '../utils/logger';
// import { getButtonColors } from '../design-system/tokens/colors';

// Services
import { UserAPI, TokenManager, AuthAPI, FriendsAPI } from '../services/api';

// Hooks
import { useSocialProxy } from '../hooks/useSocialProxy';

interface UserProfile {
  profilePicture?: string;
  bannerImage?: string;
  name?: string;
  email: string;
  id: string;
  bio?: string;
  location?: string;
  website?: string;
  username?: string;
}

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, colors } = useTheme();
  
  const [editMode, setEditMode] = useState(false);
  const [viewMode, setViewMode] = useState<'basic' | 'busy'>('basic');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [shouldRenderSignOutModal, setShouldRenderSignOutModal] = useState(false);
  const [showAnalysisData, setShowAnalysisData] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Animation refs for sequential fade-in
  const interestsOpacity = useRef(new Animated.Value(0)).current;
  const communicationOpacity = useRef(new Animated.Value(0)).current;
  const statsOpacity = useRef(new Animated.Value(0)).current;
  const lastAnalyzedOpacity = useRef(new Animated.Value(0)).current;

  // ScrollView and Qualia section refs
  const scrollViewRef = useRef<ScrollView>(null);
  const qualiaViewRef = useRef<View>(null);

  // Social proxy hook for living profile data
  const { profile: socialProfile } = useSocialProxy();

  // Header menu hook
  const { showHeaderMenu, setShowHeaderMenu, handleMenuAction, toggleHeaderMenu } = useHeaderMenu({
    screenName: 'profile',
    onSettingsPress: () => setShowSettingsModal(true),
    onSignOut: () => setShowSignOutModal(true)
  });

  // Manage SignOutModal lifecycle - fixed to prevent useInsertionEffect warnings
  useEffect(() => {
    if (showSignOutModal && !shouldRenderSignOutModal) {
      setShouldRenderSignOutModal(true);
    } else if (!showSignOutModal && shouldRenderSignOutModal) {
      // Only set timeout if modal was actually rendered
      const timer = setTimeout(() => {
        setShouldRenderSignOutModal(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showSignOutModal, shouldRenderSignOutModal]);

  useEffect(() => {
    const initializeProfile = async () => {
      // Check if authenticated before making API calls
      const token = await TokenManager.getToken();
      if (token) {
        loadProfile();
        // TODO: Load social proxy profile data
        // fetchSocialProxyProfile();
      }
    };
    
    initializeProfile();
  }, []);

  const handleNavigateBack = () => {
    navigation.goBack();
  };

  const handleMenuPress = () => {
    toggleHeaderMenu();
  };

  const handleSignOut = async () => {
    try {
      await AuthAPI.logout();
      // Auth check in App.tsx will handle navigation automatically
    } catch (error) {
      logger.error('Sign out error:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
      throw error; // Re-throw to let SignOutModal handle error state
    }
  };

  const loadProfile = async () => {
    // Check authentication first
    const token = await TokenManager.getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [profileResponse, usernameResponse] = await Promise.all([
        UserAPI.getProfile(),
        FriendsAPI.getUserUsername().catch(() => ({ username: null }))
      ]);
      
      if (profileResponse.status === 'success' && (profileResponse.data?.user || profileResponse.data?.data?.user)) {
        const userData = profileResponse.data?.user || profileResponse.data?.data?.user;
        setProfile({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          bio: userData.bio,
          location: userData.location,
          website: userData.website,
          profilePicture: profileResponse.data.profilePicture,
          bannerImage: profileResponse.data.bannerImage,
          username: usernameResponse.username || userData.username,
        });
      } else {
        logger.error('Profile response missing user data:', profileResponse);
        throw new Error('Profile data is incomplete');
      }
    } catch (error: any) {
      logger.error('Error loading profile:', error);
      // Don't show error for auth failures
      if (error.status !== 401) {
        Alert.alert('Error', 'Failed to load profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!profile) return;
    
    try {
      setLoading(true);
      
      // Prepare profile data for server
      const profileData = {
        name: profile.name,
        bio: profile.bio,
        location: profile.location,
        website: profile.website,
      };
      
      const response = await UserAPI.updateProfile(profileData);
      
      if (response.status === 'success' || response.success) {
        Alert.alert('Success', 'Profile updated successfully!');
        setEditMode(false);
        // Optionally refresh profile data
        await loadProfile();
      } else {
        Alert.alert('Error', response.message || 'Failed to save profile changes.');
      }
    } catch (error: any) {
      logger.error('Error saving profile:', error);
      const errorMessage = error.message || 'Failed to save profile. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant photo library permissions.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      try {
        setUploading(true);
        const response = await UserAPI.uploadProfilePicture(result.assets[0].uri);
        
        if (response.status === 'success') {
          // Update local profile state with new picture
          setProfile(prev => prev ? {
            ...prev,
            profilePicture: response.data.profilePicture
          } : null);
          Alert.alert('Success', 'Profile picture updated successfully!');
        }
      } catch (error) {
        logger.error('Error uploading profile picture:', error);
        Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
      } finally {
        setUploading(false);
      }
    }
  };

  const pickBannerImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant photo library permissions.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      try {
        setUploading(true);
        const response = await UserAPI.uploadBannerImage(result.assets[0].uri);
        
        if (response.status === 'success') {
          // Update local profile state with new banner
          setProfile(prev => prev ? {
            ...prev,
            bannerImage: response.data.bannerImage
          } : null);
          Alert.alert('Success', 'Banner image updated successfully!');
        }
      } catch (error) {
        logger.error('Error uploading banner image:', error);
        Alert.alert('Error', 'Failed to upload banner image. Please try again.');
      } finally {
        setUploading(false);
      }
    }
  };

  const deleteProfilePicture = async () => {
    Alert.alert(
      'Delete Profile Picture',
      'Are you sure you want to remove your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setUploading(true);
              await UserAPI.deleteProfilePicture();
              
              // Update local profile state
              setProfile(prev => prev ? {
                ...prev,
                profilePicture: undefined
              } : null);
              Alert.alert('Success', 'Profile picture deleted successfully!');
            } catch (error) {
              logger.error('Error deleting profile picture:', error);
              Alert.alert('Error', 'Failed to delete profile picture. Please try again.');
            } finally {
              setUploading(false);
            }
          }
        }
      ]
    );
  };

  const deleteBannerImage = async () => {
    Alert.alert(
      'Delete Banner Image',
      'Are you sure you want to remove your banner image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setUploading(true);
              await UserAPI.deleteBannerImage();
              
              // Update local profile state
              setProfile(prev => prev ? {
                ...prev,
                bannerImage: undefined
              } : null);
              Alert.alert('Success', 'Banner image deleted successfully!');
            } catch (error) {
              logger.error('Error deleting banner image:', error);
              Alert.alert('Error', 'Failed to delete banner image. Please try again.');
            } finally {
              setUploading(false);
            }
          }
        }
      ]
    );
  };

  const handleFieldChange = (field: keyof UserProfile, value: string) => {
    if (!profile) return;
    setProfile(prev => prev ? ({
      ...prev,
      [field]: value
    }) : null);
  };

  // Sequential animation function
  const animateAnalysisItems = () => {
    // Reset all animations
    interestsOpacity.setValue(0);
    communicationOpacity.setValue(0);
    statsOpacity.setValue(0);
    lastAnalyzedOpacity.setValue(0);

    // Sequential animations with stagger
    const animations = [
      Animated.timing(interestsOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(communicationOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(statsOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(lastAnalyzedOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ];

    // Stagger each animation by 150ms
    animations.forEach((animation, index) => {
      setTimeout(() => animation.start(), index * 150);
    });
  };

  // Scroll to Qualia section
  const scrollToQualia = () => {
    if (qualiaViewRef.current && scrollViewRef.current) {
      qualiaViewRef.current.measure((x, y, width, height, pageX, pageY) => {
        // Calculate position to center the Qualia section on screen
        const screenHeight = Dimensions.get('window').height;
        const scrollToY = Math.max(0, pageY - (screenHeight * 0.3)); // Position 30% from top
        
        scrollViewRef.current?.scrollTo({
          y: scrollToY,
          animated: true,
        });
      });
    }
  };

  // Handle Qualia section toggle
  const toggleAnalysisData = () => {
    const newValue = !showAnalysisData;
    setShowAnalysisData(newValue);
    
    if (newValue) {
      // Scroll to section and start animations when expanding
      setTimeout(() => scrollToQualia(), 50);
      setTimeout(() => animateAnalysisItems(), 200);
    }
  };

  // Handle view mode toggle
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'basic' ? 'busy' : 'basic');
  };

  if (loading) {
    return (
      <PageBackground theme={theme} variant="profile">
        <SafeAreaView style={styles.container}>
          <StatusBar 
            barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} 
            backgroundColor="transparent"
            translucent={true}
          />
          <Header 
            title="Aether"
            showBackButton={true}
            showMenuButton={true}
            onBackPress={handleNavigateBack}
            onMenuPress={handleMenuPress}
            isMenuOpen={showHeaderMenu}
            theme={theme}
          />
          <View style={styles.loadingContainer}>
            <LottieLoader size="large" />
          </View>
        </SafeAreaView>
      </PageBackground>
    );
  }

  if (!profile) {
    return (
      <PageBackground theme={theme} variant="profile">
        <SafeAreaView style={styles.container}>
          <StatusBar 
            barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} 
            backgroundColor="transparent"
            translucent={true}
          />
          <Header 
            title="Aether"
            showBackButton={true}
            showMenuButton={true}
            onBackPress={handleNavigateBack}
            onMenuPress={handleMenuPress}
            isMenuOpen={showHeaderMenu}
            theme={theme}
          />
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.text }]}>Failed to load profile</Text>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={loadProfile}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </PageBackground>
    );
  }

  return (
    <PageBackground theme={theme} variant="profile">
      <SafeAreaView style={styles.container}>
          <StatusBar 
            barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} 
            backgroundColor="transparent"
            translucent={true}
          />
          
          <Header 
            title="Aether"
            showBackButton={true}
            showMenuButton={true}
            onBackPress={handleNavigateBack}
            onMenuPress={handleMenuPress}
            isMenuOpen={showHeaderMenu}
            theme={theme}
            rightIcon={
              <TouchableOpacity
                onPress={editMode ? saveProfile : () => setEditMode(true)}
                activeOpacity={0.7}
                style={styles.headerIcon}
              >
                <Feather 
                  name={editMode ? 'save' : 'edit'} 
                  size={18} 
                  color={colors.text}
                />
              </TouchableOpacity>
            }
            onRightPress={() => {}}
          />

          <ScrollView 
            ref={scrollViewRef}
            style={styles.scrollView} 
            contentContainerStyle={styles.scrollContent}
          >
          {/* Profile Banner */}
          <TouchableOpacity 
            style={[styles.profileBanner, { backgroundColor: colors.surface }]}
            onPress={editMode ? pickBannerImage : undefined}
            disabled={uploading || !editMode}
            activeOpacity={editMode ? 0.8 : 1}
          >
            {profile.bannerImage && (
              <Image source={{ uri: profile.bannerImage }} style={styles.bannerImage} />
            )}
            {editMode && (
              <View style={[styles.bannerOverlay, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
                <Feather name="camera" size={24} color="white" />
                <Text style={styles.bannerOverlayText}>Change Banner</Text>
              </View>
            )}
            {/* Delete Banner Button - only show in edit mode and when banner exists */}
            {profile.bannerImage && !uploading && editMode && (
              <TouchableOpacity 
                style={[styles.deleteBannerButton, { backgroundColor: '#98FB98' }]}
                onPress={deleteBannerImage}
              >
                <Feather name="x" size={16} color="#2D5A3D" />
              </TouchableOpacity>
            )}
            {/* Online Status Indicator - more detailed in busy view */}
            <View style={[styles.onlineIndicator, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
              <View style={[styles.onlineDot, { backgroundColor: '#4CAF50' }]} />
              <Text style={[styles.onlineText, { color: '#4CAF50' }]}>
                {viewMode === 'basic' ? 'online' : 'online • active now'}
              </Text>
            </View>
            
            {/* Profile Header */}
            <View style={styles.profileHeader}>
              
              <TouchableOpacity 
                style={styles.profileImageContainer} 
                onPress={editMode ? pickImage : undefined}
                disabled={uploading || !editMode}
              >
                {profile.profilePicture ? (
                  <Image source={{ uri: profile.profilePicture }} style={styles.profileImage} />
                ) : (
                  <View style={[styles.profileImage, styles.placeholderImage, { backgroundColor: colors.surface }]}>
                    <Feather name="user" size={48} color={colors.textSecondary} />
                  </View>
                )}
                {editMode && (uploading ? (
                  <View style={[styles.editImageOverlay, { backgroundColor: '#87CEEB' }]}>
                    <ActivityIndicator size={16} color="white" />
                  </View>
                ) : (
                  <View style={[styles.editImageOverlay, { backgroundColor: '#87CEEB' }]}>
                    <Feather name="camera" size={16} color="white" />
                  </View>
                ))}
                {/* Delete Profile Picture Button - only show in edit mode */}
                {profile.profilePicture && !uploading && editMode && (
                  <TouchableOpacity 
                    style={[styles.deleteImageButton, { backgroundColor: '#98FB98' }]}
                    onPress={deleteProfilePicture}
                  >
                    <Feather name="x" size={14} color="#2D5A3D" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          {/* Profile Fields */}
          <View style={styles.fieldsContainer}>
            {/* Always show username if available */}
            {profile.username && (
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Username</Text>
                <Text style={[styles.fieldValue, { color: colors.text, fontFamily: 'monospace' }]}>
                  @{profile.username}
                </Text>
              </View>
            )}

            {/* Social Proxy Information */}
            {socialProfile && (
              <>
                {/* Current Status */}
                {socialProfile.currentStatus && (
                  <View style={styles.fieldContainer}>
                    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Current Status</Text>
                    <Text style={[styles.fieldValue, { color: colors.text, fontStyle: 'italic' }]}>
                      "{socialProfile.currentStatus}"
                    </Text>
                  </View>
                )}

                {/* Mood & Plans Row */}
                <View style={styles.socialProxyRow}>
                  {socialProfile.mood && (
                    <View style={[styles.moodContainer, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Mood</Text>
                      <Text style={[styles.moodText, { color: colors.text }]}>
                        {socialProfile.mood}
                      </Text>
                    </View>
                  )}
                  
                  {socialProfile.currentPlans && (
                    <View style={[styles.plansContainer, { backgroundColor: colors.surface, flex: 1 }]}>
                      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Plans</Text>
                      <Text style={[styles.fieldValue, { color: colors.text, fontSize: 14 }]}>
                        {socialProfile.currentPlans}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Spotify Integration */}
                {socialProfile.spotify?.connected && (
                  <View style={[styles.spotifyContainer, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                      🎵 Recently Played
                    </Text>
                    {socialProfile.spotify.currentTrack ? (
                      <Text style={[styles.fieldValue, { color: colors.text }]}>
                        {socialProfile.spotify.currentTrack.name} - {socialProfile.spotify.currentTrack.artist}
                      </Text>
                    ) : socialProfile.spotify.recentTracks?.length > 0 ? (
                      <Text style={[styles.fieldValue, { color: colors.text }]}>
                        {socialProfile.spotify.recentTracks[0].name} - {socialProfile.spotify.recentTracks[0].artist}
                      </Text>
                    ) : (
                      <Text style={[styles.fieldValue, { color: colors.textSecondary }]}>
                        No recent activity
                      </Text>
                    )}
                  </View>
                )}
              </>
            )}

            {/* Always show email */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Email</Text>
              <Text style={[styles.fieldValue, { color: colors.text }]}>
                {profile.email}
              </Text>
            </View>

            {/* Always show bio */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Bio</Text>
              {editMode ? (
                <TextInput
                  style={[styles.input, styles.textArea, { 
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.borders.default
                  }]}
                  value={profile.bio || ''}
                  onChangeText={(text) => handleFieldChange('bio', text)}
                  placeholder="Tell us about yourself..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={4}
                />
              ) : (
                <Text style={[styles.fieldValue, { color: colors.text }]}>
                  {profile.bio || 'No bio set'}
                </Text>
              )}
            </View>

            {/* Basic view: Only show location and website if they have values, or in edit mode */}
            {/* Busy view: Always show all fields */}
            {(viewMode === 'busy' || profile.location || editMode) && (
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Location</Text>
                {editMode ? (
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: colors.surface,
                      color: colors.text,
                      borderColor: colors.borders.default
                    }]}
                    value={profile.location || ''}
                    onChangeText={(text) => handleFieldChange('location', text)}
                    placeholder="Enter your location"
                    placeholderTextColor={colors.textSecondary}
                  />
                ) : (
                  <Text style={[styles.fieldValue, { color: colors.text }]}>
                    {profile.location || (viewMode === 'busy' ? 'No location set' : '')}
                  </Text>
                )}
              </View>
            )}

            {(viewMode === 'busy' || profile.website || editMode) && (
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Website</Text>
                {editMode ? (
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: colors.surface,
                      color: colors.text,
                      borderColor: colors.borders.default
                    }]}
                    value={profile.website || ''}
                    onChangeText={(text) => handleFieldChange('website', text)}
                    placeholder="Enter your website URL"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="url"
                    autoCapitalize="none"
                  />
                ) : (
                  <Text style={[styles.fieldValue, { color: colors.text }]}>
                    {profile.website || (viewMode === 'busy' ? 'No website set' : '')}
                  </Text>
                )}
              </View>
            )}

            {/* View Mode Indicator - only in busy mode */}
            {viewMode === 'busy' && (
              <View style={[styles.viewModeIndicator, { 
                backgroundColor: colors.surface,
                borderColor: colors.borders.default
              }]}>
                <Feather name="info" size={16} color={colors.textSecondary} />
                <Text style={[styles.viewModeText, { color: colors.textSecondary }]}>
                  Showing detailed view - switch to Basic to see essential info only
                </Text>
              </View>
            )}

            {/* AI-Learned Personality Insights */}
            {socialProfile?.personality && (
              <View ref={qualiaViewRef} style={styles.analysisSection}>
                <TouchableOpacity
                  style={styles.analysisSectionHeader}
                  onPress={toggleAnalysisData}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.analysisSectionTitle, { color: colors.text }]}>
                    AI Insights
                  </Text>
                  <Feather
                    name={showAnalysisData ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.text}
                  />
                </TouchableOpacity>

                {showAnalysisData && (
                  <View style={styles.analysisContent}>
                    {/* Interests */}
                    {socialProfile?.personality?.interests && socialProfile.personality.interests.length > 0 && (
                      <Animated.View style={[styles.analysisSubsection, { opacity: interestsOpacity }]}>
                        <Text style={[styles.analysisSubtitle, { color: colors.textSecondary }]}>
                          Detected Interests
                        </Text>
                        <View style={styles.interestsContainer}>
                          {socialProfile?.personality?.interests?.slice(0, 6).map((interest: any, index: number) => (
                            <View
                              key={index}
                              style={[styles.interestTag, { 
                                backgroundColor: colors.surface,
                                borderColor: colors.borders.default
                              }]}
                            >
                              <Text style={[styles.interestText, { color: colors.text }]}>
                                {interest.topic}
                              </Text>
                              <Text style={[styles.confidenceText, { color: colors.textSecondary }]}>
                                {Math.round(interest.confidence * 100)}%
                              </Text>
                            </View>
                          ))}
                        </View>
                      </Animated.View>
                    )}

                    {/* Communication Style */}
                    {socialProfile?.personality?.communicationStyle && (
                      <Animated.View style={[styles.analysisSubsection, { opacity: communicationOpacity }]}>
                        <Text style={[styles.analysisSubtitle, { color: colors.textSecondary }]}>
                          Communication Style
                        </Text>
                        <View style={styles.communicationGrid}>
                          {Object.entries(socialProfile?.personality?.communicationStyle || {}).map(([key, value]: [string, any]) => (
                            <View key={key} style={styles.styleItem}>
                              <Text style={[styles.styleLabel, { color: colors.text }]}>
                                {key.charAt(0).toUpperCase() + key.slice(1)}
                              </Text>
                              <View style={[styles.progressBar, { 
                                backgroundColor: theme === 'light' ? '#E0E0E0' : colors.surface 
                              }]}>
                                <View
                                  style={[
                                    styles.progressFill,
                                    {
                                      width: `${value * 100}%`,
                                      backgroundColor: '#4CAF50'
                                    }
                                  ]}
                                />
                              </View>
                              <Text style={[styles.styleValue, { color: colors.textSecondary }]}>
                                {Math.round(value * 100)}%
                              </Text>
                            </View>
                          ))}
                        </View>
                      </Animated.View>
                    )}

                    {/* Profile Statistics */}
                    <Animated.View style={[styles.analysisSubsection, { opacity: statsOpacity }]}>
                      <Text style={[styles.analysisSubtitle, { color: colors.textSecondary }]}>
                        Profile Statistics
                      </Text>
                      <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                          <Text style={[styles.statValue, { color: colors.text }]}>
                            {socialProfile?.personality?.totalMessages || 0}
                          </Text>
                          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                            Messages Analyzed
                          </Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text style={[styles.statValue, { color: colors.text }]}>
                            {socialProfile?.personality?.interests?.length || 0}
                          </Text>
                          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                            Interests Found
                          </Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text style={[styles.statValue, { color: colors.text }]}>
                            {socialProfile?.personality?.lastAnalyzed ? 'Active' : 'Learning'}
                          </Text>
                          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                            AI Status
                          </Text>
                        </View>
                      </View>
                    </Animated.View>

                    {/* Last Analyzed */}
                    {socialProfile?.personality?.lastAnalyzed && (
                      <Animated.View style={[styles.lastAnalyzedContainer, { opacity: lastAnalyzedOpacity }]}>
                        <Text style={[styles.lastAnalyzedText, { color: colors.textSecondary }]}>
                          Last analyzed: {socialProfile?.personality?.lastAnalyzed ? new Date(socialProfile.personality.lastAnalyzed).toLocaleDateString() : 'Never'}
                        </Text>
                      </Animated.View>
                    )}
                  </View>
                )}
              </View>
            )}

          </View>

          {/* Spotify Integration */}
          <SpotifyIntegration 
            onStatusChange={() => {
              // Refresh profile data when Spotify status changes
              loadProfile();
            }}
          />

        </ScrollView>
        

        {/* Header Menu */}
        <HeaderMenu
          visible={showHeaderMenu}
          onClose={() => setShowHeaderMenu(false)}
          onAction={handleMenuAction}
          showAuthOptions={true}
        />

        {/* Floating View Mode Toggle Button */}
        <TouchableOpacity
          onPress={toggleViewMode}
          activeOpacity={0.8}
          style={[styles.fab, { 
            backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.8)',
            borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)',
            shadowColor: theme === 'dark' ? '#000000' : '#000000',
          }]}
        >
          <Feather 
            name={viewMode === 'basic' ? 'layers' : 'minimize-2'} 
            size={18} 
            color={theme === 'dark' ? '#FFFFFF' : '#333333'}
          />
        </TouchableOpacity>

        {/* Sign Out Modal */}
        {shouldRenderSignOutModal && (
          <SignOutModal
            visible={showSignOutModal}
            onClose={() => setShowSignOutModal(false)}
            onConfirm={handleSignOut}
            theme={theme}
          />
        )}
        
        {/* Settings Modal */}
        <SettingsModal
          visible={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          navigation={navigation}
        />
      </SafeAreaView>

      {/* Header Menu */}
      <HeaderMenu
        visible={showHeaderMenu}
        onClose={() => setShowHeaderMenu(false)}
        onAction={handleMenuAction}
        showAuthOptions={true}
      />
    </PageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 120,
    paddingBottom: 40,
  },
  profileBanner: {
    width: '100%',
    marginBottom: spacing[4],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    position: 'relative',
    overflow: 'visible',
    zIndex: 1,
  },
  bannerImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[2],
  },
  bannerOverlayText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  profileHeader: {
    alignItems: 'flex-start',
    paddingVertical: spacing[6],
    paddingHorizontal: spacing[5],
    paddingBottom: 60,
    minHeight: 160,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: -48,
    right: spacing[5],
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  onlineText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'lowercase',
  },
  profileImageContainer: {
    position: 'absolute',
    bottom: -60,
    left: spacing[5],
    zIndex: 100,
    elevation: 10,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  editImageOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldsContainer: {
    paddingHorizontal: spacing[5],
    paddingTop: 80,
  },
  fieldContainer: {
    marginBottom: spacing[5],
  },
  fieldLabel: {
    ...typography.textStyles.bodyMedium,
    fontWeight: '600',
    marginBottom: spacing[2],
  },
  fieldValue: {
    ...typography.textStyles.bodyLarge,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    ...typography.textStyles.bodyLarge,
    minHeight: 50,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  // Header Icon
  headerIcon: {
    padding: spacing[2],
  },
  
  // Floating Action Button
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 64,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    zIndex: 1000,
  },
  
  // View Mode Indicator
  viewModeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 8,
    borderWidth: 1,
    marginTop: spacing[4],
  },
  viewModeText: {
    ...typography.textStyles.caption,
    flex: 1,
    fontStyle: 'italic',
  },
  
  // Loading and error states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingTop: 100,
  },
  errorText: {
    ...typography.textStyles.bodyLarge,
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  retryButton: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: 12,
  },
  retryButtonText: {
    color: 'white',
    ...typography.textStyles.bodyMedium,
    fontWeight: '600',
  },
  
  // Profile picture delete button
  deleteImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  
  // Banner delete button
  deleteBannerButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  deleteImageText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Field hint text
  fieldHint: {
    fontSize: 12,
    marginTop: spacing[1],
    fontStyle: 'italic',
  },

  // AI Analysis Section Styles
  analysisSection: {
    marginTop: spacing[6],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  analysisSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    marginBottom: spacing[4],
  },
  analysisSectionTitle: {
    ...typography.textStyles.headlineSmall,
    fontWeight: '600',
  },
  analysisContent: {
    gap: spacing[5],
  },
  analysisSubsection: {
    gap: spacing[3],
  },
  analysisSubtitle: {
    ...typography.textStyles.bodyMedium,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Interests
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  interestTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing[2],
  },
  interestText: {
    ...typography.textStyles.bodySmall,
    fontWeight: '500',
  },
  confidenceText: {
    ...typography.textStyles.caption,
    fontSize: 11,
  },
  
  // Communication Style
  communicationGrid: {
    gap: spacing[3],
  },
  styleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  styleLabel: {
    ...typography.textStyles.bodySmall,
    fontWeight: '500',
    width: 80,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  styleValue: {
    ...typography.textStyles.caption,
    width: 40,
    textAlign: 'right',
  },
  
  // Statistics
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing[3],
  },
  statItem: {
    alignItems: 'center',
    gap: spacing[1],
  },
  statValue: {
    ...typography.textStyles.headlineMedium,
    fontWeight: '700',
  },
  statLabel: {
    ...typography.textStyles.caption,
    textAlign: 'center',
  },
  
  // Last Analyzed
  lastAnalyzedContainer: {
    alignItems: 'center',
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  lastAnalyzedText: {
    ...typography.textStyles.caption,
    fontStyle: 'italic',
  },

  // Social Proxy Styles
  socialProxyRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  moodContainer: {
    padding: spacing[3],
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  moodText: {
    ...typography.textStyles.bodyMedium,
    fontWeight: '600',
    textTransform: 'capitalize',
    marginTop: spacing[1],
  },
  plansContainer: {
    padding: spacing[3],
    borderRadius: 12,
    marginLeft: spacing[2],
  },
  spotifyContainer: {
    padding: spacing[3],
    borderRadius: 12,
    marginBottom: spacing[3],
    borderLeftWidth: 3,
    borderLeftColor: '#1DB954', // Spotify green
  },
});

export default ProfileScreen;