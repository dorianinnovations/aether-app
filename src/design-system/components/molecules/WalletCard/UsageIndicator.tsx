/**
 * Usage Indicator Component
 * Shows usage progress and remaining requests
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface UsageIndicatorProps {
  usage: {
    gpt4o: number;
    gpt5: number;
    gpt5Limit?: number;
  };
  usagePercentage: number;
  remainingRequests: number;
  theme: 'light' | 'dark';
}

export const UsageIndicator: React.FC<UsageIndicatorProps> = ({
  usage,
  usagePercentage,
  remainingRequests,
  theme,
}) => {
  const getUsageColor = () => {
    if (usagePercentage < 50) return ['#10B981', '#059669'] as const;
    if (usagePercentage < 80) return ['#F59E0B', '#D97706'] as const;
    return ['#EF4444', '#DC2626'] as const;
  };

  const colors = getUsageColor();

  return (
    <View style={styles.usageSection}>
      <View style={styles.usageHeader}>
        <Text style={[styles.usageLabel, { 
          color: theme === 'dark' ? '#ffffff' : '#000000' 
        }]}>
          Premium Model Usage
        </Text>
        <Text style={[styles.usageNumbers, { 
          color: theme === 'dark' ? '#cccccc' : '#666666' 
        }]}>
          {usage.gpt5}/{usage.gpt5Limit || 0}
        </Text>
      </View>
      
      <View style={[styles.progressBar, {
        backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f0f0f0'
      }]}>
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressFill, { width: `${usagePercentage}%` }]}
        />
      </View>
      
      <Text style={[styles.remainingText, { 
        color: theme === 'dark' ? '#aaaaaa' : '#888888' 
      }]}>
        {remainingRequests} requests remaining this month
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  usageSection: {
    marginTop: 16,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  usageLabel: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  usageNumbers: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'System',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  remainingText: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'System',
  },
});