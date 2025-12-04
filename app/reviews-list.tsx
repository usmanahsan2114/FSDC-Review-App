import { ConnectivityStatus } from '@/components/ConnectivityStatus';
import { NoReviewsEmptyState, NoSearchResultsEmptyState } from '@/components/EmptyState';
import { GlassCard } from '@/components/GlassCard';
import { ReviewListSkeleton } from '@/components/SkeletonLoader';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import ThemeToggle from '@/components/ThemeToggle';
import { Simulator } from '@/constants/simulators';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  ListRenderItem,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import { Button, Chip, Divider, IconButton, Menu, Modal, Portal, TextInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StarRating from 'react-native-star-rating-widget';

import { deleteReview, getAllReviews, initializeDataStorage, Review } from '../utils/dataStorage';
import { validateAdminPin } from '../utils/deviceConfig';
import { exportToExcel } from '../utils/exportUtils';
import { hapticsButtonPress, hapticsFilterSelect } from '../utils/haptics';
import { getDevicePadding, hp, isTablet, minTouchTarget, rf, rs, wp } from '../utils/responsive';
import { getSimulators, getSimulatorTypes } from '../utils/simulatorStorage';

// ... (Keep interfaces same as before)
interface RatingCategory {
  id?: string;
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
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);
  const [reviewToEdit, setReviewToEdit] = useState<Review | null>(null);
  const [pinAction, setPinAction] = useState<'edit' | 'delete'>('delete');
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
  const [reviewTypeFilter, setReviewTypeFilter] = useState<'all' | 'professional' | 'joyride'>('all');
  const [typeFilterMenuVisible, setTypeFilterMenuVisible] = useState(false);
  const [simulatorTypeFilter, setSimulatorTypeFilter] = useState<string>('all');
  const [simulatorFilter, setSimulatorFilter] = useState<string>('all');
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [availableSimulators, setAvailableSimulators] = useState<Simulator[]>([]);
  const [simTypeMenuVisible, setSimTypeMenuVisible] = useState(false);
  const [simulatorMenuVisible, setSimulatorMenuVisible] = useState(false);
  const [ratingMenuVisible, setRatingMenuVisible] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { isDark } = useTheme();
  const { width } = useWindowDimensions();
  const numColumns = 1;
  const insets = useSafeAreaInsets();
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const accentColor = useThemeColor({}, 'accent');
  const borderColor = useThemeColor({ light: '#E0E0E0', dark: '#404040' }, 'text');
  const cardBackgroundColor = useThemeColor({ light: '#FFFFFF', dark: '#1E1E1E' }, 'background');
  
  // Memoized styles based on theme
  const styles = useMemo(() => createStyles(isDark, cardBackgroundColor, borderColor), [isDark, cardBackgroundColor, borderColor]);

  useEffect(() => {
    loadReviews();
    loadSimulatorData();
    loadPersonalInfoFields();
    loadRatingCategories();
  }, []);

  const loadSimulatorData = async () => {
    const types = await getSimulatorTypes();
    const sims = await getSimulators();
    setAvailableTypes(types);
    setAvailableSimulators(sims);
  };

  const loadReviews = async () => {
    try {
      setLoading(true);
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
        const parsed = JSON.parse(stored);
        setRatingCategories(parsed);
      } else {
        await AsyncStorage.setItem('ratingCategories', JSON.stringify(defaultRatingCategories));
        setRatingCategories(defaultRatingCategories);
      }
    } catch (error) {
      console.error('Error loading rating categories:', error);
    }
  };

  const handleViewDetail = useCallback((review: Review) => {
    router.push({
      pathname: '/review-detail',
      params: { reviewData: JSON.stringify(review) }
    });
  }, []);

  const handleDeleteReview = useCallback(async (review: Review) => {
    // 1. Prompt for PIN
    // We can't use a prompt with secure text entry easily in React Native Alert.prompt on Android (it's iOS only for secure text).
    // So we might need a custom modal or just a simple Alert if we don't care about hiding the PIN on Android (but user said "admin pin").
    // Or we can use a simple prompt and check the text.
    // Since Alert.prompt is not cross-platform for secure text, I'll use a simple approach or assume iOS/Android differences.
    // Actually, for "Admin PIN", a custom modal is better, but for speed, I'll try Alert.prompt (works on iOS, Android support varies or requires library).
    // Wait, Expo/React Native `Alert.prompt` works on Android now? No, it's still iOS only.
    // I should use a custom modal for PIN entry.
    // But to save time and complexity, I'll use a simple `Alert` confirmation first, then maybe a custom modal if I have time.
    // User said "use needs to add admin pin".
    // I'll implement a simple PIN modal state.
    
    setPinAction('delete');
    setReviewToDelete(review);
    setPinModalVisible(true);
  }, []);

  const handleEditReview = useCallback(async (review: Review) => {
    setPinAction('edit');
    setReviewToEdit(review);
    setPinModalVisible(true);
  }, []);

  const confirmPinAction = async () => {
    const isValid = await validateAdminPin(adminPin);
    if (!isValid) {
      Alert.alert('Error', 'Incorrect PIN');
      return;
    }

    if (pinAction === 'edit' && reviewToEdit) {
      // Navigate to add-review with edit data
      setPinModalVisible(false);
      setAdminPin('');
      router.push({
        pathname: '/add-review',
        params: { editData: JSON.stringify(reviewToEdit) }
      });
      setReviewToEdit(null);
      return;
    }

    // Handle delete action
    if (pinAction === 'delete' && reviewToDelete) {
      try {
        // 1. Delete from Supabase
        const { error } = await supabase.from('reviews').delete().eq('id', reviewToDelete.id);
        if (error) {
          console.error('Error deleting from Supabase:', error);
          Alert.alert('Error', 'Failed to delete from server, but will delete locally.');
        }

        // 2. Delete locally
        const success = await deleteReview(reviewToDelete.id);
        if (success) {
          setReviews(prev => prev.filter(r => r.id !== reviewToDelete.id));
          Alert.alert('Success', 'Review deleted successfully');
        } else {
          Alert.alert('Error', 'Failed to delete locally');
        }
      } catch (error) {
        console.error('Delete error:', error);
        Alert.alert('Error', 'An unexpected error occurred');
      } finally {
        setPinModalVisible(false);
        setAdminPin('');
        setReviewToDelete(null);
      }
    }
  };

  const handleGoBack = useCallback(() => {
    router.back();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadReviews();
    setRefreshing(false);
  }, [loadReviews]);

  const getPersonalInfoValue = useCallback((review: Review, key: string): string => {
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

  const filteredReviews = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = reviews;

    if (reviewTypeFilter !== 'all') {
      list = list.filter(r => (r.reviewType || 'professional') === reviewTypeFilter);
    }
    if (simulatorTypeFilter !== 'all') {
      list = list.filter(r => r.simulatorType === simulatorTypeFilter);
    }
    if (simulatorFilter !== 'all') {
      list = list.filter(r => r.simulatorName === simulatorFilter);
    }
    if (q) {
      list = list.filter(r => {
        const pi = r.personalInfo || {};
        const fields = Object.values(pi).join(' ').toLowerCase();
        const text = (r.textComment || '').toLowerCase();
        return fields.includes(q) || text.includes(q);
      });
    }
    if (filterMinRating > 0) {
      list = list.filter(r => calculateAverageRating(r.ratings) >= filterMinRating);
    }
    if (filterHasPhotos) {
      list = list.filter(r => r.photos && r.photos.length > 0);
    }
    if (filterHasHandwriting) {
      list = list.filter(r => !!r.handwrittenComment);
    }

    const sorted = [...list].sort((a, b) => {
      switch (sortOption) {
        case 'dateDesc': return b.timestamp - a.timestamp;
        case 'dateAsc': return a.timestamp - b.timestamp;
        case 'ratingDesc': return calculateAverageRating(b.ratings) - calculateAverageRating(a.ratings);
        case 'ratingAsc': return calculateAverageRating(a.ratings) - calculateAverageRating(b.ratings);
        case 'nameAsc': return (a.personalInfo.name || '').localeCompare(b.personalInfo.name || '');
        case 'nameDesc': return (b.personalInfo.name || '').localeCompare(a.personalInfo.name || '');
        default: return 0;
      }
    });

    return sorted;
  }, [reviews, reviewTypeFilter, simulatorTypeFilter, simulatorFilter, searchQuery, sortOption, filterMinRating, filterHasPhotos, filterHasHandwriting, calculateAverageRating]);

  const displayCount = filteredReviews.length;
  const displayAverage = useMemo(() => {
    if (displayCount === 0) return 0;
    const total = filteredReviews.reduce((sum, r) => sum + calculateAverageRating(r.ratings), 0);
    return total / displayCount;
  }, [filteredReviews, displayCount, calculateAverageRating]);

  const ReviewCard = React.memo(({ review }: { review: Review }) => {
    const reviewRating = useMemo(() => calculateAverageRating(review.ratings), [review.ratings]);
    const reviewerName = useMemo(() => getPersonalInfoValue(review, 'fullName'), [review]);
    const reviewDate = useMemo(() => new Date(review.timestamp).toLocaleDateString(), [review.timestamp]);
    const simulatorName = review.simulatorName;
    
    const handleEditPress = (e: any) => {
      e.stopPropagation();
      handleEditReview(review);
    };

    const handleDeletePress = (e: any) => {
      e.stopPropagation();
      handleDeleteReview(review);
    };
    
    return (
    <TouchableOpacity 
      activeOpacity={0.7} 
      onPress={() => handleViewDetail(review)}
      style={{ marginBottom: 8 }}
    >
      <GlassCard style={styles.reviewCard} intensity={15} variant="glass-panel">
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Left: Indicator & Name */}
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
            <View style={[
              styles.syncDot, 
              { backgroundColor: review.isSynced ? '#10B981' : '#EF4444' }
            ]} />
            <View>
              <ThemedText type="defaultSemiBold" numberOfLines={1} style={styles.reviewerName}>
                {reviewerName}
              </ThemedText>
              <ThemedText type="technical-label" style={{ color: secondaryColor, fontSize: 10 }}>
                {simulatorName} • {reviewDate}
              </ThemedText>
            </View>
          </View>

          {/* Right: Rating & Actions */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ alignItems: 'flex-end' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <ThemedText type="defaultSemiBold" style={{ color: '#FFD700' }}>
                  {reviewRating.toFixed(1)}
                </ThemedText>
                <StarRating
                  rating={reviewRating}
                  onChange={() => {}}
                  starSize={12}
                  color="#FFD700"
                  emptyColor={isDark ? '#404040' : '#E0E0E0'}
                  enableHalfStar={false}
                />
              </View>
            </View>
            
            <IconButton
              icon="pencil"
              size={20}
              iconColor="#3B82F6"
              onPress={handleEditPress}
              style={{ margin: 0 }}
            />

            <IconButton
              icon="delete"
              size={20}
              iconColor="#EF4444"
              onPress={handleDeletePress}
              style={{ margin: 0 }}
            />
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
    );
  }, (prevProps, nextProps) => {
    return prevProps.review.id === nextProps.review.id && 
           prevProps.review.timestamp === nextProps.review.timestamp &&
           prevProps.review.isSynced === nextProps.review.isSynced;
  });

  const renderReviewItem: ListRenderItem<Review> = useCallback(({ item }) => (
    <ReviewCard review={item} />
  ), [handleViewDetail, handleDeleteReview]);

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setFilterMinRating(0);
    setFilterHasPhotos(false);
    setFilterHasHandwriting(false);
    setSortOption('dateDesc');
    setSimulatorTypeFilter('all');
    setSimulatorFilter('all');
    setReviewTypeFilter('all');
    hapticsButtonPress();
  }, []);

  const hasActiveFilters = searchQuery || filterMinRating > 0 || filterHasPhotos || filterHasHandwriting || simulatorTypeFilter !== 'all' || simulatorFilter !== 'all' || reviewTypeFilter !== 'all';

  const ListEmptyComponent = useMemo(() => {
    if (reviews.length === 0) {
      return <NoReviewsEmptyState onAddReview={() => router.push('/add-review')} />;
    }
    if (hasActiveFilters) {
      return <NoSearchResultsEmptyState onClearFilters={clearAllFilters} />;
    }
    return null;
  }, [reviews.length, hasActiveFilters, clearAllFilters]);

  if (loading) {
    return (
      <ThemedView style={styles.container} variant="grid-background">
        <View style={styles.header}>
            <ThemedText type="title">LOGS</ThemedText>
        </View>
        <ReviewListSkeleton count={5} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container} variant="grid-background">
      <View style={[styles.header, { marginTop: insets.top }]}>
        <View style={styles.headerTop}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={handleGoBack}
            style={{ margin: 0, marginRight: 4 }}
            iconColor={primaryColor}
          />
          <View style={styles.headerTitles}>
            <ThemedText type="hero-title" style={styles.title}>FLIGHT LOGS</ThemedText>
            <ThemedText type="technical-label" style={{ opacity: 0.7 }}>
              {filteredReviews.length} RECORDS FOUND
            </ThemedText>
          </View>
          <View style={styles.headerActions}>
            <ConnectivityStatus />
            <ThemeToggle />
            <IconButton
              icon="file-excel"
              mode="contained"
              containerColor={isDark ? '#2E7D32' : '#4CAF50'}
              iconColor="white"
              size={20}
              onPress={async () => {
                hapticsButtonPress();
                setIsExporting(true);
                try {
                  await exportToExcel(filteredReviews);
                } catch (error) {
                  Alert.alert('Export Failed', 'Could not export reviews to Excel.');
                } finally {
                  setIsExporting(false);
                }
              }}
              loading={isExporting}
              style={{ margin: 0, marginLeft: 8 }}
            />
          </View>
        </View>

        <View style={styles.controlsRow}>
          <TextInput
            mode="outlined"
            placeholder="SEARCH LOGS..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            dense
            left={<TextInput.Icon icon="magnify" />}
          />
        </View>

        <View style={styles.filterBar}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.filterContentContainer}
          >
            {hasActiveFilters && (
              <Chip
                icon="close"
                onPress={clearAllFilters}
                style={[styles.filterChip, styles.resetChip]}
                textStyle={styles.resetChipText}
              >
                RESET
              </Chip>
            )}

            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <Chip
                  icon="sort"
                  onPress={() => setMenuVisible(true)}
                  style={styles.filterChip}
                  textStyle={{ fontSize: 12 }}
                >
                  {sortLabel.toUpperCase()}
                </Chip>
              }
            >
              <Menu.Item onPress={() => { setSortOption('dateDesc'); setMenuVisible(false); }} title="Date (Newest)" />
              <Menu.Item onPress={() => { setSortOption('dateAsc'); setMenuVisible(false); }} title="Date (Oldest)" />
              <Divider />
              <Menu.Item onPress={() => { setSortOption('ratingDesc'); setMenuVisible(false); }} title="Rating (High → Low)" />
              <Menu.Item onPress={() => { setSortOption('ratingAsc'); setMenuVisible(false); }} title="Rating (Low → High)" />
            </Menu>

             <Menu
              visible={typeFilterMenuVisible}
              onDismiss={() => setTypeFilterMenuVisible(false)}
              anchor={
                <Chip
                  icon="filter-variant"
                  onPress={() => setTypeFilterMenuVisible(true)}
                  style={[styles.filterChip, reviewTypeFilter !== 'all' && styles.filterChipActive]}
                  textStyle={{ fontSize: 12 }}
                >
                  {reviewTypeFilter === 'all' ? 'TYPE: ALL' : reviewTypeFilter.toUpperCase()}
                </Chip>
              }
            >
              <Menu.Item onPress={() => { setReviewTypeFilter('all'); setTypeFilterMenuVisible(false); }} title="All Reviews" />
              <Menu.Item onPress={() => { setReviewTypeFilter('professional'); setTypeFilterMenuVisible(false); }} title="Professional" />
              <Menu.Item onPress={() => { setReviewTypeFilter('joyride'); setTypeFilterMenuVisible(false); }} title="Joyride" />
            </Menu>

            <Menu
              visible={simulatorMenuVisible}
              onDismiss={() => setSimulatorMenuVisible(false)}
              anchor={
                <Chip
                  icon="airplane"
                  onPress={() => setSimulatorMenuVisible(true)}
                  style={[styles.filterChip, simulatorFilter !== 'all' && styles.filterChipActive]}
                  textStyle={{ fontSize: 12 }}
                >
                  {simulatorFilter === 'all' ? 'SIM: ALL' : simulatorFilter.toUpperCase()}
                </Chip>
              }
            >
              <Menu.Item onPress={() => { setSimulatorFilter('all'); setSimulatorMenuVisible(false); }} title="All Simulators" />
              <Divider />
              {availableSimulators.map(sim => (
                <Menu.Item 
                  key={sim.id} 
                  onPress={() => { setSimulatorFilter(sim.name); setSimulatorMenuVisible(false); }} 
                  title={sim.name} 
                />
              ))}
            </Menu>
            <Chip
              selected={filterHasPhotos}
              onPress={() => { hapticsFilterSelect(); setFilterHasPhotos(!filterHasPhotos); }}
              icon="camera"
              style={[styles.filterChip, filterHasPhotos && styles.filterChipActive]}
              textStyle={filterHasPhotos ? styles.filterChipTextActive : undefined}
              showSelectedOverlay
            >
              Photos
            </Chip>

            <Chip
              selected={filterHasHandwriting}
              onPress={() => { hapticsFilterSelect(); setFilterHasHandwriting(!filterHasHandwriting); }}
              icon="pen"
              style={[styles.filterChip, filterHasHandwriting && styles.filterChipActive]}
              textStyle={filterHasHandwriting ? styles.filterChipTextActive : undefined}
              showSelectedOverlay
            >
              Handwritten
            </Chip>
          </ScrollView>
        </View>

        {filteredReviews.length > 0 && (
          <View style={styles.overallAverageContainer}>
            <View style={styles.overallHeaderRow}>
              <ThemedText style={styles.overallAverageLabel}>Average Rating</ThemedText>
            </View>
            <View style={styles.overallAverageDisplay}>
              <StarRating
                rating={displayAverage}
                onChange={() => {}}
                starSize={wp('3.5%')}
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
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom, rs(24)) }
        ]}
        numColumns={numColumns}
        key={numColumns} // Force re-render on column change
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />
        }
        ListEmptyComponent={ListEmptyComponent}
      />

      <View style={[styles.bottomActions, { paddingBottom: Math.max(insets.bottom, hp('1%')) }]}>
        <Button
          mode="outlined"
          onPress={handleGoBack}
          style={styles.backButton}
        >
          Back to Home
        </Button>
      </View>

      <Portal>
        <Modal visible={pinModalVisible} onDismiss={() => setPinModalVisible(false)} contentContainerStyle={{ padding: 20, margin: 20 }}>
          <GlassCard style={{ padding: 20 }} variant="glass-panel">
            <ThemedText type="subtitle" style={{ marginBottom: 10, textAlign: 'center' }}>Admin Verification</ThemedText>
            <ThemedText style={{ marginBottom: 20, textAlign: 'center' }}>
              Enter PIN to {pinAction === 'edit' ? 'edit' : 'delete'} review
            </ThemedText>
            <TextInput
              mode="outlined"
              value={adminPin}
              onChangeText={setAdminPin}
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
              style={{ marginBottom: 20, backgroundColor: cardBackgroundColor }}
              autoFocus
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
              <Button mode="outlined" onPress={() => { setPinModalVisible(false); setAdminPin(''); }} style={{ flex: 1 }}>Cancel</Button>
              <Button 
                mode="contained" 
                onPress={confirmPinAction} 
                style={{ flex: 1, backgroundColor: pinAction === 'edit' ? '#3B82F6' : '#EF4444' }}
              >
                {pinAction === 'edit' ? 'Edit' : 'Delete'}
              </Button>
            </View>
          </GlassCard>
        </Modal>
      </Portal>
    </ThemedView>
  );
}





