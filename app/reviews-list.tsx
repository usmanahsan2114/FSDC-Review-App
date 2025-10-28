import { NoReviewsEmptyState, NoSearchResultsEmptyState } from '@/components/EmptyState';
import { ReviewListSkeleton } from '@/components/SkeletonLoader';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, ListRenderItem, RefreshControl, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Divider, Menu, TextInput } from 'react-native-paper';
import StarRating from 'react-native-star-rating-widget';
import { deleteReview, getAllReviews, initializeDataStorage, Review } from '../utils/dataStorage';
import { hapticsButtonPress, hapticsDelete, hapticsFilterSelect } from '../utils/haptics';
import { getDevicePadding, hp, isTablet, minTouchTarget, rf, rs, wp } from '../utils/responsive';

interface RatingCategory {
  key: string;
  title: string;
  description: string;
}

const defaultRatingCategories: RatingCategory[] = [
  { key: 'generalFlying', title: 'General Flying / Handling Characteristics', description: 'How realistic are the aircraft controls and flight dynamics?' },
  { key: 'emergencyProcedures', title: 'Emergency Procedures', description: 'How well does the simulator handle emergency scenarios?' },
  { key: 'instrumentFlying', title: 'Instrument Flying System Integration', description: 'How accurate and functional are the aircraft instruments?' },
  { key: 'visualEffects', title: 'Visual Effects Take-Off & Landing', description: 'How realistic are the visual effects during critical phases?' },
  { key: 'fidelityRealism', title: 'Characteristics Fidelity & Realism', description: 'Overall realism and attention to detail in the simulation' },
  { key: 'simulatorPerformance', title: 'Simulator Performance', description: 'Technical performance, frame rate, and system stability' },
];

interface PersonalInfoField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'multiline' | 'autocomplete';
  required: boolean;
  options?: string[];
}

const defaultPersonalInfoFields: PersonalInfoField[] = [
  { key: 'fullName', label: 'Full Name', type: 'text', required: true },
  { key: 'nationality', label: 'Nationality', type: 'autocomplete', required: true, options: [] },
  { key: 'profession', label: 'Profession / Industry', type: 'autocomplete', required: true, options: [] },
  { key: 'previousSimulatorExperience', label: 'Previous Simulator Experience', type: 'multiline', required: true },
  { key: 'previousFlyingExperience', label: 'Previous Flying Experience', type: 'multiline', required: true },
  { key: 'contact', label: 'Contact Information', type: 'text', required: false },
];

