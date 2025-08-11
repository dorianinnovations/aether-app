/**
 * Advanced Badge Component - Revolutionary badge system with multiple effects
 * Features: Particle effects, holographic surfaces, 3D depth, dynamic animations
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ViewStyle, 
  TouchableOpacity, 
  Animated,
  Dimensions,
  Easing
} from 'react-native';
import Svg, { 
  Defs, 
  LinearGradient, 
  Stop, 
  Rect, 
  Circle, 
  Path,
  G,
  RadialGradient,
  Polygon
} from 'react-native-svg';
import { MiniTooltip } from './MiniTooltip';

const { width: screenWidth } = Dimensions.get('window');

export type BadgeStyle = 
  | 'holographic'
  | 'neon' 
  | 'glass'
  | 'metal'
  | 'cosmic'
  | 'plasma'
  | 'crystalline'
  | 'quantum';

export type BadgeAnimation = 
  | 'pulse'
  | 'shimmer'
  | 'rotate'
  | 'float'
  | 'particles'
  | 'energy'
  | 'breathe'
  | 'magnetic';

export type BadgeType = 
  | 'legend' 
  | 'vip' 
  | 'og'
  | 'ea' 
  | 'creator' 
  | 'innovator'
  | 'founder'
  | 'legendary'
  | 'quantum'
  | 'ethereal';

interface ParticleConfig {
  count: number;
  size: number;
  speed: number;
  colors: string[];
  opacity: number;
}

interface AdvancedBadgeProps {
  type: BadgeType;
  style?: BadgeStyle;
  animation?: BadgeAnimation;
  visible?: boolean;
  interactive?: boolean;
  showTooltip?: boolean;
  customText?: string;
  size?: 'small' | 'medium' | 'large' | 'xl';
  theme?: 'light' | 'dark';
  intensity?: 'subtle' | 'normal' | 'intense' | 'extreme';
  containerStyle?: ViewStyle;
}

// Particle System Component
const ParticleSystem: React.FC<{
  config: ParticleConfig;
  animation: Animated.Value;
  width: number;
  height: number;
  style: BadgeStyle;
}> = ({ config, animation, width, height, style }) => {
  const particles = Array.from({ length: config.count }, (_, i) => {
    const angle = (i / config.count) * Math.PI * 2;
    const radius = Math.min(width, height) * 0.4;
    
    return {
      id: i,
      x: width / 2 + Math.cos(angle + i) * radius * 0.8,
      y: height / 2 + Math.sin(angle + i) * radius * 0.8,
      size: config.size * (0.5 + Math.random() * 0.5),
      color: config.colors[i % config.colors.length],
      speed: config.speed * (0.7 + Math.random() * 0.6),
    };
  });

  const getParticleElement = (particle: any) => {
    if (style === 'cosmic' || style === 'quantum') {
      return (
        <G key={particle.id}>
          <Circle
            cx={particle.x}
            cy={particle.y}
            r={particle.size}
            fill={particle.color}
            opacity={config.opacity * 0.8}
          />
          <Circle
            cx={particle.x}
            cy={particle.y}
            r={particle.size * 0.5}
            fill="#FFFFFF"
            opacity={config.opacity * 0.4}
          />
        </G>
      );
    }
    
    if (style === 'crystalline') {
      const points = `${particle.x},${particle.y - particle.size} ${particle.x + particle.size},${particle.y + particle.size} ${particle.x - particle.size},${particle.y + particle.size}`;
      return (
        <Polygon
          key={particle.id}
          points={points}
          fill={particle.color}
          opacity={config.opacity}
        />
      );
    }

    // Default circular particles
    return (
      <Circle
        key={particle.id}
        cx={particle.x}
        cy={particle.y}
        r={particle.size}
        fill={particle.color}
        opacity={config.opacity}
      />
    );
  };

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient id="particleGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
          <Stop offset="70%" stopColor={config.colors[0]} stopOpacity="0.4" />
          <Stop offset="100%" stopColor={config.colors[0]} stopOpacity="0.1" />
        </RadialGradient>
      </Defs>
      {particles.map(getParticleElement)}
    </Svg>
  );
};

// Dynamic Background Component
const DynamicBackground: React.FC<{
  style: BadgeStyle;
  animation: Animated.Value;
  width: number;
  height: number;
  theme: 'light' | 'dark';
  type?: BadgeType;
}> = ({ style, animation, width, height, theme, type }) => {
  const getBackground = () => {
    const gradientId = `${style}Gradient`;
    
    switch (style) {
      case 'holographic':
        return (
          <Defs>
            <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FF00FF" stopOpacity="0.3" />
              <Stop offset="25%" stopColor="#00FFFF" stopOpacity="0.4" />
              <Stop offset="50%" stopColor="#FFFF00" stopOpacity="0.3" />
              <Stop offset="75%" stopColor="#FF8000" stopOpacity="0.4" />
              <Stop offset="100%" stopColor="#FF00FF" stopOpacity="0.3" />
            </LinearGradient>
          </Defs>
        );
        
      case 'neon':
        return (
          <Defs>
            <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#FF0080" stopOpacity="0.6" />
              <Stop offset="50%" stopColor="#8000FF" stopOpacity="0.8" />
              <Stop offset="100%" stopColor="#0080FF" stopOpacity="0.6" />
            </LinearGradient>
            <RadialGradient id="neonGlow" cx="50%" cy="50%" r="60%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.2" />
              <Stop offset="70%" stopColor="#FF0080" stopOpacity="0.1" />
              <Stop offset="100%" stopColor="#8000FF" stopOpacity="0.05" />
            </RadialGradient>
          </Defs>
        );
        
      case 'cosmic':
        return (
          <Defs>
            <RadialGradient id={gradientId} cx="50%" cy="50%" r="70%">
              <Stop offset="0%" stopColor="#000040" stopOpacity="0.9" />
              <Stop offset="30%" stopColor="#200040" stopOpacity="0.7" />
              <Stop offset="60%" stopColor="#400080" stopOpacity="0.5" />
              <Stop offset="100%" stopColor="#8000FF" stopOpacity="0.3" />
            </RadialGradient>
          </Defs>
        );
        
      case 'crystalline':
        return (
          <Defs>
            <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#E0F7FF" stopOpacity="0.8" />
              <Stop offset="50%" stopColor="#B8E6FF" stopOpacity="0.6" />
              <Stop offset="100%" stopColor="#80D4FF" stopOpacity="0.4" />
            </LinearGradient>
          </Defs>
        );
        
      case 'glass':
        return (
          <Defs>
            <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={theme === 'dark' ? "#FFFFFF" : "#000000"} stopOpacity="0.05" />
              <Stop offset="50%" stopColor={theme === 'dark' ? "#FFFFFF" : "#000000"} stopOpacity="0.03" />
              <Stop offset="100%" stopColor={theme === 'dark' ? "#FFFFFF" : "#000000"} stopOpacity="0.02" />
            </LinearGradient>
          </Defs>
        );
        
      default:
        return (
          <Defs>
            <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop 
                offset="0%" 
                stopColor={theme === 'dark' ? "#FFFFFF" : "#000000"} 
                stopOpacity="0.05" 
              />
              <Stop 
                offset="100%" 
                stopColor={theme === 'dark' ? "#000000" : "#FFFFFF"} 
                stopOpacity="0.02" 
              />
            </LinearGradient>
          </Defs>
        );
    }
  };

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      {getBackground()}
      <Rect
        width={width}
        height={height}
        rx={height / 4}
        fill={`url(#${style}Gradient)`}
      />
      {style === 'neon' && (
        <Rect
          width={width}
          height={height}
          rx={height / 4}
          fill="url(#neonGlow)"
        />
      )}
    </Svg>
  );
};

const getBadgeConfig = (type: BadgeType, theme: 'light' | 'dark') => {
  const configs = {
    founder: {
      text: 'FOUNDER',
      primaryColor: theme === 'light' ? '#B91C1C' : '#EF4444',
      secondaryColor: theme === 'light' ? '#EF4444' : '#F87171',
      style: 'plasma' as BadgeStyle,
      animation: 'energy' as BadgeAnimation,
      tooltip: 'Early adopter and platform pioneer',
      particles: {
        count: 25,
        size: 3,
        speed: 2.5,
        colors: ['#B91C1C', '#EF4444', '#F87171', '#FECACA'],
        opacity: 1.0,
      },
    },
    og: {
      text: 'OG',
      primaryColor: theme === 'light' ? '#8B5CF6' : '#A78BFA',
      secondaryColor: theme === 'light' ? '#A78BFA' : '#C4B5FD',
      style: 'cosmic' as BadgeStyle,
      animation: 'energy' as BadgeAnimation,
      tooltip: '👑 Original gangster from day one',
      particles: {
        count: 12,
        size: 2,
        speed: 1.2,
        colors: ['#8B5CF6', '#A78BFA', '#C4B5FD'],
        opacity: 0.6,
      },
    },
    vip: {
      text: 'VIP',
      primaryColor: theme === 'light' ? '#D97706' : '#F59E0B',
      secondaryColor: theme === 'light' ? '#F59E0B' : '#FCD34D',
      style: 'crystalline' as BadgeStyle,
      animation: 'breathe' as BadgeAnimation,
      tooltip: 'VIP member with exclusive access',
      particles: {
        count: 8,
        size: 1.5,
        speed: 0.8,
        colors: ['#D97706', '#F59E0B', '#FCD34D'],
        opacity: 0.6,
      },
    },
    ea: {
      text: 'EA',
      primaryColor: theme === 'light' ? '#10B981' : '#34D399',
      secondaryColor: theme === 'light' ? '#34D399' : '#6EE7B7',
      style: 'neon' as BadgeStyle,
      animation: 'pulse' as BadgeAnimation,
      tooltip: 'Early Access pioneer and beta tester',
      particles: {
        count: 12,
        size: 2,
        speed: 1.5,
        colors: ['#10B981', '#34D399', '#6EE7B7'],
        opacity: 0.7,
      },
    },
    creator: {
      text: 'CREATOR',
      primaryColor: theme === 'light' ? '#F59E0B' : '#FCD34D',
      secondaryColor: theme === 'light' ? '#FCD34D' : '#FDE68A',
      style: 'neon' as BadgeStyle,
      animation: 'pulse' as BadgeAnimation,
      tooltip: '🎨 Creative mastermind and content creator',
      particles: {
        count: 10,
        size: 1.2,
        speed: 1,
        colors: ['#F59E0B', '#FCD34D', '#FDE68A'],
        opacity: 0.6,
      },
    },
    innovator: {
      text: 'INNOVATOR',
      primaryColor: theme === 'light' ? '#10B981' : '#34D399',
      secondaryColor: theme === 'light' ? '#34D399' : '#6EE7B7',
      style: 'quantum' as BadgeStyle,
      animation: 'magnetic' as BadgeAnimation,
      tooltip: '⚡ Innovation catalyst and tech pioneer',
      particles: {
        count: 15,
        size: 0.8,
        speed: 1.5,
        colors: ['#10B981', '#34D399', '#6EE7B7'],
        opacity: 0.8,
      },
    },
    legend: {
      text: 'LEGEND',
      primaryColor: theme === 'light' ? '#B91C1C' : '#EF4444',
      secondaryColor: theme === 'light' ? '#EF4444' : '#F87171',
      style: 'plasma' as BadgeStyle,
      animation: 'energy' as BadgeAnimation,
      tooltip: 'Early adopter and platform pioneer',
      particles: {
        count: 25,
        size: 3,
        speed: 1.5,
        colors: ['#B91C1C', '#EF4444', '#F87171'],
        opacity: 1.0,
      },
    },
    legendary: {
      text: 'LEGENDARY',
      primaryColor: theme === 'light' ? '#DC2626' : '#F87171',
      secondaryColor: theme === 'light' ? '#F87171' : '#FCA5A5',
      style: 'plasma' as BadgeStyle,
      animation: 'energy' as BadgeAnimation,
      tooltip: 'Achieved legendary status through excellence',
      particles: {
        count: 30,
        size: 2.5,
        speed: 2.0,
        colors: ['#DC2626', '#F87171', '#FCA5A5', '#FECACA'],
        opacity: 0.9,
      },
    },
    quantum: {
      text: 'QUANTUM',
      primaryColor: theme === 'light' ? '#059669' : '#10B981',
      secondaryColor: theme === 'light' ? '#10B981' : '#34D399',
      style: 'quantum' as BadgeStyle,
      animation: 'particles' as BadgeAnimation,
      tooltip: '⚛️ Exists in multiple states simultaneously',
      particles: {
        count: 30,
        size: 0.6,
        speed: 3,
        colors: ['#059669', '#10B981', '#34D399', '#6EE7B7'],
        opacity: 0.6,
      },
    },
    ethereal: {
      text: 'ETHEREAL',
      primaryColor: theme === 'light' ? '#EC4899' : '#F472B6',
      secondaryColor: theme === 'light' ? '#F472B6' : '#F9A8D4',
      style: 'holographic' as BadgeStyle,
      animation: 'shimmer' as BadgeAnimation,
      tooltip: '✨ Pure ethereal energy being',
      particles: {
        count: 18,
        size: 1.4,
        speed: 0.7,
        colors: ['#EC4899', '#F472B6', '#F9A8D4', '#FBCFE8'],
        opacity: 0.5,
      },
    },
  };

  return configs[type] || configs.vip;
};

const getSizeConfig = (size: 'small' | 'medium' | 'large' | 'xl') => {
  const configs = {
    small: { width: 32, height: 12, fontSize: 6, padding: 2 },
    medium: { width: 50, height: 18, fontSize: 8, padding: 4 },
    large: { width: 58, height: 20, fontSize: 9, padding: 5 },
    xl: { width: 66, height: 22, fontSize: 10, padding: 6 },
  };
  
  return configs[size] || configs.medium;
};

export const AdvancedBadge: React.FC<AdvancedBadgeProps> = ({
  type,
  style: customStyle,
  animation: customAnimation,
  visible = true,
  interactive = true,
  showTooltip = true,
  customText,
  size = 'medium',
  theme = 'light',
  intensity = 'normal',
  containerStyle,
}) => {
  const [showTooltipState, setShowTooltipState] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;
  const rotateValue = useRef(new Animated.Value(0)).current;
  const shimmerValue = useRef(new Animated.Value(0)).current;
  
  const config = getBadgeConfig(type, theme);
  const sizeConfig = getSizeConfig(size);
  const finalStyle = customStyle || config.style;
  const finalAnimation = null; // Disabled all badge animations

  // Animations disabled - badges should never move
  // useEffect(() => {
  //   Animation code removed
  // }, [finalAnimation, visible]);

  if (!visible) return null;

  const handlePress = () => {
    if (!interactive) return;
    
    // No animations on press - badges should never move

    if (showTooltip) {
      setShowTooltipState(true);
      setTimeout(() => setShowTooltipState(false), 3000);
    }
  };

  const getIntensityMultiplier = () => {
    const multipliers = { subtle: 0.5, normal: 1, intense: 1.5, extreme: 2 };
    return multipliers[intensity];
  };

  const intensityMultiplier = getIntensityMultiplier();

  const WrapperComponent = View;
  const wrapperStyle = [
    {
      width: sizeConfig.width,
      height: sizeConfig.height,
    },
  ];

  return (
    <View style={[styles.container, containerStyle]}>
      <WrapperComponent style={wrapperStyle}>
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={interactive ? 0.8 : 1}
          style={[
            styles.badge,
            {
              width: sizeConfig.width,
              height: sizeConfig.height,
              borderRadius: sizeConfig.height / 4,
              borderWidth: intensity === 'extreme' ? 0.5 : 0.25,
              borderColor: (type === 'founder' || type === 'legend') && theme === 'light' 
                ? '#FECACA' // Much lighter red in light mode
                : config.primaryColor,
              backgroundColor: 'transparent',
              shadowColor: config.primaryColor,
              shadowOffset: { width: 0, height: intensity === 'subtle' ? 1 : 2 },
              shadowOpacity: intensity === 'subtle' ? 0.05 : 0.2 * intensityMultiplier,
              shadowRadius: intensity === 'subtle' ? 1 : 4 * intensityMultiplier,
              elevation: intensity === 'subtle' ? 1 : 5 * intensityMultiplier,
            },
          ]}
        >
          {/* Dynamic Background */}
          <DynamicBackground
            style={finalStyle}
            animation={animatedValue}
            width={sizeConfig.width}
            height={sizeConfig.height}
            theme={theme}
            type={type}
          />
          
          {/* Particle System */}
          {finalAnimation && (finalAnimation === 'particles' || intensity === 'extreme') && (
            <ParticleSystem
              config={{
                ...config.particles,
                count: Math.round(config.particles.count * intensityMultiplier),
                opacity: config.particles.opacity * intensityMultiplier,
              }}
              animation={animatedValue}
              width={sizeConfig.width}
              height={sizeConfig.height}
              style={finalStyle}
            />
          )}
          
          {/* Badge Text */}
          <Text
            style={[
              styles.text,
              {
                fontSize: sizeConfig.fontSize,
                color: type === 'founder' || type === 'legend' ? '#FFFFFF' 
                  : (theme === 'dark' ? '#FFFFFF' : config.primaryColor),
                fontWeight: intensity === 'extreme' ? '900' : '800',
                textShadowColor: intensity === 'subtle' ? 'transparent' : (type === 'founder' || type === 'legend' ? '#FFFFFF' : (theme === 'dark' ? config.primaryColor : 'rgba(0,0,0,0.3)')),
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: intensity === 'subtle' ? 0 : (type === 'founder' || type === 'legend' ? (theme === 'dark' ? 8 : 4) : (3 * intensityMultiplier)),
                zIndex: 10,
                letterSpacing: -0.2,
              },
            ]}
          >
            {customText || config.text}
          </Text>
        </TouchableOpacity>
      </WrapperComponent>
      
      {/* Tooltip */}
      {showTooltip && (
        <MiniTooltip
          text={config.tooltip}
          visible={showTooltipState}
          theme={theme}
          position="top"
          width={200}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  text: {
    fontFamily: 'Inter-ExtraBold',
    letterSpacing: -0.2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});

export default AdvancedBadge;