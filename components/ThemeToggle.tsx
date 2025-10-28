import React from 'react';
import { StyleSheet } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useTheme } from '@/contexts/ThemeContext';
import { minTouchTarget } from '../utils/responsive';

interface ThemeToggleProps {
  style?: any;
  size?: number;
}

export default function ThemeToggle({ style, size = 24 }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <IconButton
      icon={isDark ? 'weather-sunny' : 'weather-night'}
      size={size}
      onPress={toggleTheme}
      style={[styles.themeToggle, style]}
    />
  );
}

const styles = StyleSheet.create({
  themeToggle: {
    margin: 0,
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
  },
});