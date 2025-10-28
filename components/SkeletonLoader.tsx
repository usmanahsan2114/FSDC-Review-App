import { useTheme } from '@/contexts/ThemeContext';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { isTablet, rs, wp } from '../utils/responsive';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const { isDark } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: isDark ? '#2A2A2A' : '#E0E0E0',
          opacity,
        },
        style,
      ]}
    />
  );
};

// Review Card Skeleton
export const ReviewCardSkeleton: React.FC = () => {
  const { isDark } = useTheme();
  
  return (
    <View style={[styles.card, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
      <View style={styles.cardHeader}>
        <SkeletonLoader width={wp(isTablet ? '30%' : '50%')} height={24} />
        <SkeletonLoader width={wp(isTablet ? '15%' : '20%')} height={16} />
      </View>

      <View style={styles.chipsRow}>
        <SkeletonLoader width={wp(isTablet ? '15%' : '25%')} height={32} borderRadius={16} />
        <SkeletonLoader width={wp(isTablet ? '18%' : '30%')} height={32} borderRadius={16} />
      </View>

      <View style={styles.experienceRow}>
        <SkeletonLoader width={wp(isTablet ? '25%' : '40%')} height={28} />
        <SkeletonLoader width={wp(isTablet ? '25%' : '40%')} height={28} />
      </View>

      <View style={styles.ratingRow}>
        <SkeletonLoader width={wp(isTablet ? '20%' : '30%')} height={20} />
        <SkeletonLoader width={wp(isTablet ? '30%' : '50%')} height={24} />
      </View>

      <SkeletonLoader width="100%" height={60} style={{ marginTop: rs(12) }} />

      <View style={styles.buttonRow}>
        <SkeletonLoader width="48%" height={44} borderRadius={8} />
        <SkeletonLoader width="48%" height={44} borderRadius={8} />
      </View>
    </View>
  );
};

// Stats Card Skeleton
export const StatsCardSkeleton: React.FC = () => {
  const { isDark } = useTheme();
  
  return (
    <View style={[styles.statsCard, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
      <SkeletonLoader width={wp(isTablet ? '20%' : '40%')} height={16} />
      <SkeletonLoader width={wp(isTablet ? '25%' : '50%')} height={36} style={{ marginTop: rs(8) }} />
      <SkeletonLoader width={wp(isTablet ? '15%' : '30%')} height={12} style={{ marginTop: rs(4) }} />
    </View>
  );
};

// List Skeleton (multiple cards)
export const ReviewListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <ReviewCardSkeleton key={index} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: rs(16),
    padding: rs(16),
    borderRadius: rs(12),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: rs(12),
  },
  chipsRow: {
    flexDirection: 'row',
    gap: rs(8),
    marginBottom: rs(12),
  },
  experienceRow: {
    flexDirection: 'row',
    gap: rs(12),
    marginBottom: rs(12),
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: rs(8),
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: rs(12),
  },
  statsCard: {
    padding: rs(20),
    borderRadius: rs(16),
    alignItems: 'center',
    marginBottom: rs(12),
    elevation: 2,
  },
  listContainer: {
    padding: wp('5%'),
  },
});