function ReviewsListScreen() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [personalInfoFields, setPersonalInfoFields] = useState<PersonalInfoField[]>(defaultPersonalInfoFields);
  const [ratingCategories, setRatingCategories] = useState<RatingCategory[]>(defaultRatingCategories);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string | 'overall'>('overall');
  const [menuVisible, setMenuVisible] = useState(false);
  const [sortOption, setSortOption] = useState<'dateDesc' | 'dateAsc' | 'ratingDesc' | 'ratingAsc' | 'nameAsc' | 'nameDesc'>('dateDesc');
  const [filterMinRating, setFilterMinRating] = useState<number>(0);
  const [filterHasPhotos, setFilterHasPhotos] = useState(false);
  const [filterHasHandwriting, setFilterHasHandwriting] = useState(false);
  const [avgMenuVisible, setAvgMenuVisible] = useState(false);

  const { isDark } = useTheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackgroundColor = useThemeColor({ light: '#FFFFFF', dark: '#1E1E1E' }, 'background');
  const borderColor = useThemeColor({ light: '#E0E0E0', dark: '#404040' }, 'text');
  
  // Memoized styles based on theme
  const styles = useMemo(() => createStyles(isDark, cardBackgroundColor, borderColor), [isDark, cardBackgroundColor, borderColor]);

  useEffect(() => {
    loadReviews();
    loadPersonalInfoFields();
    loadRatingCategories();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      // Initialize storage system
      await initializeDataStorage();
      const allReviews = await getAllReviews();
      setReviews(allReviews);
    } catch (error) {
      console.error('Error loading reviews:', error);
      Alert.alert('Error', 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const loadPersonalInfoFields = async () => {
    try {
      const stored = await AsyncStorage.getItem('personalInfoFields');
      if (stored) {
        setPersonalInfoFields(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading personal info fields:', error);
    }
  };

  const loadRatingCategories = async () => {
    try {
      const stored = await AsyncStorage.getItem('ratingCategories');
      if (stored) {
        setRatingCategories(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading rating categories:', error);
    }
  };

  const handleDeleteReview = useCallback(async (reviewId: string) => {
    hapticsButtonPress();
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete this review? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => hapticsButtonPress() },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              hapticsDelete();
              await deleteReview(reviewId);
              await loadReviews();
              Alert.alert('Success', 'Review deleted successfully');
            } catch (error) {
              console.error('Error deleting review:', error);
              Alert.alert('Error', 'Failed to delete review');
            }
          },
        },
      ]
    );
  }, []);

  const handleViewDetail = useCallback((review: Review) => {
    router.push({
      pathname: '/review-detail',
      params: { reviewData: JSON.stringify(review) }
    });
  }, []);

  const handleGoBack = useCallback(() => {
    router.back();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadReviews();
    setRefreshing(false);
  }, [loadReviews]);

  const getPersonalInfoValue = useCallback((review: Review, key: string): string => {
    // Map field keys to Review interface properties
    const keyMapping: { [key: string]: keyof Review['personalInfo'] } = {
      'fullName': 'name',
      'nationality': 'nationality',
      'profession': 'profession',
      'contact': 'email'
    };
    
    const mappedKey = keyMapping[key] || key as keyof Review['personalInfo'];
    return review.personalInfo?.[mappedKey] || '';
  }, []);

  const calculateAverageRating = useCallback((ratings: { [key: string]: number }): number => {
    const values = Object.values(ratings).filter(rating => rating > 0);
    if (values.length === 0) return 0;
    return values.reduce((sum, rating) => sum + rating, 0) / values.length;
  }, []);

  const overallAverageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const totalRating = reviews.reduce((sum, review) => {
      return sum + calculateAverageRating(review.ratings);
    }, 0);
    return totalRating / reviews.length;
  }, [reviews, calculateAverageRating]);

  // Label for current sort option (for UI)
  const sortLabel = useMemo(() => {
    switch (sortOption) {
      case 'dateDesc': return 'Date (Newest)';
      case 'dateAsc': return 'Date (Oldest)';
      case 'ratingDesc': return 'Rating (High → Low)';
      case 'ratingAsc': return 'Rating (Low → High)';
      case 'nameAsc': return 'Name (A → Z)';
      case 'nameDesc': return 'Name (Z → A)';
      default: return 'Date (Newest)';
    }
  }, [sortOption]);

  // Derived filtered/sorted reviews (must be above any conditional returns)
  const filteredReviews = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = reviews;

    // Search filter
    if (q) {
      list = list.filter(r => {
        const pi = r.personalInfo || {};
        const fields = Object.values(pi).join(' ').toLowerCase();
        const text = (r.textComment || '').toLowerCase();
        return fields.includes(q) || text.includes(q);
      });
    }

    // Rating threshold filter (overall)
    if (filterMinRating > 0) {
      list = list.filter(r => calculateAverageRating(r.ratings) >= filterMinRating);
    }

    // Photos filter
    if (filterHasPhotos) {
      list = list.filter(r => r.photos && r.photos.length > 0);
    }

    // Handwritten comment filter
    if (filterHasHandwriting) {
      list = list.filter(r => !!r.handwrittenComment);
    }

    // Sort
    const sorted = [...list].sort((a, b) => {
      switch (sortOption) {
        case 'dateDesc':
          return b.timestamp - a.timestamp;
        case 'dateAsc':
          return a.timestamp - b.timestamp;
        case 'ratingDesc':
          return calculateAverageRating(b.ratings) - calculateAverageRating(a.ratings);
        case 'ratingAsc':
          return calculateAverageRating(a.ratings) - calculateAverageRating(b.ratings);
        case 'nameAsc':
          return (a.personalInfo.name || '').localeCompare(b.personalInfo.name || '');
        case 'nameDesc':
          return (b.personalInfo.name || '').localeCompare(a.personalInfo.name || '');
        default:
          return 0;
      }
    });

    return sorted;
  }, [reviews, searchQuery, sortOption, filterMinRating, filterHasPhotos, filterHasHandwriting, calculateAverageRating]);

  // Average to display in header section based on dropdown selection
  const { displayAverage, displayCount } = useMemo(() => {
    if (filteredReviews.length === 0) return { displayAverage: 0, displayCount: 0 };
    if (selectedCategoryKey === 'overall') {
      const total = filteredReviews.reduce((sum, r) => sum + calculateAverageRating(r.ratings), 0);
      return { displayAverage: total / filteredReviews.length, displayCount: filteredReviews.length };
    }
    const values = filteredReviews
      .map(r => r.ratings[selectedCategoryKey] || 0)
      .filter(v => v > 0);
    if (values.length === 0) return { displayAverage: 0, displayCount: 0 };
    const avg = values.reduce((s, v) => s + v, 0) / values.length;
    return { displayAverage: avg, displayCount: values.length };
  }, [filteredReviews, selectedCategoryKey, calculateAverageRating]);

  // Close average dropdown if the section disappears (prevents stuck state)
  useEffect(() => {
    if (filteredReviews.length === 0 && avgMenuVisible) {
      setAvgMenuVisible(false);
    }
  }, [filteredReviews.length, avgMenuVisible]);

  // Memoized ReviewCard component for FlatList performance
  const ReviewCard = React.memo(({ review }: { review: Review }) => {
    const reviewRating = useMemo(() => calculateAverageRating(review.ratings), [review.ratings]);
    const reviewerName = useMemo(() => getPersonalInfoValue(review, 'fullName'), [review]);
    const reviewDate = useMemo(() => new Date(review.timestamp).toLocaleDateString(), [review.timestamp]);
    const nationality = useMemo(() => getPersonalInfoValue(review, 'nationality'), [review]);
    const profession = useMemo(() => getPersonalInfoValue(review, 'profession'), [review]);
    const simExperience = useMemo(() => getPersonalInfoValue(review, 'previousSimulatorExperience'), [review]);
    const flyingExperience = useMemo(() => getPersonalInfoValue(review, 'previousFlyingExperience'), [review]);
    
    return (
      <Card style={styles.reviewCard}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <ThemedText type="subtitle" style={styles.reviewerName}>
              {reviewerName}
            </ThemedText>
            <ThemedText style={styles.submittedDate}>
              {reviewDate}
            </ThemedText>
          </View>

          <View style={styles.reviewInfo}>
            {nationality && (
              <Chip style={styles.chip} textStyle={styles.chipText}>
                {nationality}
              </Chip>
            )}
            {profession && (
              <Chip style={styles.chip} textStyle={styles.chipText}>
                {profession}
              </Chip>
            )}
          </View>

          {/* Experience Row */}
          <View style={styles.experienceRow}>
            {simExperience && (
              <View style={styles.experienceItem}>
                <ThemedText style={styles.experienceLabel}>Simulator:</ThemedText>
                <Chip 
                  style={[styles.experienceChip, simExperience.toLowerCase() === 'yes' ? styles.chipYes : styles.chipNo]}
                  textStyle={styles.chipText}
                >
                  {simExperience}
                </Chip>
              </View>
            )}
            {flyingExperience && (
              <View style={styles.experienceItem}>
                <ThemedText style={styles.experienceLabel}>Flying:</ThemedText>
                <Chip 
                  style={[styles.experienceChip, flyingExperience.toLowerCase() === 'yes' ? styles.chipYes : styles.chipNo]}
                  textStyle={styles.chipText}
                >
                  {flyingExperience}
                </Chip>
              </View>
            )}
          </View>

          {/* Overall Rating */}
          <View style={styles.cardOverallRatingContainer}>
            <ThemedText style={styles.overallRatingLabel}>Overall Rating:</ThemedText>
            <View style={styles.overallRatingDisplay}>
              <StarRating
                rating={reviewRating}
                onChange={() => {}}
                starSize={wp('4%')}
                color="#FFD700"
                emptyColor={isDark ? '#404040' : '#E0E0E0'}
                enableHalfStar={false}
              />
              <ThemedText style={styles.overallRatingText}>
                {reviewRating.toFixed(1)}/5.0
              </ThemedText>
            </View>
          </View>

          {/* Comments Preview */}
          {review.textComment && (
            <View style={styles.commentsContainer}>
              <ThemedText style={styles.commentsLabel}>Comment:</ThemedText>
              <ThemedText style={styles.comments} numberOfLines={2}>
                {review.textComment}
              </ThemedText>
            </View>
          )}

          {/* Handwritten and Photos Status */}
          <View style={styles.additionalInfo}>
            <View style={styles.statusItem}>
              <ThemedText style={styles.statusLabel}>Handwritten:</ThemedText>
              <Chip 
                style={[styles.statusChip, review.handwrittenComment ? styles.statusYes : styles.statusNo]}
                textStyle={styles.statusChipText}
              >
                {review.handwrittenComment ? 'Yes' : 'No'}
              </Chip>
            </View>
            <View style={styles.statusItem}>
              <ThemedText style={styles.statusLabel}>Photos:</ThemedText>
              <Chip 
                style={[styles.statusChip, review.photos && review.photos.length > 0 ? styles.statusYes : styles.statusNo]}
                textStyle={styles.statusChipText}
              >
                {review.photos && review.photos.length > 0 ? 'Yes' : 'No'}
              </Chip>
            </View>
          </View>

          <View style={styles.cardActions}>
            <Button
              mode="contained"
              onPress={() => handleViewDetail(review)}
              style={styles.actionButton}
              accessibilityLabel={`View details for review by ${reviewerName}`}
              accessibilityHint="Opens detailed view of this review"
              accessibilityRole="button"
            >
              View Details
            </Button>
            <Button
              mode="outlined"
              onPress={() => handleDeleteReview(review.id)}
              style={styles.deleteButton}
              textColor="#d32f2f"
              accessibilityLabel={`Delete review by ${reviewerName}`}
              accessibilityHint="Permanently removes this review"
              accessibilityRole="button"
            >
              Delete
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  }, (prevProps, nextProps) => {
    // Custom comparison function for better memoization
    return prevProps.review.id === nextProps.review.id && 
           prevProps.review.timestamp === nextProps.review.timestamp;
  });

  const renderReviewItem: ListRenderItem<Review> = useCallback(({ item }) => (
    <ReviewCard review={item} />
  ), [getPersonalInfoValue, calculateAverageRating, personalInfoFields, ratingCategories, handleViewDetail, handleDeleteReview]);

  const keyExtractor = useCallback((item: Review) => item.id, []);

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setFilterMinRating(0);
    setFilterHasPhotos(false);
    setFilterHasHandwriting(false);
    setSortOption('dateDesc');
    hapticsButtonPress();
  }, []);

  const hasActiveFilters = searchQuery || filterMinRating > 0 || filterHasPhotos || filterHasHandwriting;

  const ListEmptyComponent = useMemo(() => {
    if (reviews.length === 0) {
      return <NoReviewsEmptyState onAddReview={() => router.push('/add-review')} />;
    }
    if (hasActiveFilters) {
      return <NoSearchResultsEmptyState onClearFilters={clearAllFilters} />;
    }
    return (
      <View style={styles.emptyState}>
        <ThemedText style={styles.emptyText}>
          No reviews yet. Add your first review!
        </ThemedText>
        <Button
          mode="contained"
          onPress={() => router.push('/add-review')}
          style={styles.addButton}
        >
          Add Review
        </Button>
      </View>
    );
  }, [reviews.length, hasActiveFilters, clearAllFilters]);

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerTitles}>
              <ThemedText style={styles.title}>Reviews</ThemedText>
              <ThemedText style={styles.subtitle}>Loading...</ThemedText>
            </View>
            <ThemeToggle />
          </View>
        </View>
        <ReviewListSkeleton count={5} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitles}>
            <ThemedText style={styles.title}>Reviews</ThemedText>
            <ThemedText style={styles.subtitle}>
              {filteredReviews.length} review{filteredReviews.length !== 1 ? 's' : ''} found
            </ThemedText>
          </View>
          <ThemeToggle />
        </View>
        
        {/* Search, sort and filter controls */}
        <View style={styles.controlsRow}>
          <TextInput
            mode="outlined"
            placeholder="Search by name, profession, nationality, comments"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          <Menu
            key={`sort-menu-${menuVisible}`}
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Button 
                mode="outlined" 
                onPress={() => setMenuVisible(!menuVisible)} 
                style={styles.menuAnchorButton} 
                contentStyle={{ minHeight: minTouchTarget }}
              >
                Sort by: {sortLabel}
              </Button>
            }
          >
            <Menu.Item onPress={() => { setSortOption('dateDesc'); setMenuVisible(false); }} title="Date (Newest)" />
            <Menu.Item onPress={() => { setSortOption('dateAsc'); setMenuVisible(false); }} title="Date (Oldest)" />
            <Divider />
            <Menu.Item onPress={() => { setSortOption('ratingDesc'); setMenuVisible(false); }} title="Rating (High → Low)" />
            <Menu.Item onPress={() => { setSortOption('ratingAsc'); setMenuVisible(false); }} title="Rating (Low → High)" />
            <Divider />
            <Menu.Item onPress={() => { setSortOption('nameAsc'); setMenuVisible(false); }} title="Name (A → Z)" />
            <Menu.Item onPress={() => { setSortOption('nameDesc'); setMenuVisible(false); }} title="Name (Z → A)" />
          </Menu>
        </View>

        <View style={styles.filtersRow}>
          <TextInput
            mode="outlined"
            label="Min rating (0-5)"
            placeholder="e.g. 3"
            keyboardType="numeric"
            value={filterMinRating > 0 ? String(filterMinRating) : ''}
            onChangeText={(text) => {
              const num = parseFloat(text);
              if (isNaN(num)) { setFilterMinRating(0); return; }
              const clamped = Math.max(0, Math.min(5, num));
              setFilterMinRating(clamped);
            }}
            style={{ flex: 1 }}
          />
          <Chip
            selected={filterHasPhotos}
            onPress={() => {
              hapticsFilterSelect();
              setFilterHasPhotos(prev => !prev);
            }}
            icon="image-outline"
            style={[styles.filterChip, filterHasPhotos && styles.filterChipSelected]}
            textStyle={[styles.chipText, filterHasPhotos && styles.filterChipTextSelected]}
          >
            Photos
          </Chip>
          <Chip
            selected={filterHasHandwriting}
            onPress={() => {
              hapticsFilterSelect();
              setFilterHasHandwriting(prev => !prev);
            }}
            icon="pen"
            style={[styles.filterChip, filterHasHandwriting && styles.filterChipSelected]}
            textStyle={[styles.chipText, filterHasHandwriting && styles.filterChipTextSelected]}
          >
            Handwritten
          </Chip>
        </View>

        {filteredReviews.length > 0 && (
          <View style={styles.overallAverageContainer}>
            <View style={styles.overallHeaderRow}>
              <ThemedText style={styles.overallAverageLabel}>Average Rating</ThemedText>
              <Menu
                key={`avg-menu-${avgMenuVisible}`}
                visible={avgMenuVisible}
                onDismiss={() => setAvgMenuVisible(false)}
                anchor={
                  <Button 
                    mode="outlined" 
                    onPress={() => setAvgMenuVisible(!avgMenuVisible)} 
                    style={styles.menuAnchorButton} 
                    contentStyle={{ minHeight: minTouchTarget }}
                  >
                    Showing: {selectedCategoryKey === 'overall' ? 'Overall' : (ratingCategories.find(rc => rc.key === selectedCategoryKey)?.title || 'Category')}
                  </Button>
                }
              >
                <Menu.Item onPress={() => { setSelectedCategoryKey('overall'); setAvgMenuVisible(false); }} title="Overall" />
                <Divider />
                {ratingCategories.map(rc => (
                  <Menu.Item key={rc.key} onPress={() => { setSelectedCategoryKey(rc.key); setAvgMenuVisible(false); }} title={rc.title} />
                ))}
              </Menu>
            </View>
            <View style={styles.overallAverageDisplay}>
              <StarRating
                rating={displayAverage}
                onChange={() => {}}
                starSize={wp('5%')}
                color="#FFD700"
                emptyColor="#E0E0E0"
                enableHalfStar={true}
              />
              <ThemedText style={styles.overallAverageText}>
                {displayAverage.toFixed(1)}/5.0
              </ThemedText>
              <ThemedText style={styles.overallAverageSubtext}>
                Based on {displayCount} review{displayCount !== 1 ? 's' : ''}
              </ThemedText>
            </View>
          </View>
        )}
      </View>



      <FlatList
        data={filteredReviews}
        renderItem={renderReviewItem}
        keyExtractor={keyExtractor}
        ListEmptyComponent={ListEmptyComponent}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={filteredReviews.length === 0 ? styles.emptyContainer : undefined}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={5}
        windowSize={10}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? '#FFFFFF' : '#000000'}
            colors={['#2196F3']}
          />
        }
        // Removing inaccurate fixed getItemLayout to avoid jumpy virtualization
        accessibilityLabel="Reviews list"
        accessibilityHint="Pull down to refresh. Scrollable list of all reviews"
        accessibilityRole="list"
      />

      <View style={styles.bottomActions}>
        <Button
          mode="outlined"
          onPress={handleGoBack}
          style={styles.backButton}
        >
          Back to Home
        </Button>
      </View>
    </ThemedView>
  );
}