const createStyles = (isDark: boolean, cardBackgroundColor: string, borderColor: string) => StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: hp(isTablet ? 3 : 5),
  },
  header: {
    paddingHorizontal: getDevicePadding().horizontal,
    paddingBottom: rs(4), // Further reduced
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(6), // Further reduced
    marginBottom: rs(2), // Further reduced
  },
  headerTitles: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
  },
  filterButton: {
    marginRight: rs(4),
  },
  title: {
    fontSize: rf(isTablet ? 22 : 20), // Reduced from 28:24
    fontWeight: 'bold',
    marginBottom: rs(2), // Keep tight
    textAlign: 'center',
    flexShrink: 1,
    paddingHorizontal: wp('2%'),
    paddingVertical: rs(4),
  },
  subtitle: {
    fontSize: rf(14), // Reduced from 16
    textAlign: 'center',
    opacity: 0.7,
    paddingVertical: rs(2),
  },
  overallAverageContainer: {
    marginTop: hp('0.5%'),
    paddingVertical: hp('0.5%'),
    paddingHorizontal: wp('2%'),
    backgroundColor: isDark ? '#2A2A2A' : '#f8f9fa',
    borderRadius: rs(10),
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
    gap: rs(8),
    marginBottom: rs(4),
  },
  overallAverageLabel: {
    fontSize: rf(14),
    fontWeight: '600',
    marginBottom: rs(2),
    color: isDark ? '#FFFFFF' : '#333',
    paddingVertical: rs(2),
    lineHeight: rf(32),
  },
  overallAverageDisplay: {
    alignItems: 'center',
    gap: rs(1),
  },
  overallAverageText: {
    fontSize: rf(16),
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: rs(1),
    textAlign: 'center',
    flexShrink: 1,
    paddingVertical: rs(2),
  },
  overallAverageSubtext: {
    fontSize: wp('3.5%'),
    opacity: 0.7,
    marginTop: hp('0.3%'),
    paddingBottom: rs(1),
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: wp('5%'),
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: rs(8),
    marginTop: rs(4),
    marginBottom: rs(4),
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: rs(8),
    marginBottom: rs(6),
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
    paddingBottom: rs(5),
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
    paddingBottom: rs(4),
    lineHeight: rf(26),
  },
  submittedDate: {
    fontSize: wp('3%'),
    opacity: 0.6,
    marginLeft: wp('2%'),
    paddingBottom: rs(2),
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
    paddingBottom: rs(2),
    lineHeight: wp('4.2%'),
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
    paddingBottom: rs(2),
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
    paddingBottom: rs(3),
    lineHeight: wp('6%'),
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
    paddingBottom: rs(4),
    lineHeight: rf(24),
  },
  commentsContainer: {
    marginBottom: hp('1.5%'),
  },
  commentsLabel: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    marginBottom: hp('0.5%'),
    paddingBottom: rs(3),
  },
  comments: {
    fontSize: wp('3.5%'),
    fontStyle: 'italic',
    opacity: 0.8,
    lineHeight: wp('5%'),
    padding: wp('2%'),
    paddingBottom: wp('2.5%'),
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
    paddingBottom: rs(2),
  },
  statusChip: {
    minHeight: hp('3%'),
  },
  statusChipText: {
    fontSize: wp('2.8%'),
    paddingBottom: rs(2),
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
    minHeight: rs(34),
  },
  filterChip: {
    minHeight: rs(30),
    paddingHorizontal: rs(4),
  },
  filterChipSelected: {
    backgroundColor: isDark ? '#1976d2' : '#2196F3',
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
  },
  filterBar: {
    marginBottom: rs(12),
  },
  filterContentContainer: {
    paddingHorizontal: wp('4%'),
    gap: rs(8),
    paddingRight: rs(20),
  },
  filterChipActive: {
    backgroundColor: isDark ? '#1976d2' : '#2196F3',
    borderColor: isDark ? '#1976d2' : '#2196F3',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  resetChip: {
    backgroundColor: isDark ? '#d32f2f' : '#f44336',
    borderColor: isDark ? '#d32f2f' : '#f44336',
  },
  resetChipText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  verticalDivider: {
    width: 1,
    height: '60%',
    backgroundColor: borderColor,
    marginHorizontal: rs(8),
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: wp('5%'),
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: rs(12),
  },
  infoCol: {
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: rs(12),
    paddingTop: rs(12),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  listContent: {
    padding: rs(16),
    gap: rs(16),
  },
});

export default React.memo(ReviewsListScreen);