import React, { useEffect, useRef, useState } from 'react';
import { Animated, View, Text } from 'react-native';

interface CarouselTextProps {
  phrases: string[];
  style?: any;
  speed?: number;
  height?: number;
}

export const CarouselText: React.FC<CarouselTextProps> = ({
  phrases,
  style,
  speed = 2000,
  height = 200,
}) => {
  const animatedValue = useRef(new Animated.Value(height)).current;
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const animatePhrase = () => {
      animatedValue.setValue(height);
      Animated.timing(animatedValue, {
        toValue: -50,
        duration: speed,
        useNativeDriver: true,
      }).start(() => {
        setCurrentIndex((prev) => (prev + 1) % phrases.length);
      });
    };

    const interval = setInterval(animatePhrase, speed + 200);
    animatePhrase();

    return () => clearInterval(interval);
  }, [phrases, speed, height]);

  return (
    <View style={{ height, overflow: 'hidden' }}>
      <Animated.Text
        numberOfLines={1}
        style={[
          style,
          {
            transform: [{ translateY: animatedValue }],
            position: 'absolute',
            width: '100%',
            textAlign: 'center',
          },
        ]}
      >
        {phrases[currentIndex]}
      </Animated.Text>
    </View>
  );
};