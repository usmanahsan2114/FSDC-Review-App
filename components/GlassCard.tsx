import { useThemeColor } from '@/hooks/use-theme-color';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, StyleSheet, View, ViewProps } from 'react-native';

export type GlassCardProps = ViewProps & {
  intensity?: number;
  variant?: 'default' | 'thin' | 'heavy' | 'glass-panel';
};

export function GlassCard({ style, intensity = 20, variant = 'default', children, ...otherProps }: GlassCardProps) {
  const borderColor = useThemeColor({}, 'border');
  const backgroundColor = useThemeColor({ light: 'rgba(255,255,255,0.7)', dark: 'rgba(21, 25, 34, 0.7)' }, 'background');

  // Android doesn't support BlurView natively in the same way as iOS, so we fallback to a translucent background
  if (Platform.OS === 'android') {
    return (
      <View
        style={[
          styles.card,
          { backgroundColor, borderColor },
          style,
        ]}
        {...otherProps}>
        {children}
      </View>
    );
  }

  return (
    <BlurView
      intensity={intensity}
      tint="dark" // Always dark tint for Orbital Command vibe
      style={[
        styles.card,
        { borderColor, backgroundColor: 'rgba(21, 25, 34, 0.4)' }, // Lower opacity for blur
        style,
      ]}
      {...otherProps}>
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
  },
});
