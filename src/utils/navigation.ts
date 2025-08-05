// Navigation utilities

import { NavigationProp } from '@react-navigation/native';

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
  Friends: undefined;
  Profile: undefined;
  Feed: undefined;
};

export type NavigationProps = NavigationProp<RootStackParamList>;

export const navigateToScreen = (
  navigation: NavigationProps,
  screenName: keyof RootStackParamList
): void => {
  navigation.navigate(screenName);
};

export const goBack = (navigation: NavigationProps): void => {
  if (navigation.canGoBack()) {
    navigation.goBack();
  }
};

export const resetToScreen = (
  navigation: NavigationProps,
  screenName: keyof RootStackParamList
): void => {
  // Use navigate instead of reset to avoid navigation structure issues
  navigation.navigate(screenName as never);
};