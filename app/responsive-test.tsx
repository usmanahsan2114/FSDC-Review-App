import React from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ResponsiveTest } from '@/components/ResponsiveTest';
import ThemeToggle from '@/components/ThemeToggle';
import { getDevicePadding, rs, minTouchTarget } from '../utils/responsive';

export default function ResponsiveTestScreen() {
  const handleGoBack = () => {
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
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
    paddingHorizontal: getDevicePadding().horizontal,
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