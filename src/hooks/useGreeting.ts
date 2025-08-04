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
      "Good morning! Ready to start something new",
      "Rise and shine—let's make today memorable",
      "Morning! New opportunities await you",
      "Start your day with a fresh connection",
      "It's a bright morning with bright friendships ahead",
      "Let's make this morning count"
    ];

    const afternoonGreetings = [
      "Good afternoon! Time to connect and grow",
      "Hope your day is going well—let's meet someone new",
      "Afternoon vibes are perfect for new friends",
      "Expand your circle this afternoon",
      "Your next great conversation starts now",
      "Let's make the most of your afternoon"
    ];

    const eveningGreetings = [
      "Good evening! Unwind and connect",
      "Evening is for meaningful conversations",
      "Relax and meet someone interesting tonight",
      "It's the perfect time to discover new friends",
      "Your evening just got more social",
      "Let's end the day with a great chat"
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
        console.log('User data from storage:', userData); // Debug log
        
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
        setGreetingText(`${timeGreeting}, ${firstName}`);
      } catch (error) {
        console.error('Error loading user data for greeting:', error);
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