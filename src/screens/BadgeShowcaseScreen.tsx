/**
 * Badge Showcase Screen - Demo all revolutionary badge variations
 * Features: Live preview, customization controls, performance testing
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import { AdvancedBadge, BadgeType, BadgeStyle, BadgeAnimation } from '../design-system/components/atoms/AdvancedBadge';
import { InteractiveBadge } from '../design-system/components/atoms/InteractiveBadge';
import { designTokens } from '../design-system/tokens/colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ShowcaseSection {
  title: string;
  badges: {
    type: BadgeType;
    style?: BadgeStyle;
    animation?: BadgeAnimation;
    description: string;
  }[];
}

const showcaseSections: ShowcaseSection[] = [
  {
    title: '🚀 Legendary Badges',
    badges: [
      {
        type: 'founder',
        style: 'holographic',
        animation: 'shimmer',
        description: 'Holographic shimmer effect with golden particles'
      },
      {
        type: 'legend',
        style: 'plasma',
        animation: 'energy',
        description: 'Plasma energy field with intense glow'
      },
      {
        type: 'quantum',
        style: 'cosmic',
        animation: 'float',
        description: 'Cosmic consciousness with stellar particles'
      },
    ],
  },
  {
    title: '⚡ Tech Innovators',
    badges: [
      {
        type: 'innovator',
        style: 'quantum',
        animation: 'magnetic',
        description: 'Quantum field manipulation effects'
      },
      {
        type: 'quantum',
        style: 'quantum',
        animation: 'particles',
        description: 'Multi-state quantum particle system'
      },
      {
        type: 'ethereal',
        style: 'holographic',
        animation: 'shimmer',
        description: 'Pure ethereal energy manifestation'
      },
    ],
  },
  {
    title: '🎨 Creative Visionaries',
    badges: [
      {
        type: 'creator',
        style: 'neon',
        animation: 'pulse',
        description: 'Neon pulse with creative energy'
      },
      {
        type: 'vip',
        style: 'crystalline',
        animation: 'breathe',
        description: 'Crystal formation with organic breathing'
      },
      {
        type: 'vip',
        style: 'glass',
        animation: 'rotate',
        description: 'Glass morphic rotating elements'
      },
    ],
  },
];

const badgeStyles: BadgeStyle[] = ['holographic', 'neon', 'glass', 'metal', 'cosmic', 'plasma', 'crystalline', 'quantum'];
const badgeAnimations: BadgeAnimation[] = ['pulse', 'shimmer', 'rotate', 'float', 'particles', 'energy', 'breathe', 'magnetic'];
const intensityLevels: Array<'subtle' | 'normal' | 'intense' | 'extreme'> = ['subtle', 'normal', 'intense', 'extreme'];

export const BadgeShowcaseScreen: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [interactive, setInteractive] = useState(true);
  const [enableHaptics, setEnableHaptics] = useState(true);
  const [enableSounds, setEnableSounds] = useState(false);
  const [enableMagnetism, setEnableMagnetism] = useState(true);
  const [currentStyle, setCurrentStyle] = useState<BadgeStyle>('holographic');
  const [currentAnimation, setCurrentAnimation] = useState<BadgeAnimation>('shimmer');
  const [intensity, setIntensity] = useState<'subtle' | 'normal' | 'intense' | 'extreme'>('intense');
  const [customizationMode, setCustomizationMode] = useState(false);

  const [performanceStats, setPerformanceStats] = useState({
    renderTime: 0,
    animationFrames: 0,
    memoryUsage: 0,
  });

  // Performance monitoring
  useEffect(() => {
    const startTime = Date.now();
    let frameCount = 0;

    const monitorPerformance = () => {
      frameCount++;
      if (frameCount % 60 === 0) { // Update every 60 frames
        setPerformanceStats({
          renderTime: Date.now() - startTime,
          animationFrames: frameCount,
          memoryUsage: Math.random() * 100, // Mock memory usage
        });
      }
      requestAnimationFrame(monitorPerformance);
    };

    monitorPerformance();
  }, []);

  const renderBadgeSection = (section: ShowcaseSection, index: number) => (
    <View key={index} style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#FFFFFF' : '#000000' }]}>
        {section.title}
      </Text>
      
      <View style={styles.badgeGrid}>
        {section.badges.map((badge, badgeIndex) => (
          <View key={badgeIndex} style={styles.badgeContainer}>
            <View style={styles.badgeWrapper}>
              {interactive ? (
                <InteractiveBadge
                  type={badge.type}
                  style={badge.style}
                  animation={badge.animation}
                  theme={theme}
                  enableHaptics={enableHaptics}
                  enableSounds={enableSounds}
                  enableMagnetism={enableMagnetism}
                  onPress={() => {
                    Alert.alert('Badge Pressed!', `You pressed the ${badge.type} badge`);
                  }}
                  onLongPress={() => {
                    Alert.alert('Badge Long Pressed!', `Long press detected on ${badge.type} badge`);
                  }}
                />
              ) : (
                <AdvancedBadge
                  type={badge.type}
                  style={badge.style}
                  animation={badge.animation}
                  theme={theme}
                  intensity={intensity}
                  size="large"
                />
              )}
            </View>
            
            <Text style={[styles.badgeLabel, { color: theme === 'dark' ? '#CCCCCC' : '#666666' }]}>
              {badge.type.toUpperCase()}
            </Text>
            
            <Text style={[styles.badgeDescription, { color: theme === 'dark' ? '#999999' : '#888888' }]}>
              {badge.description}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderCustomizationPanel = () => (
    <View style={[styles.customizationPanel, { 
      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    }]}>
      <Text style={[styles.panelTitle, { color: theme === 'dark' ? '#FFFFFF' : '#000000' }]}>
        🎛️ Customization Lab
      </Text>

      {/* Style Selection */}
      <View style={styles.controlGroup}>
        <Text style={[styles.controlLabel, { color: theme === 'dark' ? '#CCCCCC' : '#666666' }]}>
          Visual Style
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.styleSelector}>
          {badgeStyles.map((style) => (
            <TouchableOpacity
              key={style}
              style={[
                styles.styleButton,
                currentStyle === style && styles.activeStyleButton,
                { borderColor: theme === 'dark' ? '#FFFFFF' : '#000000' }
              ]}
              onPress={() => setCurrentStyle(style)}
            >
              <Text style={[
                styles.styleButtonText,
                { color: currentStyle === style ? '#FFFFFF' : (theme === 'dark' ? '#CCCCCC' : '#666666') }
              ]}>
                {style}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Animation Selection */}
      <View style={styles.controlGroup}>
        <Text style={[styles.controlLabel, { color: theme === 'dark' ? '#CCCCCC' : '#666666' }]}>
          Animation Type
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.styleSelector}>
          {badgeAnimations.map((animation) => (
            <TouchableOpacity
              key={animation}
              style={[
                styles.styleButton,
                currentAnimation === animation && styles.activeStyleButton,
                { borderColor: theme === 'dark' ? '#FFFFFF' : '#000000' }
              ]}
              onPress={() => setCurrentAnimation(animation)}
            >
              <Text style={[
                styles.styleButtonText,
                { color: currentAnimation === animation ? '#FFFFFF' : (theme === 'dark' ? '#CCCCCC' : '#666666') }
              ]}>
                {animation}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Custom Badge Preview */}
      <View style={styles.previewContainer}>
        <Text style={[styles.previewLabel, { color: theme === 'dark' ? '#CCCCCC' : '#666666' }]}>
          Live Preview
        </Text>
        <View style={styles.previewBadge}>
          {interactive ? (
            <InteractiveBadge
              type="founder"
              style={currentStyle}
              animation={currentAnimation}
              theme={theme}
              enableHaptics={enableHaptics}
              enableSounds={enableSounds}
              enableMagnetism={enableMagnetism}
            />
          ) : (
            <AdvancedBadge
              type="founder"
              style={currentStyle}
              animation={currentAnimation}
              theme={theme}
              intensity={intensity}
              size="xl"
            />
          )}
        </View>
      </View>
    </View>
  );

  const renderPerformanceStats = () => (
    <View style={[styles.statsPanel, { 
      backgroundColor: theme === 'dark' ? 'rgba(0,255,0,0.1)' : 'rgba(0,200,0,0.1)',
    }]}>
      <Text style={[styles.statsTitle, { color: theme === 'dark' ? '#00FF00' : '#008000' }]}>
        ⚡ Performance Monitor
      </Text>
      
      <View style={styles.statsRow}>
        <Text style={[styles.statLabel, { color: theme === 'dark' ? '#CCCCCC' : '#666666' }]}>
          Render Time:
        </Text>
        <Text style={[styles.statValue, { color: theme === 'dark' ? '#00FF00' : '#008000' }]}>
          {performanceStats.renderTime}ms
        </Text>
      </View>
      
      <View style={styles.statsRow}>
        <Text style={[styles.statLabel, { color: theme === 'dark' ? '#CCCCCC' : '#666666' }]}>
          Animation Frames:
        </Text>
        <Text style={[styles.statValue, { color: theme === 'dark' ? '#00FF00' : '#008000' }]}>
          {performanceStats.animationFrames}
        </Text>
      </View>
      
      <View style={styles.statsRow}>
        <Text style={[styles.statLabel, { color: theme === 'dark' ? '#CCCCCC' : '#666666' }]}>
          Memory Usage:
        </Text>
        <Text style={[styles.statValue, { color: theme === 'dark' ? '#00FF00' : '#008000' }]}>
          {performanceStats.memoryUsage.toFixed(1)}MB
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { 
      backgroundColor: theme === 'dark' ? '#000000' : '#FFFFFF' 
    }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      
      <LinearGradient
        colors={theme === 'dark' ? ['#000000', '#1a1a2e', '#16213e'] : ['#ffffff', '#f0f4f8', '#e2e8f0']}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme === 'dark' ? '#FFFFFF' : '#000000' }]}>
            🎯 Revolutionary Badges
          </Text>
          <Text style={[styles.subtitle, { color: theme === 'dark' ? '#CCCCCC' : '#666666' }]}>
            Next-generation badge system with advanced effects
          </Text>
        </View>

        {/* Controls */}
        <View style={[styles.controlsPanel, { 
          backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        }]}>
          <View style={styles.controlRow}>
            <Text style={[styles.controlLabel, { color: theme === 'dark' ? '#CCCCCC' : '#666666' }]}>
              Theme
            </Text>
            <Switch
              value={theme === 'dark'}
              onValueChange={(value) => setTheme(value ? 'dark' : 'light')}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={theme === 'dark' ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>

          <View style={styles.controlRow}>
            <Text style={[styles.controlLabel, { color: theme === 'dark' ? '#CCCCCC' : '#666666' }]}>
              Interactive Mode
            </Text>
            <Switch
              value={interactive}
              onValueChange={setInteractive}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
            />
          </View>

          <View style={styles.controlRow}>
            <Text style={[styles.controlLabel, { color: theme === 'dark' ? '#CCCCCC' : '#666666' }]}>
              Haptic Feedback
            </Text>
            <Switch
              value={enableHaptics}
              onValueChange={setEnableHaptics}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
            />
          </View>

          <View style={styles.controlRow}>
            <Text style={[styles.controlLabel, { color: theme === 'dark' ? '#CCCCCC' : '#666666' }]}>
              Magnetic Effects
            </Text>
            <Switch
              value={enableMagnetism}
              onValueChange={setEnableMagnetism}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
            />
          </View>

          <View style={styles.controlRow}>
            <Text style={[styles.controlLabel, { color: theme === 'dark' ? '#CCCCCC' : '#666666' }]}>
              Customization Lab
            </Text>
            <Switch
              value={customizationMode}
              onValueChange={setCustomizationMode}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
            />
          </View>
        </View>

        {/* Customization Panel */}
        {customizationMode && renderCustomizationPanel()}

        {/* Performance Stats */}
        {renderPerformanceStats()}

        {/* Badge Showcases */}
        {showcaseSections.map(renderBadgeSection)}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme === 'dark' ? '#666666' : '#999999' }]}>
            🚀 Built with revolutionary badge technology
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 50,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  controlsPanel: {
    margin: 20,
    padding: 15,
    borderRadius: 12,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  controlLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  customizationPanel: {
    margin: 20,
    padding: 15,
    borderRadius: 12,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  controlGroup: {
    marginBottom: 20,
  },
  styleSelector: {
    marginTop: 8,
  },
  styleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 8,
  },
  activeStyleButton: {
    backgroundColor: '#007AFF',
  },
  styleButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  previewContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  previewLabel: {
    fontSize: 14,
    marginBottom: 10,
  },
  previewBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  statsPanel: {
    margin: 20,
    padding: 15,
    borderRadius: 12,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  section: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  badgeContainer: {
    alignItems: 'center',
    marginBottom: 30,
    width: screenWidth / 3 - 20,
  },
  badgeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    marginBottom: 8,
  },
  badgeLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  badgeDescription: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
    paddingHorizontal: 4,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default BadgeShowcaseScreen;