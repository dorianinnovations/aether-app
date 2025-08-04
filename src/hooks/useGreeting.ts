/**
 * Custom hook for managing dynamic greeting state and logic
 */
import { useState, useEffect } from 'react';
import { TokenManager } from '../services/api';

interface UseGreetingReturn {
  userName: string;
  greetingText: string;
  showGreeting: boolean;
  setShowGreeting: (show: boolean) => void;
}

export const useGreeting = (): UseGreetingReturn => {
  const [userName, setUserName] = useState<string>('');
  const [greetingText, setGreetingText] = useState<string>('');
  const [showGreeting, setShowGreeting] = useState<boolean>(true);

  // Get time-based greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    
    const morningGreetings = [
      'Good Morning',
      'Rise and shine',
      'Top of the morning',
      'Morning, sunshine',
      'Wishing you a bright morning',
      'Hope your morning is as lovely as you'
    ];
    const afternoonGreetings = [
      'Good Afternoon',
      'Hope your afternoon is going well',
      'Wishing you a productive afternoon',
      'Hello, afternoon star',
      'Enjoy your afternoon',
      'A pleasant afternoon to you'
    ];
    const eveningGreetings = [
      'Good Evening',
      'Hope you had a great day',
      'Winding down, are we?',
      'Evening, friend',
      'Wishing you a relaxing evening',
      'The night is young'
    ];

    function getRandomGreeting(greetings: string[]) {
      return greetings[Math.floor(Math.random() * greetings.length)];
    }

    if (hour >= 5 && hour < 12) {
      return getRandomGreeting(morningGreetings);
    } else if (hour >= 12 && hour < 17) {
      return getRandomGreeting(afternoonGreetings);
    } else {
      return getRandomGreeting(eveningGreetings);
    }
  };

  // Initialize dynamic greeting
  useEffect(() => {
    const initializeGreeting = async () => {
      try {
        const userData = await TokenManager.getUserData();
        const firstName = userData?.name?.split(' ')[0] || 'User';
        setUserName(firstName);
        
        const timeGreeting = getTimeBasedGreeting();
        setGreetingText(`${timeGreeting}, ${firstName}`);
      } catch (error) {
        // Fallback with current time-based greeting
        const timeGreeting = getTimeBasedGreeting();
        setGreetingText(`${timeGreeting}, User`);
      }
    };
    
    initializeGreeting();
  }, []);

  return {
    userName,
    greetingText,
    showGreeting,
    setShowGreeting,
  };
};