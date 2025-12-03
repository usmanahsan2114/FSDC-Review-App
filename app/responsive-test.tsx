import { ResponsiveTest } from '@/components/ResponsiveTest';
import { ThemedView } from '@/components/themed-view';
import ThemeToggle from '@/components/ThemeToggle';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton } from 'react-native-paper';
import { getDevicePadding, minTouchTarget, rs, useResponsiveDimensions } from '../utils/responsive';

export default function ResponsiveTestScreen() {
  const { width, height } = useResponsiveDimensions();
  const padding = getDevicePadding(width, height);

  const handleGoBack = () => {
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingHorizontal: padding.horizontal }]}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={handleGoBack}
          style={styles.backButton}
        />
        <ThemeToggle />
      </View>
      
      <ResponsiveTest />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: rs(16),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    margin: 0,
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
  },
});