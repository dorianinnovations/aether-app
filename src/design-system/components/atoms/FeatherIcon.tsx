/**
 * Feather Icon Component
 * Custom Feather Icons with stroke width states
 */

import React from 'react';
import Svg, { Path, Circle, Line, Polyline, Rect } from 'react-native-svg';

interface FeatherIconProps {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const FeatherIcon: React.FC<FeatherIconProps> = ({ 
  name, 
  size = 24, 
  color = '#000', 
  strokeWidth = 2 
}) => {
  const iconProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case 'clock':
      return (
        <Svg {...iconProps}>
          <Circle cx="12" cy="12" r="10" />
          <Polyline points="12,6 12,12 16,14" />
        </Svg>
      );
    
    case 'disc':
      return (
        <Svg {...iconProps}>
          <Circle cx="12" cy="12" r="10" />
          <Circle cx="12" cy="12" r="3" />
        </Svg>
      );
    
    case 'file-text':
      return (
        <Svg {...iconProps}>
          <Path d="M14,2 L6,2 C4.9,2 4,2.9 4,4 L4,20 C4,21.1 4.9,22 6,22 L18,22 C19.1,22 20,21.1 20,20 L20,8 L14,2 Z" />
          <Polyline points="14,2 14,8 20,8" />
          <Line x1="16" y1="13" x2="8" y2="13" />
          <Line x1="16" y1="17" x2="8" y2="17" />
          <Polyline points="10,9 9,9 8,9" />
        </Svg>
      );
    
    case 'mic':
      return (
        <Svg {...iconProps}>
          <Path d="M12,2 C10.9,2 10,2.9 10,4 L10,12 C10,13.1 10.9,14 12,14 C13.1,14 14,13.1 14,12 L14,4 C14,2.9 13.1,2 12,2 Z" />
          <Path d="M19,10 L19,12 C19,16.4 15.4,20 11,20 L13,20 C8.6,20 5,16.4 5,12 L5,10" />
          <Line x1="12" y1="20" x2="12" y2="24" />
          <Line x1="8" y1="24" x2="16" y2="24" />
        </Svg>
      );
    
    case 'trending-up':
      return (
        <Svg {...iconProps}>
          <Polyline points="23,6 13.5,15.5 8.5,10.5 1,18" />
          <Polyline points="17,6 23,6 23,12" />
        </Svg>
      );
    
    case 'pulse':
      return (
        <Svg {...iconProps}>
          <Polyline points="2,12 6,8 10,16 14,4 18,12 22,8" />
        </Svg>
      );
    
    case 'wave':
      return (
        <Svg {...iconProps}>
          <Path d="M3,12 Q6,6 9,12 T15,12 Q18,6 21,12" />
          <Path d="M3,16 Q6,10 9,16 T15,16 Q18,10 21,16" />
        </Svg>
      );
    
    case 'vinyl':
      return (
        <Svg {...iconProps}>
          <Circle cx="12" cy="12" r="10" />
          <Circle cx="12" cy="12" r="6" />
          <Circle cx="12" cy="12" r="2" fill={color} />
        </Svg>
      );
    
    case 'soundwave':
      return (
        <Svg {...iconProps}>
          <Line x1="8" y1="6" x2="8" y2="18" />
          <Line x1="12" y1="2" x2="12" y2="22" />
          <Line x1="16" y1="8" x2="16" y2="16" />
          <Line x1="4" y1="10" x2="4" y2="14" />
          <Line x1="20" y1="10" x2="20" y2="14" />
        </Svg>
      );
    
    case 'frequency':
      return (
        <Svg {...iconProps}>
          <Path d="M12,2 C17.5,2 22,6.5 22,12 C22,17.5 17.5,22 12,22 C6.5,22 2,17.5 2,12 C2,6.5 6.5,2 12,2 Z" />
          <Path d="M12,6 C15.3,6 18,8.7 18,12 C18,15.3 15.3,18 12,18 C8.7,18 6,15.3 6,12 C6,8.7 8.7,6 12,6 Z" />
          <Circle cx="12" cy="12" r="2" fill={color} />
        </Svg>
      );
    
    default:
      return (
        <Svg {...iconProps}>
          <Circle cx="12" cy="12" r="10" />
        </Svg>
      );
  }
};

export default FeatherIcon;