/**
 * Typography Test Component
 * Demonstrates enhanced chat typography at different sizes and themes
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { typography } from '../../tokens/typography';

interface TypographyTestProps {
  theme?: 'light' | 'dark';
}

export const TypographyTest: React.FC<TypographyTestProps> = ({ theme = 'light' }) => {
  const themeColors = {
    background: theme === 'dark' ? '#000000' : '#FFFFFF',
    text: theme === 'dark' ? '#FFFFFF' : '#1A1A1A',
    bubble: theme === 'dark' ? '#1C1C1E' : '#F5F5F7',
    bubbleText: theme === 'dark' ? '#FFFFFF' : '#1A1A1A',
    muted: theme === 'dark' ? '#888888' : '#666666',
  };

  const sampleMessages = [
    "Hey there! This is a test message with modern Inter typography.",
    "This is a longer message to demonstrate how the enhanced typography looks with multiple lines of text. The line height and letter spacing have been optimized for chat interfaces.",
    "Short msg",
    "Testing emojis and special characters: 🎉 Amazing! The Inter font handles Unicode beautifully.",
    "Code blocks and technical text should also look great with our new typography system.",
  ];

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView style={styles.scrollView}>
        
        {/* Typography Samples Header */}
        <Text style={[styles.header, { color: themeColors.text }]}>
          Enhanced Chat Typography
        </Text>
        
        {/* AI Messages */}
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
          AI Messages (Inter Regular)
        </Text>
        {sampleMessages.map((message, index) => (
          <View key={`ai-${index}`} style={styles.aiMessageContainer}>
            <Text style={[
              typography.textStyles.aiMessage,
              { color: themeColors.text }
            ]}>
              {message}
            </Text>
            <Text style={[
              typography.textStyles.timestampSmall,
              { color: themeColors.muted, marginTop: 4 }
            ]}>
              {index + 1}m ago
            </Text>
          </View>
        ))}
        
        {/* User Messages */}
        <Text style={[styles.sectionTitle, { color: themeColors.text, marginTop: 24 }]}>
          User Messages (Inter Regular in Bubbles)
        </Text>
        {sampleMessages.map((message, index) => (
          <View key={`user-${index}`} style={styles.userMessageContainer}>
            <View style={[
              styles.userBubble,
              { backgroundColor: themeColors.bubble }
            ]}>
              <Text style={[
                typography.textStyles.userMessage,
                { color: themeColors.bubbleText }
              ]}>
                {message}
              </Text>
            </View>
            <Text style={[
              typography.textStyles.timestampSmall,
              { color: themeColors.muted, marginTop: 4, textAlign: 'right' }
            ]}>
              {index + 1}m ago
            </Text>
          </View>
        ))}
        
        {/* Typography Specimens */}
        <Text style={[styles.sectionTitle, { color: themeColors.text, marginTop: 24 }]}>
          Typography Specimens
        </Text>
        
        <View style={styles.specimenContainer}>
          <Text style={[typography.textStyles.aiMessage, { color: themeColors.text }]}>
            AI Message - Inter Regular 16px/24px
          </Text>
          <Text style={[typography.textStyles.userMessage, { color: themeColors.text }]}>
            User Message - Inter Regular 16px/22px
          </Text>
          <Text style={[typography.textStyles.aiMessageEmphasis, { color: themeColors.text }]}>
            AI Emphasis - Inter Medium 16px/24px
          </Text>
          <Text style={[typography.textStyles.timestamp, { color: themeColors.muted }]}>
            Timestamp - Inter Regular 12px/16px
          </Text>
          <Text style={[typography.textStyles.timestampSmall, { color: themeColors.muted }]}>
            Small Timestamp - Inter Regular 11px/14px
          </Text>
        </View>
        
        <Text style={[styles.footer, { color: themeColors.muted, marginTop: 32 }]}>
          All typography optimized for {theme} mode with modern Inter typeface
        </Text>
        
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  aiMessageContainer: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
    marginBottom: 16,
    paddingRight: 20,
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    maxWidth: '75%',
    marginBottom: 16,
  },
  userBubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  specimenContainer: {
    gap: 12,
    paddingVertical: 16,
  },
  footer: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 32,
  },
});

export default TypographyTest;