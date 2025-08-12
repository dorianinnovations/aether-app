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

// Design System
import { PageBackground, SwipeToMenu } from '../../design-system/components/atoms';
import { LottieLoader } from '../../design-system/components/atoms/LottieLoader';
import { PersonaModal } from '../../design-system/components/organisms/PersonaModal';
import { 
  Header, 
  HeaderMenu, 
  SignOutModal, 
  ProfileSuccessModal,
  ProfileCard,
  WalletModal
} from '../../design-system/components/organisms';
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
      await SpotifyAPI.saveGrails(grails);
      // Update socialProfile with new grails
      if (socialProfile) {
        // This would typically be handled by the useProfileData hook
        // For now, we'll rely on the next refresh to show the updated data
      }
      showSuccess('Grails updated successfully!');
    } catch (error) {
      logger.error('Error saving grails:', error);
      showError('Failed to save grails. Please try again.');
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
    <SwipeToMenu onSwipeToMenu={toggleHeaderMenu}>
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

        {/* Wallet Icon - positioned to the right of back arrow in header */}
        <TouchableOpacity
          style={styles.walletIcon}
          onPress={() => setShowWalletModal(true)}
          activeOpacity={0.7}
        >
          <Feather name="credit-card" size={23} color={colors.text} />
        </TouchableOpacity>

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
          configureMode={configureMode}
          scrollRef={scrollViewRef}
        />


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

        {/* Floating Edit Icon */}
        <TouchableOpacity
          onPress={editMode ? handleSaveProfile : () => setEditMode(true)}
          activeOpacity={0.7}
          style={styles.floatingEditIcon}
        >
          <Feather 
            name={editMode ? 'check' : 'edit-3'} 
            size={24} 
            color={editMode ? '#4CAF50' : colors.text}
          />
        </TouchableOpacity>
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
  floatingEditIcon: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    padding: spacing[2],
  },
  walletIcon: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 69 : 49,
    left: 75,
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});

export default ProfileScreen;