/**
 * Aether - Sign Up Screen
 * Aether-style elegant account creation with glassmorphic design and sophisticated animations
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
  Keyboard,
  TouchableWithoutFeedback,
  Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { PageBackground } from '../../design-system/components/atoms/PageBackground';
import { LottieLoader } from '../../design-system/components/atoms/LottieLoader';
import { AnimatedHamburger } from '../../design-system/components/atoms';
import { Header, HeaderMenu } from '../../design-system/components/organisms';
import { FadedBorder } from '../../components/FadedBorder';
import { PasswordStrengthIndicator } from '../../design-system/components/molecules/PasswordStrengthIndicator';
import { UsernameStatusIndicator } from '../../design-system/components/molecules/UsernameStatusIndicator';
import { AuthButton } from '../../design-system/components/molecules/AuthButton';
// Removed unused getThemeColors import
import { useTheme } from '../../contexts/ThemeContext';
import { typography } from '../../design-system/tokens/typography';
import { spacing } from '../../design-system/tokens/spacing';
import { designTokens } from '../../design-system/tokens/colors';
import { useSignUpForm } from '../../hooks/useSignUpForm';
import { usePasswordStrength } from '../../hooks/usePasswordStrength';
import { useUsernameValidation } from '../../hooks/useUsernameValidation';
import { TokenManager } from '../../services/api';

const { height } = Dimensions.get('window');

interface SignUpScreenProps {
  navigation: any;
  route: any;
}

const SignUpScreen: React.FC<SignUpScreenProps> = ({
  navigation,
  route: _route,
}) => {
  const { theme, toggleTheme } = useTheme();
  
  // Custom hooks
  const {
    firstName,
    setFirstName,
    lastName,
    setLastName,
    username,
    setUsername,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    error,
    localLoading,
    authStatus,
    setAuthStatus,
    isSignUpSuccess,
    showSlowServerMessage,
    clearErrorOnChange,
    validateAndSubmit,
  } = useSignUpForm();
  
  const passwordStrength = usePasswordStrength(password);
  const { usernameAvailable, usernameError, checkingUsername } = useUsernameValidation(username);
  
  // Component state
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Use either auth loading or local loading
  const loading = localLoading;

  // Removed unused themeColors

  // Animation refs - Staggered load-in animations
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const linkOpacity = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  // Removed unused buttonScaleAnim
  const buttonGlowAnim = useRef(new Animated.Value(0)).current;
  const firstNameInputScaleAnim = useRef(new Animated.Value(1)).current;
  const lastNameInputScaleAnim = useRef(new Animated.Value(1)).current;
  const usernameInputScaleAnim = useRef(new Animated.Value(1)).current;
  const emailInputScaleAnim = useRef(new Animated.Value(1)).current;
  const passwordInputScaleAnim = useRef(new Animated.Value(1)).current;
  const confirmPasswordInputScaleAnim = useRef(new Animated.Value(1)).current;
  const headerOpacityAnim = useRef(new Animated.Value(1)).current;
  const cardTranslateYAnim = useRef(new Animated.Value(0)).current;
  
  // Success animation
  const successAnim = useRef(new Animated.Value(0)).current;
  
  // Input refs
  const firstNameInputRef = useRef<TextInput>(null);
  const lastNameInputRef = useRef<TextInput>(null);
  const usernameInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Staggered load-in sequence - longer and smoother
    const animateSequence = () => {
      // Title first (300ms delay)
      setTimeout(() => {
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      }, 300);

      // Form second (700ms delay)
      setTimeout(() => {
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }).start();
      }, 700);

      // Button third (1200ms delay)
      setTimeout(() => {
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
        
        // Start minimal glow animation after button appears
        const glowAnimation = Animated.loop(
          Animated.sequence([
            Animated.timing(buttonGlowAnim, {
              toValue: 1,
              duration: 3500,
              useNativeDriver: true,
            }),
            Animated.timing(buttonGlowAnim, {
              toValue: 0,
              duration: 3500,
              useNativeDriver: true,
            }),
          ])
        );
        glowAnimation.start();
      }, 1200);

      // Link last (1600ms delay)
      setTimeout(() => {
        Animated.timing(linkOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }).start();
      }, 1600);
    };

    animateSequence();
    
    // Set legacy animations for compatibility
    fadeAnim.setValue(1);
    scaleAnim.setValue(1);
    slideAnim.setValue(0);
    
    return () => {
      // Cleanup on unmount
    };
  }, []);




  const handleSubmit = async () => {
    Keyboard.dismiss();
    await validateAndSubmit(usernameAvailable, passwordStrength);
  };

  // Handle successful signup - separate effect to avoid timing issues
  useEffect(() => {
    if (isSignUpSuccess && !isSuccess) {
      setIsSuccess(true);
      
      // Animate success state
      Animated.timing(successAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
      
      // Navigate to main app after success animation
      setTimeout(async () => {
        // Verify we have a token and trigger navigation to MainStack
        const token = await TokenManager.getToken();
        if (token) {
          try {
            // Mark as new user to show tutorial
            await AsyncStorage.setItem('isNewUser', 'true');
            
            // Trigger immediate auth check in App.tsx
            if ((global as any).checkAuthState) {
              await (global as any).checkAuthState();
            }
            
          } catch (error) {
            console.error('Navigation error after signup:', error);
            navigation.replace('SignIn');
          }
        } else {
          // Token not found, reset to sign in
          console.error('No token found after successful signup');
          navigation.replace('SignIn');
        }
      }, 1500);
    }
  }, [isSignUpSuccess, isSuccess, navigation, successAnim]);


  // Success screen
  if (isSuccess) {
    return (
      <PageBackground theme={theme} variant="auth">
        <SafeAreaView style={styles.container}>
          <Animated.View style={[styles.successContainer, { opacity: successAnim }]}>
            <LottieLoader size={60} style={{ marginBottom: 24 }} />
          </Animated.View>
        </SafeAreaView>
      </PageBackground>
    );
  }

  // Header menu action handler
  const handleMenuAction = (key: string) => {
    setShowHeaderMenu(false);
    
    switch (key) {
      case 'chat':
      case 'insights':
      case 'connections':
        // These screens require authentication - show message or redirect to sign in
        alert('Please sign in to access this feature');
        break;
      case 'settings':
        // Add settings navigation if needed
        break;
      case 'theme_toggle':
        toggleTheme();
        break;
      default:
        break;
    }
  };

  return (
    <PageBackground theme={theme} variant="auth">
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} 
          backgroundColor="transparent"
          translucent={true}
        />

        {/* Dark mode overlay effect */}
        {theme === "dark" && (
          <View
            style={[styles.darkModeOverlay, { backgroundColor: "#0a0a0a" }]}
            pointerEvents="none"
          ></View>
        )}
      
      {/* Centered bottom menu button */}
      <TouchableOpacity
        style={styles.centerMenuButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowHeaderMenu(!showHeaderMenu);
        }}
        activeOpacity={0.8}
      >
        <AnimatedHamburger
          isOpen={showHeaderMenu}
          color={theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.secondary}
          size={22}
        />
      </TouchableOpacity>

      {/* Header Menu */}
      <HeaderMenu
        visible={showHeaderMenu}
        onClose={() => setShowHeaderMenu(false)}
        onAction={handleMenuAction}
        showAuthOptions={false}
        
        
      />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1 }}>
          <KeyboardAvoidingView
            style={styles.keyboardAvoid}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? -80 : -60}
          >
            <Animated.View
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                  transform: [
                    { translateX: slideAnim },
                    { scale: scaleAnim },
                    { translateY: cardTranslateYAnim },
                  ],
                },
              ]}
            >
              {/* Neumorphic form container */}
              <View style={styles.formWrapper}>
                <View style={[
                  styles.formContainer, 
                  theme === 'dark' ? {
                    backgroundColor: '#151515',
                    borderColor: '#333333',
                    borderWidth: 1,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 12,
                    elevation: 8,
                  } : styles.glassmorphic
                ]}>
                  {/* Header */}
                  <Animated.View style={[styles.header, { opacity: titleOpacity }]}>
                    <Animated.Text
                      style={[
                        styles.title,
                        {
                          color: theme === 'dark' ? '#ffffff' : '#1a1a1abf',
                          fontFamily: 'Mozilla Headline',
                          textShadowColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(26, 26, 26, 0.2)',
                          textShadowOffset: { width: 0, height: 0 },
                          textShadowRadius: 8,
                          transform: [{ 
                            translateX: slideAnim.interpolate({
                              inputRange: [-30, 0],
                              outputRange: [-15, 0],
                            }) 
                          }],
                        },
                      ]}
                    >
                      Sign up
                    </Animated.Text>
                    <Text style={[
                      styles.subtitle, 
                      { 
                        color: theme === 'dark' ? '#ffffff' : '#4a4a4a',
                        marginBottom: 8
                      }
                    ]}>
                      Find your frequency
                    </Text>
                    <FadedBorder theme={theme} style={{ marginTop: 16 }} />
                  </Animated.View>

                  {/* Form Content */}
                  <Animated.View style={[styles.formContent, { opacity: formOpacity }]}>
                    {/* Input fields */}
                    <View style={styles.inputGroup}>
                      {/* Name Fields - Side by Side */}
                      <View style={styles.nameRow}>
                        <Animated.View style={[styles.nameInputContainer, { transform: [{ scale: firstNameInputScaleAnim }] }]}>
                          <TextInput
                            ref={firstNameInputRef}
                            style={[
                              styles.input,
                              styles.nameInput,
                              { 
                                color: theme === 'dark' ? '#ffffff' : '#000000',
                                backgroundColor: theme === 'dark' ? '#2a2a2a' : '#ffffff',
                                shadowColor: theme === 'dark' ? '#000000' : '#000000',
                                shadowOffset: { width: 0, height: theme === 'dark' ? 4 : 1 },
                                shadowOpacity: theme === 'dark' ? 0.5 : 0.12,
                                shadowRadius: theme === 'dark' ? 12 : 3,
                                elevation: theme === 'dark' ? 6 : 3,
                              }
                            ]}
                            placeholder="First Name"
                            placeholderTextColor={theme === 'dark' ? '#666666' : '#999999'}
                            value={firstName}
                            onChangeText={(text) => {
                              setFirstName(text);
                              clearErrorOnChange();
                            }}
                            autoCapitalize="words"
                            autoCorrect={false}
                            spellCheck={false}
                            keyboardType="default"
                            keyboardAppearance={theme === 'dark' ? 'dark' : 'light'}
                            returnKeyType="next"
                            editable={!loading}
                            onSubmitEditing={() => lastNameInputRef.current?.focus()}
                            onFocus={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              Animated.parallel([
                                Animated.timing(firstNameInputScaleAnim, {
                                  toValue: 1.02,
                                  duration: 200,
                                  easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
                                  useNativeDriver: true,
                                }),
                              ]).start();
                            }}
                            onBlur={() => {
                              Animated.parallel([
                                Animated.timing(firstNameInputScaleAnim, {
                                  toValue: 1,
                                  duration: 350,
                                  easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
                                  useNativeDriver: true,
                                }),
                              ]).start();
                            }}
                          />
                        </Animated.View>
                        
                        <Animated.View style={[styles.nameInputContainer, { transform: [{ scale: lastNameInputScaleAnim }] }]}>
                          <TextInput
                            ref={lastNameInputRef}
                            style={[
                              styles.input,
                              styles.nameInput,
                              { 
                                color: theme === 'dark' ? '#ffffff' : '#000000',
                                backgroundColor: theme === 'dark' ? '#2a2a2a' : '#ffffff',
                                shadowColor: theme === 'dark' ? '#000000' : '#000000',
                                shadowOffset: { width: 0, height: theme === 'dark' ? 4 : 1 },
                                shadowOpacity: theme === 'dark' ? 0.5 : 0.12,
                                shadowRadius: theme === 'dark' ? 12 : 3,
                                elevation: theme === 'dark' ? 6 : 3,
                              }
                            ]}
                            placeholder="Last Name"
                            placeholderTextColor={theme === 'dark' ? '#666666' : '#999999'}
                            value={lastName}
                            onChangeText={(text) => {
                              setLastName(text);
                              clearErrorOnChange();
                            }}
                            autoCapitalize="words"
                            autoCorrect={false}
                            spellCheck={false}
                            keyboardType="default"
                            keyboardAppearance={theme === 'dark' ? 'dark' : 'light'}
                            returnKeyType="next"
                            editable={!loading}
                            onSubmitEditing={() => usernameInputRef.current?.focus()}
                            onFocus={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              Animated.parallel([
                                Animated.timing(lastNameInputScaleAnim, {
                                  toValue: 1.02,
                                  duration: 200,
                                  easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
                                  useNativeDriver: true,
                                }),
                              ]).start();
                            }}
                            onBlur={() => {
                              Animated.parallel([
                                Animated.timing(lastNameInputScaleAnim, {
                                  toValue: 1,
                                  duration: 350,
                                  easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
                                  useNativeDriver: true,
                                }),
                              ]).start();
                            }}
                          />
                        </Animated.View>
                      </View>
                      
                      {/* Username Input */}
                      <Animated.View style={{ transform: [{ scale: usernameInputScaleAnim }] }}>
                        <TextInput
                          ref={usernameInputRef}
                          style={[
                            styles.input,
                            { 
                              color: theme === 'dark' ? '#ffffff' : '#000000',
                              backgroundColor: theme === 'dark' ? '#2a2a2a' : '#ffffff',
                              shadowColor: theme === 'dark' ? '#000000' : '#000000',
                              shadowOffset: { width: 0, height: theme === 'dark' ? 4 : 1 },
                              shadowOpacity: theme === 'dark' ? 0.5 : 0.12,
                              shadowRadius: theme === 'dark' ? 12 : 3,
                              elevation: theme === 'dark' ? 6 : 3,
                            }
                          ]}
                          placeholder="Username"
                          placeholderTextColor={theme === 'dark' ? '#666666' : '#999999'}
                          value={username}
                          onChangeText={(text) => {
                            const cleanText = text.toLowerCase().replace(/[^a-z0-9_-]/g, '');
                            setUsername(cleanText);
                            clearErrorOnChange();
                          }}
                          autoCapitalize="none"
                          autoCorrect={false}
                          spellCheck={false}
                          keyboardType="default"
                          keyboardAppearance={theme === 'dark' ? 'dark' : 'light'}
                          returnKeyType="next"
                          editable={!loading}
                          onSubmitEditing={() => emailInputRef.current?.focus()}
                          onFocus={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            Animated.parallel([
                              Animated.timing(usernameInputScaleAnim, {
                                toValue: 1.02,
                                duration: 200,
                                easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
                                useNativeDriver: true,
                              }),
                            ]).start();
                          }}
                          onBlur={() => {
                            Animated.parallel([
                              Animated.timing(usernameInputScaleAnim, {
                                toValue: 1,
                                duration: 350,
                                easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
                                useNativeDriver: true,
                              }),
                            ]).start();
                          }}
                        />
                      </Animated.View>
                      
                      <UsernameStatusIndicator
                        username={username}
                        checking={checkingUsername}
                        available={usernameAvailable}
                        error={usernameError}
                        theme={theme}
                      />
                      
                      {/* Email Input */}
                      <Animated.View style={{ transform: [{ scale: emailInputScaleAnim }] }}>
                        <TextInput
                          ref={emailInputRef}
                          style={[
                            styles.input,
                            { 
                              color: theme === 'dark' ? '#ffffff' : '#000000',
                              backgroundColor: theme === 'dark' ? '#2a2a2a' : '#ffffff',
                              shadowColor: theme === 'dark' ? '#000000' : '#000000',
                              shadowOffset: { width: 0, height: theme === 'dark' ? 4 : 1 },
                              shadowOpacity: theme === 'dark' ? 0.5 : 0.12,
                              shadowRadius: theme === 'dark' ? 12 : 3,
                              elevation: theme === 'dark' ? 6 : 3,
                            }
                          ]}
                          placeholder="Email"
                          placeholderTextColor={theme === 'dark' ? '#666666' : '#999999'}
                          value={email}
                          onChangeText={(text) => {
                            setEmail(text);
                            clearErrorOnChange();
                          }}
                          autoCapitalize="none"
                          autoCorrect={false}
                          spellCheck={false}
                          keyboardType="email-address"
                          keyboardAppearance={theme === 'dark' ? 'dark' : 'light'}
                          returnKeyType="next"
                          editable={!loading}
                          onSubmitEditing={() => passwordInputRef.current?.focus()}
                          onFocus={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            Animated.parallel([
                              Animated.spring(emailInputScaleAnim, {
                                toValue: 1.02,
                                useNativeDriver: true,
                                speed: 50,
                                bounciness: 8,
                              }),
                              Animated.timing(headerOpacityAnim, {
                                toValue: 0,
                                duration: 150,
                                easing: Easing.out(Easing.cubic),
                                useNativeDriver: true,
                              }),
                              Animated.timing(cardTranslateYAnim, {
                                toValue: -0.08 * height,
                                duration: 400,
                                easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
                                useNativeDriver: true,
                              }),
                            ]).start();
                          }}
                          onBlur={() => {
                            Animated.parallel([
                              Animated.spring(emailInputScaleAnim, {
                                toValue: 1,
                                useNativeDriver: true,
                                speed: 50,
                                bounciness: 8,
                              }),
                              Animated.timing(headerOpacityAnim, {
                                toValue: 1,
                                duration: 200,
                                easing: Easing.in(Easing.cubic),
                                useNativeDriver: true,
                              }),
                              Animated.timing(cardTranslateYAnim, {
                                toValue: 0,
                                duration: 350,
                                easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
                                useNativeDriver: true,
                              }),
                            ]).start();
                          }}
                        />
                      </Animated.View>
                      
                      <View style={styles.passwordContainer}>
                        <Animated.View style={{ transform: [{ scale: passwordInputScaleAnim }] }}>
                          <TextInput
                            ref={passwordInputRef}
                            style={[
                              styles.input,
                              { 
                                color: theme === 'dark' ? '#ffffff' : '#000000',
                                backgroundColor: theme === 'dark' ? '#2a2a2a' : '#ffffff',
                                shadowColor: theme === 'dark' ? '#000000' : '#000000',
                                shadowOffset: { width: 0, height: theme === 'dark' ? 4 : 1 },
                                shadowOpacity: theme === 'dark' ? 0.5 : 0.12,
                                shadowRadius: theme === 'dark' ? 12 : 3,
                                elevation: theme === 'dark' ? 6 : 3,
                              }
                            ]}
                            placeholder="Password"
                            placeholderTextColor={theme === 'dark' ? '#666666' : '#999999'}
                            value={password}
                            onChangeText={(text) => {
                              setPassword(text);
                              clearErrorOnChange();
                            }}
                            secureTextEntry
                            autoCorrect={false}
                            spellCheck={false}
                            keyboardAppearance={theme === 'dark' ? 'dark' : 'light'}
                            returnKeyType="next"
                            editable={!loading}
                            onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
                            onFocus={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              Animated.parallel([
                                Animated.spring(passwordInputScaleAnim, {
                                  toValue: 1.02,
                                  useNativeDriver: true,
                                  speed: 50,
                                  bounciness: 8,
                                }),
                                Animated.timing(headerOpacityAnim, {
                                  toValue: 0,
                                  duration: 150,
                                  easing: Easing.out(Easing.cubic),
                                  useNativeDriver: true,
                                }),
                                Animated.timing(cardTranslateYAnim, {
                                  toValue: -0.08 * height,
                                  duration: 400,
                                  easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
                                  useNativeDriver: true,
                                }),
                              ]).start();
                            }}
                            onBlur={() => {
                              Animated.parallel([
                                Animated.spring(passwordInputScaleAnim, {
                                  toValue: 1,
                                  useNativeDriver: true,
                                  speed: 50,
                                  bounciness: 8,
                                }),
                                Animated.timing(headerOpacityAnim, {
                                  toValue: 1,
                                  duration: 200,
                                  easing: Easing.in(Easing.cubic),
                                  useNativeDriver: true,
                                }),
                                Animated.timing(cardTranslateYAnim, {
                                  toValue: 0,
                                  duration: 350,
                                  easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
                                  useNativeDriver: true,
                                }),
                              ]).start();
                            }}
                          />
                        </Animated.View>
                        
                        <PasswordStrengthIndicator
                          password={password}
                          theme={theme}
                        />
                      </View>
                      
                      <Animated.View style={{ transform: [{ scale: confirmPasswordInputScaleAnim }] }}>
                        <TextInput
                          ref={confirmPasswordInputRef}
                          style={[
                            styles.input,
                            { 
                              color: theme === 'dark' ? '#ffffff' : '#000000',
                              backgroundColor: theme === 'dark' ? '#2a2a2a' : '#ffffff',
                              shadowColor: theme === 'dark' ? '#000000' : '#000000',
                              shadowOffset: { width: 0, height: theme === 'dark' ? 4 : 1 },
                              shadowOpacity: theme === 'dark' ? 0.5 : 0.12,
                              shadowRadius: theme === 'dark' ? 12 : 3,
                              elevation: theme === 'dark' ? 6 : 3,
                            }
                          ]}
                          placeholder="Confirm Password"
                          placeholderTextColor={theme === 'dark' ? '#666666' : '#999999'}
                          value={confirmPassword}
                          onChangeText={(text) => {
                            setConfirmPassword(text);
                            clearErrorOnChange();
                          }}
                          secureTextEntry
                          autoCorrect={false}
                          spellCheck={false}
                          keyboardAppearance={theme === 'dark' ? 'dark' : 'light'}
                          returnKeyType="done"
                          editable={!loading}
                          onSubmitEditing={() => {
                            Keyboard.dismiss();
                            handleSubmit();
                          }}
                          onFocus={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            Animated.parallel([
                              Animated.spring(confirmPasswordInputScaleAnim, {
                                toValue: 1.02,
                                useNativeDriver: true,
                                speed: 50,
                                bounciness: 8,
                              }),
                              Animated.timing(headerOpacityAnim, {
                                toValue: 0,
                                duration: 150,
                                easing: Easing.out(Easing.cubic),
                                useNativeDriver: true,
                              }),
                              Animated.timing(cardTranslateYAnim, {
                                toValue: -0.08 * height,
                                duration: 400,
                                easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
                                useNativeDriver: true,
                              }),
                            ]).start();
                          }}
                          onBlur={() => {
                            Animated.parallel([
                              Animated.spring(confirmPasswordInputScaleAnim, {
                                toValue: 1,
                                useNativeDriver: true,
                                speed: 50,
                                bounciness: 8,
                              }),
                              Animated.timing(headerOpacityAnim, {
                                toValue: 1,
                                duration: 200,
                                easing: Easing.in(Easing.cubic),
                                useNativeDriver: true,
                              }),
                              Animated.timing(cardTranslateYAnim, {
                                toValue: 0,
                                duration: 350,
                                easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
                                useNativeDriver: true,
                              }),
                            ]).start();
                          }}
                        />
                      </Animated.View>
                    </View>

                    {/* Sign Up Button with Animation */}
                    <Animated.View style={{ opacity: buttonOpacity }}>
                      <AuthButton
                        onPress={handleSubmit}
                        loading={loading}
                        success={isSignUpSuccess}
                        theme={theme}
                        authStatus={authStatus}
                        onAnimationComplete={() => {
                          if (authStatus === 'error') {
                            setAuthStatus('idle');
                          }
                        }}
                        title="Create Account"
                        loadingTitle="Creating Account"
                        successTitle="Success!"
                      />
                    </Animated.View>

                    {/* Sign In Link */}
                    <Animated.View style={{ opacity: linkOpacity }}>
                      <TouchableOpacity
                        style={styles.linkButton}
                        onPress={() => {
                          // Light haptic for navigation
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          navigation.replace('SignIn');
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.linkText, 
                          { color: theme === 'dark' ? '#cccccc' : '#b0b0b0' }
                        ]}>
                          Already have an account? <Text style={[styles.linkTextBold, { color: theme === 'dark' ? '#aaaaaa' : '#888888' }]}>Sign in</Text>
                        </Text>
                      </TouchableOpacity>
                    </Animated.View>

                      {/* Error Message */}
                      {error && (
                        <Animated.View
                          style={[
                            styles.errorContainer,
                            {
                              opacity: fadeAnim,
                              transform: [{ translateY: slideAnim }],
                            },
                          ]}
                        >
                          <Text style={styles.errorText}>{error}</Text>
                        </Animated.View>
                      )}

                      {/* Slow Server Message */}
                      {showSlowServerMessage && !error && (
                        <Animated.View
                          style={[
                            styles.slowServerContainer,
                            {
                              opacity: fadeAnim,
                              transform: [{ translateY: slideAnim }],
                            },
                          ]}
                        >
                          <Text style={[
                            styles.slowServerText,
                            { color: theme === 'dark' ? '#fbbf24' : '#d97706' }
                          ]}>
                            Server may be slow, please wait...
                          </Text>
                        </Animated.View>
                      )}
                    </Animated.View>
                  </View>
                </View>
              </Animated.View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </PageBackground>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  darkModeOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  centerMenuButton: {
    position: 'absolute',
    bottom: 40,
    left: '50%',
    marginLeft: -25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 32,
    paddingTop: 140,
  },
  content: {
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
  },
  formWrapper: {
    position: 'relative',
    width: '100%',
  },
  formContainer: {
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  glassmorphic: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },

  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    ...typography.textStyles.displayMedium,
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -1.5,
  },
  subtitle: {
    ...typography.textStyles.bodyMedium,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 26,
  },
  formContent: {
    gap: 24,
  },
  inputGroup: {
    gap: 16,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameInputContainer: {
    flex: 1,
  },
  nameInput: {
    marginBottom: 0,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 0,
    borderRadius: 8,
    fontSize: 16,
    fontWeight: '400',
    height: 42,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  
  // Password strength
  passwordContainer: {
    gap: 16,
  },
  
  linkButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  linkText: {
    ...typography.textStyles.bodyMedium,
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
  },
  linkTextBold: {
    ...typography.textStyles.bodyMedium,
    fontWeight: '600',
  },
  errorContainer: {
    marginTop: 16,
  },
  errorText: {
    ...typography.textStyles.bodyMedium,
    color: '#dc2626',
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 14,
  },
  slowServerContainer: {
    marginTop: 16,
  },
  slowServerText: {
    ...typography.textStyles.bodyMedium,
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 14,
  },
  // Success Screen
  successContainer: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
    flex: 1,
    justifyContent: 'center',
  },
});

export default SignUpScreen;