import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
// import { typography } from '../../tokens/typography';

interface UsernameStatusIndicatorProps {
  username: string;
  checking: boolean;
  available: boolean | null;
  error: string;
  theme: 'light' | 'dark';
}

export const UsernameStatusIndicator: React.FC<UsernameStatusIndicatorProps> = ({
  username,
  checking,
  available,
  error,
  theme,
}) => {
  if (username.length < 3) {
    return null;
  }

  return (
    <View style={styles.usernameStatus}>
      {checking ? (
        <View style={styles.usernameStatusRow}>
          <Text style={[styles.usernameStatusText, { color: theme === 'dark' ? '#888' : '#666' }]}>
            Checking...
          </Text>
        </View>
      ) : available === true ? (
        <View style={styles.usernameStatusRow}>
          <Feather name="check-circle" size={14} color="#22c55e" />
          <Text style={[styles.usernameStatusText, { color: '#22c55e' }]}>
            Available
          </Text>
        </View>
      ) : available === false ? (
        <View style={styles.usernameStatusRow}>
          <Feather name="x-circle" size={14} color="#ef4444" />
          <Text style={[styles.usernameStatusText, { color: '#ef4444' }]}>
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  usernameStatus: {
    marginTop: 8,
    alignItems: 'flex-start',
  },
  usernameStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  usernameStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
});