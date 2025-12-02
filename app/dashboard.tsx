import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import ThemeToggle from '@/components/ThemeToggle';
import { FSDC_SIMULATORS } from '@/constants/simulators';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Card, Menu } from 'react-native-paper';
import StarRating from 'react-native-star-rating-widget';
import { getAllReviews, Review } from '../utils/dataStorage';
import { hp, isTablet, wp } from '../utils/responsive';

interface RatingCategory {
  id?: string; // Optional for backward compatibility
  key: string;
  title: string;
  description: string;
}

const defaultRatingCategories: RatingCategory[] = [
  { id: '1', key: 'cockpitRealismLayout', title: 'Cockpit realism & layout', description: '' },
  { id: '2', key: 'visualQualityFOV', title: 'Visual quality & field of view', description: '' },
  { id: '3', key: 'controlLoadingRealism', title: 'Control loading realism (force feedback)', description: '' },
  { id: '4', key: 'motionFidelity', title: 'Motion fidelity (6-DOF cues & response)', description: '' },
  { id: '5', key: 'aerodynamicResponse', title: 'Aerodynamic response & flight feel', description: '' },
  { id: '6', key: 'instrumentSwitchFunctionality', title: 'Instrument & switch functionality', description: '' },
  { id: '7', key: 'visualMotionSync', title: 'Visual-motion synchronization', description: '' },
  { id: '8', key: 'instructorControlTrainingFlow', title: 'Instructor control & training flow', description: '' },
  { id: '9', key: 'aircraftBehaviorMatch', title: 'Aircraft behavior matches real flight characteristics', description: '' },
  { id: '10', key: 'soundVibrationRealism', title: 'Sound & vibration realism', description: '' },
  { id: '11', key: 'overallImmersionRealism', title: 'Overall immersion & realism', description: '' },
];

// Joyride categories for dashboard analytics
const joyrideRatingCategories: RatingCategory[] = [
  { id: '1',  key: 'overallExperience',       title: 'Overall experience rating',         description: '' },
  { id: '2',  key: 'visualQuality',           title: 'Visual quality and graphics',       description: '' },
  { id: '3',  key: 'motionExperience',        title: 'Motion experience and realism',     description: '' },
  { id: '4',  key: 'easeOfUse',               title: 'Ease of use and controls',          description: '' },
  { id: '5',  key: 'safetyFeeling',           title: 'Feeling of safety and security',    description: '' },
  { id: '6',  key: 'thrillLevel',             title: 'Thrill and excitement level',       description: '' },
  { id: '7',  key: 'wouldRecommend',          title: 'How much would you recommend this to others?', description: '' },
  { id: '8',  key: 'overallSatisfaction',     title: 'Overall satisfaction',              description: '' },
];

