import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SubscriptionTierCard } from '../atoms/SubscriptionTierCard';
import { useTheme } from '../../../contexts/ThemeContext';
import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';

interface WalletSubscriptionsProps {
  onTierSelect: (tier: 'pro' | 'elite') => void;
}

export const WalletSubscriptions: React.FC<WalletSubscriptionsProps> = ({
  onTierSelect,
}) => {
  const { colors } = useTheme();
  const [selectedTier, setSelectedTier] = useState<'pro' | 'elite' | null>(null);

  const handleTierSelect = (tier: 'pro' | 'elite') => {
    setSelectedTier(tier);
    onTierSelect(tier);
  };

  const proFeatures = [
    'Unlimited GPT-4o access',
    '3,500-4,500 GPT-5 requests/month',
    'Priority support',
    'Advanced analytics',
  ];

  const eliteFeatures = [
    'Unlimited GPT-4o access',
    'Unlimited GPT-5 (API pricing)',
    'Priority support',
    'Advanced analytics',
    'Early feature access',
    'Custom integrations',
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={[
          styles.title,
          typography.textStyles.headlineMedium,
          { color: colors.text }
        ]}>
          Upgrade Your Plan
        </Text>
        
        <Text style={[
          styles.subtitle,
          typography.textStyles.bodyMedium,
          { color: colors.textSecondary }
        ]}>
          Choose the perfect plan for your AI needs
        </Text>

        <SubscriptionTierCard
          tier="pro"
          price="$14.99/month"
          features={proFeatures}
          onSelect={() => handleTierSelect('pro')}
          isSelected={selectedTier === 'pro'}
        />

        <SubscriptionTierCard
          tier="elite"
          price="$29.99/month"
          features={eliteFeatures}
          onSelect={() => handleTierSelect('elite')}
          isSelected={selectedTier === 'elite'}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing[4],
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing[4],
    lineHeight: 20,
  },
});