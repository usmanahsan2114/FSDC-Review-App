import OptimizedImage from '@/components/OptimizedImage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button } from 'react-native-paper';
import { getDevicePadding, hp, isTablet, minTouchTarget, rf, rs, wp } from '../../utils/responsive';

export default function HomeScreen() {
  const { isDark } = useTheme();

  const handleAddReview = () => {
    router.push('/add-review');
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
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
          Welcome! Choose an option below to get started.
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
    flex: 1,
    justifyContent: 'center',
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
    minHeight: minTouchTarget,
    borderRadius: rs(8),
  },
  buttonContent: {
    paddingVertical: rs(12),
    paddingHorizontal: rs(16),
    minHeight: minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonLabel: {
    fontSize: rf(16),
    // Let platform compute safe line height
    textAlign: 'center',
  },
  dashboardButton: {
    backgroundColor: '#2196F3',
    minHeight: minTouchTarget,
  },
  adminButton: {
    backgroundColor: '#FF6B35',
    marginTop: rs(16),
    minHeight: minTouchTarget,
  },
});
