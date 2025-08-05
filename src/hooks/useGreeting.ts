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

  // Get time-based greeting with friend/family focus
  const getTimeBasedGreeting = () => {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = day === 0 || day === 6;
    const isFriday = day === 5;
    
    const morningGreetings = [
      "Good morning! Ready to start something amazing?",
      "Rise and shine! The day is full of possibilities",
      "Morning! Time to turn your dreams into plans",
      "Start your day with a smile and see what unfolds",
      "Coffee's ready, and so are you for greatness!",
      "Morning vibes: Today feels like a perfect day",
      "Early bird catches the sunrise and the good vibes!",
      "Good morning! Fun fact: Today is going to be fantastic",
      "Rise and shine! The world is waiting for your magic"
    ];

    const afternoonGreetings = [
      "Good afternoon! Perfect timing to tackle your goals",
      "Afternoon check-in: How's your day treating you?",
      "Lunch break vibes! Time to recharge and refocus",
      "Afternoon energy = perfect time to get things done",
      "Mid-day motivation: You're doing great, keep it up!",
      "Afternoon delight: Making progress feels amazing",
      "Fun fact: 3 PM is scientifically the best time for creativity!",
      "Afternoon wisdom: Every small step counts",
      "Post-lunch clarity hitting! Ready to conquer the rest of the day"
    ];

    const eveningGreetings = [
      "Good evening! Time to unwind and reflect on the day",
      "Evening vibes: Perfect for relaxation and peaceful moments",
      "Dinner time approaching... What sounds delicious tonight?",
      "Golden hour energy! Time to enjoy the beautiful sunset",
      "Evening wisdom: The best ideas often come when you're relaxed",
      "Sunset mode activated! Time for some well-deserved rest",
      "Why did the evening smile? Because it brought peace and calm!",
      "End-of-day ritual: Celebrating what you accomplished today",
      "Evening mood: Ready to embrace the tranquil night ahead"
    ];

    const weekendGreetings = [
      "Weekend mode: Maximum relaxation activated!",
      "Saturday/Sunday vibes: Ready for some well-deserved fun?",
      "Weekend wisdom: The best adventures start with a great mood",
      "No alarms, just good vibes and endless possibilities",
      "Weekend energy: Time for the things that make you happy",
      "Lazy weekend or adventure weekend? Both sound perfect!",
      "Weekend joke: Why are weekends so short? Because good times fly by!"
    ];

    const fridayGreetings = [
      "TGIF! Time to celebrate making it through the week",
      "Friday feeling: The weekend is calling your name",
      "Friday energy: Ready to make some weekend magic happen?",
      "End of work week = beginning of relaxation time!",
      "Friday mood: Time to plan some well-deserved fun",
      "Weekend countdown begins now! What sounds amazing?"
    ];
  
  

    function getRandomGreeting(greetings: string[]) {
      return greetings[Math.floor(Math.random() * greetings.length)];
    }

    // Special day overrides
    if (isFriday && hour >= 17) {
      return getRandomGreeting(fridayGreetings);
    }
    
    if (isWeekend) {
      return getRandomGreeting(weekendGreetings);
    }

    // Regular time-based greetings
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
        console.error('Error loading user data for greeting:', error);
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
  };
};