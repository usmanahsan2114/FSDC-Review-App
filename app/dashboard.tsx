import { GlassCard } from '@/components/GlassCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import ThemeToggle from '@/components/ThemeToggle';
import { Simulator } from '@/constants/simulators';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, IconButton, Menu } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StarRating from 'react-native-star-rating-widget';
import { getAllReviews, Review } from '../utils/dataStorage';
import { hapticsFilterSelect } from '../utils/haptics';
import { hp, isTablet, rf, rs, wp } from '../utils/responsive';
import { getSimulators, getSimulatorTypes } from '../utils/simulatorStorage';

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
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackgroundColor = useThemeColor({ light: '#FFFFFF', dark: '#1E1E1E' }, 'background');
  const borderColor = useThemeColor({ light: '#E0E0E0', dark: '#404040' }, 'text');
  const primaryColor = useThemeColor({}, 'primary');
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingCategories, setRatingCategories] = useState<RatingCategory[]>(defaultRatingCategories);
  const [reviewTypeFilter, setReviewTypeFilter] = useState<'all' | 'professional' | 'joyride'>('all');
  const [simulatorFilter, setSimulatorFilter] = useState<string>('all'); // 'all' or simulator ID
  const [simulatorTypeFilter, setSimulatorTypeFilter] = useState<string>('all'); // 'all' or simulator type

  // Dynamic Simulators State
  const [availableSimulators, setAvailableSimulators] = useState<Simulator[]>([]);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [simulatorMenuVisible, setSimulatorMenuVisible] = useState(false);
  const [typeMenuVisible, setTypeMenuVisible] = useState(false);

  const styles = useMemo(() => createStyles(isDark, cardBackgroundColor, borderColor), 
    [isDark, cardBackgroundColor, borderColor]);

  const loadReviews = useCallback(async () => {
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

  const loadSimulatorData = async () => {
    const sims = await getSimulators();
    const types = await getSimulatorTypes();
    setAvailableSimulators(sims);
    setAvailableTypes(types);
  };

  useFocusEffect(
    useCallback(() => {
      loadReviews();
      loadSimulatorData();
    }, [])
  );

  // Calculate statistics - separate for professional and joyride
  const calculateStatsForType = (type: 'professional' | 'joyride' | 'all') => {
    const filteredReviews = reviews.filter(r => {
      const typeMatch = type === 'all' || (r.reviewType || 'professional') === type;
      const simMatch = simulatorFilter === 'all' || r.simulatorId === simulatorFilter;
      const simTypeMatch = simulatorTypeFilter === 'all' || r.simulatorType === simulatorTypeFilter;
      return typeMatch && simMatch && simTypeMatch;
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
  const stats = useMemo(() => calculateStatsForType(reviewTypeFilter), [reviews, ratingCategories, reviewTypeFilter, simulatorFilter, simulatorTypeFilter]);
  const professionalStats = useMemo(() => calculateStatsForType('professional'), [reviews, ratingCategories, simulatorFilter, simulatorTypeFilter]);
  const joyrideStats = useMemo(() => calculateStatsForType('joyride'), [reviews, ratingCategories, simulatorFilter, simulatorTypeFilter]);
  
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
    const sim = availableSimulators.find(s => s.id === simulatorFilter);
    return sim ? sim.name : 'Unknown Simulator';
  }, [simulatorFilter, availableSimulators]);

  const typeLabel = useMemo(() => {
    if (simulatorTypeFilter === 'all') return 'All Types';
    return simulatorTypeFilter;
  }, [simulatorTypeFilter]);

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
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(hp('5%'), insets.bottom + 20) }}
      >
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => router.back()}
            style={{ margin: 0, marginRight: 4 }}
            iconColor={primaryColor}
          />
          <View style={styles.headerContent}>
            <ThemedText type="hero-title" style={styles.title}>DASHBOARD</ThemedText>
            <ThemedText style={styles.subtitle}>ANALYTICS & INSIGHTS</ThemedText>
          </View>
          <View style={styles.headerActions}>
            <Menu
              visible={filterMenuVisible}
              onDismiss={() => {
                setFilterMenuVisible(false);
              }}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => {
                    setFilterMenuVisible(!filterMenuVisible);
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
                  setReviewTypeFilter('all');
                  setFilterMenuVisible(false);
                  hapticsFilterSelect();
                }}
                title="All Reviews"
                leadingIcon={reviewTypeFilter === 'all' ? 'check' : undefined}
              />
              <Menu.Item
                onPress={() => {
                  setReviewTypeFilter('professional');
                  setFilterMenuVisible(false);
                  hapticsFilterSelect();
                }}
                title="Professional"
                leadingIcon={reviewTypeFilter === 'professional' ? 'check' : undefined}
              />
              <Menu.Item
                onPress={() => {
                  setReviewTypeFilter('joyride');
                  setFilterMenuVisible(false);
                  hapticsFilterSelect();
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
                    onPress={() => setSimulatorMenuVisible(!simulatorMenuVisible)}
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
                    hapticsFilterSelect();
                  }}
                  title="All Simulators"
                  leadingIcon={simulatorFilter === 'all' ? 'check' : undefined}
                />
                {availableSimulators.map(sim => (
                  <Menu.Item
                    key={sim.id}
                    onPress={() => {
                      setSimulatorFilter(sim.id);
                      setSimulatorMenuVisible(false);
                      hapticsFilterSelect();
                    }}
                    title={sim.name}
                    leadingIcon={simulatorFilter === sim.id ? 'check' : undefined}
                  />
                ))}
              </Menu>

              <Menu
                visible={typeMenuVisible}
                onDismiss={() => setTypeMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setTypeMenuVisible(!typeMenuVisible)}
                    icon="cog"
                    style={styles.filterButton}
                    compact
                  >
                    {typeLabel}
                  </Button>
                }
              >
                <Menu.Item
                  onPress={() => {
                    setSimulatorTypeFilter('all');
                    setTypeMenuVisible(false);
                    hapticsFilterSelect();
                  }}
                  title="All Types"
                  leadingIcon={simulatorTypeFilter === 'all' ? 'check' : undefined}
                />
                {availableTypes.map(type => (
                  <Menu.Item
                    key={type}
                    onPress={() => {
                      setSimulatorTypeFilter(type);
                      setTypeMenuVisible(false);
                      hapticsFilterSelect();
                    }}
                    title={type}
                    leadingIcon={simulatorTypeFilter === type ? 'check' : undefined}
                  />
                ))}
              </Menu>

            <ThemeToggle />
          </View>
        </View>

        {/* Top Stats Cards */}
        <View style={styles.statsContainer}>
          <GlassCard style={[styles.statCard, styles.statCardPrimary]} variant="glass-panel">
            <View style={styles.statCardContent}>
              <ThemedText style={styles.statLabel}>Total Reviews</ThemedText>
              <ThemedText style={styles.statValue}>{stats.totalReviews}</ThemedText>
              <ThemedText style={styles.statIcon}>📊</ThemedText>
            </View>
          </GlassCard>

          <GlassCard style={[styles.statCard, styles.statCardSuccess]} variant="glass-panel">
            <View style={styles.statCardContent}>
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
            </View>
          </GlassCard>

          <GlassCard style={[styles.statCard, styles.statCardInfo]} variant="glass-panel">
            <View style={styles.statCardContent}>
              <ThemedText style={styles.statLabel}>This Month</ThemedText>
              <ThemedText style={styles.statValue}>{stats.thisMonth}</ThemedText>
              <ThemedText style={styles.statTrend}>
                {stats.thisMonth > 0 ? '↑ Active' : '—'}
              </ThemedText>
            </View>
          </GlassCard>
        </View>

        {/* Professional Reviews Stats - Only show when All is selected (otherwise shown in top stats) */}
        {reviewTypeFilter === 'all' && professionalStats.totalReviews > 0 && (
          <GlassCard style={styles.sectionCard} variant="glass-panel">
            <View style={{ padding: 16 }}>
              <ThemedText style={styles.sectionTitle}>Professional Reviews</ThemedText>
              <View style={styles.statsContainer}>
                <GlassCard style={[styles.statCard, styles.statCardPrimary]} variant="glass-panel">
                  <View style={styles.statCardContent}>
                    <ThemedText style={styles.statLabel}>Total</ThemedText>
                    <ThemedText style={styles.statValue}>{professionalStats.totalReviews}</ThemedText>
                  </View>
                </GlassCard>
                <GlassCard style={[styles.statCard, styles.statCardSuccess]} variant="glass-panel">
                  <View style={styles.statCardContent}>
                    <ThemedText style={styles.statLabel}>Avg Rating</ThemedText>
                    <ThemedText style={styles.statValue}>{professionalStats.averageRating.toFixed(1)} ⭐</ThemedText>
                  </View>
                </GlassCard>
                <GlassCard style={[styles.statCard, styles.statCardInfo]} variant="glass-panel">
                  <View style={styles.statCardContent}>
                    <ThemedText style={styles.statLabel}>This Month</ThemedText>
                    <ThemedText style={styles.statValue}>{professionalStats.thisMonth}</ThemedText>
                  </View>
                </GlassCard>
              </View>
            </View>
          </GlassCard>
        )}

        {/* Joyride Reviews Stats - Only show when All is selected (otherwise shown in top stats) */}
        {reviewTypeFilter === 'all' && joyrideStats.totalReviews > 0 && (
          <GlassCard style={styles.sectionCard} variant="glass-panel">
            <View style={{ padding: 16 }}>
              <ThemedText style={styles.sectionTitle}>Joyride Reviews</ThemedText>
              <View style={styles.statsContainer}>
                <GlassCard style={[styles.statCard, styles.statCardPrimary]} variant="glass-panel">
                  <View style={styles.statCardContent}>
                    <ThemedText style={styles.statLabel}>Total</ThemedText>
                    <ThemedText style={styles.statValue}>{joyrideStats.totalReviews}</ThemedText>
                  </View>
                </GlassCard>
                <GlassCard style={[styles.statCard, styles.statCardSuccess]} variant="glass-panel">
                  <View style={styles.statCardContent}>
                    <ThemedText style={styles.statLabel}>Avg Rating</ThemedText>
                    <ThemedText style={styles.statValue}>{joyrideStats.averageRating.toFixed(1)} ⭐</ThemedText>
                  </View>
                </GlassCard>
                <GlassCard style={[styles.statCard, styles.statCardInfo]} variant="glass-panel">
                  <View style={styles.statCardContent}>
                    <ThemedText style={styles.statLabel}>This Month</ThemedText>
                    <ThemedText style={styles.statValue}>{joyrideStats.thisMonth}</ThemedText>
                  </View>
                </GlassCard>
                <GlassCard style={[styles.statCard, styles.statCardInfo]} variant="glass-panel">
                  <View style={styles.statCardContent}>
                    <ThemedText style={styles.statLabel}>Avg Suggested Price (USD)</ThemedText>
                    <ThemedText style={styles.statValue}>
                      {joyrideStats.averagePrice > 0 ? `$${joyrideStats.averagePrice.toFixed(0)}` : '—'}
                    </ThemedText>
                  </View>
                </GlassCard>
                <GlassCard style={[styles.statCard, styles.statCardInfo]} variant="glass-panel">
                  <View style={styles.statCardContent}>
                    <ThemedText style={styles.statLabel}>Avg Cost Estimate (USD M)</ThemedText>
                    <ThemedText style={styles.statValue}>
                      {joyrideStats.averageSimulatorEstimate > 0 ? `${joyrideStats.averageSimulatorEstimate.toFixed(1)}M` : '—'}
                    </ThemedText>
                  </View>
                </GlassCard>
              </View>
            </View>
          </GlassCard>
        )}

        {/* Rating Distribution - Only show for Professional filter */}
        {reviewTypeFilter === 'professional' && professionalStats.totalReviews > 0 && (
          <GlassCard style={styles.sectionCard} variant="glass-panel">
            <View style={{ padding: 16 }}>
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
            </View>
          </GlassCard>
        )}

        {/* Rating Distribution - Joyride */}
        {reviewTypeFilter === 'joyride' && joyrideStats.totalReviews > 0 && (
          <GlassCard style={styles.sectionCard} variant="glass-panel">
            <View style={{ padding: 16 }}>
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
            </View>
          </GlassCard>
        )}

        {/* Category Performance - Only show for Professional filter */}
        {reviewTypeFilter === 'professional' && professionalStats.totalReviews > 0 && (
          <GlassCard style={styles.sectionCard} variant="glass-panel">
            <View style={{ padding: 16 }}>
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
            </View>
          </GlassCard>
        )}

        {/* Category Performance - Joyride */}
        {reviewTypeFilter === 'joyride' && joyrideStats.totalReviews > 0 && (
          <GlassCard style={styles.sectionCard} variant="glass-panel">
            <View style={{ padding: 16 }}>
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
            </View>
          </GlassCard>
        )}

        {/* Top Nationalities - Only show for Professional filter */}
        {reviewTypeFilter === 'professional' && professionalStats.topNationalities.length > 0 && (
          <GlassCard style={styles.sectionCard} variant="glass-panel">
            <View style={{ padding: 16 }}>
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
            </View>
          </GlassCard>
        )}

        {/* Experience Stats - Only show for Professional filter */}
        {reviewTypeFilter === 'professional' && professionalStats.totalReviews > 0 && (
          <View style={styles.experienceStatsContainer}>
            <GlassCard style={[styles.experienceCard, styles.experienceCardSim]} variant="glass-panel">
              <View style={styles.experienceCardContent}>
                <ThemedText style={styles.experienceLabel}>Simulator Experience (Professional)</ThemedText>
                <ThemedText style={styles.experienceValue}>
                  {professionalStats.hasExperience.simulator} / {professionalStats.totalReviews}
                </ThemedText>
                <ThemedText style={styles.experiencePercentage}>
                  {professionalStats.totalReviews > 0 
                    ? `${Math.round((professionalStats.hasExperience.simulator / professionalStats.totalReviews) * 100)}%`
                    : '0%'
                  }
                </ThemedText>
              </View>
            </GlassCard>

            <GlassCard style={[styles.experienceCard, styles.experienceCardFly]} variant="glass-panel">
              <View style={styles.experienceCardContent}>
                <ThemedText style={styles.experienceLabel}>Flying Experience (Professional)</ThemedText>
                <ThemedText style={styles.experienceValue}>
                  {professionalStats.hasExperience.flying} / {professionalStats.totalReviews}
                </ThemedText>
                <ThemedText style={styles.experiencePercentage}>
                  {professionalStats.totalReviews > 0 
                    ? `${Math.round((professionalStats.hasExperience.flying / professionalStats.totalReviews) * 100)}%`
                    : '0%'
                  }
                </ThemedText>
              </View>
            </GlassCard>
          </View>
        )}

        {/* Content Stats - Only show when All is selected */}
        {reviewTypeFilter === 'all' && (
          <View style={styles.contentStatsContainer}>
            <GlassCard style={styles.contentStatCard} variant="glass-panel">
              <View style={styles.contentStatContent}>
                <ThemedText style={styles.contentStatIcon}>📸</ThemedText>
                <ThemedText style={styles.contentStatLabel}>Photos (All)</ThemedText>
                <ThemedText style={styles.contentStatValue}>{stats.withPhotos}</ThemedText>
              </View>
            </GlassCard>

            <GlassCard style={styles.contentStatCard} variant="glass-panel">
              <View style={styles.contentStatContent}>
                <ThemedText style={styles.contentStatIcon}>📝</ThemedText>
                <ThemedText style={styles.contentStatLabel}>Handwritten (All)</ThemedText>
                <ThemedText style={styles.contentStatValue}>{stats.withHandwriting}</ThemedText>
              </View>
            </GlassCard>
          </View>
        )}
        
        {/* Professional Content Stats - Show when All or Professional selected */}
        {(reviewTypeFilter === 'all' || reviewTypeFilter === 'professional') && professionalStats.totalReviews > 0 && (
          <View style={styles.contentStatsContainer}>
            <GlassCard style={styles.contentStatCard} variant="glass-panel">
              <View style={styles.contentStatContent}>
                <ThemedText style={styles.contentStatIcon}>📸</ThemedText>
                <ThemedText style={styles.contentStatLabel}>Photos (Professional)</ThemedText>
                <ThemedText style={styles.contentStatValue}>{professionalStats.withPhotos}</ThemedText>
              </View>
            </GlassCard>

            <GlassCard style={styles.contentStatCard} variant="glass-panel">
              <View style={styles.contentStatContent}>
                <ThemedText style={styles.contentStatIcon}>📝</ThemedText>
                <ThemedText style={styles.contentStatLabel}>Handwritten (Professional)</ThemedText>
                <ThemedText style={styles.contentStatValue}>{professionalStats.withHandwriting}</ThemedText>
              </View>
            </GlassCard>
          </View>
        )}
        
        {/* Joyride Content Stats - Show when All or Joyride selected */}
        {(reviewTypeFilter === 'all' || reviewTypeFilter === 'joyride') && joyrideStats.totalReviews > 0 && (
          <View style={styles.contentStatsContainer}>
            <GlassCard style={styles.contentStatCard} variant="glass-panel">
              <View style={styles.contentStatContent}>
                <ThemedText style={styles.contentStatIcon}>📸</ThemedText>
                <ThemedText style={styles.contentStatLabel}>Photos (Joyride)</ThemedText>
                <ThemedText style={styles.contentStatValue}>{joyrideStats.withPhotos}</ThemedText>
              </View>
            </GlassCard>

            <GlassCard style={styles.contentStatCard} variant="glass-panel">
              <View style={styles.contentStatContent}>
                <ThemedText style={styles.contentStatIcon}>📝</ThemedText>
                <ThemedText style={styles.contentStatLabel}>Handwritten (Joyride)</ThemedText>
                <ThemedText style={styles.contentStatValue}>{joyrideStats.withHandwriting}</ThemedText>
              </View>
            </GlassCard>

            <GlassCard style={styles.contentStatCard} variant="glass-panel">
              <View style={styles.contentStatContent}>
                <ThemedText style={styles.contentStatIcon}>💲</ThemedText>
                <ThemedText style={styles.contentStatLabel}>Avg Suggested Price (USD)</ThemedText>
                <ThemedText style={styles.contentStatValue}>
                  {joyrideStats.averagePrice > 0 ? `$${joyrideStats.averagePrice.toFixed(0)}` : '—'}
                </ThemedText>
              </View>
            </GlassCard>

            <GlassCard style={styles.contentStatCard} variant="glass-panel">
              <View style={styles.contentStatContent}>
                <ThemedText style={styles.contentStatIcon}>🏷️</ThemedText>
                <ThemedText style={styles.contentStatLabel}>Avg Cost Estimate (USD M)</ThemedText>
                <ThemedText style={styles.contentStatValue}>
                  {joyrideStats.averageSimulatorEstimate > 0 ? `${joyrideStats.averageSimulatorEstimate.toFixed(1)}M` : '—'}
                </ThemedText>
              </View>
            </GlassCard>
          </View>
        )}

        <Button
          mode="outlined"
          onPress={() => router.back()}
          style={styles.backButton}
          icon="arrow-left"
        >
          Back to Home
        </Button>

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
    flexWrap: 'wrap', // Allow wrapping on very small screens
    gap: rs(10),
  },
  headerContent: {
    flex: 1,
    minWidth: '50%', // Ensure it takes space but allows wrapping
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
  },
  title: {
    fontSize: rf(24),
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: rf(14),
    opacity: 0.7,
  },
  filterButton: {
    marginRight: rs(5),
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp('2%'),
    gap: wp('2%'),
    flexWrap: 'wrap', // Allow wrapping
  },
  statCard: {
    flex: 1,
    backgroundColor: cardBackgroundColor,
    minWidth: wp('28%'), // Ensure minimum width for 3-column layout, but allows wrapping if needed
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
    padding: rs(10),
  },
  statLabel: {
    fontSize: rf(12),
    opacity: 0.7,
    textAlign: 'center',
  },
  statValue: {
    fontSize: rf(20),
    fontWeight: 'bold',
    marginVertical: hp('0.5%'),
  },
  statIcon: {
    fontSize: rf(18),
  },
  statTrend: {
    fontSize: rf(10),
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
    fontSize: rf(18),
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
    minWidth: 40,
  },
  distributionRating: {
    fontSize: rf(14),
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
    minWidth: 30,
    textAlign: 'right',
    fontSize: rf(14),
  },
  categoryContainer: {
    gap: hp('1.5%'),
  },
  categoryRow: {
    gap: hp('0.5%'),
  },
  categoryLabel: {
    fontSize: rf(14),
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
    minWidth: 30,
    textAlign: 'right',
    fontWeight: 'bold',
    fontSize: rf(14),
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
    fontSize: rf(14),
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
    minWidth: 30,
    textAlign: 'right',
    fontWeight: 'bold',
    fontSize: rf(14),
  },
  experienceStatsContainer: {
    flexDirection: 'row',
    gap: wp('2%'),
    marginBottom: hp('2%'),
    flexWrap: 'wrap',
  },
  experienceCard: {
    flex: 1,
    backgroundColor: cardBackgroundColor,
    minWidth: wp('40%'),
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
    padding: rs(12),
  },
  experienceLabel: {
    fontSize: rf(12),
    textAlign: 'center',
    marginBottom: hp('0.5%'),
    opacity: 0.8,
  },
  experienceValue: {
    fontSize: rf(20),
    fontWeight: 'bold',
  },
  experiencePercentage: {
    fontSize: rf(12),
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
    minWidth: '45%', // Keeps 2 columns on most screens
    backgroundColor: cardBackgroundColor,
  },
  contentStatContent: {
    alignItems: 'center',
    padding: rs(12),
  },
  contentStatIcon: {
    fontSize: rf(24),
    marginBottom: hp('0.5%'),
  },
  contentStatLabel: {
    fontSize: rf(12),
    textAlign: 'center',
    opacity: 0.7,
  },
  contentStatValue: {
    fontSize: rf(20),
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
  backButton: {
    marginTop: hp('2%'),
    marginBottom: hp('4%'),
  },
});


