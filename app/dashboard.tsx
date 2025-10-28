import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card } from 'react-native-paper';
import StarRating from 'react-native-star-rating-widget';
import { getAllReviews, Review } from '../utils/dataStorage';
import { getDevicePadding, hp, isTablet, rf, rs, wp } from '../utils/responsive';

interface RatingCategory {
  key: string;
  title: string;
  description: string;
}

const defaultRatingCategories: RatingCategory[] = [
  { key: 'generalFlying', title: 'General Flying', description: '' },
  { key: 'emergencyProcedures', title: 'Emergency Procedures', description: '' },
  { key: 'instrumentFlying', title: 'Instrument Flying', description: '' },
  { key: 'visualEffects', title: 'Visual Effects', description: '' },
  { key: 'fidelityRealism', title: 'Fidelity & Realism', description: '' },
  { key: 'simulatorPerformance', title: 'Simulator Performance', description: '' },
];

export default function DashboardScreen() {
  const { isDark } = useTheme();
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackgroundColor = useThemeColor({ light: '#FFFFFF', dark: '#1E1E1E' }, 'background');
  const borderColor = useThemeColor({ light: '#E0E0E0', dark: '#404040' }, 'text');
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingCategories, setRatingCategories] = useState<RatingCategory[]>(defaultRatingCategories);

  const styles = useMemo(() => createStyles(isDark, cardBackgroundColor, borderColor), 
    [isDark, cardBackgroundColor, borderColor]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const allReviews = await getAllReviews();
      setReviews(allReviews);
      
      const savedCategories = await AsyncStorage.getItem('admin_rating_categories');
      if (savedCategories) {
        setRatingCategories(JSON.parse(savedCategories));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (reviews.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        thisMonth: 0,
        withPhotos: 0,
        withHandwriting: 0,
        ratingDistribution: [0, 0, 0, 0, 0],
        topNationalities: [],
        categoryAverages: [],
        hasExperience: { simulator: 0, flying: 0 },
      };
    }

    const now = new Date();
    const thisMonth = reviews.filter(r => {
      const reviewDate = new Date(r.timestamp);
      return reviewDate.getMonth() === now.getMonth() && 
             reviewDate.getFullYear() === now.getFullYear();
    }).length;

    const totalRating = reviews.reduce((sum, r) => {
      const ratings = Object.values(r.ratings).filter(rating => rating > 0);
      const avg = ratings.length > 0 ? ratings.reduce((s, v) => s + v, 0) / ratings.length : 0;
      return sum + avg;
    }, 0);
    const averageRating = totalRating / reviews.length;

    const withPhotos = reviews.filter(r => r.photos && r.photos.length > 0).length;
    const withHandwriting = reviews.filter(r => r.handwrittenComment).length;

    // Rating distribution
    const distribution = [0, 0, 0, 0, 0];
    reviews.forEach(r => {
      const ratings = Object.values(r.ratings).filter(rating => rating > 0);
      const avg = ratings.length > 0 ? ratings.reduce((s, v) => s + v, 0) / ratings.length : 0;
      const rounded = Math.round(avg);
      if (rounded >= 1 && rounded <= 5) {
        distribution[rounded - 1]++;
      }
    });

    // Top nationalities
    const nationalityCount: { [key: string]: number } = {};
    reviews.forEach(r => {
      const nationality = r.personalInfo?.nationality || r.nationality || 'Unknown';
      nationalityCount[nationality] = (nationalityCount[nationality] || 0) + 1;
    });
    const topNationalities = Object.entries(nationalityCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Category averages
    const categoryAverages = ratingCategories.map(category => {
      const values = reviews
        .map(r => r.ratings[category.key])
        .filter(v => v > 0);
      const avg = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0;
      return { title: category.title, average: avg };
    });

    // Experience stats
    const simYes = reviews.filter(r => 
      r.personalInfo?.previousSimulatorExperience?.toLowerCase() === 'yes'
    ).length;
    const flyYes = reviews.filter(r => 
      r.personalInfo?.previousFlyingExperience?.toLowerCase() === 'yes'
    ).length;

    return {
      totalReviews: reviews.length,
      averageRating,
      thisMonth,
      withPhotos,
      withHandwriting,
      ratingDistribution: distribution,
      topNationalities,
      categoryAverages,
      hasExperience: { simulator: simYes, flying: flyYes },
    };
  }, [reviews, ratingCategories]);

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>Dashboard</ThemedText>
          <ThemeToggle />
        </View>
        <View style={styles.loadingContainer}>
          <ThemedText>Loading dashboard...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <ThemedText type="title" style={styles.title}>Dashboard</ThemedText>
            <ThemedText style={styles.subtitle}>Analytics & Insights</ThemedText>
          </View>
          <ThemeToggle />
        </View>

        {/* Top Stats Cards */}
        <View style={styles.statsContainer}>
          <Card style={[styles.statCard, styles.statCardPrimary]}>
            <Card.Content style={styles.statCardContent}>
              <ThemedText style={styles.statLabel}>Total Reviews</ThemedText>
              <ThemedText style={styles.statValue}>{stats.totalReviews}</ThemedText>
              <ThemedText style={styles.statIcon}>📊</ThemedText>
            </Card.Content>
          </Card>

          <Card style={[styles.statCard, styles.statCardSuccess]}>
            <Card.Content style={styles.statCardContent}>
              <ThemedText style={styles.statLabel}>Average Rating</ThemedText>
              <ThemedText style={styles.statValue}>{stats.averageRating.toFixed(1)} ⭐</ThemedText>
              <View style={styles.miniStars}>
                <StarRating
                  rating={stats.averageRating}
                  onChange={() => {}}
                  starSize={isTablet ? wp('1.5%') : wp('3%')}
                  color="#FFD700"
                  emptyColor={isDark ? '#404040' : '#E0E0E0'}
                  enableHalfStar={true}
                />
              </View>
            </Card.Content>
          </Card>

          <Card style={[styles.statCard, styles.statCardInfo]}>
            <Card.Content style={styles.statCardContent}>
              <ThemedText style={styles.statLabel}>This Month</ThemedText>
              <ThemedText style={styles.statValue}>{stats.thisMonth}</ThemedText>
              <ThemedText style={styles.statTrend}>
                {stats.thisMonth > 0 ? '↑ Active' : '—'}
              </ThemedText>
            </Card.Content>
          </Card>
        </View>

        {/* Rating Distribution */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <ThemedText style={styles.sectionTitle}>Rating Distribution</ThemedText>
            <View style={styles.distributionContainer}>
              {[5, 4, 3, 2, 1].map((rating, index) => {
                const count = stats.ratingDistribution[rating - 1];
                const percentage = stats.totalReviews > 0 
                  ? (count / stats.totalReviews) * 100 
                  : 0;
                return (
                  <View key={rating} style={styles.distributionRow}>
                    <View style={styles.distributionLabel}>
                      <ThemedText style={styles.distributionRating}>{rating} ⭐</ThemedText>
                    </View>
                    <View style={styles.distributionBarContainer}>
                      <View 
                        style={[
                          styles.distributionBar,
                          { 
                            width: `${percentage}%`,
                            backgroundColor: rating >= 4 ? '#4CAF50' : rating >= 3 ? '#FF9800' : '#F44336'
                          }
                        ]} 
                      />
                    </View>
                    <ThemedText style={styles.distributionCount}>{count}</ThemedText>
                  </View>
                );
              })}
            </View>
          </Card.Content>
        </Card>

        {/* Category Performance */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <ThemedText style={styles.sectionTitle}>Category Performance</ThemedText>
            <View style={styles.categoryContainer}>
              {stats.categoryAverages.map((category, index) => (
                <View key={index} style={styles.categoryRow}>
                  <ThemedText style={styles.categoryLabel} numberOfLines={1}>
                    {category.title}
                  </ThemedText>
                  <View style={styles.categoryRatingContainer}>
                    <View style={styles.categoryBarBackground}>
                      <View 
                        style={[
                          styles.categoryBar,
                          { 
                            width: `${(category.average / 5) * 100}%`,
                            backgroundColor: category.average >= 4 ? '#4CAF50' : 
                                           category.average >= 3 ? '#FF9800' : '#F44336'
                          }
                        ]} 
                      />
                    </View>
                    <ThemedText style={styles.categoryValue}>
                      {category.average.toFixed(1)}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Top Nationalities */}
        {stats.topNationalities.length > 0 && (
          <Card style={styles.sectionCard}>
            <Card.Content>
              <ThemedText style={styles.sectionTitle}>Top Nationalities</ThemedText>
              <View style={styles.nationalityContainer}>
                {stats.topNationalities.map((item, index) => {
                  const percentage = (item.count / stats.totalReviews) * 100;
                  return (
                    <View key={index} style={styles.nationalityRow}>
                      <ThemedText style={styles.nationalityName}>{item.name}</ThemedText>
                      <View style={styles.nationalityBarContainer}>
                        <View 
                          style={[styles.nationalityBar, { width: `${percentage}%` }]} 
                        />
                      </View>
                      <ThemedText style={styles.nationalityCount}>{item.count}</ThemedText>
                    </View>
                  );
                })}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Experience Stats */}
        <View style={styles.experienceStatsContainer}>
          <Card style={[styles.experienceCard, styles.experienceCardSim]}>
            <Card.Content style={styles.experienceCardContent}>
              <ThemedText style={styles.experienceLabel}>Simulator Experience</ThemedText>
              <ThemedText style={styles.experienceValue}>
                {stats.hasExperience.simulator} / {stats.totalReviews}
              </ThemedText>
              <ThemedText style={styles.experiencePercentage}>
                {stats.totalReviews > 0 
                  ? `${((stats.hasExperience.simulator / stats.totalReviews) * 100).toFixed(0)}%`
                  : '0%'
                }
              </ThemedText>
            </Card.Content>
          </Card>

          <Card style={[styles.experienceCard, styles.experienceCardFly]}>
            <Card.Content style={styles.experienceCardContent}>
              <ThemedText style={styles.experienceLabel}>Flying Experience</ThemedText>
              <ThemedText style={styles.experienceValue}>
                {stats.hasExperience.flying} / {stats.totalReviews}
              </ThemedText>
              <ThemedText style={styles.experiencePercentage}>
                {stats.totalReviews > 0 
                  ? `${((stats.hasExperience.flying / stats.totalReviews) * 100).toFixed(0)}%`
                  : '0%'
                }
              </ThemedText>
            </Card.Content>
          </Card>
        </View>

        {/* Content Stats */}
        <View style={styles.contentStatsContainer}>
          <Card style={styles.contentStatCard}>
            <Card.Content style={styles.contentStatContent}>
              <ThemedText style={styles.contentStatIcon}>📸</ThemedText>
              <ThemedText style={styles.contentStatLabel}>With Photos</ThemedText>
              <ThemedText style={styles.contentStatValue}>{stats.withPhotos}</ThemedText>
            </Card.Content>
          </Card>

          <Card style={styles.contentStatCard}>
            <Card.Content style={styles.contentStatContent}>
              <ThemedText style={styles.contentStatIcon}>📝</ThemedText>
              <ThemedText style={styles.contentStatLabel}>Handwritten</ThemedText>
              <ThemedText style={styles.contentStatValue}>{stats.withHandwriting}</ThemedText>
            </Card.Content>
          </Card>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Button
            mode="contained"
            onPress={() => router.push('/add-review')}
            style={styles.actionButton}
            icon="plus"
          >
            Add New Review
          </Button>
          <Button
            mode="outlined"
            onPress={() => router.push('/reviews-list')}
            style={styles.actionButton}
            icon="view-list"
          >
            View All Reviews
          </Button>
          <Button
            mode="outlined"
            onPress={() => router.back()}
            style={styles.actionButton}
            icon="home"
          >
            Back to Home
          </Button>
        </View>

        <View style={{ height: hp('5%') }} />
      </ScrollView>
    </ThemedView>
  );
}

const createStyles = (isDark: boolean, cardBackgroundColor: string, borderColor: string) => StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: hp(isTablet ? 3 : 5),
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: getDevicePadding().horizontal,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: rs(24),
    paddingBottom: rs(16),
    borderBottomWidth: 1,
    borderBottomColor: borderColor,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: rf(isTablet ? 32 : 28),
    fontWeight: 'bold',
    marginBottom: rs(4),
  },
  subtitle: {
    fontSize: rf(16),
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: rs(12),
    marginBottom: rs(16),
    flexWrap: 'wrap',
  },
  statCard: {
    flex: 1,
    minWidth: isTablet ? wp('28%') : wp('100%'),
    elevation: 4,
    borderRadius: rs(16),
  },
  statCardPrimary: {
    backgroundColor: isDark ? '#1E3A8A' : '#EFF6FF',
  },
  statCardSuccess: {
    backgroundColor: isDark ? '#14532D' : '#F0FDF4',
  },
  statCardInfo: {
    backgroundColor: isDark ? '#7C2D12' : '#FEF3C7',
  },
  statCardContent: {
    alignItems: 'center',
    paddingVertical: rs(20),
  },
  statLabel: {
    fontSize: rf(14),
    opacity: 0.8,
    marginBottom: rs(8),
    textAlign: 'center',
  },
  statValue: {
    fontSize: rf(isTablet ? 36 : 32),
    fontWeight: 'bold',
    marginBottom: rs(4),
  },
  statIcon: {
    fontSize: rf(24),
    marginTop: rs(4),
  },
  statTrend: {
    fontSize: rf(12),
    opacity: 0.7,
    marginTop: rs(4),
  },
  miniStars: {
    marginTop: rs(4),
  },
  sectionCard: {
    marginBottom: rs(16),
    borderRadius: rs(16),
    elevation: 2,
  },
  sectionTitle: {
    fontSize: rf(20),
    fontWeight: 'bold',
    marginBottom: rs(16),
  },
  distributionContainer: {
    gap: rs(12),
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
  },
  distributionLabel: {
    width: wp(isTablet ? '10%' : '15%'),
  },
  distributionRating: {
    fontSize: rf(14),
    fontWeight: '600',
  },
  distributionBarContainer: {
    flex: 1,
    height: rs(24),
    backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
    borderRadius: rs(12),
    overflow: 'hidden',
  },
  distributionBar: {
    height: '100%',
    borderRadius: rs(12),
  },
  distributionCount: {
    width: wp(isTablet ? '8%' : '12%'),
    textAlign: 'right',
    fontSize: rf(14),
    fontWeight: '600',
  },
  categoryContainer: {
    gap: rs(16),
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
  },
  categoryLabel: {
    width: wp(isTablet ? '35%' : '40%'),
    fontSize: rf(14),
  },
  categoryRatingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
  },
  categoryBarBackground: {
    flex: 1,
    height: rs(20),
    backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
    borderRadius: rs(10),
    overflow: 'hidden',
  },
  categoryBar: {
    height: '100%',
    borderRadius: rs(10),
  },
  categoryValue: {
    width: wp(isTablet ? '8%' : '12%'),
    textAlign: 'right',
    fontSize: rf(14),
    fontWeight: '600',
  },
  nationalityContainer: {
    gap: rs(12),
  },
  nationalityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
  },
  nationalityName: {
    width: wp(isTablet ? '20%' : '30%'),
    fontSize: rf(14),
  },
  nationalityBarContainer: {
    flex: 1,
    height: rs(20),
    backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
    borderRadius: rs(10),
    overflow: 'hidden',
  },
  nationalityBar: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: rs(10),
  },
  nationalityCount: {
    width: wp(isTablet ? '8%' : '12%'),
    textAlign: 'right',
    fontSize: rf(14),
    fontWeight: '600',
  },
  experienceStatsContainer: {
    flexDirection: 'row',
    gap: rs(12),
    marginBottom: rs(16),
    flexWrap: 'wrap',
  },
  experienceCard: {
    flex: 1,
    minWidth: isTablet ? wp('45%') : wp('100%'),
    borderRadius: rs(16),
    elevation: 2,
  },
  experienceCardSim: {
    backgroundColor: isDark ? '#1E3A8A' : '#DBEAFE',
  },
  experienceCardFly: {
    backgroundColor: isDark ? '#14532D' : '#D1FAE5',
  },
  experienceCardContent: {
    alignItems: 'center',
    paddingVertical: rs(16),
  },
  experienceLabel: {
    fontSize: rf(14),
    marginBottom: rs(8),
    textAlign: 'center',
  },
  experienceValue: {
    fontSize: rf(24),
    fontWeight: 'bold',
    marginBottom: rs(4),
  },
  experiencePercentage: {
    fontSize: rf(16),
    opacity: 0.8,
  },
  contentStatsContainer: {
    flexDirection: 'row',
    gap: rs(12),
    marginBottom: rs(16),
    flexWrap: 'wrap',
  },
  contentStatCard: {
    flex: 1,
    minWidth: isTablet ? wp('45%') : wp('100%'),
    borderRadius: rs(16),
    elevation: 2,
  },
  contentStatContent: {
    alignItems: 'center',
    paddingVertical: rs(16),
  },
  contentStatIcon: {
    fontSize: rf(32),
    marginBottom: rs(8),
  },
  contentStatLabel: {
    fontSize: rf(14),
    marginBottom: rs(4),
  },
  contentStatValue: {
    fontSize: rf(24),
    fontWeight: 'bold',
  },
  actionsContainer: {
    gap: rs(12),
    marginTop: rs(8),
  },
  actionButton: {
    borderRadius: rs(12),
  },
});

