import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { designTokens } from '../../tokens/colors';
import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';

interface SubscriptionTierCardProps {
  tier: 'pro' | 'elite';
  price: string;
  features: string[];
  onSelect: () => void;
  isSelected?: boolean;
}

export const SubscriptionTierCard: React.FC<SubscriptionTierCardProps> = ({
  tier,
  price,
  features,
  onSelect,
  isSelected = false,
}) => {
  const { theme, colors } = useTheme();
  
  const isPro = tier === 'pro';
  
  const tierColor = isPro ? designTokens.pastels.blue : designTokens.pastels.purple;
  const borderColor = isSelected 
    ? tierColor 
    : (theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)');

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: theme === 'dark' 
            ? designTokens.brand.surfaceDark 
            : designTokens.brand.surface,
          borderColor,
          borderWidth: isSelected ? 2 : 1,
        }
      ]}
      onPress={onSelect}
      activeOpacity={0.9}
    >
      <View style={styles.header}>
        <View style={styles.tierInfo}>
          <Text style={[
            styles.tierName,
            typography.textStyles.headlineSmall,
            { color: tierColor }
          ]}>
            {tier.toUpperCase()}
          </Text>
          <Text style={[
            styles.price,
            typography.textStyles.bodyLarge,
            { color: colors.text }
          ]}>
            {price}
          </Text>
        </View>
        {isSelected && (
          <Feather name="check-circle" size={20} color={tierColor} />
        )}
      </View>
      
      <View style={styles.features}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Feather 
              name="check" 
              size={14} 
              color={tierColor}
              style={styles.checkIcon}
            />
            <Text style={[
              styles.featureText,
              typography.textStyles.bodySmall,
              { color: colors.textSecondary }
            ]}>
              {feature}
            </Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: spacing[4],
    marginVertical: spacing[2],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  tierInfo: {
    flex: 1,
  },
  tierName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: spacing[1],
  },
  features: {
    gap: spacing[2],
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    marginRight: spacing[2],
  },
  featureText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
});