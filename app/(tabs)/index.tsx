import OptimizedImage from '@/components/OptimizedImage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getDevicePadding, hp, isTablet, rf, rs, wp } from '../../utils/responsive';

export default function HomeScreen() {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const handleAddReview = () => {
    router.push('/add-review');
  };

  const handleAddJoyrideReview = () => {
    router.push('/add-review?type=joyride');
  };

  const handleViewReviews = () => {
    router.push('/reviews-list');
  };

  const handleAdminQuestions = () => {
    router.push('/admin-questions');
  };

  const handleDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemeToggle />
      </View>
      
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: rs(16), paddingBottom: Math.max(insets.bottom, rs(24)) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <OptimizedImage 
          source={isDark ? require('@/assets/images/white-logo.png') : require('@/assets/images/black-logo.png')} 
          style={styles.logo}
          contentFit="contain"
          transition={200}
          cachePolicy="memory-disk"
          priority="high"
          alt="FSDC Logo"
        />
        
        <ThemedText type="title" style={styles.title}>
          FSDC Flight Reviews
        </ThemedText>
        
        <ThemedText style={styles.subtitle}>
          Welcome! Choose an action below.
        </ThemedText>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleDashboard}
            style={[styles.button, styles.dashboardButton]}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            icon="chart-box"
          >
            Dashboard & Analytics
          </Button>

          <Button
            mode="contained"
            onPress={handleAddReview}
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            icon="plus-circle"
          >
            Add a New Review
          </Button>

          <Button
            mode="contained"
            onPress={handleAddJoyrideReview}
            style={[styles.button, styles.joyrideButton]}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            icon="airplane-takeoff"
          >
            Joyride
          </Button>

          <Button
            mode="outlined"
            onPress={handleViewReviews}
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            icon="view-list"
          >
            View All Reviews
          </Button>

          <Button
            mode="contained"
            onPress={handleAdminQuestions}
            style={[styles.button, styles.adminButton]}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            icon="cog"
          >
            Admin: Manage Questions
          </Button>
        </View>
        
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: getDevicePadding().horizontal,
  },
  header: {
    alignItems: 'flex-end',
    marginBottom: rs(16),
  },
  content: {
    // Avoid vertical centering so content can scroll on small screens and landscape
    alignItems: 'center',
    width: '100%',
    maxWidth: isTablet ? wp(70) : wp(90),
    alignSelf: 'center',
  },
  logo: {
    width: isTablet ? wp(40) : wp(60),
    height: isTablet ? hp(12) : hp(15),
    marginBottom: rs(24),
  },
  title: {
    fontSize: rf(isTablet ? 28 : 24),
    // Avoid overriding ThemedText's safe lineHeight to prevent descender cutoff
    marginBottom: rs(16),
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: rf(16),
    // Avoid tight lineHeight to prevent descender cutoff on Android tablets
    textAlign: 'center',
    marginBottom: rs(32),
    opacity: 0.8,
    paddingHorizontal: rs(8),
  },
  buttonContainer: {
    width: '100%',
    gap: rs(16),
  },
  button: {
    width: '100%',
    // Keep touch target reasonable but not oversized on small screens
    minHeight: isTablet ? rs(56) : rs(44),
    borderRadius: rs(8),
  },
  buttonContent: {
    paddingVertical: isTablet ? rs(12) : rs(10),
    paddingHorizontal: rs(16),
    minHeight: isTablet ? rs(56) : rs(44),
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonLabel: {
    fontSize: rf(isTablet ? 16 : 15),
   lineHeight: rf(40),
    textAlign: 'center',
  },
  dashboardButton: {
    backgroundColor: '#2196F3',
    minHeight: isTablet ? rs(56) : rs(44),
  },
  adminButton: {
    backgroundColor: '#FF6B35',
    marginTop: rs(16),
    minHeight: isTablet ? rs(56) : rs(44),
  },
  joyrideButton: {
    backgroundColor: '#9C27B0',
    minHeight: isTablet ? rs(56) : rs(44),
  },
});
