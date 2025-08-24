/**
 * Forge Screen - Aether Forge Feed
 * Discover and collaborate on creative sparks during live seasons
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  StatusBar,
  Platform,
  Dimensions,
  SafeAreaView,
  Animated,
  Modal,
  ScrollView,
} from 'react-native';
// LottieView removed - not used in current implementation
// Navigation removed - not used in current implementation
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
// Forge API and types
import { Spark, Season } from '../../types/forge';
import SparkCard from '../../design-system/components/molecules/SparkCard';

// Design System
import { PageBackground } from '../../design-system/components/atoms';
import { HeaderMenu } from '../../design-system/components/organisms';
import { AnimatedHamburger, FloatingActionButton } from '../../design-system/components/atoms';
import { FloatingButtonBar } from '../../design-system/components/molecules';

// Design Tokens
import { designTokens } from '../../design-system/tokens/colors';
import { typography } from '../../design-system/tokens/typography';
import { spacing } from '../../design-system/tokens/spacing';

// Hooks
import { useTheme } from '../../contexts/ThemeContext';
import { useHeaderMenu } from '../../design-system/hooks';

// Types (removed unused ThemeColors import)

const { width: screenWidth } = Dimensions.get('window');

// OptimizedSlider removed - not used in Forge implementation

// Minimal witty loading messages
const loadingMessages = [
  'vibes incoming',
  'hunting gems',
  'sonic magic',
  'digging deep',
  'pure heat',
  "chef's kiss",
  'next banger',
  'taste test',
  'fire loading',
  'vibe check',
  'mood decoded',
];

const ForgeScreen: React.FC = () => {
  const { colors: themeColors, theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const headerMenu = useHeaderMenu();

  // Map theme colors to expected format
  const colors = {
    ...themeColors,
    primary: designTokens.brand.primary,
    textTertiary: themeColors.textMuted,
    textPrimary: themeColors.text,
    textSecondary: themeColors.textSecondary || themeColors.textMuted,
    surfaces: {
      base: themeColors.surface,
      elevated: themeColors.surface,
      sunken: themeColors.background,
      highlight: designTokens.brand.primary + '10',
      shadow: isDarkMode ? '#00000040' : '#0000001A',
    },
    borders: {
      default: themeColors.borders?.default || designTokens.borders[theme].default,
      muted: themeColors.borders?.subtle || designTokens.borders[theme].subtle,
      primary: designTokens.brand.primary,
    },
    pageBackground: themeColors.background,
  };

  // State
  const [hamburgerOpen, setHamburgerOpen] = useState(false);
  
  // Forge discovery state
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null);
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const [boostedSparks, setBoostedSparks] = useState<Set<string>>(new Set());
  const [committedSparks, setCommittedSparks] = useState<Set<string>>(new Set());
  
  // Scroll and modal states
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [selectedSpark, setSelectedSpark] = useState<Spark | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Remote control button animations
  const primaryButtonOpacity = useRef(new Animated.Value(1)).current;
  const secondaryButtonOpacity = useRef(new Animated.Value(1)).current;
  const primaryButtonScale = useRef(new Animated.Value(1)).current;
  const secondaryButtonScale = useRef(new Animated.Value(1)).current;
  
  
  // Removed music-specific preferences - not needed for Forge
  
  // Removed PanResponder - not needed for Forge scroll-based UI

  // Removed all music-related functions - not needed for Forge

  // Mock data for Season 0
  const mockSeason: Season = {
    id: 's0',
    name: 'Season 0: Make a thing in 72 hours',
    state: 'live',
    vertical: 'micro-apps',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    crystallizeDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    totalSparks: 42,
    totalCommits: 18,
    crystallizedCount: 0,
    prizePool: 5000,
    sponsors: ['Vercel', 'Replit']
  };

  const mockSparks: Spark[] = [
    {
      id: 'spark1',
      title: 'Local Dog Walker Finder',
      oneLiner: 'An app that connects dog owners with trusted walkers in their neighborhood',
      tags: ['mobile', 'location', 'pets'],
      artifactType: 'code',
      content: 'Building a React Native app that uses location services to match dog owners with verified walkers nearby. Features include real-time tracking, payment integration, and rating system.',
      creatorId: 'user1',
      creatorUsername: 'petlover',
      createdAt: new Date().toISOString(),
      seasonId: 's0',
      boosts: 23,
      commits: 3,
      views: 127,
      status: 'active',
      recentBoosters: ['coder123', 'designguru'],
      commitCount: 3
    },
    {
      id: 'spark2', 
      title: 'AI-Powered Study Buddy',
      oneLiner: 'Smart flashcard system that adapts to your learning patterns',
      tags: ['ai', 'education', 'productivity'],
      artifactType: 'code',
      content: 'Creating an intelligent study companion that uses spaced repetition and AI to optimize learning. Tracks your progress and adjusts difficulty automatically.',
      creatorId: 'user2',
      creatorUsername: 'studymaster',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      seasonId: 's0',
      boosts: 31,
      commits: 5,
      views: 89,
      status: 'active',
      recentBoosters: ['aidev', 'learnfast'],
      commitCount: 5
    },
    {
      id: 'spark3',
      title: 'Habit Stack Tracker',
      oneLiner: 'Chain multiple small habits together for compound productivity gains',
      tags: ['habits', 'productivity', 'gamification'],
      artifactType: 'design',
      content: 'Designing a habit tracking system where completing one habit unlocks the next in your daily stack. Visual progress chains with streak rewards.',
      creatorId: 'user3',
      creatorUsername: 'habitguru',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      seasonId: 's0',
      boosts: 18,
      commits: 2,
      views: 156,
      status: 'active',
      recentBoosters: ['productiv'],
      commitCount: 2
    }
  ];

  // Handlers
  const handleBoost = useCallback((sparkId: string) => {
    setBoostedSparks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sparkId)) {
        newSet.delete(sparkId);
        // Decrease boost count
        setSparks(sparks => sparks.map(s => 
          s.id === sparkId ? { ...s, boosts: s.boosts - 1 } : s
        ));
      } else {
        newSet.add(sparkId);
        // Increase boost count
        setSparks(sparks => sparks.map(s => 
          s.id === sparkId ? { ...s, boosts: s.boosts + 1 } : s
        ));
      }
      return newSet;
    });
    // Premium haptic feedback for boost action
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleCommit = useCallback((sparkId: string) => {
    setCommittedSparks(prev => {
      const newSet = new Set(prev);
      newSet.add(sparkId);
      // Increase commit count
      setSparks(sparks => sparks.map(s => 
        s.id === sparkId ? { ...s, commits: s.commits + 1 } : s
      ));
      return newSet;
    });
    // Premium success haptic for commit action
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // TODO: Open build room creation modal
  }, []);

  const handleViewSparkDetails = useCallback((sparkId: string) => {
    const spark = sparks.find(s => s.id === sparkId);
    if (spark) {
      setSelectedSpark(spark);
      setShowBuilderModal(true);
      // Premium haptic for modal presentation
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  }, [sparks]);

  // Premium button animation functions
  const animateButtonPress = useCallback((opacityValue: Animated.Value, scaleValue: Animated.Value) => {
    Animated.parallel([
      Animated.timing(opacityValue, {
        toValue: 0.6,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.parallel([
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, []);

  const handlePrimaryButtonPress = useCallback(() => {
    animateButtonPress(primaryButtonOpacity, primaryButtonScale);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (selectedSpark) {
      handleCommit(selectedSpark.id);
    }
    setShowBuilderModal(false);
  }, [selectedSpark, handleCommit, animateButtonPress, primaryButtonOpacity, primaryButtonScale]);

  const handleSecondaryButtonPress = useCallback(() => {
    animateButtonPress(secondaryButtonOpacity, secondaryButtonScale);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (selectedSpark) {
      handleBoost(selectedSpark.id);
    }
    setShowBuilderModal(false);
  }, [selectedSpark, handleBoost, animateButtonPress, secondaryButtonOpacity, secondaryButtonScale]);

  // Utility functions for modal
  const getArtifactIcon = (artifactType: string) => {
    switch (artifactType) {
      case 'code': return 'code-slash';
      case 'design': return 'color-palette';
      case 'audio': return 'musical-notes';
      case 'business': return 'briefcase';
      case 'art': return 'brush';
      default: return 'bulb';
    }
  };

  const getArtifactColor = (artifactType: string) => {
    switch (artifactType) {
      case 'code': return '#00D2FF';
      case 'design': return '#FF6B9D';
      case 'audio': return '#1DB954';
      case 'business': return '#FFD700';
      case 'art': return '#FF4757';
      default: return designTokens.brand.primary;
    }
  };

  const getTailoredBenefits = (artifactType: string) => {
    switch (artifactType) {
      case 'code':
        return [
          { icon: 'terminal', title: 'Technical Recognition', description: 'Showcase engineering expertise to FAANG recruiters actively scouting builders' },
          { icon: 'cash', title: 'Developer Bounties', description: 'Access $5K-$100K+ prizes from sponsors seeking technical solutions' },
          { icon: 'rocket', title: 'Product Launch', description: 'Transform prototypes into funded startups with proven market validation' },
          { icon: 'people', title: 'Tech Network', description: 'Connect with senior engineers, CTOs, and technical co-founders' },
        ];
      case 'design':
        return [
          { icon: 'brush', title: 'Design Portfolio', description: 'Build case studies that land roles at top design studios and unicorns' },
          { icon: 'eye', title: 'Creative Exposure', description: 'Get featured in design communities and attract high-paying clients' },
          { icon: 'trophy', title: 'UX Competitions', description: 'Win design challenges with $10K-$50K prizes from leading brands' },
          { icon: 'trending-up', title: 'Freelance Pipeline', description: 'Generate consistent $100-$500/hour client opportunities' },
        ];
      case 'business':
        return [
          { icon: 'briefcase', title: 'Venture Capital', description: 'Pitch directly to VCs and angels actively funding Season winners' },
          { icon: 'analytics', title: 'Market Validation', description: 'Prove business models with real user traction before major investment' },
          { icon: 'handshake', title: 'Strategic Partnerships', description: 'Connect with Fortune 500 sponsors seeking innovation partnerships' },
          { icon: 'cash', title: 'Revenue Generation', description: 'Launch profitable ventures with built-in customer acquisition' },
        ];
      case 'audio':
        return [
          { icon: 'musical-notes', title: 'Music Tech Innovation', description: 'Pioneer audio solutions for Spotify, Apple Music, and emerging platforms' },
          { icon: 'radio', title: 'Creator Economy', description: 'Build tools that empower content creators and generate recurring revenue' },
          { icon: 'headset', title: 'Audio Engineering', description: 'Showcase technical skills to gaming, podcast, and streaming companies' },
          { icon: 'star', title: 'Artistic Recognition', description: 'Gain recognition from audio professionals and potential collaborators' },
        ];
      case 'art':
        return [
          { icon: 'palette', title: 'Digital Art Market', description: 'Create collectible works for the growing NFT and digital art economy' },
          { icon: 'camera', title: 'Creative Commissions', description: 'Attract high-value commissioned work from collectors and brands' },
          { icon: 'globe', title: 'Global Exhibitions', description: 'Get featured in digital galleries and international art showcases' },
          { icon: 'heart', title: 'Cultural Impact', description: 'Use art to drive social change and inspire communities worldwide' },
        ];
      default:
        return [
          { icon: 'bulb', title: 'Innovation Recognition', description: 'Stand out as a visionary creator solving tomorrow\'s challenges today' },
          { icon: 'cash', title: 'Multi-Domain Rewards', description: 'Access diverse prize pools from $1K-$50K+ across all creative verticals' },
          { icon: 'rocket', title: 'Cross-Functional Skills', description: 'Develop versatile expertise valued by modern startups and enterprises' },
          { icon: 'network', title: 'Interdisciplinary Network', description: 'Build relationships spanning tech, design, business, and creative industries' },
        ];
    }
  };

  // Load initial data on mount
  useEffect(() => {
    setCurrentSeason(mockSeason);
    setSparks(mockSparks);
  }, []);

  // Reset hamburger animation when header menu closes
  useEffect(() => {
    if (!headerMenu.showHeaderMenu) {
      setHamburgerOpen(false);
    }
  }, [headerMenu.showHeaderMenu]);


  return (
    <View style={[styles.screenContainer, { backgroundColor: isDarkMode ? '#000000' : '#F5F5F5' }]}>
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />

        {/* Animated Season Header - Fixed Position */}
        {currentSeason && (
          <Animated.View 
            style={[
              styles.fixedSeasonCard,
              {
                backgroundColor: isDarkMode ? 'rgba(51, 51, 51, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                borderColor: isDarkMode ? 'rgba(85, 85, 85, 0.6)' : 'rgba(221, 221, 221, 0.6)',
                shadowColor: isDarkMode ? '#000000' : '#000000',
                transform: [
                  {
                    translateY: scrollY.interpolate({
                      inputRange: [0, 100],
                      outputRange: [0, -10], // Much less upward movement
                      extrapolate: 'clamp',
                    }),
                  },
                ],
                opacity: scrollY.interpolate({
                  inputRange: [0, 40],
                  outputRange: [1, 0], // Faster fade out
                  extrapolate: 'clamp',
                }),
                height: scrollY.interpolate({
                  inputRange: [0, 50],
                  outputRange: [90, 0], // Faster height collapse
                  extrapolate: 'clamp',
                }),
              },
            ]}
          >
            {/* Full header content - fades out on scroll */}
            <Animated.View 
              style={{
                opacity: scrollY.interpolate({
                  inputRange: [0, 30],
                  outputRange: [1, 0], // Fade out faster
                  extrapolate: 'clamp',
                }),
              }}
            >
              <View style={styles.seasonHeader}>
                <View style={[styles.liveIndicator, {
                  backgroundColor: currentSeason.state === 'live' ? '#00D2FF' : '#FF6B9D'
                }]}>
                  <Text style={styles.liveText}>
                    {currentSeason.state.toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.seasonStats, {
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(26, 26, 26, 0.6)',
                }]}>
                  {currentSeason.totalSparks} sparks • {currentSeason.totalCommits} builders
                </Text>
              </View>
              
              <Text style={[styles.seasonTitle, { 
                color: isDarkMode ? '#FFFFFF' : '#1A1A1A',
                fontFamily: typography.fonts.mozillaHeadline,
              }]}>
                {currentSeason.name}
              </Text>
              <Text style={[styles.seasonSubtitle, { 
                color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(26, 26, 26, 0.8)',
                fontFamily: typography.fonts.mozillaText,
              }]}>
                Discover sparks. Join builds. Ship together. The forge is live—what will you create?
              </Text>
              
              {/* Timer */}
              <View style={styles.timerContainer}>
                <Ionicons name="timer-outline" size={16} color="#00D2FF" />
                <Text style={[styles.timerText, { color: '#00D2FF' }]}>
                  72 hours remaining
                </Text>
              </View>
            </Animated.View>

          </Animated.View>
        )}

        {/* Full-screen blur background when scrolled */}
        {currentSeason && (
          <Animated.View 
            style={[
              styles.fullScreenBlur,
              {
                opacity: scrollY.interpolate({
                  inputRange: [25, 45],
                  outputRange: [0, 1], // Tighter, more responsive blur appearance
                  extrapolate: 'clamp',
                }),
              }
            ]}
            pointerEvents="none" // Allow content to flow through
          >
            <BlurView 
              intensity={isDarkMode ? 60 : 30} // Stronger blur for dark mode
              tint={isDarkMode ? 'systemUltraThinMaterialDark' : 'light'}
              style={styles.fullBlurContainer}
            />
          </Animated.View>
        )}

        {/* Floating Dynamic Island Notification */}
        {currentSeason && (
          <Animated.View 
            style={[
              styles.dynamicIsland,
              {
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.15)',
                shadowColor: isDarkMode ? '#FFFFFF' : '#000000',
                shadowOpacity: isDarkMode ? 0.15 : 0.25,
                opacity: scrollY.interpolate({
                  inputRange: [25, 45],
                  outputRange: [0, 1], // Tighter timing for island appearance
                  extrapolate: 'clamp',
                }),
                transform: [
                  {
                    translateY: scrollY.interpolate({
                      inputRange: [25, 45],
                      outputRange: [-8, 0], // Subtle slide down instead of scale
                      extrapolate: 'clamp',
                    }),
                  },
                ],
              }
            ]}
          >
            <BlurView 
              intensity={isDarkMode ? 100 : 70} // Much stronger blur for dark island
              tint={isDarkMode ? 'systemUltraThinMaterialDark' : 'light'}
              style={styles.islandBlurContainer}
            >
              {/* Dynamic island overlay */}
              <View style={[styles.islandOverlay, {
                backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
              }]} />
              
              <View style={styles.islandContent}>
                <View style={styles.islandLeft}>
                  <View style={[styles.compactLiveIndicator, {
                    backgroundColor: currentSeason.state === 'live' ? '#00D2FF' : '#FF6B9D',
                  }]}>
                    <Text style={styles.compactLiveText}>
                      {currentSeason.state.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[styles.islandTitle, { 
                    color: isDarkMode ? '#FFFFFF' : '#1A1A1A',
                    fontFamily: typography.fonts.mozillaHeadline,
                  }]}>
                    Season 0
                  </Text>
                </View>
                <Text style={[styles.islandTimer, { color: '#00D2FF' }]}>
                  72h left
                </Text>
              </View>
            </BlurView>
          </Animated.View>
        )}

        {/* Main Content */}
        <View style={styles.content}>
          {/* Sparks Feed */}
          <Animated.ScrollView 
            style={styles.sparksContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ 
              paddingTop: Platform.OS === 'android' 
                ? (StatusBar.currentHeight || 0) + 75  // A bit less initial padding
                : 95  // A bit less initial padding
            }}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { 
                useNativeDriver: false,
                listener: (event) => {
                  // Additional premium scroll behavior can be added here
                }
              }
            )}
            scrollEventThrottle={8} // Higher frequency for smoother premium feel
          >
            {sparks.map((spark) => (
              <SparkCard
                key={spark.id}
                spark={spark}
                theme={theme}
                onBoost={handleBoost}
                onCommit={handleCommit}
                onViewDetails={handleViewSparkDetails}
                hasUserBoosted={boostedSparks.has(spark.id)}
                hasUserCommitted={committedSparks.has(spark.id)}
              />
            ))}
          </Animated.ScrollView>
        </View>

        {/* Floating Action Buttons - Conjoined Style */}
        <FloatingButtonBar
          theme={theme}
          slideAnimation={new Animated.Value(0)}
          visible={!headerMenu.showHeaderMenu}
        >
          {/* Menu/Hamburger Button */}
          <FloatingActionButton
            iconName="menu"
            onPress={() => {
              setHamburgerOpen(!hamburgerOpen);
              setTimeout(() => {
                headerMenu.open();
              }, 150);
            }}
            theme={theme}
          >
            <AnimatedHamburger
              isOpen={hamburgerOpen}
              color={theme === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)'}
              size={22}
            />
          </FloatingActionButton>
        </FloatingButtonBar>

        {/* Header Menu */}
        <HeaderMenu
          visible={headerMenu.showHeaderMenu}
          onClose={headerMenu.close}
          onAction={headerMenu.handleMenuAction}
        />

        {/* Builder Modal */}
        {selectedSpark && (
          <Modal
            visible={showBuilderModal}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowBuilderModal(false)}
          >
            <SafeAreaView style={[styles.builderModalContainer, {
              backgroundColor: isDarkMode ? '#1A1A1A' : '#FFFFFF',
            }]}>
              {/* Modal Header */}
              <View style={styles.builderModalHeader}>
                <View>
                  <Text style={[styles.builderModalTitle, {
                    color: isDarkMode ? '#FFFFFF' : '#1A1A1A',
                    fontFamily: typography.fonts.mozillaHeadline,
                  }]}>
                    Join the Build
                  </Text>
                  <Text style={[styles.builderModalSubtitle, {
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(26, 26, 26, 0.7)',
                    fontFamily: typography.fonts.mozillaText,
                  }]}>
                    {selectedSpark.title}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.closeModalButton, {
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowBuilderModal(false);
                  }}
                >
                  <Ionicons name="close" size={20} color={isDarkMode ? '#FFFFFF' : '#1A1A1A'} />
                </TouchableOpacity>
              </View>

              <View style={styles.builderModalMainContent}>
                <ScrollView style={styles.builderModalContent} showsVerticalScrollIndicator={false}>
                  {/* Spark Details */}
                  <View style={[styles.sparkDetailsCard, {
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                  }]}>
                    <View style={[styles.artifactBadge, { backgroundColor: getArtifactColor(selectedSpark.artifactType) }]}>
                      <Ionicons name={getArtifactIcon(selectedSpark.artifactType)} size={14} color="white" />
                      <Text style={styles.artifactText}>{selectedSpark.artifactType.toUpperCase()}</Text>
                    </View>
                    <Text style={[styles.sparkDescription, {
                      color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(26, 26, 26, 0.9)',
                      fontFamily: typography.fonts.mozillaText,
                    }]}>
                      {selectedSpark.content}
                    </Text>
                  </View>

                  {/* Builder Benefits */}
                  <View style={styles.benefitsSection}>
                    <Text style={[styles.modalSectionTitle, {
                      color: isDarkMode ? '#FFFFFF' : '#1A1A1A',
                      fontFamily: typography.fonts.mozillaHeadline,
                    }]}>
                      Why Join This {selectedSpark.artifactType.charAt(0).toUpperCase() + selectedSpark.artifactType.slice(1)} Build?
                    </Text>

                    {/* Benefit Cards - Tailored to Artifact Type */}
                    {getTailoredBenefits(selectedSpark.artifactType).map((benefit, index) => (
                      <View key={index} style={[styles.benefitCard, {
                        backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                      }]}>
                        <View style={[styles.benefitIcon, { backgroundColor: '#00D2FF' + '20' }]}>
                          <Ionicons name={benefit.icon as any} size={20} color="#00D2FF" />
                        </View>
                        <View style={styles.benefitText}>
                          <Text style={[styles.benefitTitle, {
                            color: isDarkMode ? '#FFFFFF' : '#1A1A1A',
                            fontFamily: typography.fonts.mozillaHeadline,
                          }]}>
                            {benefit.title}
                          </Text>
                          <Text style={[styles.benefitDescription, {
                            color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(26, 26, 26, 0.7)',
                            fontFamily: typography.fonts.mozillaText,
                          }]}>
                            {benefit.description}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </ScrollView>

                {/* Remote Control Action Buttons - Right Side */}
                <View style={[styles.remoteControlPanel, {
                  backgroundColor: isDarkMode 
                    ? 'rgba(255, 255, 255, 0.03)' 
                    : 'rgba(0, 0, 0, 0.02)',
                  borderColor: isDarkMode 
                    ? 'rgba(255, 255, 255, 0.08)' 
                    : 'rgba(0, 0, 0, 0.06)',
                  shadowColor: isDarkMode ? '#000000' : '#000000',
                }]}>
                  <Animated.View style={[styles.remoteButton, {
                    backgroundColor: isDarkMode 
                      ? 'rgba(255, 255, 255, 0.05)' 
                      : 'rgba(0, 0, 0, 0.03)',
                    borderColor: isDarkMode 
                      ? 'rgba(255, 255, 255, 0.1)' 
                      : 'rgba(0, 0, 0, 0.08)',
                    opacity: primaryButtonOpacity,
                    transform: [{ scale: primaryButtonScale }],
                  }]}>
                    <TouchableOpacity
                      style={styles.remoteButtonTouchable}
                      onPress={handlePrimaryButtonPress}
                      activeOpacity={1}
                    >
                      <Animated.View style={styles.remoteButtonContent}>
                        <Ionicons 
                          name="hammer" 
                          size={24} 
                          color={isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)'} 
                        />
                      </Animated.View>
                    </TouchableOpacity>
                  </Animated.View>
                  
                  <View style={[styles.remoteDivider, {
                    backgroundColor: isDarkMode 
                      ? 'rgba(255, 255, 255, 0.06)' 
                      : 'rgba(0, 0, 0, 0.04)',
                  }]} />
                  
                  <Animated.View style={[styles.remoteButton, {
                    backgroundColor: isDarkMode 
                      ? 'rgba(255, 255, 255, 0.05)' 
                      : 'rgba(0, 0, 0, 0.03)',
                    borderColor: isDarkMode 
                      ? 'rgba(255, 255, 255, 0.1)' 
                      : 'rgba(0, 0, 0, 0.08)',
                    opacity: secondaryButtonOpacity,
                    transform: [{ scale: secondaryButtonScale }],
                  }]}>
                    <TouchableOpacity
                      style={styles.remoteButtonTouchable}
                      onPress={handleSecondaryButtonPress}
                      activeOpacity={1}
                    >
                      <Animated.View style={styles.remoteButtonContent}>
                        <Ionicons 
                          name="rocket" 
                          size={24} 
                          color={isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)'} 
                        />
                      </Animated.View>
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              </View>
            </SafeAreaView>
          </Modal>
        )}

      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: Platform.OS === 'android' 
      ? (StatusBar.currentHeight || 0) + 10 
      : 20,
    paddingHorizontal: spacing.xs,
  },
  seasonCard: {
    width: screenWidth * 0.98,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    borderRadius: 12,
    borderWidth: 0,
    alignSelf: 'center',
    // Neumorphic shadow - minimal height
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  seasonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  liveIndicator: {
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
  },
  liveText: {
    fontSize: 8,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  seasonStats: {
    fontSize: 8,
    fontWeight: '700',
  },
  seasonTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  seasonSubtitle: {
    fontSize: 10,
    fontWeight: '400',
    letterSpacing: -0.1,
    lineHeight: 16,
    marginBottom: spacing.xs,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sparksContainer: {
    flex: 1,
  },
  fixedSeasonCard: {
    position: 'absolute',
    top: Platform.OS === 'android' 
      ? (StatusBar.currentHeight || 0) + 20 
      : 50,
    left: spacing.sm,
    right: spacing.sm,
    zIndex: 1000,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
    // Blur effect would be handled by native backdrop blur
    overflow: 'hidden',
  },
  collapsedTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  collapsedTimer: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  // Standalone notification banner styles
  standaloneBanner: {
    position: 'absolute',
    top: Platform.OS === 'android' 
      ? (StatusBar.currentHeight || 0) + 48
      : 64, // Much lower for comfortable viewing
    left: spacing.sm,
    right: spacing.sm,
    height: 40, // Shorter/thinner banner
    borderRadius: 20, // Adjusted radius for shorter height
    borderWidth: 0.5,
    zIndex: 2000, // Higher priority than everything
    // Enhanced neumorphic shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
    overflow: 'hidden',
  },
  bannerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 4, // Reduced padding for shorter banner
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactLiveIndicator: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: spacing.xs,
  },
  compactLiveText: {
    fontSize: 8,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.3,
  },
  bannerTitle: {
    fontSize: 13, // Slightly larger for better visibility
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  bannerTimer: {
    fontSize: 11, // Slightly larger for better visibility
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  // Full-screen blur background
  fullScreenBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'android' 
      ? (StatusBar.currentHeight || 0) + 95
      : 105, // Even less blur coverage height
    zIndex: 1000,
  },
  fullBlurContainer: {
    flex: 1,
    borderBottomLeftRadius: 12, // Rounded bottom corners for card effect
    borderBottomRightRadius: 12,
    overflow: 'hidden',
  },
  
  // Dynamic Island styles
  dynamicIsland: {
    position: 'absolute',
    top: Platform.OS === 'android' 
      ? (StatusBar.currentHeight || 0) + 48
      : 64,
    left: spacing.sm, // Wider - less margin from edges
    right: spacing.sm, // Wider - less margin from edges
    height: 28, // Shorter height
    borderRadius: 6, // Adjusted radius for shorter height
    borderWidth: 0.3,
    zIndex: 2001, // Above everything
    // Dynamic island shadow
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  islandBlurContainer: {
    flex: 1,
    borderRadius: 6, // Match island border radius
    overflow: 'hidden',
  },
  islandOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 6, // Match island border radius
  },
  islandContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  islandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  islandTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  islandTimer: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  bottomCard: {
    position: 'absolute',
    bottom: -50,
    left: 0,
    right: 0,
    height: 200,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl * 2,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 0.5,
    borderBottomWidth: 0,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  miniPlayer: {
    alignItems: 'flex-start',
    width: '100%',
  },
  trackContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    gap: 16,
  },
  albumArt: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trackInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  trackTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  trackAlbum: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  
  
  // Settings Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingTop: Platform.OS === 'android' 
      ? (StatusBar.currentHeight || 0) + spacing.lg 
      : spacing.lg,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  settingsSection: {
    marginBottom: spacing.xl,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.lg,
    letterSpacing: -0.3,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    letterSpacing: -0.2,
  },
  // New refactored slider styles
  preferenceItem: {
    marginBottom: spacing.xl,
  },
  preferenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  preferenceValue: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  preferenceDescription: {
    fontSize: 13,
    marginBottom: spacing.md,
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  sliderContainer: {
    width: 280,
    height: 40,
    justifyContent: 'center',
    alignSelf: 'center',
    borderRadius: 20,
    paddingHorizontal: 20,
  },
  sliderTrack: {
    width: 280,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    alignSelf: 'center',
  },
  sliderFill: {
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  sliderThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: 'absolute',
    top: -7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  toggleButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    minWidth: 50,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  loadingSpinner: {
    width: 24,
    height: 24,
  },
  loadingText: {
    marginTop: spacing.xs,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  
  // Builder Modal Styles
  builderModalContainer: {
    flex: 1,
  },
  builderModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 0.8,
    borderBottomColor: 'rgba(218, 218, 218, 0.1)',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  builderModalTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  builderModalSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 4,
    letterSpacing: -0.2,
  },
  closeModalButton: {
    width: 48,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  builderModalMainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  builderModalContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingRight: spacing.sm, // Less padding on right to make room for remote
  },
  // Remote Control Panel Styles
  remoteControlPanel: {
    width: 80,
    alignSelf: 'stretch',
    marginVertical: spacing.lg,
    marginRight: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
    gap: spacing.sm,
    // Neumorphic shadow
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  remoteButton: {
    height: 60,
    borderRadius: 12,
    borderWidth: 0.5,
    // Neumorphic button styling
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    // Inner shadow simulation
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  remoteButtonTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  remoteButtonContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  remoteDivider: {
    height: 1,
    marginHorizontal: spacing.xs,
    borderRadius: 0.5,
  },
  sparkDetailsCard: {
    padding: spacing.lg,
    borderRadius: 12,
    marginVertical: spacing.md,
  },
  artifactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    marginBottom: spacing.md,
  },
  artifactText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  sparkDescription: {
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: -0.2,
  },
  benefitsSection: {
    marginVertical: spacing.lg,
  },
  modalSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: spacing.lg,
    letterSpacing: -0.3,
  },
  benefitCard: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  benefitIcon: {
    width: 28,
    height: 28,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  benefitDescription: {
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    gap: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});

// Streamlined optimized styles
const streamStyles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 20,
    gap: 20,
  },
  section: {
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  slider: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
  },
  value: {
    fontSize: 15,
    fontWeight: '700',
  },
  track: {
    width: 260,
    height: 4,
    borderRadius: 2,
    position: 'relative',
  },
  fill: {
    height: 4,
    borderRadius: 2,
    position: 'absolute',
  },
  thumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    position: 'absolute',
    top: -6,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  toggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 44,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ForgeScreen;