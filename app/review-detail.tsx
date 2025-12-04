import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
import { buildReviewHTML, generateReviewPDF, previewAndSavePDF, previewHTMLWithPrintDialog, ReviewData } from '@/utils/pdfGenerator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Card, Chip, IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StarRating from 'react-native-star-rating-widget';

import { Image as ExpoImage } from 'expo-image';
import { hp, rf, rs, wp } from '../utils/responsive';


interface RatingCategory {
  id: string;
  key: string;
  title: string;
  description: string;
}

const defaultRatingCategories: RatingCategory[] = [
  { id: '1',  key: 'cockpitRealismLayout',            title: 'Cockpit realism & layout',               description: '' },
  { id: '2',  key: 'visualQualityFOV',                title: 'Visual quality & field of view',         description: '' },
  { id: '3',  key: 'controlLoadingRealism',           title: 'Control loading realism (force feedback)', description: '' },
  { id: '4',  key: 'motionFidelity',                  title: 'Motion fidelity (6-DOF cues & response)', description: '' },
  { id: '5',  key: 'aerodynamicResponse',             title: 'Aerodynamic response & flight feel',      description: '' },
  { id: '6',  key: 'instrumentSwitchFunctionality',   title: 'Instrument & switch functionality',       description: '' },
  { id: '7',  key: 'visualMotionSync',                title: 'Visual-motion synchronization',           description: '' },
  { id: '8',  key: 'instructorControlTrainingFlow',   title: 'Instructor control & training flow',      description: '' },
  { id: '9',  key: 'aircraftBehaviorMatch',           title: 'Aircraft behavior matches real flight characteristics', description: '' },
  { id: '10', key: 'soundVibrationRealism',           title: 'Sound & vibration realism',               description: '' },
  { id: '11', key: 'overallImmersionRealism',         title: 'Overall immersion & realism',             description: '' },
];

const joyrideRatingCategories: RatingCategory[] = [
  { id: '1', key: 'overallExperience', title: 'Overall experience rating', description: '' },
  { id: '2', key: 'visualQuality', title: 'Visual quality and graphics', description: '' },
  { id: '3', key: 'motionExperience', title: 'Motion experience and realism', description: '' },
  { id: '4', key: 'easeOfUse', title: 'Ease of use and controls', description: '' },
  { id: '5', key: 'safetyFeeling', title: 'Feeling of safety and security', description: '' },
  { id: '6', key: 'thrillLevel', title: 'Thrill and excitement level', description: '' },
  { id: '7', key: 'wouldRecommend', title: 'How much would you recommend this to others?', description: '' },
  { id: '8', key: 'overallSatisfaction', title: 'Overall satisfaction', description: '' },
];

interface PersonalInfoField {
  id?: string;
  key: string;
  label: string;
  placeholder?: string;
  type: 'text' | 'email' | 'phone' | 'multiline' | 'autocomplete' | 'yesno';
  required: boolean;
  options?: string[];
  yesNoValues?: { yes: string; no: string };
}

const defaultPersonalInfoFields: PersonalInfoField[] = [
  { key: 'fullName', label: 'Full Name', type: 'text', required: true },
  { key: 'nationality', label: 'Nationality', type: 'autocomplete', required: true, options: [] },
  { key: 'profession', label: 'Profession / Industry', type: 'autocomplete', required: true, options: [] },
  { key: 'previousSimulatorExperience', label: 'Previous Simulator Experience', type: 'multiline', required: true },
  { key: 'previousFlyingExperience', label: 'Previous Flying Experience', type: 'multiline', required: true },
  { key: 'contact', label: 'Contact Information', type: 'text', required: false },
];

