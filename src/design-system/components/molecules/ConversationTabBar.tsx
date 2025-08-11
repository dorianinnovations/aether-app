import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { TabButton } from '../atoms';

type FeatherIconNames = keyof typeof Feather.glyphMap;

interface Tab {
  label: string;
  icon?: FeatherIconNames;
  logo?: any;
}

interface ConversationTabBarProps {
  tabs: Tab[];
  currentTab: number;
  theme: 'light' | 'dark';
  onTabPress: (index: number) => void;
  disabled?: boolean;
}

const ConversationTabBar: React.FC<ConversationTabBarProps> = ({
  tabs,
  currentTab,
  theme,
  onTabPress,
  disabled = false
}) => {
  return (
    <View style={styles.tabContainer}>
      {tabs.map((tab, index) => (
        <View key={tab.label} style={styles.tabWrapper}>
          <TabButton
            label={tab.label}
            icon={tab.icon}
            logo={tab.logo}
            isActive={index === currentTab}
            theme={theme}
            onPress={() => onTabPress(index)}
            disabled={disabled}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
    gap: 10,
  },
  tabWrapper: {
    flex: 1,
  },
});

export default ConversationTabBar;