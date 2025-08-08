/**
 * OnlineStatus Atom
 * Atomic design component for displaying user online status with customizable states
 */

import React from 'react';
import {
  View,
  Text,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { spacing } from '../../tokens/spacing';

export type OnlineStatusType = 'online' | 'offline' | 'away' | 'busy' | 'invisible';

export interface OnlineStatusProps {
  /** Status type */
  status?: OnlineStatusType;
  /** Custom status message */
  statusMessage?: string;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Position style */
  position?: 'absolute' | 'relative';
  /** Custom positioning (for absolute positioning) */
  positioning?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  /** Custom style overrides */
  style?: ViewStyle;
  /** Whether to show detailed status */
  showDetails?: boolean;
}

const STATUS_COLORS = {
  online: '#4CAF50',
  offline: '#9E9E9E',
  away: '#FF9800',
  busy: '#F44336',
  invisible: '#757575',
} as const;

const STATUS_LABELS = {
  online: 'Online',
  offline: 'Offline',
  away: 'Away',
  busy: 'Busy',
  invisible: 'Invisible',
} as const;

const SIZES = {
  small: {
    dot: 6,
    fontSize: 10,
    padding: 4,
  },
  medium: {
    dot: 8,
    fontSize: 12,
    padding: 6,
  },
  large: {
    dot: 10,
    fontSize: 14,
    padding: 8,
  },
} as const;

export const OnlineStatus: React.FC<OnlineStatusProps> = ({
  status = 'online',
  statusMessage,
  size = 'medium',
  position = 'relative',
  positioning,
  style,
  showDetails = false,
}) => {
  const sizeConfig = SIZES[size];
  const statusColor = STATUS_COLORS[status];
  const statusLabel = STATUS_LABELS[status];

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${statusColor}20`,
    borderWidth: 1,
    borderColor: `${statusColor}50`,
    borderRadius: 16,
    paddingHorizontal: sizeConfig.padding * 2,
    paddingVertical: sizeConfig.padding,
    position,
    ...(position === 'absolute' && positioning),
    ...style,
  };

  const dotStyle: ViewStyle = {
    width: sizeConfig.dot,
    height: sizeConfig.dot,
    borderRadius: sizeConfig.dot / 2,
    backgroundColor: statusColor,
    marginRight: spacing[1],
  };

  const textStyle: TextStyle = {
    color: statusColor,
    fontSize: sizeConfig.fontSize,
    fontWeight: '500',
    textTransform: 'lowercase',
  };

  const displayText = showDetails && statusMessage 
    ? `${statusLabel.toLowerCase()} • ${statusMessage}`
    : statusLabel.toLowerCase();

  return (
    <View style={containerStyle}>
      <View style={dotStyle} />
      <Text style={textStyle}>{displayText}</Text>
    </View>
  );
};

export default OnlineStatus;