import { useState, useEffect } from 'react';
import { AuthAPI } from '../services/api';

interface UseUsernameValidationReturn {
  usernameAvailable: boolean | null;
  usernameError: string;
  checkingUsername: boolean;
}

export const useUsernameValidation = (username: string): UseUsernameValidationReturn => {
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);

  useEffect(() => {
    const checkUsername = async () => {
      if (username.length >= 3 && /^[a-zA-Z0-9_-]+$/.test(username)) {
        setCheckingUsername(true);
        setUsernameError('');
        setUsernameAvailable(null);
        
        try {
          const result = await AuthAPI.checkUsernameAvailability(username);
          const available = (result as any).available ?? result.data?.available;
          setUsernameAvailable(available);
          if (!available) {
            setUsernameError(result.message || result.data?.message || 'Username not available');
          }
        } catch (error) {
          setUsernameError('Error checking username');
          setUsernameAvailable(null);
        } finally {
          setCheckingUsername(false);
        }
      } else {
        setUsernameAvailable(null);
        setUsernameError('');
        setCheckingUsername(false);
      }
    };

    const timeoutId = setTimeout(checkUsername, 500); // Debounce for 500ms
    return () => clearTimeout(timeoutId);
  }, [username]);

  return {
    usernameAvailable,
    usernameError,
    checkingUsername,
  };
};