const joyridePersonalInfoFields: PersonalInfoField[] = [
  {
    id: '1',
    key: 'fullName',
    label: 'Full Name',
    placeholder: 'Enter your full name',
    required: true,
    type: 'text'
  },
  {
    id: '2',
    key: 'age',
    label: 'Age',
    placeholder: 'Enter your age',
    required: true,
    type: 'text'
  },
  {
    id: '3',
    key: 'nationality',
    label: 'Nationality',
    placeholder: 'Select your nationality',
    required: true,
    type: 'text'
  },
  {
    id: '4',
    key: 'profession',
    label: 'Profession / Occupation',
    placeholder: 'Enter your profession or occupation',
    required: true,
    type: 'text'
  },
  {
    id: '5',
    key: 'simulatorCostEstimate',
    label: 'Based on your time in the simulator, what’s your estimated value of the entire experience in millions of USD?',
    placeholder: 'e.g., 2.5',
    required: false,
    type: 'text'
  },
  {
    id: '6',
    key: 'priceSuggestion',
    label: 'How much would you pay for a 15-minute joyride?',
    placeholder: 'e.g., 75 (USD)',
    required: false,
    type: 'text'
  },
  {
    id: '7',
    key: 'previousSimulatorExperience',
    label: 'Previous Simulator Experience',
    placeholder: '',
    required: false,
    type: 'yesno',
    yesNoValues: { yes: 'Yes', no: 'No' }
  },
  {
    id: '8',
    key: 'amusementParkInterest',
    label: 'Would you try this in an amusement park?',
    placeholder: '',
    required: false,
    type: 'yesno',
    yesNoValues: { yes: 'Yes', no: 'No' }
  },
  {
    id: '9',
    key: 'contact',
    label: 'Contact Information',
    placeholder: 'Enter your email or phone',
    required: false,
    type: 'email'
  }
];

const joyrideDetectionKeys = ['priceSuggestion', 'simulatorCostEstimate', 'age', 'amusementParkInterest'];

const detectJoyrideFromPersonalInfo = (info?: { [key: string]: string }) => {
  if (!info) return false;
  return joyrideDetectionKeys.some((key) => {
    const value = info[key];
    return typeof value === 'string' && value.trim().length > 0;
  });
};

interface Review {
  id: string;
  reviewType?: 'professional' | 'joyride'; // Review type
  // Legacy fields for backward compatibility
  fullName?: string;
  nationality?: string;
  profession?: string;
  previousSimulatorExperience?: string;
  previousFlyingExperience?: string;
  contact?: string;
  // New dynamic structure
  personalInfo: { [key: string]: string };
  ratings: { [key: string]: number };
  textComment?: string;
  handwrittenComment?: string;
  photos: string[];
  submittedAt: string;
  timestamp?: number; // Fallback for older reviews
  simulatorId?: string;
  simulatorName?: string;
  simulatorType?: string;
}

