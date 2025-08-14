/**
 * BasicMarkdown - Simple, reliable markdown for bot messages
 * Handles: bold, lists, basic formatting with colors
 */

import React from 'react';
import { Text, View, StyleSheet, TextStyle } from 'react-native';
import { getCyclingPastelColor } from '../../tokens/colors';

interface BasicMarkdownProps {
  children: string;
  theme?: 'light' | 'dark';
  style?: TextStyle;
}

// Simple Question Container Component - minimalistic approach
const QuestionContainer: React.FC<{
  children: React.ReactNode;
  theme: 'light' | 'dark';
}> = ({ children, theme }) => {
  // Simple, static styling with subtle accent
  const borderColor = theme === 'dark' ? '#4a5568' : '#e2e8f0';
  
  return (
    <View
      style={[
        styles.questionContainer,
        {
          borderLeftColor: borderColor,
        },
      ]}
    >
      {children}
    </View>
  );
};

const BasicMarkdown: React.FC<BasicMarkdownProps> = ({ children, theme = 'light', style = {} }) => {
  const renderText = () => {
    // Ensure children is a string
    const text = typeof children === 'string' ? children : String(children || '');
    
    // Split by newlines
    let lines = text.split('\n');
    
    // If no newlines, try to split by list patterns but be more careful
    if (lines.length === 1) {
      // Split more carefully to avoid mixing list types
      lines = text.split(/(?=\n)|(?=- [^0-9])|(?=\d+\.\s[^0-9])/).filter(line => line.trim());
    }
    
    // Clean up lines but preserve list type separation
    lines = lines.map(line => {
      let cleaned = line.trim();
      
      // Only convert * bullets to - bullets, never mix with numbers
      if (cleaned.startsWith('* ') && !/^\d/.test(cleaned.substring(2))) {
        cleaned = cleaned.replace(/^\*\s/, '- ');
      }
      
      // Remove standalone asterisks only
      if (/^\*+$/.test(cleaned)) {
        return '';
      }
      
      return cleaned;
    }).filter(line => line);
    
    const elements: React.ReactNode[] = [];
    let colorIndex = 0;

    lines.forEach((line, index) => {
      // STRICT: Numbered lists ONLY - must start with digit(s), period, space, and have descriptive content
      // Exclude years (4 digits) and lone numbers
      if (/^\d{1,3}\.\s[A-Za-z]/.test(line) && line.length > 6) {
        const match = line.match(/^(\d+)\.\s(.+)/);
        if (match) {
          const number = match[1];
          const text = match[2];
          const numberColor = getCyclingPastelColor(colorIndex++, theme);
          
          elements.push(
            <View key={index} style={styles.listItem}>
              <Text style={[styles.numberBullet, { color: numberColor }]}>
                {number}.
              </Text>
              <View style={styles.listTextContainer}>
                <Text style={[styles.text, style]}>
                  {formatInlineText(text, theme)}
                </Text>
              </View>
            </View>
          );
        }
      }
      // STRICT: Bullet lists ONLY - must start with dash, space, NON-digit
      else if (/^-\s[^0-9]/.test(line)) {
        const text = line.substring(2);
        const bulletColor = getCyclingPastelColor(colorIndex++, theme);
        
        elements.push(
          <View key={index} style={styles.listItem}>
            <Text style={[styles.bullet, { color: bulletColor }]}>
              •
            </Text>
            <View style={styles.listTextContainer}>
              <Text style={[styles.bulletText, style]}>
                {formatInlineText(text, theme)}
              </Text>
            </View>
          </View>
        );
      }
      // Headers (## Header or # Header)
      else if (/^#+\s/.test(line)) {
        const headerMatch = line.match(/^(#+)\s(.+)/);
        if (headerMatch) {
          const level = headerMatch[1].length;
          const text = headerMatch[2];
          const headerStyle = level === 1 ? styles.header1 : styles.header2;
          
          elements.push(
            <View key={index} style={styles.headerContainer}>
              <Text style={[headerStyle, style, { color: getCyclingPastelColor(colorIndex++, theme) }]}>
                {formatInlineText(text, theme)}
              </Text>
            </View>
          );
        }
      }
      // Question/important text (starts with ? or contains key phrases)
      else if (/^\?/.test(line) || /\b(how|what|why|when|where|should|could|would)\b/i.test(line.substring(0, 50))) {
        elements.push(
          <QuestionContainer key={index} theme={theme}>
            <Text style={[styles.questionText, style]}>
              {formatInlineText(line, theme)}
            </Text>
          </QuestionContainer>
        );
      }
      // Regular text - detect if it's a longer paragraph vs short sentence
      else if (line.trim()) {
        const isLongParagraph = line.length > 100;
        const containerStyle = isLongParagraph ? styles.longParagraphContainer : styles.paragraphContainer;
        const textStyle = isLongParagraph ? styles.paragraphText : styles.text;
        
        elements.push(
          <View key={index} style={containerStyle}>
            <Text style={[textStyle, style]}>
              {formatInlineText(line, theme)}
            </Text>
          </View>
        );
      }
      // Empty line
      else {
        elements.push(<View key={index} style={styles.emptyLine} />);
      }
    });

    return elements;
  };

  const formatInlineText = (text: string, theme: 'light' | 'dark') => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;
    let quotedTextIndex = 0;

    while (remaining.length > 0) {
      // Bold text **text**
      const boldMatch = remaining.match(/^(.*?)\*\*(.*?)\*\*(.*)/);
      if (boldMatch) {
        if (boldMatch[1]) {
          parts.push(<Text key={key++}>{boldMatch[1]}</Text>);
        }
        parts.push(
          <Text key={key++} style={{ 
            fontWeight: '900',
            fontFamily: 'Nunito-Black',
            color: getCyclingPastelColor(quotedTextIndex++, theme),
            fontSize: 18,
            letterSpacing: -0.5,
          }}>
            {boldMatch[2]}
          </Text>
        );
        remaining = boldMatch[3];
        continue;
      }

      // Italic text *text*
      const italicMatch = remaining.match(/^(.*?)\*([^*]+?)\*(.*)/);
      if (italicMatch) {
        if (italicMatch[1]) {
          parts.push(<Text key={key++}>{italicMatch[1]}</Text>);
        }
        parts.push(
          <Text key={key++} style={{ 
            fontStyle: 'italic',
            fontFamily: 'Nunito-LightItalic',
            color: getCyclingPastelColor(quotedTextIndex++, theme),
            fontSize: 17,
            letterSpacing: 0.2,
          }}>
            {italicMatch[2]}
          </Text>
        );
        remaining = italicMatch[3];
        continue;
      }

      // Song titles "text"
      const songMatch = remaining.match(/^(.*?)"(.*?)"(.*)/);
      if (songMatch) {
        if (songMatch[1]) {
          parts.push(<Text key={key++}>{songMatch[1]}</Text>);
        }
        parts.push(
          <Text key={key++} style={{ 
            fontWeight: 'bold',
            fontFamily: 'Nunito-Bold',
            color: theme === 'dark' ? '#4ECDC4' : '#98FB98', // Mint green for song titles
          }}>
            {songMatch[2]}
          </Text>
        );
        remaining = songMatch[3];
        continue;
      }

      // Code text `text`
      const codeMatch = remaining.match(/^(.*?)`(.*?)`(.*)/);
      if (codeMatch) {
        if (codeMatch[1]) {
          parts.push(<Text key={key++}>{codeMatch[1]}</Text>);
        }
        parts.push(
          <Text key={key++} style={{ 
            fontFamily: 'JetBrains Mono',
            backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
            fontSize: 15,
            fontWeight: '600',
            color: getCyclingPastelColor(quotedTextIndex++, theme),
            borderWidth: 1,
            borderColor: getCyclingPastelColor(quotedTextIndex, theme),
            letterSpacing: 0.5,
          }}>
            {codeMatch[2]}
          </Text>
        );
        remaining = codeMatch[3];
        continue;
      }

      // No formatting found
      parts.push(<Text key={key++}>{remaining}</Text>);
      break;
    }

    return parts;
  };

  return <View>{renderText()}</View>;
};

const styles = StyleSheet.create({
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 1,
    marginLeft: 2,
    paddingLeft: 0,
    paddingRight: 0,
  },
  bullet: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 6,
    marginTop: 1,
    lineHeight: 24,
    width: 14,
  },
  numberBullet: {
    fontSize: 15,
    fontWeight: '700',
    marginRight: 6,
    marginTop: 1,
    lineHeight: 24,
    minWidth: 18,
  },
  listTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  paragraphContainer: {
    marginVertical: 3,
    paddingHorizontal: 2,
    paddingRight: 8,
  },
  text: {
    fontSize: 17,
    lineHeight: 26,
    letterSpacing: -0.2,
    fontFamily: 'Nunito-Regular',
  },
  bulletText: {
    fontSize: 19,
    lineHeight: 28,
    letterSpacing: -0.3,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
  },
  emptyLine: {
    height: 12,
  },
  headerContainer: {
    marginVertical: 8,
    marginBottom: 4,
  },
  header1: {
    fontSize: 32,
    lineHeight: 40,
    fontFamily: 'Nunito-Black',
    fontWeight: '900',
    letterSpacing: -0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  header2: {
    fontSize: 26,
    lineHeight: 34,
    fontFamily: 'Nunito-ExtraBold',
    fontWeight: '800',
    letterSpacing: -0.6,
    textShadowColor: 'rgba(0, 0, 0, 0.08)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  questionContainer: {
    marginVertical: 8,
    paddingLeft: 16,
    paddingRight: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  questionText: {
    fontSize: 22,
    lineHeight: 32,
    fontFamily: 'Nunito-ExtraBold',
    fontWeight: '800',
    letterSpacing: -0.4,
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  longParagraphContainer: {
    marginVertical: 6,
    paddingHorizontal: 2,
    paddingRight: 8,
  },
  paragraphText: {
    fontSize: 17,
    lineHeight: 27,
    letterSpacing: -0.2,
    fontFamily: 'Nunito-Regular',
    textAlign: 'left',
  },
});

export default BasicMarkdown;