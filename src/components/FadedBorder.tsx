import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface FadedBorderProps {
  theme: 'light' | 'dark';
  style?: any;
}

export const FadedBorder: React.FC<FadedBorderProps> = ({ 
  theme, 
  style 
}) => {
  return (
    <LinearGradient
      colors={
        theme === 'light' 
          ? ['#F8F8F8', '#F8F8F8', '#FFFFFF', '#F8F8F8', '#F8F8F8']
          : ['#151515', '#151515', '#FFFFFF', '#151515', '#151515']
      }
      locations={[0, 0.1, 0.5, 0.9, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.fadedBorder, style]}
    />
  );
};

const styles = StyleSheet.create({
  fadedBorder: {
    height: 1,
    width: '100%',
  },
});