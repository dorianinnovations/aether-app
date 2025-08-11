/**
 * Aether Mobile App - Main Entry Point
 * Beautiful neumorphic design with sophisticated AI features
 */

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import {
  MozillaText_400Regular,
  MozillaText_500Medium,
  MozillaText_600SemiBold,
  MozillaText_700Bold,
} from '@expo-google-fonts/mozilla-text';
import {
  CrimsonPro_400Regular,
  CrimsonPro_500Medium,
  CrimsonPro_600SemiBold,
  CrimsonPro_700Bold,
} from '@expo-google-fonts/crimson-pro';
// Removed bottom tabs - using stack navigation only
import { View, StyleSheet, Dimensions, Image } from 'react-native';

// Enhanced Components
import { LottieLoader } from './src/design-system/components/atoms';

// Screens
import HeroLandingScreen from './src/screens/landing/HeroLandingScreen';
import OnboardingScreen from './src/screens/onboarding/OnboardingScreen';
import SignInScreen from './src/screens/auth/SignInScreen';
import SignUpScreen from './src/screens/auth/SignUpScreen';
import ChatScreen from './src/screens/chat/ChatScreen';
import ProfileScreen from './src/screens/profile/ProfileScreen';
import NewsScreen from './src/screens/news/NewsScreen';

// Services
import { TokenManager } from './src/services/api';

// Contexts
import { ThemeProvider } from './src/contexts/ThemeContext';
import { SettingsProvider } from './src/contexts/SettingsContext';
import { ToastProvider } from './src/design-system/components/organisms';

// Design System
import { getThemeColors } from './src/design-system/tokens/colors';
import { fontConfig } from './src/design-system/tokens/typography';
import { spacing } from './src/design-system/tokens/spacing';

// Utils
import { logger } from './src/utils/logger';

// Custom Transitions
import { colorFadeTransition } from './src/design-system/transitions/colorFadeTransition';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();


Dimensions.get('window');

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  MainStack: undefined;
};

export type AuthStackParamList = {
  Hero: undefined;
  Onboarding: undefined;
  SignIn: undefined;
  SignUp: undefined;
};

export type MainStackParamList = {
  Chat: undefined;
  Profile: undefined;
  News: undefined;
};

// Create navigators
const RootStack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const MainStack = createStackNavigator<MainStackParamList>();

// All screens are now implemented


// Auth Stack Navigator
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      initialRouteName="Hero"
      screenOptions={{
        headerShown: false,
        cardStyleInterpolator: ({ current }) => ({
          cardStyle: {
            opacity: current.progress,
          },
        }),
      }}
    >
      <AuthStack.Screen name="Hero" component={HeroLandingScreen} />
      <AuthStack.Screen name="Onboarding" component={OnboardingScreen} />
      <AuthStack.Screen name="SignIn" component={SignInScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
    </AuthStack.Navigator>
  );
};

// Main Stack Navigator
const MainStackNavigator = () => {
  return (
    <MainStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyleInterpolator: colorFadeTransition,
        transitionSpec: {
          open: {
            animation: 'timing',
            config: {
              duration: 250,
            },
          },
          close: {
            animation: 'timing',
            config: {
              duration: 200,
            },
          },
        },
      }}
    >
      <MainStack.Screen name="Chat" component={ChatScreen} />
      <MainStack.Screen name="Profile" component={ProfileScreen} />
      <MainStack.Screen name="News" component={NewsScreen} />
    </MainStack.Navigator>
  );
};

// Loading Screen  
const LoadingScreen = () => {
  const theme = 'light' as const;
  const themeColors = getThemeColors(theme);
  
  // Explicit conditional logic to avoid type overlap issues
  const logoSource = require('./assets/images/aether-logo-light-mode.webp');
  const brandLogoSource = require('./assets/images/aether-brand-logo-light.webp');
  const logoOpacity = 0.2;

  return (
    <View style={[styles.loadingContainer, { backgroundColor: themeColors.background }]}>
      <View style={styles.logoContainer}>
        <Image
          source={logoSource}
          style={[styles.logo, { 
            opacity: logoOpacity, 
            transform: [{ rotate: '25deg' }, { scaleX: 2.0 }] 
          }]}
          resizeMode="contain"
        />
        <Image
          source={brandLogoSource}
          style={styles.brandLogoOverlay}
          resizeMode="contain"
        />
      </View>
      <LottieLoader 
        size="large"
        style={styles.loadingSpinner}
      />
    </View>
  );
};

// Main App Component
export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  const checkAuthStatus = async () => {
    const token = await TokenManager.getToken();
    setIsAuthenticated(!!token);
  };

  const loadFonts = async () => {
    try {
      await Font.loadAsync({
        ...fontConfig,
        MozillaText_400Regular,
        MozillaText_500Medium,
        MozillaText_600SemiBold,
        MozillaText_700Bold,
        CrimsonPro_400Regular,
        CrimsonPro_500Medium,
        CrimsonPro_600SemiBold,
        CrimsonPro_700Bold,
      });
      setFontsLoaded(true);
    } catch (error) {
      logger.error('Font loading error:', error);
      setFontsLoaded(true); // Continue with fallback fonts
    }
  };


  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load fonts and check authentication in parallel
        await Promise.all([
          loadFonts(),
          checkAuthStatus()
        ]);

        // Simulate loading time for smooth experience
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        logger.error('App initialization error:', error);
      } finally {
        setIsLoading(false);
        await SplashScreen.hideAsync();
      }
    };

    initializeApp();

    // Listen for auth state changes by checking periodically (optimized frequency)
    const authCheckInterval = setInterval(checkAuthStatus, 5000);
    
    (global as typeof globalThis & { clearAuthState?: () => Promise<void> }).clearAuthState = async () => {
      await TokenManager.removeToken();
      setIsAuthenticated(false);
    };
    
    return () => clearInterval(authCheckInterval);
  }, []);

  if (isLoading || !fontsLoaded) {
    return <LoadingScreen />;
  }

  return (
    <SettingsProvider>
      <ThemeProvider>
        <ToastProvider>
        <NavigationContainer>
        <StatusBar style="auto" />
        <RootStack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyleInterpolator: ({ current }) => ({
              cardStyle: {
                opacity: current.progress,
              },
            }),
          }}
        >
          {isAuthenticated ? (
            <RootStack.Screen name="MainStack" component={MainStackNavigator} />
          ) : (
            <RootStack.Screen name="Auth" component={AuthNavigator} />
          )}
        </RootStack.Navigator>
        </NavigationContainer>
        </ToastProvider>
      </ThemeProvider>
    </SettingsProvider>
  );
}

const styles = StyleSheet.create({
  // Loading Screen
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
  },
  logoContainer: {
    position: 'relative',
    height: 60,
    width: 200,
    overflow: 'visible',
    marginBottom: spacing[8],
  },
  logo: {
    height: 60,
    width: 200,
  },
  brandLogoOverlay: {
    position: 'absolute',
    height: 200,
    width: 200,
    top: -70,
    left: 0,
    zIndex: 2,
    opacity: 0.9,
  },
  loadingSpinner: {
    marginBottom: spacing[4],
  },

});
