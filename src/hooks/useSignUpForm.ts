import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { AuthAPI } from '../services/api';

interface UseSignUpFormReturn {
  // Form state
  firstName: string;
  setFirstName: (value: string) => void;
  lastName: string;
  setLastName: (value: string) => void;
  username: string;
  setUsername: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  
  // Error and loading state
  error: string;
  setError: (value: string) => void;
  localLoading: boolean;
  setLocalLoading: (value: boolean) => void;
  authStatus: 'idle' | 'loading' | 'success' | 'error';
  setAuthStatus: (value: 'idle' | 'loading' | 'success' | 'error') => void;
  isSignUpSuccess: boolean;
  setIsSignUpSuccess: (value: boolean) => void;
  showSlowServerMessage: boolean;
  setShowSlowServerMessage: (value: boolean) => void;
  timeoutId: NodeJS.Timeout | null;
  setTimeoutId: (value: NodeJS.Timeout | null) => void;
  
  // Methods
  clearErrorOnChange: () => void;
  validateAndSubmit: (usernameAvailable: boolean | null, passwordStrength: { score: number }) => Promise<void>;
  resetForm: () => void;
}

export const useSignUpForm = (): UseSignUpFormReturn => {
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Error and loading state
  const [error, setError] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [isSignUpSuccess, setIsSignUpSuccess] = useState(false);
  const [showSlowServerMessage, setShowSlowServerMessage] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const clearErrorOnChange = () => {
    if (error) {
      setError('');
      setAuthStatus('idle');
    }
  };

  const validateAndSubmit = async (usernameAvailable: boolean | null, passwordStrength: { score: number }) => {
    if (!firstName.trim() || !lastName.trim() || !username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (username.length < 3 || username.length > 20) {
      setError('Username must be between 3 and 20 characters');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setError('Username can only contain letters, numbers, hyphens, and underscores');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (usernameAvailable === false) {
      setError('Username is not available');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (passwordStrength.score < 2) {
      setError('Password is too weak. Add uppercase, numbers, or symbols');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setError('');
    setLocalLoading(true);
    setIsSignUpSuccess(false);
    setAuthStatus('loading');
    setShowSlowServerMessage(false);

    // Start 15-second timeout for slow server message
    const timeout = setTimeout(() => {
      if (localLoading) {
        setShowSlowServerMessage(true);
      }
    }, 15000);
    setTimeoutId(timeout);

    try {
      const response = await AuthAPI.signup(email.trim(), password, `${firstName.trim()} ${lastName.trim()}`, username.trim());

      if (response) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setIsSignUpSuccess(true);
        setAuthStatus('success');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const errorMessage = 'Account creation failed';
        setError(errorMessage);
        setIsSignUpSuccess(false);
        setAuthStatus('error');
        
        setTimeout(() => {
          setAuthStatus('idle');
        }, 3000);
      }
    } catch (err: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const errorMessage = (err as Error)?.message || 'Network error, try again in a few minutes';
      setError(errorMessage);
      setIsSignUpSuccess(false);
      setAuthStatus('error');
      
      setTimeout(() => {
        setAuthStatus('idle');
      }, 3000);
    } finally {
      setLocalLoading(false);
      setShowSlowServerMessage(false);
      
      if (timeoutId) {
        clearTimeout(timeoutId);
        setTimeoutId(null);
      }
    }
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setLocalLoading(false);
    setAuthStatus('idle');
    setIsSignUpSuccess(false);
    setShowSlowServerMessage(false);
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  };

  return {
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
    setError,
    localLoading,
    setLocalLoading,
    authStatus,
    setAuthStatus,
    isSignUpSuccess,
    setIsSignUpSuccess,
    showSlowServerMessage,
    setShowSlowServerMessage,
    timeoutId,
    setTimeoutId,
    clearErrorOnChange,
    validateAndSubmit,
    resetForm,
  };
};