export default function DashboardScreen() {
  const { isDark } = useTheme();
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackgroundColor = useThemeColor({ light: '#FFFFFF', dark: '#1E1E1E' }, 'background');
  const borderColor = useThemeColor({ light: '#E0E0E0', dark: '#404040' }, 'text');
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingCategories, setRatingCategories] = useState<RatingCategory[]>(defaultRatingCategories);
  const [reviewTypeFilter, setReviewTypeFilter] = useState<'all' | 'professional' | 'joyride'>('all');
  const [simulatorFilter, setSimulatorFilter] = useState<string>('all'); // 'all' or simulator ID
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [simulatorMenuVisible, setSimulatorMenuVisible] = useState(false);

  const styles = useMemo(() => createStyles(isDark, cardBackgroundColor, borderColor), 
    [isDark, cardBackgroundColor, borderColor]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const allReviews = await getAllReviews();
      setReviews(allReviews);
      
      const savedCategories = await AsyncStorage.getItem('admin_rating_categories');
      if (savedCategories) {
        const parsed = JSON.parse(savedCategories);
        const expectedKeys = new Set(defaultRatingCategories.map(c => c.key));
        const isMismatch = !Array.isArray(parsed) || parsed.length !== defaultRatingCategories.length || parsed.some((c: any) => !expectedKeys.has(c.key));
        if (isMismatch) {
          await AsyncStorage.setItem('admin_rating_categories', JSON.stringify(defaultRatingCategories));
          await AsyncStorage.setItem('ratingCategories', JSON.stringify(defaultRatingCategories));
          setRatingCategories(defaultRatingCategories);
        } else {
          setRatingCategories(parsed);
        }
      } else {
        await AsyncStorage.setItem('admin_rating_categories', JSON.stringify(defaultRatingCategories));
        await AsyncStorage.setItem('ratingCategories', JSON.stringify(defaultRatingCategories));
        setRatingCategories(defaultRatingCategories);
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

  // Calculate statistics - separate for professional and joyride
  const calculateStatsForType = (type: 'professional' | 'joyride' | 'all') => {
    const filteredReviews = reviews.filter(r => {
      const typeMatch = type === 'all' || (r.reviewType || 'professional') === type;
      const simMatch = simulatorFilter === 'all' || r.simulatorId === simulatorFilter;
      return typeMatch && simMatch;
    });

    if (filteredReviews.length === 0) {
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
        averagePrice: 0,
        averageSimulatorEstimate: 0,
      };
    }

    const now = new Date();
    const thisMonth = filteredReviews.filter(r => {
      const reviewDate = new Date(r.timestamp);
      return reviewDate.getMonth() === now.getMonth() && 
             reviewDate.getFullYear() === now.getFullYear();
    }).length;

    const totalRating = filteredReviews.reduce((sum, r) => {
      const ratings = Object.values(r.ratings).filter(rating => rating > 0);
      const avg = ratings.length > 0 ? ratings.reduce((s, v) => s + v, 0) / ratings.length : 0;
      return sum + avg;
    }, 0);
    const averageRating = totalRating / filteredReviews.length;

    const withPhotos = filteredReviews.filter(r => r.photos && r.photos.length > 0).length;
    const withHandwriting = filteredReviews.filter(r => r.handwrittenComment).length;

    // Rating distribution
    const distribution = [0, 0, 0, 0, 0];
    filteredReviews.forEach(r => {
      const ratings = Object.values(r.ratings).filter(rating => rating > 0);
      const avg = ratings.length > 0 ? ratings.reduce((s, v) => s + v, 0) / ratings.length : 0;
      const rounded = Math.round(avg);
      if (rounded >= 1 && rounded <= 5) {
        distribution[rounded - 1]++;
      }
    });

    // Top nationalities
    const nationalityCount: { [key: string]: number } = {};
    filteredReviews.forEach(r => {
      const nationality = r.personalInfo?.nationality || 'Unknown';
      nationalityCount[nationality] = (nationalityCount[nationality] || 0) + 1;
    });
    const topNationalities = Object.entries(nationalityCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Category averages - use appropriate category set
    const categoriesForType = type === 'joyride' ? joyrideRatingCategories : ratingCategories;
    const categoryAverages = categoriesForType.map(category => {
      const values = filteredReviews
        .map(r => r.ratings[category.key])
        .filter(v => v > 0);
      const avg = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0;
      return { title: category.title, average: avg };
    });

    // Experience stats
    const simYes = filteredReviews.filter(r => 
      r.personalInfo?.previousSimulatorExperience?.toLowerCase() === 'yes'
    ).length;
    const flyYes = filteredReviews.filter(r => 
      r.personalInfo?.previousFlyingExperience?.toLowerCase() === 'yes'
    ).length;

    // Average suggested price (Joyride only; ignored for Professional)
    let averagePrice = 0;
    let averageSimulatorEstimate = 0;
    if (type === 'joyride') {
      const prices: number[] = [];
      const estimates: number[] = [];
      filteredReviews.forEach(r => {
        const raw = r.personalInfo?.priceSuggestion || '';
        if (raw) {
          const num = parseFloat(String(raw).replace(/[^0-9.]/g, ''));
          if (!isNaN(num)) prices.push(num);
        }
        const rawEstimate = r.personalInfo?.simulatorCostEstimate || '';
        if (rawEstimate) {
          const numEstimate = parseFloat(String(rawEstimate).replace(/[^0-9.]/g, ''));
          if (!isNaN(numEstimate)) {
            estimates.push(numEstimate);
          }
        }
      });
      if (prices.length > 0) {
        averagePrice = prices.reduce((s, v) => s + v, 0) / prices.length;
      }
      if (estimates.length > 0) {
        averageSimulatorEstimate = estimates.reduce((s, v) => s + v, 0) / estimates.length;
      }
    }

    return {
      totalReviews: filteredReviews.length,
      averageRating,
      thisMonth,
      withPhotos,
      withHandwriting,
      ratingDistribution: distribution,
      topNationalities,
      categoryAverages,
      hasExperience: { simulator: simYes, flying: flyYes },
      averagePrice,
      averageSimulatorEstimate,
    };
  };

  // Calculate stats based on selected filter
  const stats = useMemo(() => calculateStatsForType(reviewTypeFilter), [reviews, ratingCategories, reviewTypeFilter, simulatorFilter]);
  const professionalStats = useMemo(() => calculateStatsForType('professional'), [reviews, ratingCategories, simulatorFilter]);
  const joyrideStats = useMemo(() => calculateStatsForType('joyride'), [reviews, ratingCategories, simulatorFilter]);
  
  // Get filter label
  const filterLabel = useMemo(() => {
    switch (reviewTypeFilter) {
      case 'professional': return 'Professional';
      case 'joyride': return 'Joyride';
      default: return 'All Reviews';
    }
  }, [reviewTypeFilter]);

  const simulatorLabel = useMemo(() => {
    if (simulatorFilter === 'all') return 'All Simulators';
    const sim = FSDC_SIMULATORS.find(s => s.id === simulatorFilter);
    return sim ? sim.name : 'Unknown Simulator';
  }, [simulatorFilter]);

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
          <View style={styles.headerActions}>
            <Menu
              key={`filter-menu-${reviewTypeFilter}-${filterMenuVisible}`}
              visible={filterMenuVisible}
              onDismiss={() => {
                setFilterMenuVisible(false);
              }}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => {
                    setFilterMenuVisible(true);
                  }}
                  icon="filter-variant"
                  style={styles.filterButton}
                  compact
                >
                  {filterLabel}
                </Button>
              }
            >
              <Menu.Item
                onPress={() => {
                  const newFilter: 'all' | 'professional' | 'joyride' = 'all';
                  setFilterMenuVisible(false);
                  // Always update state, even if same, to ensure menu closes
                  setTimeout(() => {
                    setReviewTypeFilter(newFilter);
                  }, 0);
                }}
                title="All Reviews"
                leadingIcon={reviewTypeFilter === 'all' ? 'check' : undefined}
              />
              <Menu.Item
                onPress={() => {
                  const newFilter: 'all' | 'professional' | 'joyride' = 'professional';
                  setFilterMenuVisible(false);
                  // Always update state, even if same, to ensure menu closes
                  setTimeout(() => {
                    setReviewTypeFilter(newFilter);
                  }, 0);
                }}
                title="Professional"
                leadingIcon={reviewTypeFilter === 'professional' ? 'check' : undefined}
              />
              <Menu.Item
                onPress={() => {
                  const newFilter: 'all' | 'professional' | 'joyride' = 'joyride';
                  setFilterMenuVisible(false);
                  // Always update state, even if same, to ensure menu closes
                  setTimeout(() => {
                    setReviewTypeFilter(newFilter);
                  }, 0);
                }}
                title="Joyride"
                leadingIcon={reviewTypeFilter === 'joyride' ? 'check' : undefined}
              />
            </Menu>

            <Menu
              visible={simulatorMenuVisible}
              onDismiss={() => setSimulatorMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setSimulatorMenuVisible(true)}
                  icon="airplane"
                  style={styles.filterButton}
                  compact
                >
                  {simulatorLabel}
                </Button>
              }
            >
              <Menu.Item
                onPress={() => {
                  setSimulatorFilter('all');
                  setSimulatorMenuVisible(false);
                }}
                title="All Simulators"
                leadingIcon={simulatorFilter === 'all' ? 'check' : undefined}
              />
              {FSDC_SIMULATORS.map(sim => (
                <Menu.Item
                  key={sim.id}
                  onPress={() => {
                    setSimulatorFilter(sim.id);
                    setSimulatorMenuVisible(false);
                  }}
                  title={sim.name}
                  leadingIcon={simulatorFilter === sim.id ? 'check' : undefined}
                />
              ))}
            </Menu>

            <ThemeToggle />
          </View>
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

        {/* Professional Reviews Stats - Only show when All is selected (otherwise shown in top stats) */}
        {reviewTypeFilter === 'all' && professionalStats.totalReviews > 0 && (
          <Card style={styles.sectionCard}>
            <Card.Content>
              <ThemedText style={styles.sectionTitle}>Professional Reviews</ThemedText>
              <View style={styles.statsContainer}>
                <Card style={[styles.statCard, styles.statCardPrimary]}>
                  <Card.Content style={styles.statCardContent}>
                    <ThemedText style={styles.statLabel}>Total</ThemedText>
                    <ThemedText style={styles.statValue}>{professionalStats.totalReviews}</ThemedText>
                  </Card.Content>
                </Card>
                <Card style={[styles.statCard, styles.statCardSuccess]}>
                  <Card.Content style={styles.statCardContent}>
                    <ThemedText style={styles.statLabel}>Avg Rating</ThemedText>
                    <ThemedText style={styles.statValue}>{professionalStats.averageRating.toFixed(1)} ⭐</ThemedText>
                  </Card.Content>
                </Card>
                <Card style={[styles.statCard, styles.statCardInfo]}>
                  <Card.Content style={styles.statCardContent}>
                    <ThemedText style={styles.statLabel}>This Month</ThemedText>
                    <ThemedText style={styles.statValue}>{professionalStats.thisMonth}</ThemedText>
                  </Card.Content>
                </Card>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Joyride Reviews Stats - Only show when All is selected (otherwise shown in top stats) */}
        {reviewTypeFilter === 'all' && joyrideStats.totalReviews > 0 && (
          <Card style={styles.sectionCard}>
            <Card.Content>
              <ThemedText style={styles.sectionTitle}>Joyride Reviews</ThemedText>
              <View style={styles.statsContainer}>
                <Card style={[styles.statCard, styles.statCardPrimary]}>
                  <Card.Content style={styles.statCardContent}>
                    <ThemedText style={styles.statLabel}>Total</ThemedText>
                    <ThemedText style={styles.statValue}>{joyrideStats.totalReviews}</ThemedText>
                  </Card.Content>
                </Card>
                <Card style={[styles.statCard, styles.statCardSuccess]}>
                  <Card.Content style={styles.statCardContent}>
                    <ThemedText style={styles.statLabel}>Avg Rating</ThemedText>
                    <ThemedText style={styles.statValue}>{joyrideStats.averageRating.toFixed(1)} ⭐</ThemedText>
                  </Card.Content>
                </Card>
                <Card style={[styles.statCard, styles.statCardInfo]}>
                  <Card.Content style={styles.statCardContent}>
                    <ThemedText style={styles.statLabel}>This Month</ThemedText>
                    <ThemedText style={styles.statValue}>{joyrideStats.thisMonth}</ThemedText>
                  </Card.Content>
                </Card>
                <Card style={[styles.statCard, styles.statCardInfo]}>
                  <Card.Content style={styles.statCardContent}>
                    <ThemedText style={styles.statLabel}>Avg Suggested Price (USD)</ThemedText>
                    <ThemedText style={styles.statValue}>
                      {joyrideStats.averagePrice > 0 ? `$${joyrideStats.averagePrice.toFixed(0)}` : '—'}
                    </ThemedText>
                  </Card.Content>
                </Card>
                <Card style={[styles.statCard, styles.statCardInfo]}>
                  <Card.Content style={styles.statCardContent}>
                    <ThemedText style={styles.statLabel}>Avg Cost Estimate (USD M)</ThemedText>
                    <ThemedText style={styles.statValue}>
                      {joyrideStats.averageSimulatorEstimate > 0 ? `${joyrideStats.averageSimulatorEstimate.toFixed(1)}M` : '—'}
                    </ThemedText>
                  </Card.Content>
                </Card>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Rating Distribution - Only show for Professional filter */}
        {reviewTypeFilter === 'professional' && professionalStats.totalReviews > 0 && (
          <Card style={styles.sectionCard}>
            <Card.Content>
              <ThemedText style={styles.sectionTitle}>Rating Distribution (Professional Reviews)</ThemedText>
              <View style={styles.distributionContainer}>
                {[5, 4, 3, 2, 1].map((rating, index) => {
                  const count = professionalStats.ratingDistribution[rating - 1];
                  const percentage = professionalStats.totalReviews > 0 
                    ? (count / professionalStats.totalReviews) * 100 
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
        )}

        {/* Rating Distribution - Joyride */}
        {reviewTypeFilter === 'joyride' && joyrideStats.totalReviews > 0 && (
          <Card style={styles.sectionCard}>
            <Card.Content>
              <ThemedText style={styles.sectionTitle}>Rating Distribution (Joyride Reviews)</ThemedText>
              <View style={styles.distributionContainer}>
                {[5, 4, 3, 2, 1].map((rating, index) => {
                  const count = joyrideStats.ratingDistribution[rating - 1];
                  const percentage = joyrideStats.totalReviews > 0 
                    ? (count / joyrideStats.totalReviews) * 100 
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
        )}

        {/* Category Performance - Only show for Professional filter */}
        {reviewTypeFilter === 'professional' && professionalStats.totalReviews > 0 && (
          <Card style={styles.sectionCard}>
            <Card.Content>
              <ThemedText style={styles.sectionTitle}>Category Performance (Professional Reviews)</ThemedText>
              <View style={styles.categoryContainer}>
                {professionalStats.categoryAverages.map((category, index) => (
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
        )}

        {/* Category Performance - Joyride */}
        {reviewTypeFilter === 'joyride' && joyrideStats.totalReviews > 0 && (
          <Card style={styles.sectionCard}>
            <Card.Content>
              <ThemedText style={styles.sectionTitle}>Category Performance (Joyride Reviews)</ThemedText>
              <View style={styles.categoryContainer}>
                {joyrideRatingCategories.map((cat, index) => {
                  const avg = joyrideStats.categoryAverages[index]?.average ?? 0;
                  return (
                    <View key={cat.key} style={styles.categoryRow}>
                      <ThemedText style={styles.categoryLabel} numberOfLines={1}>
                        {cat.title}
                      </ThemedText>
                      <View style={styles.categoryRatingContainer}>
                        <View style={styles.categoryBarBackground}>
                          <View 
                            style={[
                              styles.categoryBar,
                              { 
                                width: `${(avg / 5) * 100}%`,
                                backgroundColor: avg >= 4 ? '#4CAF50' : 
                                               avg >= 3 ? '#FF9800' : '#F44336'
                              }
                            ]} 
                          />
                        </View>
                        <ThemedText style={styles.categoryValue}>
                          {avg.toFixed(1)}
                        </ThemedText>
                      </View>
                    </View>
                  );
                })}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Top Nationalities - Only show for Professional filter */}
        {reviewTypeFilter === 'professional' && professionalStats.topNationalities.length > 0 && (
          <Card style={styles.sectionCard}>
            <Card.Content>
              <ThemedText style={styles.sectionTitle}>Top Nationalities (Professional Reviews)</ThemedText>
              <View style={styles.nationalityContainer}>
                {professionalStats.topNationalities.map((item, index) => {
                  const percentage = (item.count / professionalStats.totalReviews) * 100;
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

        {/* Experience Stats - Only show for Professional filter */}
        {reviewTypeFilter === 'professional' && professionalStats.totalReviews > 0 && (
          <View style={styles.experienceStatsContainer}>
            <Card style={[styles.experienceCard, styles.experienceCardSim]}>
              <Card.Content style={styles.experienceCardContent}>
                <ThemedText style={styles.experienceLabel}>Simulator Experience (Professional)</ThemedText>
                <ThemedText style={styles.experienceValue}>
                  {professionalStats.hasExperience.simulator} / {professionalStats.totalReviews}
                </ThemedText>
                <ThemedText style={styles.experiencePercentage}>
                  {professionalStats.totalReviews > 0 
                    ? `${((professionalStats.hasExperience.simulator / professionalStats.totalReviews) * 100).toFixed(0)}%`
                    : '0%'
                  }
                </ThemedText>
              </Card.Content>
            </Card>

            <Card style={[styles.experienceCard, styles.experienceCardFly]}>
              <Card.Content style={styles.experienceCardContent}>
                <ThemedText style={styles.experienceLabel}>Flying Experience (Professional)</ThemedText>
                <ThemedText style={styles.experienceValue}>
                  {professionalStats.hasExperience.flying} / {professionalStats.totalReviews}
                </ThemedText>
                <ThemedText style={styles.experiencePercentage}>
                  {professionalStats.totalReviews > 0 
                    ? `${((professionalStats.hasExperience.flying / professionalStats.totalReviews) * 100).toFixed(0)}%`
                    : '0%'
                  }
                </ThemedText>
              </Card.Content>
            </Card>
          </View>
        )}

        {/* Content Stats - Only show when All is selected */}
        {reviewTypeFilter === 'all' && (
          <View style={styles.contentStatsContainer}>
            <Card style={styles.contentStatCard}>
              <Card.Content style={styles.contentStatContent}>
                <ThemedText style={styles.contentStatIcon}>📸</ThemedText>
                <ThemedText style={styles.contentStatLabel}>Photos (All)</ThemedText>
                <ThemedText style={styles.contentStatValue}>{stats.withPhotos}</ThemedText>
              </Card.Content>
            </Card>

            <Card style={styles.contentStatCard}>
              <Card.Content style={styles.contentStatContent}>
                <ThemedText style={styles.contentStatIcon}>📝</ThemedText>
                <ThemedText style={styles.contentStatLabel}>Handwritten (All)</ThemedText>
                <ThemedText style={styles.contentStatValue}>{stats.withHandwriting}</ThemedText>
              </Card.Content>
            </Card>
          </View>
        )}
        
        {/* Professional Content Stats - Show when All or Professional selected */}
        {(reviewTypeFilter === 'all' || reviewTypeFilter === 'professional') && professionalStats.totalReviews > 0 && (
          <View style={styles.contentStatsContainer}>
            <Card style={styles.contentStatCard}>
              <Card.Content style={styles.contentStatContent}>
                <ThemedText style={styles.contentStatIcon}>📸</ThemedText>
                <ThemedText style={styles.contentStatLabel}>Photos (Professional)</ThemedText>
                <ThemedText style={styles.contentStatValue}>{professionalStats.withPhotos}</ThemedText>
              </Card.Content>
            </Card>

            <Card style={styles.contentStatCard}>
              <Card.Content style={styles.contentStatContent}>
                <ThemedText style={styles.contentStatIcon}>📝</ThemedText>
                <ThemedText style={styles.contentStatLabel}>Handwritten (Professional)</ThemedText>
                <ThemedText style={styles.contentStatValue}>{professionalStats.withHandwriting}</ThemedText>
              </Card.Content>
            </Card>
          </View>
        )}
        
        {/* Joyride Content Stats - Show when All or Joyride selected */}
        {(reviewTypeFilter === 'all' || reviewTypeFilter === 'joyride') && joyrideStats.totalReviews > 0 && (
          <View style={styles.contentStatsContainer}>
            <Card style={styles.contentStatCard}>
              <Card.Content style={styles.contentStatContent}>
                <ThemedText style={styles.contentStatIcon}>📸</ThemedText>
                <ThemedText style={styles.contentStatLabel}>Photos (Joyride)</ThemedText>
                <ThemedText style={styles.contentStatValue}>{joyrideStats.withPhotos}</ThemedText>
              </Card.Content>
            </Card>

            <Card style={styles.contentStatCard}>
              <Card.Content style={styles.contentStatContent}>
                <ThemedText style={styles.contentStatIcon}>📝</ThemedText>
                <ThemedText style={styles.contentStatLabel}>Handwritten (Joyride)</ThemedText>
                <ThemedText style={styles.contentStatValue}>{joyrideStats.withHandwriting}</ThemedText>
              </Card.Content>
            </Card>

            <Card style={styles.contentStatCard}>
              <Card.Content style={styles.contentStatContent}>
                <ThemedText style={styles.contentStatIcon}>💲</ThemedText>
                <ThemedText style={styles.contentStatLabel}>Avg Suggested Price (USD)</ThemedText>
                <ThemedText style={styles.contentStatValue}>
                  {joyrideStats.averagePrice > 0 ? `$${joyrideStats.averagePrice.toFixed(0)}` : '—'}
                </ThemedText>
              </Card.Content>
            </Card>
            <Card style={styles.contentStatCard}>
              <Card.Content style={styles.contentStatContent}>
                <ThemedText style={styles.contentStatIcon}>🏷️</ThemedText>
                <ThemedText style={styles.contentStatLabel}>Avg Cost Estimate (USD M)</ThemedText>
                <ThemedText style={styles.contentStatValue}>
                  {joyrideStats.averageSimulatorEstimate > 0 ? `${joyrideStats.averageSimulatorEstimate.toFixed(1)}M` : '—'}
                </ThemedText>
              </Card.Content>
            </Card>
          </View>
        )}

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

const createStyles = (isDark: boolean, cardBackgroundColor: string, borderColor: string) => (StyleSheet as any).create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: wp('4%'),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: hp('2%'),
  },
  headerContent: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
  },
  title: {
    fontSize: isTablet ? wp('4%') : wp('6%'),
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: isTablet ? wp('2.5%') : wp('3.5%'),
    opacity: 0.7,
  },
  filterButton: {
    marginRight: wp('2%'),
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp('2%'),
    gap: wp('2%'),
  },
  statCard: {
    flex: 1,
    backgroundColor: cardBackgroundColor,
  },
  statCardPrimary: {
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  statCardSuccess: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  statCardInfo: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  statCardContent: {
    alignItems: 'center',
    padding: wp('2%'),
  },
  statLabel: {
    fontSize: isTablet ? wp('1.5%') : wp('3%'),
    opacity: 0.7,
    textAlign: 'center',
  },
  statValue: {
    fontSize: isTablet ? wp('2.5%') : wp('4.5%'),
    fontWeight: 'bold',
    marginVertical: hp('0.5%'),
  },
  statIcon: {
    fontSize: isTablet ? wp('2%') : wp('4%'),
  },
  statTrend: {
    fontSize: isTablet ? wp('1.2%') : wp('2.5%'),
    color: '#4CAF50',
  },
  miniStars: {
    marginTop: hp('0.5%'),
  },
  sectionCard: {
    marginBottom: hp('2%'),
    backgroundColor: cardBackgroundColor,
  },
  sectionTitle: {
    fontSize: isTablet ? wp('2.5%') : wp('4.5%'),
    fontWeight: 'bold',
    marginBottom: hp('1.5%'),
  },
  distributionContainer: {
    gap: hp('1%'),
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
  },
  distributionLabel: {
    width: wp('12%'),
  },
  distributionRating: {
    fontSize: isTablet ? wp('1.5%') : wp('3.5%'),
  },
  distributionBarContainer: {
    flex: 1,
    height: hp('1%'),
    backgroundColor: isDark ? '#333' : '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  distributionBar: {
    height: '100%',
    borderRadius: 4,
  },
  distributionCount: {
    width: wp('8%'),
    textAlign: 'right',
    fontSize: isTablet ? wp('1.5%') : wp('3.5%'),
  },
  categoryContainer: {
    gap: hp('1.5%'),
  },
  categoryRow: {
    gap: hp('0.5%'),
  },
  categoryLabel: {
    fontSize: isTablet ? wp('1.8%') : wp('3.5%'),
    marginBottom: hp('0.5%'),
  },
  categoryRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
  },
  categoryBarBackground: {
    flex: 1,
    height: hp('1%'),
    backgroundColor: isDark ? '#333' : '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  categoryBar: {
    height: '100%',
    borderRadius: 4,
  },
  categoryValue: {
    width: wp('8%'),
    textAlign: 'right',
    fontWeight: 'bold',
  },
  nationalityContainer: {
    gap: hp('1%'),
  },
  nationalityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
  },
  nationalityName: {
    flex: 1,
    fontSize: isTablet ? wp('1.8%') : wp('3.5%'),
  },
  nationalityBarContainer: {
    flex: 1,
    height: hp('1%'),
    backgroundColor: isDark ? '#333' : '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  nationalityBar: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 4,
  },
  nationalityCount: {
    width: wp('8%'),
    textAlign: 'right',
    fontWeight: 'bold',
  },
  experienceStatsContainer: {
    flexDirection: 'row',
    gap: wp('2%'),
    marginBottom: hp('2%'),
  },
  experienceCard: {
    flex: 1,
    backgroundColor: cardBackgroundColor,
  },
  experienceCardSim: {
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0',
  },
  experienceCardFly: {
    borderLeftWidth: 4,
    borderLeftColor: '#00BCD4',
  },
  experienceCardContent: {
    alignItems: 'center',
    padding: wp('3%'),
  },
  experienceLabel: {
    fontSize: isTablet ? wp('1.5%') : wp('3%'),
    textAlign: 'center',
    marginBottom: hp('0.5%'),
    opacity: 0.8,
  },
  experienceValue: {
    fontSize: isTablet ? wp('2.5%') : wp('4.5%'),
    fontWeight: 'bold',
  },
  experiencePercentage: {
    fontSize: isTablet ? wp('1.5%') : wp('3%'),
    color: '#4CAF50',
    marginTop: hp('0.5%'),
  },
  contentStatsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp('2%'),
    marginBottom: hp('2%'),
  },
  contentStatCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: cardBackgroundColor,
  },
  contentStatContent: {
    alignItems: 'center',
    padding: wp('3%'),
  },
  contentStatIcon: {
    fontSize: isTablet ? wp('3%') : wp('6%'),
    marginBottom: hp('0.5%'),
  },
  contentStatLabel: {
    fontSize: isTablet ? wp('1.5%') : wp('3%'),
    textAlign: 'center',
    opacity: 0.7,
  },
  contentStatValue: {
    fontSize: isTablet ? wp('2.5%') : wp('4.5%'),
    fontWeight: 'bold',
    marginTop: hp('0.5%'),
  },
  actionsContainer: {
    gap: hp('1.5%'),
    marginBottom: hp('2%'),
  },
  actionButton: {
    borderColor: borderColor,
  },
});


