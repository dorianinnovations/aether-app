import { useMemo } from 'react';
import { designTokens } from '../design-system/tokens/colors';

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

export const usePasswordStrength = (password: string): PasswordStrength => {
  return useMemo(() => {
    let score = 0;
    
    if (password.length >= 8) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = [
      designTokens.semantic.error,
      '#f59e0b',
      '#eab308',
      '#22c55e',
      designTokens.semantic.success,
    ];

    return {
      score,
      label: labels[Math.min(score, 4)],
      color: colors[Math.min(score, 4)],
    };
  }, [password]);
};