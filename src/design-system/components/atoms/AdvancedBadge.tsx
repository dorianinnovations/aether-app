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
  | 'early' 
  | 'creator' 
  | 'innovator'
  | 'founder'
  | 'legendary'
  | 'quantum'
  | 'ethereal'
  | 'verified'
  | 'supporter'
  | 'elite';

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
  // Military/Medal inspired color palette - sleek and professional
  const military = {
    gold: theme === 'light' ? '#B8860B' : '#DAA520',
    silver: theme === 'light' ? '#6B7280' : '#9CA3AF', 
    bronze: theme === 'light' ? '#8B4513' : '#CD853F',
    steel: theme === 'light' ? '#374151' : '#6B7280',
    platinum: theme === 'light' ? '#4B5563' : '#D1D5DB',
    titanium: theme === 'light' ? '#1F2937' : '#F3F4F6',
    crimson: theme === 'light' ? '#7F1D1D' : '#DC2626',
    navy: theme === 'light' ? '#1E3A8A' : '#3B82F6',
  };

  const configs = {
    founder: {
      text: 'FOUNDER',
      primaryColor: military.crimson,
      secondaryColor: military.gold,
      style: 'metal' as BadgeStyle,
      animation: null,
      tooltip: 'Founding member who built Aether from the ground up',
      particles: { count: 0, size: 0, speed: 0, colors: [], opacity: 0 },
    },
    og: {
      text: 'OG',
      primaryColor: military.gold,
      secondaryColor: military.steel,
      style: 'metal' as BadgeStyle,
      animation: null,
      tooltip: 'Original member from the early days',
      particles: { count: 0, size: 0, speed: 0, colors: [], opacity: 0 },
    },
    vip: {
      text: 'VIP',
      primaryColor: military.platinum,
      secondaryColor: military.steel,
      style: 'metal' as BadgeStyle,
      animation: null,
      tooltip: 'VIP member with exclusive privileges',
      particles: { count: 0, size: 0, speed: 0, colors: [], opacity: 0 },
    },
    early: {
      text: 'EARLY',
      primaryColor: military.bronze,
      secondaryColor: military.steel,
      style: 'metal' as BadgeStyle,
      animation: null,
      tooltip: 'Early adopter who joined in the first wave',
      particles: { count: 0, size: 0, speed: 0, colors: [], opacity: 0 },
    },
    creator: {
      text: 'CREATOR',
      primaryColor: military.navy,
      secondaryColor: military.steel,
      style: 'metal' as BadgeStyle,
      animation: null,
      tooltip: 'Content creator and community builder',
      particles: { count: 0, size: 0, speed: 0, colors: [], opacity: 0 },
    },
    innovator: {
      text: 'INNOVATOR',
      primaryColor: military.titanium,
      secondaryColor: military.steel,
      style: 'metal' as BadgeStyle,
      animation: null,
      tooltip: 'Innovation catalyst and tech pioneer',
      particles: { count: 0, size: 0, speed: 0, colors: [], opacity: 0 },
    },
    legend: {
      text: 'LEGEND',
      primaryColor: military.gold,
      secondaryColor: military.crimson,
      style: 'metal' as BadgeStyle,
      animation: null,
      tooltip: 'Legendary member with ultimate recognition',
      particles: { count: 0, size: 0, speed: 0, colors: [], opacity: 0 },
    },
    legendary: {
      text: 'LEGENDARY',
      primaryColor: military.gold,
      secondaryColor: military.crimson,
      style: 'metal' as BadgeStyle,
      animation: null,
      tooltip: 'Achieved legendary status through excellence',
      particles: { count: 0, size: 0, speed: 0, colors: [], opacity: 0 },
    },
    quantum: {
      text: 'QUANTUM',
      primaryColor: military.titanium,
      secondaryColor: military.steel,
      style: 'metal' as BadgeStyle,
      animation: null,
      tooltip: 'Advanced quantum-level contributor',
      particles: { count: 0, size: 0, speed: 0, colors: [], opacity: 0 },
    },
    ethereal: {
      text: 'ETHEREAL',
      primaryColor: military.platinum,
      secondaryColor: military.titanium,
      style: 'metal' as BadgeStyle,
      animation: null,
      tooltip: 'Ethereal presence in the community',
      particles: { count: 0, size: 0, speed: 0, colors: [], opacity: 0 },
    },
    verified: {
      text: 'VERIFIED',
      primaryColor: military.navy,
      secondaryColor: military.steel,
      style: 'metal' as BadgeStyle,
      animation: null,
      tooltip: 'Verified community member',
      particles: { count: 0, size: 0, speed: 0, colors: [], opacity: 0 },
    },
    supporter: {
      text: 'PRO',
      primaryColor: military.steel,
      secondaryColor: military.titanium,
      style: 'metal' as BadgeStyle,
      animation: null,
      tooltip: 'Platform supporter and contributor',
      particles: { count: 0, size: 0, speed: 0, colors: [], opacity: 0 },
    },
    elite: {
      text: 'ELITE',
      primaryColor: military.crimson,
      secondaryColor: military.gold,
      style: 'metal' as BadgeStyle,
      animation: null,
      tooltip: 'Elite member with exclusive access',
      particles: { count: 0, size: 0, speed: 0, colors: [], opacity: 0 },
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
                color: theme === 'dark' ? '#FFFFFF' : config.primaryColor,
                fontWeight: '800',
                zIndex: 10,
                letterSpacing: config.text.length > 6 ? -0.4 : -0.2,
                lineHeight: sizeConfig.fontSize + 2,
              },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.7}
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