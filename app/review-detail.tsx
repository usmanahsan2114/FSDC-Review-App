import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
import { generateReviewPDF, previewAndSavePDF, ReviewData } from '@/utils/pdfGenerator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Card, Chip } from 'react-native-paper';
import StarRating from 'react-native-star-rating-widget';


import OptimizedImage from '@/components/OptimizedImage';
import { hp, rf, wp } from '../utils/responsive';


interface RatingCategory {
  id: string;
  key: string;
  title: string;
  description: string;
}

const defaultRatingCategories: RatingCategory[] = [
  {
    id: '1',
    key: 'generalFlying',
    title: 'General Flying / Handling Characteristics',
    description: 'Overall flight dynamics and aircraft handling'
  },
  {
    id: '2',
    key: 'emergencyProcedures',
    title: 'Emergency Procedures',
    description: 'Emergency scenarios and procedures training'
  },
  {
    id: '3',
    key: 'instrumentFlying',
    title: 'Instrument Flying System Integration',
    description: 'Instrument flight rules and system integration'
  },
  {
    id: '4',
    key: 'visualEffects',
    title: 'Visual Effects Take-Off & Landing',
    description: 'Visual system quality for takeoff and landing'
  },
  {
    id: '5',
    key: 'fidelityRealism',
    title: 'Characteristics Fidelity & Realism',
    description: 'Realism and fidelity of aircraft characteristics'
  },
  {
    id: '6',
    key: 'simulatorPerformance',
    title: 'Simulator Performance',
    description: 'Overall simulator performance and reliability'
  }
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

interface Review {
  id: string;
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
  
  // Memoized styles based on theme
  const styles = useMemo(() => createStyles(isDark), [isDark]);

  useEffect(() => {
    loadRatingCategories();
    loadPersonalInfoFields();
  }, []);

  useEffect(() => {
    if (params.reviewData) {
      try {
        const reviewData = JSON.parse(params.reviewData as string);
        setReview(reviewData);
      } catch (error) {
        console.error('Error parsing review data:', error);
      }
    }
  }, [params.reviewData]);

  const loadRatingCategories = async () => {
    try {
      const savedCategories = await AsyncStorage.getItem('ratingCategories');
      if (savedCategories) {
        const categories = JSON.parse(savedCategories);
        setRatingCategories(categories);
      }
    } catch (error) {
      console.error('Error loading rating categories:', error);
    }
  };

  const loadPersonalInfoFields = async () => {
    try {
      const savedFields = await AsyncStorage.getItem('personalInfoFields');
      if (savedFields) {
        const fields = JSON.parse(savedFields);
        setPersonalInfoFields(fields);
      }
    } catch (error) {
      console.error('Error loading personal info fields:', error);
    }
  };

  const getPersonalInfoValue = (key: string): string => {
    if (!review) return '';
    // Use dynamic structure from storage (admin keys), with fallbacks
    const fromDynamic = (review.personalInfo && (review.personalInfo[key] ||
      (key === 'fullName' ? review.personalInfo['name'] : undefined) ||
      (key === 'contact' ? review.personalInfo['email'] : undefined))) || '';
    if (fromDynamic) return fromDynamic;

    // Legacy fallbacks
    switch (key) {
      case 'fullName':
        return review.fullName || '';
      case 'nationality':
        return review.nationality || '';
      case 'profession':
        return review.profession || '';
      case 'previousSimulatorExperience':
        return review.previousSimulatorExperience || '';
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
        submittedAt: review.submittedAt || new Date(review.timestamp).toLocaleString(),
        personalInfo: mappedPersonalInfo,
        ratings: review.ratings,
        textComment: review.textComment,
        handwrittenComment: review.handwrittenComment,
        photos: review.photos,
      };

      // Generate PDF
      const pdfUri = await generateReviewPDF(reviewData, personalInfoFields, ratingCategories);
      
      // Preview and save PDF
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

        {/* Personal Information */}
        <Card style={styles.section}>
          <Card.Content>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Personal Information
            </ThemedText>
            {personalInfoFields.map((field) => {
              const value = getPersonalInfoValue(field.key);
              if (!value) return null;

              return (
                <View key={field.key} style={styles.infoRow}>
                  <ThemedText style={styles.label}>{field.label}:</ThemedText>
                  {field.key === 'nationality' || field.key === 'profession' ? (
                    <Chip style={styles.chip}>{value}</Chip>
                  ) : (
                    <ThemedText style={styles.value}>{value}</ThemedText>
                  )}
                </View>
              );
            })}
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
            {ratingCategories.map((category) => (
              <View key={category.key} style={styles.ratingRow}>
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
                <OptimizedImage
                  source={{ uri: review.handwrittenComment || '' }}
                  style={styles.handwrittenImage}
                  contentFit="contain"
                  transition={200}
                  cachePolicy="memory-disk"
                  priority="normal"
                  alt="Handwritten comment"
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
                    <OptimizedImage
                      source={{ uri: photo }}
                      style={styles.photo}
                      contentFit="contain"
                      transition={200}
                      cachePolicy="memory-disk"
                      priority="normal"
                      alt={`Review photo ${index + 1}`}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        <View style={styles.buttonContainer}>
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
              <OptimizedImage
                source={{ uri: selectedImage }}
                style={styles.modalImage}
                contentFit="contain"
                transition={200}
                cachePolicy="memory-disk"
                priority="high"
                alt="Full size review image"
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
    marginBottom: hp('2%'),
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('3%'),
  },
  headerTitles: {
    flex: 1,
  },
  title: {
    fontSize: rf(24),
    fontWeight: 'bold',
    marginBottom: hp('1%'),
    textAlign: 'center',
    flexShrink: 1,
    paddingHorizontal: wp('2%'),
  },
  submittedDate: {
    fontSize: wp('3.5%'),
    textAlign: 'center',
    opacity: 0.6,
    marginBottom: hp('2%'),
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
  },
  value: {
    fontSize: wp('4%'),
    flex: 1,
  },
  chip: {
    backgroundColor: isDark ? '#1E3A5F' : '#e3f2fd',
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
  },
  ratingValue: {
    fontSize: wp('4%'),
    color: '#ff9800',
  },
  comments: {
    fontSize: wp('4%'),
    fontStyle: 'italic',
    lineHeight: wp('6%'),
    padding: wp('3%'),
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
  },
  ratingInfo: {
    flex: 1,
  },
  ratingTitle: {
    fontSize: wp('4%'),
    fontWeight: '600',
    marginBottom: hp('0.5%'),
  },
  ratingDescription: {
    fontSize: wp('3.5%'),
    opacity: 0.7,
    marginBottom: hp('1%'),
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
  },
});