function ReviewDetailScreen() {
  const params = useLocalSearchParams();
  const [review, setReview] = useState<Review | null>(null);
  const [ratingCategories, setRatingCategories] = useState<RatingCategory[]>(defaultRatingCategories);
  const [personalInfoFields, setPersonalInfoFields] = useState<PersonalInfoField[]>(defaultPersonalInfoFields);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Memoized styles based on theme
  const styles = useMemo(() => createStyles(isDark), [isDark]);

  // Load review data and appropriate questions/personal info fields based on review type
  useEffect(() => {
    if (params.reviewData) {
      try {
        const reviewData = JSON.parse(params.reviewData as string);
        const normalizedType: 'professional' | 'joyride' =
          reviewData.reviewType === 'joyride' || detectJoyrideFromPersonalInfo(reviewData.personalInfo)
            ? 'joyride'
            : 'professional';
        const normalizedReview = { ...reviewData, reviewType: normalizedType };
        setReview(normalizedReview);
        // Load appropriate questions and personal info fields based on review type
        const reviewType = normalizedType;
        if (reviewType === 'joyride') {
          // For joyride reviews, use joyride questions and personal info fields directly
          setRatingCategories(joyrideRatingCategories);
          setPersonalInfoFields(joyridePersonalInfoFields);
        } else {
          // For professional reviews, load from admin settings
          loadRatingCategories();
          loadPersonalInfoFields();
        }
      } catch (error) {
        console.error('Error parsing review data:', error);
      }
    } else {
      // If no review data, load professional defaults
      loadRatingCategories();
      loadPersonalInfoFields();
    }
  }, [params.reviewData]);

  const loadRatingCategories = async () => {
    try {
      // Only load for professional reviews
      const savedCategories = await AsyncStorage.getItem('admin_rating_categories');
      if (savedCategories) {
        const categories = JSON.parse(savedCategories);
        const expectedKeys = new Set(defaultRatingCategories.map((c: RatingCategory) => c.key));
        const isMismatch = !Array.isArray(categories) || categories.length !== defaultRatingCategories.length || categories.some((c: any) => !expectedKeys.has(c.key));
        if (isMismatch) {
          await AsyncStorage.setItem('admin_rating_categories', JSON.stringify(defaultRatingCategories));
          await AsyncStorage.setItem('ratingCategories', JSON.stringify(defaultRatingCategories));
          setRatingCategories(defaultRatingCategories);
        } else {
        setRatingCategories(categories);
        }
      } else {
        await AsyncStorage.setItem('admin_rating_categories', JSON.stringify(defaultRatingCategories));
        await AsyncStorage.setItem('ratingCategories', JSON.stringify(defaultRatingCategories));
        setRatingCategories(defaultRatingCategories);
      }
    } catch (error) {
      console.error('Error loading rating categories:', error);
    }
  };

  const loadPersonalInfoFields = async () => {
    try {
      // Load professional personal info fields from admin settings
      const savedFields = await AsyncStorage.getItem('admin_personal_info_fields');
      if (savedFields) {
        const fields = JSON.parse(savedFields);
        setPersonalInfoFields(fields);
      } else {
        // Use defaults if no saved fields
        setPersonalInfoFields(defaultPersonalInfoFields);
      }
    } catch (error) {
      console.error('Error loading personal info fields:', error);
      // Fallback to defaults on error
      setPersonalInfoFields(defaultPersonalInfoFields);
    }
  };

  const getPersonalInfoValue = (key: string): string => {
    if (!review) return '';
    
    // Support key variants
    const snakeKey = key
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .toLowerCase();

    // Check multiple possible sources for robustness
    const camelObj = review.personalInfo as any;
    const snakeObj = (review as any).personal_info as any;

    const dynamicFromCamel = camelObj && (
      (camelObj[key] ?? camelObj[snakeKey]) ??
      ((key === 'fullName' ? (camelObj['name'] ?? camelObj['full_name']) : undefined) ||
       (key === 'contact' ? (camelObj['email'] ?? camelObj['contact_email']) : undefined))
    );

    const dynamicFromSnake = snakeObj && (
      (snakeObj[key] ?? snakeObj[snakeKey]) ??
      ((key === 'fullName' ? (snakeObj['name'] ?? snakeObj['full_name']) : undefined) ||
       (key === 'contact' ? (snakeObj['email'] ?? snakeObj['contact_email']) : undefined))
    );

    const fromDynamic = (dynamicFromCamel || dynamicFromSnake || '') as string;
    if (fromDynamic) return String(fromDynamic);

    // Legacy fallbacks
    switch (key) {
      case 'fullName':
        return review.fullName || '';
      case 'nationality':
        return review.nationality || '';
      case 'profession':
        return review.profession || '';
      case 'age':
        return (camelObj && camelObj.age) || '';
      case 'willingnessToPay':
        return ((camelObj && (camelObj.willingnessToPay ?? camelObj.willingness_to_pay)) ||
               (snakeObj && (snakeObj.willingnessToPay ?? snakeObj.willingness_to_pay)) || '');
      case 'previousSimulatorExperience':
        return review.previousSimulatorExperience || (camelObj && camelObj.previousSimulatorExperience) || '';
      case 'previousFlyingExperience':
        return review.previousFlyingExperience || '';
      case 'contact':
        return review.contact || '';
      default:
        return '';
    }
  };

  const calculateAverageRating = () => {
    if (!review || !review.ratings) return '0.0';
    
    // Calculate average based on dynamic rating categories
    const validRatings = ratingCategories
      .map(category => review.ratings[category.key])
      .filter(rating => rating !== undefined && rating !== null);
    
    if (validRatings.length === 0) return '0.0';
    
    const sum = validRatings.reduce((acc, rating) => acc + rating, 0);
    return (sum / validRatings.length).toFixed(1);
  };

  const openImageModal = (imageUri: string) => {
    setSelectedImage(imageUri);
    setShowImageModal(true);
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const handleGeneratePDF = async () => {
    if (!review) return;

    setIsGeneratingPDF(true);
    try {
      // Map personal info to admin-configured keys for PDF rendering
      const mappedPersonalInfo: { [key: string]: string } = {};
      personalInfoFields.forEach(field => {
        const value = getPersonalInfoValue(field.key);
        if (value) {
          mappedPersonalInfo[field.key] = value;
        }
      });

      // Convert review data to the format expected by PDF generator
      const reviewData: ReviewData = {
        id: review.id,
        submittedAt: review.submittedAt || (review.timestamp ? new Date(review.timestamp).toLocaleString() : new Date().toLocaleString()),
        personalInfo: mappedPersonalInfo,
        ratings: review.ratings,
        textComment: review.textComment,
        handwrittenComment: review.handwrittenComment,
        photos: review.photos,
        simulatorName: review.simulatorName,
        simulatorType: review.simulatorType,
      };

      // Build HTML and preview via print dialog first
      const html = await buildReviewHTML(reviewData as any, personalInfoFields, ratingCategories);
      await previewHTMLWithPrintDialog(html);
      
      // Also generate a file for sharing/saving
      const pdfUri = await generateReviewPDF(reviewData as any, personalInfoFields, ratingCategories);
      await previewAndSavePDF(pdfUri);
      
      Alert.alert('Success', 'PDF generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };







  if (!review) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.content}>
          <ThemedText>Loading review details...</ThemedText>
          <Button onPress={handleGoBack} style={styles.button}>
            Go Back
          </Button>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={handleGoBack}
              style={styles.backButton}
            />
            <View style={styles.headerTitles}>
              <ThemedText type="title" style={styles.title}>
                Review Details
              </ThemedText>
              <ThemedText style={styles.submittedDate}>
                Submitted: {review.submittedAt}
              </ThemedText>
            </View>
            <ThemeToggle />
          </View>
        </View>



        {/* Simulator Information */}
        {(review.simulatorName || review.simulatorType) && (
          <Card style={styles.section}>
            <Card.Content>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Simulator Details
              </ThemedText>
              {review.simulatorName && (
                <View style={styles.infoRow}>
                  <ThemedText style={styles.label}>Aircraft:</ThemedText>
                  <Chip icon="airplane" style={styles.chip}>{review.simulatorName}</Chip>
                </View>
              )}
              {review.simulatorType && (
                <View style={styles.infoRow}>
                  <ThemedText style={styles.label}>System Type:</ThemedText>
                  <Chip icon="cog" style={styles.chip}>{review.simulatorType}</Chip>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Personal Information */}
        <Card style={styles.section}>
          <Card.Content>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Personal Information
            </ThemedText>
            {(() => {
              const renderedKeys = new Set<string>();
              return (
                <>
                  {personalInfoFields.map((field, index) => {
                    if (review?.reviewType === 'joyride' && (field.key === 'priceSuggestion' || field.key === 'simulatorCostEstimate')) {
                      return null;
                    }
                    const value = getPersonalInfoValue(field.key);
                    if (!value || value.trim() === '') return null;

                    renderedKeys.add(field.key);

                    return (
                      <View key={field.key || `field-${index}`} style={styles.infoRow}>
                  <ThemedText style={styles.label}>{field.label}:</ThemedText>
                  {field.key === 'nationality' || field.key === 'profession' ? (
                    <Chip style={styles.chip}>{value}</Chip>
                        ) : field.key === 'previousSimulatorExperience' && review?.reviewType === 'joyride' ? (
                          <Chip 
                            mode="outlined" 
                            style={[styles.chip, (value?.toLowerCase() === 'yes') ? styles.chipYes : styles.chipNo]}
                          >
                            {value}
                          </Chip>
                  ) : (
                    <ThemedText style={styles.value}>{value}</ThemedText>
                  )}
                </View>
              );
            })}
                  
                  {review?.reviewType === 'joyride' && (
                    <>
                      {(() => {
                        const rawEstimate = getPersonalInfoValue('simulatorCostEstimate');
                        const estimateValue = typeof rawEstimate === 'string' ? rawEstimate.trim() : '';
                        if (!estimateValue) return null;
                        return (
                          <View key="simulatorCostEstimate" style={styles.infoRow}>
                            <ThemedText style={styles.label}>
                              Based on your time in the simulator, what’s your estimated value of the entire experience in millions of USD?
                            </ThemedText>
                            <Chip style={styles.chip}>
                              {estimateValue.toLowerCase().endsWith('m') ? estimateValue : `${estimateValue}M`}
                            </Chip>
                          </View>
                        );
                      })()}
                      
                      {(() => {
                        const rawPrice = getPersonalInfoValue('priceSuggestion');
                        const priceValue = typeof rawPrice === 'string' ? rawPrice.trim() : '';
                        if (!priceValue) return null;
                        return (
                          <View key="priceSuggestion" style={styles.infoRow}>
                            <ThemedText style={styles.label}>How much would you pay for a 15-minute joyride?</ThemedText>
                            <Chip style={styles.chip}>
                              {priceValue.startsWith('$') ? priceValue : `$${priceValue}`}
                            </Chip>
                          </View>
                        );
                      })()}
                    </>
                  )}
                </>
              );
            })()}
          </Card.Content>
        </Card>

        {/* Overall Rating */}
        <Card style={styles.section}>
          <Card.Content>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Overall Rating
            </ThemedText>
            <View style={styles.overallRatingContainer}>
              <ThemedText style={styles.overallRatingText}>
                {calculateAverageRating()}/5.0
              </ThemedText>
              <StarRating
                rating={parseFloat(calculateAverageRating())}
                onChange={() => {}} // Read-only
                starSize={wp('6%')}
                color="#FFD700"
                emptyColor={isDark ? '#404040' : '#E0E0E0'}
                enableHalfStar={false}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Detailed Ratings */}
        <Card style={styles.section}>
          <Card.Content>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Detailed Ratings
            </ThemedText>
            {ratingCategories.map((category, index) => (
              <View key={category.key || category.id || `category-${index}`} style={styles.ratingRow}>
                <View style={styles.ratingInfo}>
                  <ThemedText style={styles.ratingTitle}>{category.title}</ThemedText>
                  <ThemedText style={styles.ratingDescription}>{category.description}</ThemedText>
                  <View style={styles.ratingDisplay}>
                    <StarRating
                      rating={review.ratings[category.key] || 0}
                      onChange={() => {}} // Read-only
                      starSize={wp('5%')}
                      color="#FFD700"
                      emptyColor={isDark ? '#404040' : '#E0E0E0'}
                      enableHalfStar={false}
                    />
                    <ThemedText style={styles.ratingValue}>
                      {review.ratings[category.key] || 0}/5
                    </ThemedText>
                  </View>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Text Comments */}
        {review.textComment && (
          <Card style={styles.section}>
            <Card.Content>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Comments
              </ThemedText>
              <ThemedText style={styles.commentText}>
                {review.textComment}
              </ThemedText>
            </Card.Content>
          </Card>
        )}

        {/* Handwritten Comments */}
        {review.handwrittenComment && (
          <Card style={styles.section}>
            <Card.Content>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Handwritten Comments
              </ThemedText>
              <TouchableOpacity onPress={() => review.handwrittenComment && openImageModal(review.handwrittenComment)}>
                <ExpoImage
                  source={{ uri: review.handwrittenComment || '' }}
                  style={styles.handwrittenImage}
                  contentFit="contain"
                  transition={200}
                />
              </TouchableOpacity>
            </Card.Content>
          </Card>
        )}

        {/* Photos */}
        {review.photos && review.photos.length > 0 && (
          <Card style={styles.section}>
            <Card.Content>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Photos ({review.photos.length})
              </ThemedText>
              <View style={styles.photosGrid}>
                {review.photos.map((photo, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => openImageModal(photo)}
                    style={styles.photoContainer}
                  >
                    <ExpoImage
                      source={{ uri: photo }}
                      style={styles.photo}
                      contentFit="cover"
                      transition={200}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        <View style={[styles.buttonContainer, { paddingBottom: Math.max(hp('1.5%'), insets.bottom) }]}>
          <Button
            mode="contained"
            onPress={handleGeneratePDF}
            style={[styles.button, styles.pdfButton]}
            loading={isGeneratingPDF}
            disabled={isGeneratingPDF}
            icon="file-pdf-box"
          >
            {isGeneratingPDF ? 'Generating PDF...' : 'Generate PDF'}
          </Button>

          <Button
            mode="outlined"
            onPress={handleGoBack}
            style={styles.button}
          >
            Back to Reviews List
          </Button>

          <Button
            mode="contained"
            onPress={handleGoHome}
            style={styles.button}
          >
            Go to Home
          </Button>
        </View>
      </ScrollView>

      {/* Image Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalBackground}
            onPress={() => setShowImageModal(false)}
          >
            <View style={styles.modalContent}>
              <ExpoImage
                source={{ uri: selectedImage }}
                style={styles.modalImage}
                contentFit="contain"
                transition={200}
              />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowImageModal(false)}
              >
                <ThemedText style={styles.closeButtonText}>✕</ThemedText>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </ThemedView>
  );
}

// Export with React.memo for performance optimization
export default React.memo(ReviewDetailScreen);

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: hp('5%'),
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: wp('5%'),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('4%'),
    paddingBottom: hp('2%'),
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitles: {
    flex: 1,
    justifyContent: 'center',
  },
  backButton: {
    margin: 0,
    marginRight: rs(8),
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
  },
  title: {
    fontSize: rf(24),
    fontWeight: 'bold',
    // marginBottom: hp('1%'), // Removed as it's now part of headerTop
    // textAlign: 'center', // Removed as it's now left-aligned
    flexShrink: 1,
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('1%'),
  },
  submittedDate: {
    fontSize: wp('3.5%'),
    textAlign: 'center',
    opacity: 0.6,
    marginBottom: hp('2%'),
    paddingVertical: rs(4),
  },
  section: {
    marginBottom: hp('2%'),
    borderRadius: wp('3%'),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: wp('5%'),
    fontWeight: 'bold',
    marginBottom: hp('1.5%'),
    color: '#1976d2',
    paddingVertical: rs(6),
    lineHeight: wp('6%'),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1%'),
    flexWrap: 'wrap',
  },
  label: {
    fontSize: wp('4%'),
    fontWeight: '600',
    marginRight: wp('2%'),
    minWidth: wp('30%'),
    paddingVertical: rs(4),
    lineHeight: wp('3%'),
  },
  value: {
    fontSize: wp('4%'),
    flex: 1,
    paddingBottom: rs(3),
    lineHeight: wp('5%'),
  },
  chip: {
    backgroundColor: isDark ? '#1E3A5F' : '#e3f2fd',
  },
  chipYes: {
    backgroundColor: isDark ? '#14532D' : '#D1FAE5',
  },
  chipNo: {
    backgroundColor: isDark ? '#7C2D12' : '#FEE2E2',
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  ratingLabel: {
    fontSize: wp('4%'),
    fontWeight: '600',
    flex: 1,
    paddingVertical: rs(4),
  },
  ratingValue: {
    fontSize: wp('4%'),
    color: '#ff9800',
    paddingBottom: rs(3),
  },
  comments: {
    fontSize: wp('4%'),
    fontStyle: 'italic',
    lineHeight: wp('6%'),
    padding: wp('3%'),
    paddingBottom: wp('4%'),
    backgroundColor: '#f5f5f5',
    borderRadius: wp('2%'),
    borderLeftWidth: 3,
    borderLeftColor: '#1976d2',
  },
  handwritingImage: {
    width: '100%',
    height: hp('30%'),
    borderRadius: wp('2%'),
    backgroundColor: '#f5f5f5',
  },
  photosContainer: {
    marginTop: hp('1%'),
  },

  buttonContainer: {
    gap: hp('2%'),
    marginTop: hp('2%'),
    marginBottom: hp('3%'),
  },
  button: {
    borderRadius: wp('3%'),
  },
  pdfButton: {
    backgroundColor: '#FF6B35',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('5%'),
  },
  overallRatingContainer: {
    alignItems: 'center',
    marginVertical: hp('1%'),
    width: '100%',
    paddingHorizontal: wp('2%'),
    overflow: 'hidden',
  },
  overallRatingText: {
    fontSize: rf(24),
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: hp('1%'),
    textAlign: 'center',
    flexShrink: 1,
    paddingVertical: rs(6),
  },
  ratingInfo: {
    flex: 1,
  },
  ratingTitle: {
    fontSize: wp('4%'),
    fontWeight: '600',
    lineHeight: wp('5.4%'),
    marginBottom: hp('0.5%'),
    paddingVertical: rs(4),
  },
  ratingDescription: {
    fontSize: wp('3.5%'),
    lineHeight: wp('4.7%'),
    opacity: 0.7,
    marginBottom: hp('1%'),
    paddingVertical: rs(3),
  },
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
  },
  commentText: {
    fontSize: wp('4%'),
    lineHeight: wp('6%'),
    padding: wp('3%'),
    paddingBottom: wp('4%'),
    backgroundColor: isDark ? '#3A3A3A' : '#f5f5f5', // Lighter background in dark mode for better visibility
    borderRadius: wp('2%'),
    borderLeftWidth: 3,
    borderLeftColor: '#1976d2',
  },
  handwrittenImage: {
    width: '100%',
    height: hp('30%'),
    borderRadius: wp('2%'),
    backgroundColor: '#f5f5f5',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp('2%'),
    marginTop: hp('1%'),
  },
  photoContainer: {
    width: wp('40%'),
    minHeight: hp('15%'),
    maxHeight: hp('30%'),
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: wp('2%'),
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    maxWidth: wp('95%'),
    maxHeight: hp('80%'),
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    maxWidth: '100%',
    maxHeight: '100%',
    minWidth: wp('50%'),
    minHeight: hp('30%'),
  },
  closeButton: {
    position: 'absolute',
    top: -hp('5%'),
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: wp('6%'),
    width: wp('12%'),
    height: wp('12%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: wp('6%'),
    fontWeight: 'bold',
    color: '#000',
    paddingBottom: rs(3),
  },
});