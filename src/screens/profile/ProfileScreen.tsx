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
  Platform,
  AppState,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// Design System
import { PageBackground, SwipeToMenu } from '../../design-system/components/atoms';
import { LottieLoader } from '../../design-system/components/atoms/LottieLoader';
import { PersonaModal } from '../../design-system/components/organisms/PersonaModal';
import { 
  HeaderMenu, 
  SignOutModal, 
  ProfileSuccessModal,
  ProfileCard,
  WalletModal
} from '../../design-system/components/organisms';
import { AnimatedHamburger } from '../../design-system/components/atoms';
import SettingsModal from '../chat/SettingsModal';

// Hooks and Context
import { useTheme } from '../../contexts/ThemeContext';
import { useHeaderMenu } from '../../design-system/hooks';
import { useProfileData } from '../../hooks/useProfileData';
import { useToast, useScrollToInput } from '../../hooks';

// Services
import { AuthAPI, SpotifyAPI } from '../../services/api';
import { UserAPI } from '../../services/apiModules/endpoints/user';
import { ProfileImageService } from '../../services/profileImageService';
import { ProfileDataService, UserProfile } from '../../services/profileDataService';
import { GrailsData } from '../../design-system/components/molecules/GrailsSection';

// Utils
import { logger } from '../../utils/logger';
import { spacing } from '../../design-system/tokens/spacing';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, colors } = useTheme();
  const { showSuccess, showError, showWarning } = useToast();
  
  // Profile data hook
  const {
    profile: baseProfile,
    socialProfile,
    loading,
    saveProfile: saveProfileData,
    refreshAllData
  } = useProfileData();

  // State management
  const [editMode, setEditMode] = useState(false);
  const [configureMode, setConfigureMode] = useState(false);
  const [viewMode, setViewMode] = useState<'basic' | 'busy'>('basic');
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [shouldRenderSignOutModal, setShouldRenderSignOutModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [hamburgerOpen, setHamburgerOpen] = useState(false);

  // Refs
  const qualiaViewRef = useRef<View>(null);
  
  // Scroll to input hook for keyboard handling
  const { scrollViewRef, handleInputFocus } = useScrollToInput();
  
  // Local editable profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  // Sync local profile with base profile from hook - ONLY on initial load
  useEffect(() => {
    if (baseProfile && !profile) {
      // ONLY set profile on initial load when profile is null
      setProfile(baseProfile);
    }
    // Never overwrite profile after initial load to prevent data loss
  }, [baseProfile, profile]);


  // Header menu hook
  const { showHeaderMenu, setShowHeaderMenu, handleMenuAction, toggleHeaderMenu } = useHeaderMenu({
    screenName: 'profile',
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

  // Reset hamburger animation when header menu closes
  useEffect(() => {
    if (!showHeaderMenu) {
      setHamburgerOpen(false);
    }
  }, [showHeaderMenu]);

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
      // Reset local profile to null so it gets refreshed from the hook
      setProfile(null);
    } catch (error) {
      logger.error('Error refreshing profile data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleFieldChange = (field: keyof UserProfile, value: string | any) => {
    if (!profile) return;
    
    try {
      // Basic validation fallback
      const validateField = (fieldName: string, fieldValue: string): { valid: boolean; error?: string } => {
        if (!fieldValue) return { valid: true };
        
        switch (fieldName) {
          case 'email':
            if (!/\S+@\S+\.\S+/.test(fieldValue)) {
              return { valid: false, error: 'Please enter a valid email address' };
            }
            break;
          case 'website':
            if (fieldValue && !fieldValue.startsWith('http') && !fieldValue.includes('.')) {
              return { valid: false, error: 'Please enter a valid website URL' };
            }
            break;
          case 'bio':
            if (fieldValue.length > 500) {
              return { valid: false, error: 'Bio must be less than 500 characters' };
            }
            break;
          case 'name':
          case 'displayName':
            if (fieldValue.length > 100) {
              return { valid: false, error: 'Name must be less than 100 characters' };
            }
            break;
          case 'location':
            if (fieldValue.length > 100) {
              return { valid: false, error: 'Location must be less than 100 characters' };
            }
            break;
        }
        return { valid: true };
      };

      // Special handling for social links
      if (field === 'socialLinks') {
        setProfile(prev => prev ? ({
          ...prev,
          socialLinks: value
        }) : null);
        return;
      }

      // Try service validation first, fallback to basic validation (only for string values)
      if (typeof value === 'string') {
        let validation;
        try {
          validation = ProfileDataService?.validateProfileField?.(field, value) || validateField(field, value);
        } catch (error) {
          logger.warn('Service validation failed, using fallback:', error);
          validation = validateField(field, value);
        }

        if (!validation.valid) {
          showError(validation.error || 'Invalid field value');
          return;
        }
      }

      setProfile(prev => prev ? ({
        ...prev,
        [field]: value
      }) : null);
    } catch (error) {
      logger.error('Error in handleFieldChange:', error);
      // Still update the field but without validation
      setProfile(prev => prev ? ({
        ...prev,
        [field]: value
      }) : null);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    
    try {
      const profileData = {
        displayName: profile.displayName,
        bio: profile.bio,
        location: profile.location,
        website: profile.website,
        socialLinks: profile.socialLinks,
      };
      
      // Use direct API call instead of the hook to avoid background refresh issues
      const response = await UserAPI.updateProfile(profileData);
      
      // Immediately update local profile state with the saved data
      // This ensures the data persists regardless of what the hook does
      setProfile(prev => prev ? {
        ...prev,
        ...profileData
      } : null);
      
      showSuccess('Profile saved successfully!');
      setEditMode(false);
    } catch (error: any) {
      logger.error('Error saving profile:', error);
      const errorMsg = error.message || 'Failed to save profile. Please try again.';
      showError(errorMsg);
    }
  };


  // Image upload handlers with improved error handling
  const handleProfileImageUpload = async () => {
    if (!profile) return;
    
    setUploading(true);
    try {
      // Check memory and app state before starting upload
      if (Platform.OS === 'ios' && AppState.currentState !== 'active') {
        showError('Please ensure the app is in the foreground for image uploads.');
        return;
      }
      
      const result = await ProfileImageService.handleProfileImageUpload();
      
      if (result.success && result.imageUrl) {
        setProfile(prev => prev ? {
          ...prev,
          profilePicture: result.imageUrl
        } : null);
        showSuccess('Profile image uploaded successfully!');
        // Note: Not refreshing immediately to avoid overwriting the uploaded image
        // The image will persist in the server and be fetched on next refresh
      } else if (result.error && result.error !== 'Image selection cancelled') {
        showError(result.error);
      }
    } catch (error: any) {
      logger.error('Profile image upload error:', error);
      
      let errorMessage = 'Failed to upload profile picture. Please try again.';
      
      // Handle specific iOS/TestFlight errors
      if (Platform.OS === 'ios') {
        if (error.message?.includes('memory')) {
          errorMessage = 'Not enough memory to upload image. Please close other apps and try again.';
        } else if (error.message?.includes('background')) {
          errorMessage = 'Upload failed. Please keep the app in the foreground during uploads.';
        }
      }
      
      showError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleBannerImageUpload = async () => {
    if (!profile) return;
    
    setUploading(true);
    try {
      // Check memory and app state before starting upload
      if (Platform.OS === 'ios' && AppState.currentState !== 'active') {
        showError('Please ensure the app is in the foreground for image uploads.');
        return;
      }
      
      const result = await ProfileImageService.handleBannerImageUpload();
      
      if (result.success && result.imageUrl) {
        setProfile(prev => prev ? {
          ...prev,
          bannerImage: result.imageUrl
        } : null);
        showSuccess('Banner image uploaded successfully!');
        // Note: Not refreshing immediately to avoid overwriting the uploaded image
        // The image will persist in the server and be fetched on next refresh
      } else if (result.error && result.error !== 'Image selection cancelled') {
        showError(result.error);
      }
    } catch (error: any) {
      logger.error('Banner image upload error:', error);
      
      let errorMessage = 'Failed to upload banner image. Please try again.';
      
      // Handle specific iOS/TestFlight errors
      if (Platform.OS === 'ios') {
        if (error.message?.includes('memory')) {
          errorMessage = 'Not enough memory to upload image. Please close other apps and try again.';
        } else if (error.message?.includes('background')) {
          errorMessage = 'Upload failed. Please keep the app in the foreground during uploads.';
        }
      }
      
      showError(errorMessage);
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
        showSuccess('Profile picture deleted successfully!');
        // Note: Not refreshing immediately to avoid issues
        // The deletion will persist in the server and be reflected on next refresh
      } else if (result.error && result.error !== 'Cancelled') {
        showError(result.error);
      }
    } catch (_error: any) {
      showError('Failed to delete profile picture. Please try again.');
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
        showSuccess('Banner image deleted successfully!');
        // Note: Not refreshing immediately to avoid issues
        // The deletion will persist in the server and be reflected on next refresh
      } else if (result.error && result.error !== 'Cancelled') {
        showError(result.error);
      }
    } catch (_error: any) {
      showError('Failed to delete banner image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // UI handlers
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'basic' ? 'busy' : 'basic');
  };

  const handleConfigurePress = () => {
    setConfigureMode(!configureMode);
  };

  const handleUsernamePress = () => {
    setShowPersonaModal(true);
  };

  const handleGrailsChange = async (grails: GrailsData) => {
    try {
      const response = await SpotifyAPI.saveGrails(grails);
      
      // Refresh social profile data to pick up the new grails
      await refreshAllData();
      
      showSuccess('Grails updated successfully!');
    } catch (error: any) {
      console.error('❌ Error saving grails - Full error details:', error);
      
      // Enhanced error reporting
      let errorMessage = 'Failed to save grails. ';
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        errorMessage += `Server error: ${error.response.status} - ${error.response.data?.message || error.response.data?.error || 'Unknown error'}`;
      } else if (error.request) {
        console.error('No response received:', error.request);
        errorMessage += 'No response from server. Check your internet connection.';
      } else {
        console.error('Request setup error:', error.message);
        errorMessage += `Request error: ${error.message}`;
      }
      
      logger.error('Error saving grails:', error);
      showError(errorMessage);
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
    <SwipeToMenu onSwipeToMenu={toggleHeaderMenu}>
      <PageBackground theme={theme} variant="profile">
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} 
          backgroundColor="transparent"
          translucent={true}
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
          onRefresh={handleRefresh}
          onFieldChange={handleFieldChange}
          onProfileImagePress={handleProfileImageUpload}
          onBannerPress={handleBannerImageUpload}
          onDeleteProfileImage={handleDeleteProfileImage}
          onDeleteBanner={handleDeleteBannerImage}
          onInputFocus={handleInputFocus}
          onSpotifyStatusChange={() => {
            refreshAllData();
          }}
          onConfigurePress={handleConfigurePress}
          onUsernamePress={handleUsernamePress}
          onGrailsChange={handleGrailsChange}
          onEnableEditMode={() => setEditMode(true)}
          configureMode={configureMode}
          scrollRef={scrollViewRef}
        />

        {/* Floating Action Button Card */}
        {!showHeaderMenu && (
          <View style={[
            styles.floatingButtonCard,
            {
              backgroundColor: theme === 'dark' ? colors.surface : colors.surface,
              borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            }
          ]}>
            {/* Wallet Button */}
            <TouchableOpacity
              style={styles.floatingButtonItem}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowWalletModal(true);
              }}
              activeOpacity={0.8}
            >
              <Feather
                name="credit-card"
                size={22}
                color={colors.text}
              />
            </TouchableOpacity>

            {/* Separator */}
            <View style={[
              styles.floatingButtonSeparator,
              {
                backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              }
            ]} />

            {/* Edit Button */}
            <TouchableOpacity
              style={styles.floatingButtonItem}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                editMode ? handleSaveProfile() : setEditMode(true);
              }}
              activeOpacity={0.8}
            >
              <Feather
                name={editMode ? 'check' : 'edit-3'}
                size={22}
                color={editMode ? '#4CAF50' : colors.text}
              />
            </TouchableOpacity>

            {/* Separator */}
            <View style={[
              styles.floatingButtonSeparator,
              {
                backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              }
            ]} />

            {/* Menu Button */}
            <TouchableOpacity
              style={styles.floatingButtonItem}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setHamburgerOpen(!hamburgerOpen);
                setTimeout(() => {
                  toggleHeaderMenu();
                }, 150); // Small delay to show animation before hiding buttons
              }}
              activeOpacity={0.8}
            >
              <AnimatedHamburger
                isOpen={hamburgerOpen}
                color={colors.text}
                size={22}
              />
            </TouchableOpacity>

            {/* Separator */}
            <View style={[
              styles.floatingButtonSeparator,
              {
                backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              }
            ]} />

            {/* Sign Out Button */}
            <TouchableOpacity
              style={styles.floatingButtonItem}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowSignOutModal(true);
              }}
              activeOpacity={0.8}
            >
              <Feather
                name="log-out"
                size={22}
                color="#FF6B6B"
              />
            </TouchableOpacity>
          </View>
        )}

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


        {/* Persona Modal */}
        <PersonaModal
          visible={showPersonaModal}
          personalityData={socialProfile?.personality || undefined}
          username={profile.username}
          profileImageUri={profile.profilePicture}
          onClose={() => setShowPersonaModal(false)}
        />

        {/* Wallet Modal */}
        <WalletModal
          visible={showWalletModal}
          onClose={() => setShowWalletModal(false)}
          onTierSelect={(tier) => {
            // TODO: Implement tier selection logic
          }}
        />

      </SafeAreaView>
    </PageBackground>
    </SwipeToMenu>
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
    paddingTop: 20, // Much tighter spacing
    gap: spacing[3],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingTop: 20, // Much tighter spacing
  },
  retryButton: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: 12,
  },
  
  // Floating Action Button Card
  floatingButtonCard: {
    position: 'absolute',
    bottom: 120, // Position above input area
    right: spacing[2], // Positioned on the right
    flexDirection: 'column',
    borderRadius: 12, // Less round corners
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    zIndex: 1000,
    overflow: 'hidden',
  },
  floatingButtonItem: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingButtonSeparator: {
    height: 1,
    width: '100%',
  },
});

export default ProfileScreen;