import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ConversationIcon, Badge } from '../atoms';
import { spacing } from '../../tokens/spacing';
import { typography } from '../../tokens/typography';
import { designTokens } from '../../tokens/colors';

interface Conversation {
  _id: string;
  title: string;
  lastActivity: string;
  messageCount: number;
  summary?: string;
  type?: 'aether' | 'friend' | 'custom';
}

interface ConversationItemProps {
  conversation: Conversation;
  theme: 'light' | 'dark';
  isSelected: boolean;
  currentTab: number;
  onPress: () => void;
  onLongPress?: () => void;
  isHighlighted?: boolean;
  disabled?: boolean;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  theme,
  isSelected,
  currentTab,
  onPress,
  onLongPress,
  isHighlighted = false,
  disabled = false
}) => {
  const themeColors = {
    primary: theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.primary,
    secondary: theme === 'dark' ? designTokens.text.secondaryDark : designTokens.text.secondary
  };

  const getTabSpecificData = () => {
    switch (currentTab) {
      case 0: // Aether - AI conversations
        return {
          icon: 'message-circle',
          badge: `${conversation.messageCount}`,
          subtitle: conversation.summary || `${conversation.messageCount} messages`
        };
      case 1: // Friends - People
        return {
          icon: 'user',
          badge: conversation.lastActivity.includes('now') ? '•' : '•',
          subtitle: conversation.summary || conversation.lastActivity
        };
      case 2: // Custom - Custom conversations
        return {
          icon: 'settings',
          badge: '•',
          subtitle: conversation.summary || 'Custom conversation'
        };
      default:
        return {
          icon: 'file',
          badge: `${conversation.messageCount}`,
          subtitle: `${conversation.messageCount} messages`
        };
    }
  };

  const tabData = getTabSpecificData();

  return (
    <View style={[
      styles.conversationItem,
      {
        backgroundColor: isSelected
          ? (theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)')
          : 'transparent',
        borderLeftWidth: isSelected ? 2 : 0,
        borderLeftColor: isSelected ? designTokens.brand.primary : 'transparent',
        borderWidth: 1,
        borderColor: theme === 'light' 
          ? 'rgba(0,0,0,0.08)' 
          : 'rgba(255,255,255,0.1)',
      }
    ]}>
      <TouchableOpacity 
        style={[
          styles.conversationTouchable,
          isHighlighted && { 
            backgroundColor: theme === 'dark' 
              ? 'rgba(255,255,255,0.1)' 
              : 'rgba(0,0,0,0.05)' 
          }
        ]}
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={500}
        activeOpacity={0.85}
        disabled={disabled}
      >
        <View style={styles.conversationContent}>
          <ConversationIcon 
            icon={tabData.icon} 
            theme={theme}
          />
          
          <View style={styles.conversationText}>
            <Text style={[
              styles.conversationTitle,
              typography.textStyles.bodyMedium,
              { color: themeColors.primary }
            ]}>
              {conversation.title || 'Untitled Conversation'}
            </Text>
            <Text style={[
              styles.conversationMeta,
              typography.textStyles.bodySmall,
              { color: themeColors.secondary }
            ]}>
              {tabData.subtitle}
            </Text>
          </View>
          
          <Badge theme={theme}>
            {tabData.badge}
          </Badge>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  conversationItem: {
    borderRadius: 8,
    overflow: 'hidden',
    marginHorizontal: spacing[3],
    marginVertical: spacing[1],
  },
  conversationTouchable: {
    flex: 1,
  },
  conversationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    gap: spacing[3],
  },
  conversationText: {
    flex: 1,
    gap: 2,
  },
  conversationTitle: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 18,
  },
  conversationMeta: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 14,
  },
});

export default ConversationItem;