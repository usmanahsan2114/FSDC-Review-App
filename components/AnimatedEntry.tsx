import React from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
    FadeInDown
} from 'react-native-reanimated';

interface AnimatedEntryProps {
  children: React.ReactNode;
  delay?: number;
  style?: ViewStyle;
}

export const AnimatedEntry: React.FC<AnimatedEntryProps> = ({ 
  children, 
  delay = 0, 
  style 
}) => {
  return (
    <Animated.View 
      entering={FadeInDown.delay(delay).duration(600).springify()}
      style={style}
    >
      {children}
    </Animated.View>
  );
};
