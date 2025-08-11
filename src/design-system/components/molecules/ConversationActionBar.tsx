import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ActionButton } from '../atoms';
import { spacing } from '../../tokens/spacing';
import { designTokens } from '../../tokens/colors';

interface ConversationActionBarProps {
  theme: 'light' | 'dark';
  onNewChat?: () => void;
  onClose: () => void;
  disabled?: boolean;
}

const ConversationActionBar: React.FC<ConversationActionBarProps> = ({
  theme,
  onNewChat,
  onClose,
  disabled = false
}) => {
  return (
    <View style={[
      styles.actionBar,
      {
        borderTopColor: theme === 'dark' 
          ? designTokens.borders.dark.subtle 
          : designTokens.borders.light.subtle,
        backgroundColor: 'transparent',
      }
    ]}>
      {onNewChat && (
        <ActionButton
          icon="plus"
          label="New Chat"
          theme={theme}
          variant="primary"
          onPress={onNewChat}
          disabled={disabled}
        />
      )}
      
      <ActionButton
        icon="x"
        theme={theme}
        variant="secondary"
        onPress={onClose}
        disabled={disabled}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    paddingBottom: spacing[3],
    borderTopWidth: 0.5,
    borderBottomRightRadius: 16,
    gap: spacing[2],
  },
});

export default ConversationActionBar;