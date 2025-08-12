/**
 * FeedHeader Component
 * Tab navigation for different feed types
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { FeatherIcon } from '../../../design-system/components/atoms';

// Design System
import { typography } from '../../../design-system/tokens/typography';
import { spacing } from '../../../design-system/tokens/spacing';
import type { ThemeColors } from '../types';

type FeedTab = 'looped' | 'releases' | 'custom';

interface FeedHeaderProps {
  activeTab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
  colors: ThemeColors;
  isDarkMode: boolean;
}

interface TabConfig {
  id: FeedTab;
  label: string;
  icon: string;
  color: string;
}

const tabs: TabConfig[] = [
  { id: 'looped', label: 'Looped', icon: 'refresh', color: '#EF4444' }, // Red
  { id: 'releases', label: 'Releases', icon: 'disc', color: '#10B981' }, // Green
  { id: 'custom', label: 'Custom', icon: 'settings', color: '#3B82F6' }, // Blue
];

const FeedHeader: React.FC<FeedHeaderProps> = ({
  activeTab,
  onTabChange,
  colors,
  isDarkMode,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const tabAnimations = useRef(
    tabs.reduce((acc, tab) => {
      acc[tab.id] = new Animated.Value(tab.id === activeTab ? 1 : 0);
      return acc;
    }, {} as Record<FeedTab, Animated.Value>)
  ).current;

  useEffect(() => {
    // Animate tab selection
    tabs.forEach((tab) => {
      Animated.timing(tabAnimations[tab.id], {
        toValue: tab.id === activeTab ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    });
  }, [activeTab, tabAnimations]);

  const handleTabPress = (tab: FeedTab, index: number) => {
    onTabChange(tab);
    
    // Scroll to selected tab
    scrollViewRef.current?.scrollTo({
      x: index * 100 - 50,
      animated: true,
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((tab, index) => {
          const animatedScale = tabAnimations[tab.id].interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          });

          const isActive = activeTab === tab.id;

          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                isActive && [
                  styles.activeTab,
                  { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }
                ],
              ]}
              onPress={() => handleTabPress(tab.id, index)}
              activeOpacity={0.7}
            >
              <View style={styles.tabContent}>
                <FeatherIcon
                  name={tab.icon}
                  size={16}
                  color={isActive ? tab.color : colors.textSecondary}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isActive ? tab.color : colors.textSecondary,
                      fontWeight: isActive ? '600' : '400',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: 20,
    flexGrow: 1,
    justifyContent: 'center',
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  activeTab: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  tabContent: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  tabLabel: {
    ...typography.caption,
    fontSize: 12,
  },
});

export default FeedHeader;