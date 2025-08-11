import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { spacing } from '../../tokens/spacing';
import { designTokens } from '../../tokens/colors';

type FeatherIconNames = keyof typeof Feather.glyphMap;

interface Tab {
  label: string;
  icon: FeatherIconNames;
}

interface ConversationEmptyStateProps {
  tab: Tab;
  theme: 'light' | 'dark';
  isLoading: boolean;
}

const ConversationEmptyState: React.FC<ConversationEmptyStateProps> = ({
  tab,
  theme,
  isLoading
}) => {
  const themeColors = {
    primary: theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.primary,
    secondary: theme === 'dark' ? designTokens.text.secondaryDark : designTokens.text.secondary
  };

  const getEmptyMessage = () => {
    if (isLoading) return 'Loading...';
    
    switch (tab.label) {
      case 'Aether': return 'Start your first conversation with Aether';
      case 'Friends': return 'Add friends to start chatting';
      case 'Custom': return 'Custom conversations coming soon';
      default: return 'No conversations yet';
    }
  };

  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Feather 
          name={tab.icon}
          size={24}
          color={themeColors.secondary}
        />
      </View>
      <Text style={[
        styles.emptyTitle,
        { color: themeColors.primary }
      ]}>
        {tab.label}
      </Text>
      <Text style={[
        styles.emptyText,
        { color: themeColors.secondary }
      ]}>
        {getEmptyMessage()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[4],
    paddingTop: 40,
    paddingBottom: 80,
    gap: 16,
  },
  emptyIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    alignSelf: 'center',
  },
  emptyTitle: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Nunito',
    letterSpacing: -0.3,
    marginBottom: 4,
    textAlign: 'center',
    alignSelf: 'center',
  },
  emptyText: {
    fontSize: 9,
    fontWeight: '400',
    fontFamily: 'Nunito',
    letterSpacing: -0.2,
    textAlign: 'center',
    lineHeight: 14,
    alignSelf: 'center',
    maxWidth: 200,
    opacity: 0.7,
  },
});

export default ConversationEmptyState;