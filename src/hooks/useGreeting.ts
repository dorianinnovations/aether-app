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

  // Get simple time-based greeting
  const getTimeBasedGreeting = () => {
    const now = new Date();
    const hour = now.getHours();
    
    // Early AM (12 AM - 4:59 AM): Special case - late night
    if (hour >= 0 && hour < 5) {
      return "Good evening";
    }
    // Morning (5 AM - 11:59 AM)
    else if (hour >= 5 && hour < 12) {
      return "Good morning";
    }
    // Afternoon (12 PM - 5:59 PM)
    else if (hour >= 12 && hour < 18) {
      return "Good afternoon";
    }
    // Evening (6 PM - 11:59 PM): Special case - late night
    else {
      return "Good evening";
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
        
        const timeGreeting = getTimeBasedGreeting();
        
        // 60% chance to include name, 40% chance to just use greeting
        const includeNameChance = Math.random() > 0.4;
        
        if (includeNameChance) {
          // Check if this greeting works well with names
          if (isNameFriendly(timeGreeting)) {
            // Sometimes add the name at the start, sometimes at the end
            const nameAtStart = Math.random() > 0.5;
            if (nameAtStart) {
              setGreetingText(`Hey ${firstName}! ${timeGreeting}`);
            } else {
              setGreetingText(`${timeGreeting}, ${firstName}!`);
            }
          } else {
            // For name-unfriendly greetings, only add name at the start
            setGreetingText(`Hey ${firstName}! ${timeGreeting}`);
          }
        } else {
          // Just use the greeting without the name
          setGreetingText(timeGreeting);
        }
      } catch (error) {
        logger.error('Error loading user data for greeting:', error);
        // Fallback with current time-based greeting (no "User" needed)
        const timeGreeting = getTimeBasedGreeting();
        setGreetingText(timeGreeting);
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