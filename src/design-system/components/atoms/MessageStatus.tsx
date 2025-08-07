/**
 * MessageStatus Component
 * Shows delivery and read status for friend messages with timestamps
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface MessageStatusProps {
  status?: 'sent' | 'delivered' | 'read';
  readAt?: string;
  deliveredAt?: string;
  timestamp: string;
  theme: 'light' | 'dark';
  showTimestamp?: boolean;
}

const MessageStatus: React.FC<MessageStatusProps> = ({
  status,
  readAt,
  deliveredAt,
  timestamp,
  theme,
  showTimestamp = true
}) => {
  const colors = {
    sent: theme === 'dark' ? '#666' : '#999',
    delivered: theme === 'dark' ? '#4A90E2' : '#007AFF', 
    read: theme === 'dark' ? '#00DD44' : '#34C759',
    timestamp: theme === 'dark' ? '#666' : '#999'
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return '';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'sent':
        return <Feather name="check" size={12} color={colors.sent} />;
      case 'delivered':
        return (
          <View style={styles.doubleCheck}>
            <Feather name="check" size={12} color={colors.delivered} style={styles.checkIcon} />
            <Feather name="check" size={12} color={colors.delivered} style={styles.checkIconOverlay} />
          </View>
        );
      case 'read':
        return (
          <View style={styles.doubleCheck}>
            <Feather name="check" size={12} color={colors.read} style={styles.checkIcon} />
            <Feather name="check" size={12} color={colors.read} style={styles.checkIconOverlay} />
          </View>
        );
      default:
        return null;
    }
  };

  const getStatusTime = () => {
    if (readAt) return formatTime(readAt);
    if (deliveredAt) return formatTime(deliveredAt);
    return formatTime(timestamp);
  };

  const getStatusText = () => {
    if (status === 'read' && readAt) return 'Read';
    if (status === 'delivered' && deliveredAt) return 'Delivered';
    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        {getStatusIcon()}
        
        {showTimestamp && (
          <Text style={[styles.timestamp, { color: colors.timestamp }]}>
            {getStatusTime()}
          </Text>
        )}
        
        {getStatusText() && (
          <Text style={[styles.statusText, { 
            color: status === 'read' ? colors.read : colors.delivered 
          }]}>
            {getStatusText()}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  doubleCheck: {
    flexDirection: 'row',
    width: 16,
    height: 12,
    position: 'relative',
  },
  checkIcon: {
    position: 'absolute',
    left: 0,
  },
  checkIconOverlay: {
    position: 'absolute',
    left: 4,
  },
  timestamp: {
    fontSize: 11,
    fontFamily: 'Nunito-Regular',
    letterSpacing: -0.1,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Nunito-Medium',
    letterSpacing: -0.1,
    opacity: 0.9,
  },
});

export default MessageStatus;