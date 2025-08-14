/**
 * Custom hook for managing dynamic greeting state and logic
 */
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TokenManager } from '../services/api';
import { logger } from '../utils/logger';

interface UseGreetingReturn {
  userName: string;
  greetingText: string;
  showGreeting: boolean;
  setShowGreeting: (show: boolean) => void;
  hasShimmerRun: boolean;
  markShimmerAsRun: () => Promise<void>;
  resetShimmerState: () => Promise<void>;
}

const SHIMMER_RUN_KEY = '@greeting_shimmer_has_run';

export const useGreeting = (): UseGreetingReturn => {
  const [userName, setUserName] = useState<string>('');
  const [greetingText, setGreetingText] = useState<string>('');
  const [showGreeting, setShowGreeting] = useState<boolean>(true);
  const [hasShimmerRun, setHasShimmerRun] = useState<boolean>(false);

  // Check if a greeting works well with a name appended
  const isNameFriendly = (greeting: string): boolean => {
    const nameUnfriendlyPatterns = [
      /^Fun fact:/i,
      /^Why did/i,
      /joke:/i,
      /\?$/,  // Questions don't work well with names at the end
      /!.*!/,  // Multiple exclamations usually don't work with names
    ];
    
    return !nameUnfriendlyPatterns.some(pattern => pattern.test(greeting));
  };

  // Get time-based greeting with variations
  const getTimeGreeting = () => {
    const now = new Date();
    const hour = now.getHours();
    
    if (hour >= 5 && hour < 12) {
      const morningGreetings = [
        { text: "Good morning", useName: true },
        { text: "Morning", useName: true },
        { text: "Rise and shine", useName: true },
        { text: "Someone's alarm just went off somewhere", useName: false },
        { text: "Morning coffee and good music, perfect combo", useName: false }
      ];
      return morningGreetings[Math.floor(Math.random() * morningGreetings.length)];
    } 
    else if (hour >= 12 && hour < 18) {
      const afternoonGreetings = [
        { text: "Good afternoon", useName: true },
        { text: "Afternoon", useName: true },
        { text: "Hope your day's been melodic", useName: true },
        { text: "That afternoon playlist energy is hitting different", useName: false },
        { text: "Somewhere someone just discovered their new favorite song", useName: false }
      ];
      return afternoonGreetings[Math.floor(Math.random() * afternoonGreetings.length)];
    }
    else {
      const eveningGreetings = [
        { text: "Good evening", useName: true },
        { text: "Evening", useName: true },
        { text: "Hope your evening sounds good", useName: true },
        { text: "Golden hour deserves a golden playlist", useName: false },
        { text: "The skip button is working overtime tonight", useName: false }
      ];
      return eveningGreetings[Math.floor(Math.random() * eveningGreetings.length)];
    }
  };

  // Function to mark shimmer as run
  const markShimmerAsRun = async () => {
    try {
      await AsyncStorage.setItem(SHIMMER_RUN_KEY, 'true');
      setHasShimmerRun(true);
    } catch (error) {
      logger.error('Error saving shimmer run state:', error);
    }
  };

  // Function to reset shimmer state (for testing)
  const resetShimmerState = async () => {
    try {
      await AsyncStorage.removeItem(SHIMMER_RUN_KEY);
      setHasShimmerRun(false);
    } catch (error) {
      logger.error('Error resetting shimmer state:', error);
    }
  };

  // Check if shimmer has already run
  const checkShimmerRunState = async () => {
    try {
      const hasRun = await AsyncStorage.getItem(SHIMMER_RUN_KEY);
      setHasShimmerRun(hasRun === 'true');
    } catch (error) {
      logger.error('Error checking shimmer run state:', error);
      setHasShimmerRun(false);
    }
  };

  // Initialize dynamic greeting
  useEffect(() => {
    const initializeGreeting = async () => {
      // Check shimmer run state first
      await checkShimmerRunState();
      try {
        const userData = await TokenManager.getUserData();
        
        // Try multiple ways to extract the name
        let firstName = 'User';
        if (userData?.name) {
          firstName = userData.name.split(' ')[0];
        } else if (userData?.firstName) {
          firstName = userData.firstName;
        } else if (userData?.full_name) {
          firstName = userData.full_name.split(' ')[0];
        } else if (userData?.fullName) {
          firstName = userData.fullName.split(' ')[0];
        }
        
        setUserName(firstName);
        
        const timeGreeting = getTimeGreeting();
        
        // Add name only if it makes sense
        if (timeGreeting.useName) {
          setGreetingText(`${timeGreeting.text}, ${firstName}`);
        } else {
          setGreetingText(timeGreeting.text);
        }
      } catch (error) {
        logger.error('Error loading user data for greeting:', error);
        // Fallback greeting
        const timeGreeting = getTimeGreeting();
        setGreetingText(timeGreeting.text);
      }
    };
    
    initializeGreeting();
  }, []);

  return {
    userName,
    greetingText,
    showGreeting,
    setShowGreeting,
    hasShimmerRun,
    markShimmerAsRun,
    resetShimmerState,
  };
};