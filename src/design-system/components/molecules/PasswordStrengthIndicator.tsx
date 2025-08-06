import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { designTokens } from '../../tokens/colors';
import { typography } from '../../tokens/typography';

interface PasswordStrengthIndicatorProps {
  password: string;
  theme: 'light' | 'dark';
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  theme,
}) => {
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    
    if (pass.length >= 8) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

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
  };

  if (password.length === 0) {
    return null;
  }

  const passwordStrength = getPasswordStrength(password);

  return (
    <View style={styles.strengthContainer}>
      <View style={styles.strengthBar}>
        {[1, 2, 3, 4, 5].map((level) => (
          <View
            key={level}
            style={[
              styles.strengthSegment,
              {
                backgroundColor: level <= passwordStrength.score 
                  ? passwordStrength.color 
                  : (theme === 'light' ? '#e5e7eb' : '#333333'),
              },
            ]}
          />
        ))}
      </View>
      <Text style={[
        styles.strengthLabel,
        { color: passwordStrength.color }
      ]}>
        {passwordStrength.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  strengthContainer: {
    marginTop: 8,
    gap: 4,
  },
  strengthBar: {
    flexDirection: 'row',
    height: 4,
    gap: 4,
  },
  strengthSegment: {
    flex: 1,
    borderRadius: 2,
  },
  strengthLabel: {
    ...typography.textStyles.bodyMedium,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'right',
  },
});