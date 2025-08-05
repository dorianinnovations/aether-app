/**
 * Aether - Insights Screen
 * Analytics dashboard with emotional metrics visualization
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

// Types
import type { EmotionalMetric, NavigationProps } from '../../types';

// Design System
import { PageBackground } from '../../design-system/components/atoms/PageBackground';
import { Header } from '../../design-system/components/organisms/Header';
import MetricCard from '../../design-system/components/molecules/MetricCard';
import TrendChart from '../../design-system/components/molecules/TrendChart';
import { MetricDetailModal } from '../../design-system/components/organisms/MetricDetailModal';

// Hooks & Services
import { useTheme } from '../../hooks/useTheme';
import { useMetrics } from '../../hooks/useMetrics';

// Tokens
import { getThemeColors } from '../../design-system/tokens/colors';
import { spacing } from '../../design-system/tokens/spacing';
import { typography } from '../../design-system/tokens/typography';

interface InsightsScreenProps {
  navigation: NavigationProps;
}

const InsightsScreen: React.FC<InsightsScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);
  // TODO: Replace with proper analytics data fetching hook
  const metrics: EmotionalMetric[] = [];
  const loading = false;
  const error = null;
  const fetchMetrics = () => {};
  
  const [selectedMetric, setSelectedMetric] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMetrics();
    setRefreshing(false);
  };

  const handleMetricPress = (metric: EmotionalMetric) => {
    setSelectedMetric(metric);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedMetric(null);
  };

  // Sample data for demonstration
  const sampleMetrics: EmotionalMetric[] = [
    {
      id: '1',
      userId: 'user1',
      emotion: 'joy',
      intensity: 8.5,
      timestamp: new Date().toISOString(),
      context: 'Chat conversation',
    },
    {
      id: '2',
      userId: 'user1',
      emotion: 'calm',
      intensity: 7.2,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      context: 'Profile update',
    },
    {
      id: '3',
      userId: 'user1',
      emotion: 'excitement',
      intensity: 9.1,
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      context: 'New connection',
    },
  ];

  const displayMetrics = metrics.length > 0 ? metrics : sampleMetrics;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <PageBackground theme={theme} variant="insights">
        <></>
      </PageBackground>
      
      <Header
        title="Aether"
        rightIcon="refresh-cw"
        onRightPress={fetchMetrics}
      />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.metricsGrid}>
          {displayMetrics.map((metric) => (
            <MetricCard
              key={metric.id}
              title={metric.emotion || 'Emotion'}
              value={`${Math.round(metric.intensity * 100)}%`}
              subtitle={metric.context}
              onPress={() => handleMetricPress(metric)}
            />
          ))}
        </View>

        <View style={styles.chartSection}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Emotional Trends
          </Text>
          <TrendChart data={[]} />
        </View>

        <View style={styles.summarySection}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Weekly Summary
          </Text>
          <View style={[styles.summaryCard, { backgroundColor: themeColors.surface }]}>
            <Text style={[styles.summaryText, { color: themeColors.textSecondary }]}>
              Your most frequent emotion this week: Joy
            </Text>
            <Text style={[styles.summaryText, { color: themeColors.textSecondary }]}>
              Average intensity: 8.2/10
            </Text>
            <Text style={[styles.summaryText, { color: themeColors.textSecondary }]}>
              Most active time: Evening conversations
            </Text>
          </View>
        </View>
      </ScrollView>

      <MetricDetailModal
        visible={modalVisible}
        metric={selectedMetric}
        onClose={closeModal}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  chartSection: {
    marginBottom: spacing.lg,
  },
  summarySection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  summaryCard: {
    padding: spacing.md,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryText: {
    ...typography.body,
    marginBottom: spacing.sm,
  },
});

export default InsightsScreen;