// Export with React.memo for performance optimization
export default React.memo(ReviewsListScreen);

const createStyles = (isDark: boolean, cardBackgroundColor: string, borderColor: string) => StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: hp(isTablet ? 3 : 5),
  },
  header: {
    paddingHorizontal: getDevicePadding().horizontal,
    paddingBottom: rs(8), // Reduced from getDevicePadding().vertical
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8), // Reduced from 12
    marginBottom: rs(4), // Reduced from 8
  },
  headerTitles: {
    flex: 1,
  },

  title: {
    fontSize: rf(isTablet ? 22 : 20), // Reduced from 28:24
    fontWeight: 'bold',
    marginBottom: rs(2), // Reduced from 8
    textAlign: 'center',
    flexShrink: 1,
    paddingHorizontal: wp('2%'),
  },
  subtitle: {
    fontSize: rf(14), // Reduced from 16
    textAlign: 'center',
    opacity: 0.7,
  },
  overallAverageContainer: {
    marginTop: hp('1%'), // Reduced from 2%
    paddingVertical: hp('1%'), // Reduced from 2%
    paddingHorizontal: wp('3%'), // Reduced from 4%
    backgroundColor: isDark ? '#2A2A2A' : '#f8f9fa',
    borderRadius: rs(12), // Reduced from wp('3%')
    borderWidth: 1,
    borderColor: borderColor,
    alignItems: 'center',
    width: '100%',
    overflow: 'visible',
  },
  overallHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: rs(12),
    marginBottom: rs(8),
  },
  overallAverageLabel: {
    fontSize: rf(15), // Reduced from 18
    fontWeight: '600',
    marginBottom: rs(4), // Reduced
    color: isDark ? '#FFFFFF' : '#333',
  },
  overallAverageDisplay: {
    alignItems: 'center',
    gap: rs(4), // Reduced
  },
  overallAverageText: {
    fontSize: rf(18), // Reduced from 20
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: rs(2), // Reduced
    textAlign: 'center',
    flexShrink: 1,
  },
  overallAverageSubtext: {
    fontSize: wp('3.5%'),
    opacity: 0.7,
    marginTop: hp('0.5%'),
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: wp('5%'),
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: rs(12),
    marginTop: rs(8),
    marginBottom: rs(8),
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: rs(12),
    marginBottom: rs(8),
  },
  searchInput: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp('10%'),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: wp('4.5%'),
    textAlign: 'center',
    marginBottom: hp('3%'),
    opacity: 0.7,
  },
  addButton: {
    borderRadius: rs(12),
    minHeight: minTouchTarget,
  },
  reviewCard: {
    marginBottom: rs(16),
    borderRadius: rs(12),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp('1%'),
  },
  reviewerName: {
    fontSize: rf(18),
    fontWeight: 'bold',
    flex: 1,
    flexShrink: 1,
    paddingRight: wp('2%'),
  },
  submittedDate: {
    fontSize: wp('3%'),
    opacity: 0.6,
    marginLeft: wp('2%'),
  },
  reviewInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp('2%'),
    marginBottom: hp('1.5%'),
  },
  chip: {
    backgroundColor: isDark ? '#1E3A5F' : '#e3f2fd',
  },
  chipText: {
    fontSize: wp('3%'),
    color: isDark ? '#90CAF9' : '#1976d2',
  },
  chipYes: {
    backgroundColor: isDark ? '#1B4D1B' : '#E8F5E8',
  },
  chipNo: {
    backgroundColor: isDark ? '#4D3D1B' : '#FFF3E0',
  },
  experienceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp('2%'),
    marginBottom: hp('1.5%'),
  },
  experienceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1%'),
  },
  experienceLabel: {
    fontSize: wp('3%'),
    fontWeight: '500',
  },
  experienceChip: {
    minHeight: hp('3%'),
  },
  cardOverallRatingContainer: {
    marginBottom: hp('1.5%'),
    paddingVertical: hp('1%'),
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: borderColor,
  },
  overallRatingLabel: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    marginBottom: hp('0.5%'),
  },
  overallRatingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
  },
  overallRatingText: {
    fontSize: rf(16),
    fontWeight: '600',
    color: '#FFD700',
    textAlign: 'center',
    flexShrink: 1,
  },
  commentsContainer: {
    marginBottom: hp('1.5%'),
  },
  commentsLabel: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    marginBottom: hp('0.5%'),
  },
  comments: {
    fontSize: wp('3.5%'),
    fontStyle: 'italic',
    opacity: 0.8,
    lineHeight: wp('5%'),
    padding: wp('2%'),
    backgroundColor: isDark ? '#3A3A3A' : '#f5f5f5', // Lighter background in dark mode for better visibility
    borderRadius: wp('1%'),
    borderLeftWidth: 2,
    borderLeftColor: isDark ? '#90CAF9' : '#1976d2',
  },
  additionalInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp('3%'),
    marginBottom: hp('1%'),
    alignItems: 'center',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1%'),
  },
  statusLabel: {
    fontSize: wp('3%'),
    fontWeight: '500',
  },
  statusChip: {
    minHeight: hp('3%'),
  },
  statusChipText: {
    fontSize: wp('2.8%'),
  },
  statusYes: {
    backgroundColor: isDark ? '#1B5E20' : '#C8E6C9',
  },
  statusNo: {
    backgroundColor: isDark ? '#4A4A4A' : '#E0E0E0',
  },
  cardActions: {
    flexDirection: 'row',
    gap: wp('3%'),
    marginTop: hp('1%'),
  },
  actionButton: {
    flex: 1,
    borderRadius: wp('2%'),
  },
  deleteButton: {
    flex: 1,
    borderRadius: wp('2%'),
    borderColor: '#d32f2f',
  },
  bottomActions: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    borderTopWidth: 1,
    borderTopColor: borderColor,
  },
  backButton: {
    borderRadius: wp('3%'),
  },
  menuAnchorButton: {
    minHeight: minTouchTarget,
  },
  filterChip: {
    minHeight: minTouchTarget,
  },
  filterChipSelected: {
    backgroundColor: isDark ? '#1976d2' : '#2196F3',
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('5%'),
  },
});