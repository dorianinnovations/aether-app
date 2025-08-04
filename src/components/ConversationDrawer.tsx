/**
 * ConversationDrawer - Simple slide-out conversation history
 * Clean implementation with three labeled categories: Aether, Friends, Connections
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { designTokens, getThemeColors } from '../design-system/tokens/colors';
import { spacing } from '../design-system/tokens/spacing';

const { width: screenWidth } = Dimensions.get('window');

interface Conversation {
  _id: string;
  title: string;
  lastActivity: string;
  messageCount: number;
  summary?: string;
}

interface ConversationDrawerProps {
  isVisible: boolean;
  onClose: () => void;
  onConversationSelect: (conversation: Conversation) => void;
  onStartNewChat?: () => void;
  currentConversationId?: string;
  theme: 'light' | 'dark';
}

const ConversationDrawer: React.FC<ConversationDrawerProps> = ({
  isVisible,
  onClose,
  onConversationSelect,
  onStartNewChat,
  currentConversationId,
  theme,
}) => {
  const [currentTab, setCurrentTab] = useState(0);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  
  const slideAnim = useRef(new Animated.Value(-screenWidth * 0.8)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  
  const themeColors = getThemeColors(theme);
  
  const tabs = ['Aether', 'Friends', 'Links'];
  
  // Animate drawer in/out
  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -screenWidth * 0.8,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);
  
  const handleTabPress = (index: number) => {
    setCurrentTab(index);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };
  
  const handleNewChat = () => {
    if (onStartNewChat) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onStartNewChat();
      onClose();
    }
  };
  
  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity 
      style={[
        styles.conversationItem,
        {
          backgroundColor: theme === 'dark' 
            ? 'rgba(255,255,255,0.05)' 
            : 'rgba(0,0,0,0.03)',
          borderColor: theme === 'dark' 
            ? 'rgba(255,255,255,0.1)' 
            : 'rgba(0,0,0,0.08)',
        }
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onConversationSelect(item);
        onClose();
      }}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.conversationTitle,
        { color: themeColors.text }
      ]}>
        {item.title || 'Untitled Conversation'}
      </Text>
      <Text style={[
        styles.conversationMeta,
        { color: themeColors.textSecondary }
      ]}>
        {item.messageCount} messages
      </Text>
    </TouchableOpacity>
  );
  
  const getTabContent = () => {
    switch (currentTab) {
      case 0: // Aether
        return conversations;
      case 1: // Friends
        return [];
      case 2: // Links
        return conversations.filter(c => c.messageCount > 10);
      default:
        return conversations;
    }
  };
  
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Feather 
        name="message-circle" 
        size={32} 
        color={theme === 'dark' ? '#444' : '#ccc'} 
      />
      <Text style={[
        styles.emptyText,
        { color: theme === 'dark' ? '#666' : '#999' }
      ]}>
        No conversations yet
      </Text>
    </View>
  );
  
  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      {/* Overlay */}
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: overlayOpacity,
            backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)',
          }
        ]}
      >
        <TouchableOpacity
          style={styles.overlayTouch}
          onPress={handleClose}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Drawer */}
      <Animated.View
        style={[
          styles.drawer,
          {
            transform: [{ translateX: slideAnim }],
            backgroundColor: theme === 'dark' ? '#000' : '#fff',
            shadowColor: theme === 'dark' ? '#fff' : '#000',
          }
        ]}
      >
        <SafeAreaView style={styles.drawerContent}>
          {/* Header with tabs and close button */}
          <View style={[
            styles.header,
            { borderBottomColor: theme === 'dark' ? '#333' : '#eee' }
          ]}>
            <View style={styles.tabs}>
              {tabs.map((tab, index) => (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.tab,
                    {
                      backgroundColor: index === currentTab 
                        ? (theme === 'dark' ? 'rgba(110, 231, 183, 0.15)' : 'rgba(110, 231, 183, 0.2)')
                        : 'transparent',
                    }
                  ]}
                  onPress={() => handleTabPress(index)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.tabText,
                    {
                      color: index === currentTab 
                        ? (theme === 'dark' ? '#6ee7b7' : '#10b981')
                        : (theme === 'dark' ? '#888' : '#666'),
                      fontWeight: index === currentTab ? '600' : '500',
                    }
                  ]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.headerButtons}>
              {onStartNewChat && (
                <TouchableOpacity
                  style={[
                    styles.headerButton,
                    { backgroundColor: theme === 'dark' ? '#333' : '#f0f0f0' }
                  ]}
                  onPress={handleNewChat}
                  activeOpacity={0.7}
                >
                  <Feather name="plus" size={16} color={themeColors.text} />
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[
                  styles.headerButton,
                  { backgroundColor: theme === 'dark' ? '#333' : '#f0f0f0' }
                ]}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Feather name="x" size={16} color={themeColors.text} />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Content */}
          <View style={styles.content}>
            <FlatList
              data={getTabContent()}
              renderItem={renderConversationItem}
              keyExtractor={(item) => item._id}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={renderEmptyState}
            />
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayTouch: {
    flex: 1,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: screenWidth * 0.85, // Made wider
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  drawerContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60, // Account for status bar
    borderBottomWidth: 1,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Nunito-Medium',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    gap: 12,
  },
  conversationItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  conversationTitle: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    marginBottom: 4,
  },
  conversationMeta: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Nunito-Medium',
  },
});

export default ConversationDrawer;