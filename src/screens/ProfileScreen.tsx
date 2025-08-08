/**
 * ProfileScreen - Refactored with Atomic Design
 * Clean, modular profile screen using atomic design components
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

// Design System
import { PageBackground } from '../design-system/components/atoms/PageBackground';
import { LottieLoader } from '../design-system/components/atoms/LottieLoader';
import { ProfileCard } from '../design-system/components/organisms/ProfileCard';
import { 
  Header, 
  HeaderMenu, 
  SignOutModal, 
  ProfileSuccessModal 
} from '../design-system/components/organisms';
import { SpotifyIntegration } from '../design-system/components/molecules';
import SettingsModal from './chat/SettingsModal';

// Hooks and Context
import { useTheme } from '../contexts/ThemeContext';
import { useHeaderMenu } from '../design-system/hooks';
import { useProfileData } from '../hooks/useProfileData';

// Services
import { AuthAPI } from '../services/api';
import { ProfileImageService } from '../services/profileImageService';
import { ProfileDataService, UserProfile } from '../services/profileDataService';

// Utils
import { logger } from '../utils/logger';
import { spacing } from '../design-system/tokens/spacing';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, colors } = useTheme();
  
  // State management
  const [editMode, setEditMode] = useState(false);
  const [viewMode, setViewMode] = useState<'basic' | 'busy'>('basic');
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [shouldRenderSignOutModal, setShouldRenderSignOutModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showInsightsExpanded, setShowInsightsExpanded] = useState(false);

  // Refs
  const scrollViewRef = useRef<any>(null);
  const qualiaViewRef = useRef<View>(null);

  // Profile data hook
  const {
    profile: baseProfile,
    socialProfile,
    loading,
    saveProfile: saveProfileData,
    refreshAllData
  } = useProfileData();
  
  // Local editable profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  // Sync local profile with base profile from hook
  useEffect(() => {
    if (baseProfile && (!profile || !editMode)) {
      setProfile(baseProfile);
    }
  }, [baseProfile, editMode]);

  // Header menu hook
  const { showHeaderMenu, setShowHeaderMenu, handleMenuAction, toggleHeaderMenu } = useHeaderMenu({
    screenName: 'profile',
    onSettingsPress: () => setShowSettingsModal(true),
    onSignOut: () => setShowSignOutModal(true)
  });

  // Manage SignOutModal lifecycle
  useEffect(() => {
    if (showSignOutModal && !shouldRenderSignOutModal) {
      setShouldRenderSignOutModal(true);
    } else if (!showSignOutModal && shouldRenderSignOutModal) {
      const timer = setTimeout(() => {
        setShouldRenderSignOutModal(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showSignOutModal, shouldRenderSignOutModal]);

  // Navigation handlers
  const handleNavigateBack = () => {
    navigation.goBack();
  };

  const handleMenuPress = () => {
    toggleHeaderMenu();
  };

  // Auth handlers
  const handleSignOut = async () => {
    try {
      await AuthAPI.logout();
    } catch (error) {
      logger.error('Sign out error:', error);
      throw error;
    }
  };

  // Profile data handlers
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshAllData();
    } catch (error) {
      logger.error('Error refreshing profile data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleFieldChange = (field: keyof UserProfile, value: string) => {
    if (!profile) return;
    
    // Validate field
    const validation = ProfileDataService.validateProfileField(field, value);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid field value');
      setShowErrorModal(true);
      return;
    }

    setProfile(prev => prev ? ({
      ...prev,
      [field]: value
    }) : null);
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    
    try {
      const profileData = {
        name: profile.name,
        bio: profile.bio,
        location: profile.location,
        website: profile.website,
      };
      
      await saveProfileData(profileData);
      setShowSuccessModal(true);
      setEditMode(false);
    } catch (error: any) {
      logger.error('Error saving profile:', error);
      const errorMsg = error.message || 'Failed to save profile. Please try again.';
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
    }
  };

  // Image upload handlers
  const handleProfileImageUpload = async () => {
    if (!profile) return;
    
    setUploading(true);
    try {
      const result = await ProfileImageService.handleProfileImageUpload();
      
      if (result.success && result.imageUrl) {
        setProfile(prev => prev ? {
          ...prev,
          profilePicture: result.imageUrl
        } : null);
        setShowSuccessModal(true);
        // Note: Not refreshing immediately to avoid overwriting the uploaded image
        // The image will persist in the server and be fetched on next refresh
      } else if (result.error && result.error !== 'Image selection cancelled') {
        setErrorMessage(result.error);
        setShowErrorModal(true);
      }
    } catch (_error: any) {
      setErrorMessage('Failed to upload profile picture. Please try again.');
      setShowErrorModal(true);
    } finally {
      setUploading(false);
    }
  };

  const handleBannerImageUpload = async () => {
    if (!profile) return;
    
    setUploading(true);
    try {
      const result = await ProfileImageService.handleBannerImageUpload();
      
      if (result.success && result.imageUrl) {
        setProfile(prev => prev ? {
          ...prev,
          bannerImage: result.imageUrl
        } : null);
        setShowSuccessModal(true);
        // Note: Not refreshing immediately to avoid overwriting the uploaded image
        // The image will persist in the server and be fetched on next refresh
      } else if (result.error && result.error !== 'Image selection cancelled') {
        setErrorMessage(result.error);
        setShowErrorModal(true);
      }
    } catch (_error: any) {
      setErrorMessage('Failed to upload banner image. Please try again.');
      setShowErrorModal(true);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteProfileImage = async () => {
    if (!profile) return;
    
    setUploading(true);
    try {
      const result = await ProfileImageService.handleProfileImageDeletion();
      
      if (result.success) {
        setProfile(prev => prev ? {
          ...prev,
          profilePicture: undefined
        } : null);
        setShowSuccessModal(true);
        // Note: Not refreshing immediately to avoid issues
        // The deletion will persist in the server and be reflected on next refresh
      } else if (result.error && result.error !== 'Cancelled') {
        setErrorMessage(result.error);
        setShowErrorModal(true);
      }
    } catch (_error: any) {
      setErrorMessage('Failed to delete profile picture. Please try again.');
      setShowErrorModal(true);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteBannerImage = async () => {
    if (!profile) return;
    
    setUploading(true);
    try {
      const result = await ProfileImageService.handleBannerImageDeletion();
      
      if (result.success) {
        setProfile(prev => prev ? {
          ...prev,
          bannerImage: undefined
        } : null);
        setShowSuccessModal(true);
        // Note: Not refreshing immediately to avoid issues
        // The deletion will persist in the server and be reflected on next refresh
      } else if (result.error && result.error !== 'Cancelled') {
        setErrorMessage(result.error);
        setShowErrorModal(true);
      }
    } catch (_error: any) {
      setErrorMessage('Failed to delete banner image. Please try again.');
      setShowErrorModal(true);
    } finally {
      setUploading(false);
    }
  };

  // UI handlers
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'basic' ? 'busy' : 'basic');
  };

  const handleInsightsToggle = (expanded: boolean) => {
    setShowInsightsExpanded(expanded);
    
    if (expanded) {
      // Scroll to section when expanding
      setTimeout(() => {
        if (qualiaViewRef.current && scrollViewRef.current) {
          qualiaViewRef.current.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
            const screenHeight = Dimensions.get('window').height;
            const scrollToY = Math.max(0, pageY - (screenHeight * 0.3));
            
            scrollViewRef.current?.scrollTo({
              y: scrollToY,
              animated: true,
            });
          });
        }
      }, 50);
    }
  };

  // Loading state
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

  // Error state
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
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={refreshAllData}
            >
              <Feather name="refresh-cw" size={18} color="white" />
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
              onPress={editMode ? handleSaveProfile : () => setEditMode(true)}
              activeOpacity={0.7}
              style={styles.headerIcon}
            >
              <Feather 
                name={editMode ? 'check' : 'edit'} 
                size={18} 
                color={colors.text}
              />
            </TouchableOpacity>
          }
          onRightPress={() => {}}
        />

        {/* Profile Card */}
        <ProfileCard
          profile={profile}
          socialProfile={socialProfile}
          editMode={editMode}
          uploading={uploading}
          refreshing={refreshing}
          viewMode={viewMode}
          onlineStatus="online"
          showInsightsExpanded={showInsightsExpanded}
          onRefresh={handleRefresh}
          onFieldChange={handleFieldChange}
          onProfileImagePress={handleProfileImageUpload}
          onBannerPress={handleBannerImageUpload}
          onDeleteProfileImage={handleDeleteProfileImage}
          onDeleteBanner={handleDeleteBannerImage}
          onInsightsToggle={handleInsightsToggle}
          scrollRef={scrollViewRef}
        />

        {/* Spotify Integration */}
        <SpotifyIntegration 
          onStatusChange={() => {
            refreshAllData();
          }}
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

        {/* Header Menu */}
        <HeaderMenu
          visible={showHeaderMenu}
          onClose={() => setShowHeaderMenu(false)}
          onAction={handleMenuAction}
          showAuthOptions={true}
        />

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

        {/* Success Modal */}
        <ProfileSuccessModal
          visible={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          theme={theme}
        />

        {/* Error Modal */}
        <ProfileSuccessModal
          visible={showErrorModal}
          onClose={() => setShowErrorModal(false)}
          theme={theme}
          isError={true}
          errorMessage={errorMessage}
        />
      </SafeAreaView>
    </PageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    gap: spacing[3],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingTop: 100,
  },
  retryButton: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: 12,
  },
  headerIcon: {
    padding: spacing[2],
  },
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
});

export default ProfileScreen;