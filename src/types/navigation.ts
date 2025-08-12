/**
 * Navigation type definitions
 * Types for React Navigation and screen routing
 */

import { NavigationProp } from '@react-navigation/native';

export type RootStackParamList = {
  Chat: undefined;
  Profile: undefined;
  Feed: undefined;
  Buzz: undefined;
  Insights: undefined;
  SignIn: undefined;
  SignUp: undefined;
  Onboarding: undefined;
  Friends: undefined;
  Social: undefined;
  HeroLanding: undefined;
};

export type NavigationProps = NavigationProp<RootStackParamList>;

export type ScreenName = keyof RootStackParamList;
