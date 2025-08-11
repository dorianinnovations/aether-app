/**
 * Badge Examples - Integration examples for the new badge system
 * Shows how to replace old badges with new revolutionary ones
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AdvancedBadge, InteractiveBadge } from './index';
import { UserBadge } from './UserBadge';

export const BadgeComparison: React.FC<{ theme: 'light' | 'dark' }> = ({ theme }) => {
  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={[styles.title, { color: theme === 'dark' ? '#FFFFFF' : '#000000' }]}>
          🔴 OLD (Basic)
        </Text>
        <View style={styles.row}>
          <UserBadge type="founder" theme={theme} />
          <UserBadge type="og" theme={theme} />
          <UserBadge type="verified" theme={theme} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.title, { color: theme === 'dark' ? '#FFFFFF' : '#000000' }]}>
          🚀 NEW (Revolutionary)
        </Text>
        <View style={styles.row}>
          <AdvancedBadge 
            type="founder" 
            style="holographic" 
            animation="shimmer" 
            theme={theme}
            intensity="intense"
          />
          <AdvancedBadge 
            type="vip" 
            style="cosmic" 
            animation="energy" 
            theme={theme}
            intensity="intense"
          />
          <AdvancedBadge 
            type="vip" 
            style="crystalline" 
            animation="breathe" 
            theme={theme}
            intensity="intense"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.title, { color: theme === 'dark' ? '#FFFFFF' : '#000000' }]}>
          ⚡ INTERACTIVE (Next Level)
        </Text>
        <View style={styles.row}>
          <InteractiveBadge 
            type="founder" 
            style="holographic" 
            animation="shimmer" 
            theme={theme}
            enableHaptics={true}
            enableMagnetism={true}
            onPress={() => console.log('Founder badge pressed!')}
          />
          <InteractiveBadge 
            type="legend" 
            style="plasma" 
            animation="energy" 
            theme={theme}
            enableHaptics={true}
            enableMagnetism={true}
            onPress={() => console.log('Legend badge pressed!')}
          />
          <InteractiveBadge 
            type="quantum" 
            style="quantum" 
            animation="particles" 
            theme={theme}
            enableHaptics={true}
            enableMagnetism={true}
            onPress={() => console.log('Quantum badge pressed!')}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
});

export default BadgeComparison;