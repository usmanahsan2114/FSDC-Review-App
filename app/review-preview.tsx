import OptimizedImage from '@/components/OptimizedImage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import {
    Button,
    Card,
    Chip,
    Dialog,
    IconButton,
    Paragraph,
    Portal,
} from 'react-native-paper';
import StarRating from 'react-native-star-rating-widget';
import { initializeDataStorage, saveReview } from '../utils/dataStorage';

const defaultPersonalInfoFields: PersonalInfoField[] = [
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
    key: 'nationality',
    label: 'Nationality',
    placeholder: 'Select your nationality',
    required: true,
    type: 'text'
  },
  {
    id: '3',
    key: 'profession',
    label: 'Profession / Industry',
    placeholder: 'Enter your profession or industry',
    required: true,
    type: 'text'
  },
  {
    id: '4',
    key: 'previousSimulatorExperience',
    label: 'Previous Simulator Experience',
    placeholder: 'Describe your simulator experience',
    required: false,
    type: 'multiline'
  },
  {
    id: '5',
    key: 'previousFlyingExperience',
    label: 'Previous Flying Experience',
    placeholder: 'Describe your flying experience',
    required: false,
    type: 'multiline'
  },
  {
    id: '6',
    key: 'contact',
    label: 'Contact Information',
    placeholder: 'Enter your email or phone',
    required: false,
    type: 'email'
  }
];

import { hp, minTouchTarget, rf, rs, wp } from '../utils/responsive';

interface Country {
  name: string;
  flag: string;
}

const COUNTRIES: Country[] = [
  { name: 'Select Country', flag: '' },
  { name: 'Afghanistan', flag: '🇦🇫' },
  { name: 'Albania', flag: '🇦🇱' },
  { name: 'Algeria', flag: '🇩🇿' },
  { name: 'United States of America', flag: '🇺🇸' },
  { name: 'Andorra', flag: '🇦🇩' },
  { name: 'Angola', flag: '🇦🇴' },
  { name: 'Argentina', flag: '🇦🇷' },
  { name: 'Armenia', flag: '🇦🇲' },
  { name: 'Australia', flag: '🇦🇺' },
  { name: 'Austria', flag: '🇦🇹' },
  { name: 'Azerbaijan', flag: '🇦🇿' },
  { name: 'Bahrain', flag: '🇧🇭' },
  { name: 'Bangladesh', flag: '🇧🇩' },
  { name: 'Barbados', flag: '🇧🇧' },
  { name: 'Belarus', flag: '🇧🇾' },
  { name: 'Belgium', flag: '🇧🇪' },
  { name: 'Belize', flag: '🇧🇿' },
  { name: 'Benin', flag: '🇧🇯' },
  { name: 'Bhutan', flag: '🇧🇹' },
  { name: 'Bolivia', flag: '🇧🇴' },
  { name: 'Bosnia and Herzegovina', flag: '🇧🇦' },
  { name: 'Botswana', flag: '🇧🇼' },
  { name: 'Brazil', flag: '🇧🇷' },
  { name: 'United Kingdom', flag: '🇬🇧' },
  { name: 'Brunei', flag: '🇧🇳' },
  { name: 'Bulgaria', flag: '🇧🇬' },
  { name: 'Burkina Faso', flag: '🇧🇫' },
  { name: 'Burundi', flag: '🇧🇮' },
  { name: 'Cambodia', flag: '🇰🇭' },
  { name: 'Cameroon', flag: '🇨🇲' },
  { name: 'Canada', flag: '🇨🇦' },
  { name: 'Cape Verde', flag: '🇨🇻' },
  { name: 'Central African Republic', flag: '🇨🇫' },
  { name: 'Chad', flag: '🇹🇩' },
  { name: 'Chile', flag: '🇨🇱' },
  { name: 'China', flag: '🇨🇳' },
  { name: 'Colombia', flag: '🇨🇴' },
  { name: 'Comoros', flag: '🇰🇲' },
  { name: 'Congo', flag: '🇨🇬' },
  { name: 'Costa Rica', flag: '🇨🇷' },
  { name: 'Croatia', flag: '🇭🇷' },
  { name: 'Cuba', flag: '🇨🇺' },
  { name: 'Cyprus', flag: '🇨🇾' },
  { name: 'Czech Republic', flag: '🇨🇿' },
  { name: 'Denmark', flag: '🇩🇰' },
  { name: 'Djibouti', flag: '🇩🇯' },
  { name: 'Dominican Republic', flag: '🇩🇴' },
  { name: 'Netherlands', flag: '🇳🇱' },
  { name: 'Ecuador', flag: '🇪🇨' },
  { name: 'Egypt', flag: '🇪🇬' },
  { name: 'El Salvador', flag: '🇸🇻' },
  { name: 'Equatorial Guinea', flag: '🇬🇶' },
  { name: 'Eritrea', flag: '🇪🇷' },
  { name: 'Estonia', flag: '🇪🇪' },
  { name: 'Ethiopia', flag: '🇪🇹' },
  { name: 'Fiji', flag: '🇫🇯' },
  { name: 'Finland', flag: '🇫🇮' },
  { name: 'France', flag: '🇫🇷' },
  { name: 'Gabon', flag: '🇬🇦' },
  { name: 'Gambia', flag: '🇬🇲' },
  { name: 'Georgia', flag: '🇬🇪' },
  { name: 'Germany', flag: '🇩🇪' },
  { name: 'Ghana', flag: '🇬🇭' },
  { name: 'Greece', flag: '🇬🇷' },
  { name: 'Grenada', flag: '🇬🇩' },
  { name: 'Guatemala', flag: '🇬🇹' },
  { name: 'Guinea', flag: '🇬🇳' },
  { name: 'Guinea-Bissau', flag: '🇬🇼' },
  { name: 'Guyana', flag: '🇬🇾' },
  { name: 'Haiti', flag: '🇭🇹' },
  { name: 'Honduras', flag: '🇭🇳' },
  { name: 'Hungary', flag: '🇭🇺' },
  { name: 'Iceland', flag: '🇮🇸' },
  { name: 'India', flag: '🇮🇳' },
  { name: 'Indonesia', flag: '🇮🇩' },
  { name: 'Iran', flag: '🇮🇷' },
  { name: 'Iraq', flag: '🇮🇶' },
  { name: 'Ireland', flag: '🇮🇪' },
  { name: 'Israel', flag: '🇮🇱' },
  { name: 'Italy', flag: '🇮🇹' },
  { name: 'Ivory Coast', flag: '🇨🇮' },
  { name: 'Jamaica', flag: '🇯🇲' },
  { name: 'Japan', flag: '🇯🇵' },
  { name: 'Jordan', flag: '🇯🇴' },
  { name: 'Kazakhstan', flag: '🇰🇿' },
  { name: 'Kenya', flag: '🇰🇪' },
  { name: 'Kiribati', flag: '🇰🇮' },
  { name: 'North Korea', flag: '🇰🇵' },
  { name: 'South Korea', flag: '🇰🇷' },
  { name: 'Kuwait', flag: '🇰🇼' },
  { name: 'Kyrgyzstan', flag: '🇰🇬' },
  { name: 'Laos', flag: '🇱🇦' },
  { name: 'Latvia', flag: '🇱🇻' },
  { name: 'Lebanon', flag: '🇱🇧' },
  { name: 'Lesotho', flag: '🇱🇸' },
  { name: 'Liberia', flag: '🇱🇷' },
  { name: 'Libya', flag: '🇱🇾' },
  { name: 'Liechtenstein', flag: '🇱🇮' },
  { name: 'Lithuania', flag: '🇱🇹' },
  { name: 'Luxembourg', flag: '🇱🇺' },
  { name: 'North Macedonia', flag: '🇲🇰' },
  { name: 'Madagascar', flag: '🇲🇬' },
  { name: 'Malawi', flag: '🇲🇼' },
  { name: 'Malaysia', flag: '🇲🇾' },
  { name: 'Maldives', flag: '🇲🇻' },
  { name: 'Mali', flag: '🇲🇱' },
  { name: 'Malta', flag: '🇲🇹' },
  { name: 'Marshall Islands', flag: '🇲🇭' },
  { name: 'Mauritania', flag: '🇲🇷' },
  { name: 'Mauritius', flag: '🇲🇺' },
  { name: 'Mexico', flag: '🇲🇽' },
  { name: 'Micronesia', flag: '🇫🇲' },
  { name: 'Moldova', flag: '🇲🇩' },
  { name: 'Monaco', flag: '🇲🇨' },
  { name: 'Mongolia', flag: '🇲🇳' },
  { name: 'Montenegro', flag: '🇲🇪' },
  { name: 'Morocco', flag: '🇲🇦' },
  { name: 'Mozambique', flag: '🇲🇿' },
  { name: 'Myanmar', flag: '🇲🇲' },
  { name: 'Namibia', flag: '🇳🇦' },
  { name: 'Nauru', flag: '🇳🇷' },
  { name: 'Nepal', flag: '🇳🇵' },
  { name: 'New Zealand', flag: '🇳🇿' },
  { name: 'Nicaragua', flag: '🇳🇮' },
  { name: 'Niger', flag: '🇳🇪' },
  { name: 'Nigeria', flag: '🇳🇬' },
  { name: 'Norway', flag: '🇳🇴' },
  { name: 'Oman', flag: '🇴🇲' },
  { name: 'Pakistan', flag: '🇵🇰' },
  { name: 'Palau', flag: '🇵🇼' },
  { name: 'Palestine', flag: '🇵🇸' },
  { name: 'Panama', flag: '🇵🇦' },
  { name: 'Papua New Guinea', flag: '🇵🇬' },
  { name: 'Paraguay', flag: '🇵🇾' },
  { name: 'Peru', flag: '🇵🇪' },
  { name: 'Philippines', flag: '🇵🇭' },
  { name: 'Poland', flag: '🇵🇱' },
  { name: 'Portugal', flag: '🇵🇹' },
  { name: 'Qatar', flag: '🇶🇦' },
  { name: 'Romania', flag: '🇷🇴' },
  { name: 'Russia', flag: '🇷🇺' },
  { name: 'Rwanda', flag: '🇷🇼' },
  { name: 'Saint Lucia', flag: '🇱🇨' },
  { name: 'Samoa', flag: '🇼🇸' },
  { name: 'San Marino', flag: '🇸🇲' },
  { name: 'Sao Tome and Principe', flag: '🇸🇹' },
  { name: 'Saudi Arabia', flag: '🇸🇦' },
  { name: 'Scotland', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  { name: 'Senegal', flag: '🇸🇳' },
  { name: 'Serbia', flag: '🇷🇸' },
  { name: 'Seychelles', flag: '🇸🇨' },
  { name: 'Sierra Leone', flag: '🇸🇱' },
  { name: 'Singapore', flag: '🇸🇬' },
  { name: 'Slovakia', flag: '🇸🇰' },
  { name: 'Slovenia', flag: '🇸🇮' },
  { name: 'Solomon Islands', flag: '🇸🇧' },
  { name: 'Somalia', flag: '🇸🇴' },
  { name: 'South Africa', flag: '🇿🇦' },
  { name: 'South Sudan', flag: '🇸🇸' },
  { name: 'Spain', flag: '🇪🇸' },
  { name: 'Sri Lanka', flag: '🇱🇰' },
  { name: 'Sudan', flag: '🇸🇩' },
  { name: 'Suriname', flag: '🇸🇷' },
  { name: 'Eswatini', flag: '🇸🇿' },
  { name: 'Sweden', flag: '🇸🇪' },
  { name: 'Switzerland', flag: '🇨🇭' },
  { name: 'Syria', flag: '🇸🇾' },
  { name: 'Taiwan', flag: '🇹🇼' },
  { name: 'Tajikistan', flag: '🇹🇯' },
  { name: 'Tanzania', flag: '🇹🇿' },
  { name: 'Thailand', flag: '🇹🇭' },
  { name: 'Timor-Leste', flag: '🇹🇱' },
  { name: 'Togo', flag: '🇹🇬' },
  { name: 'Tonga', flag: '🇹🇴' },
  { name: 'Trinidad and Tobago', flag: '🇹🇹' },
  { name: 'Tunisia', flag: '🇹🇳' },
  { name: 'Turkey', flag: '🇹🇷' },
  { name: 'Turkmenistan', flag: '🇹🇲' },
  { name: 'Tuvalu', flag: '🇹🇻' },
  { name: 'Uganda', flag: '🇺🇬' },
  { name: 'Ukraine', flag: '🇺🇦' },
  { name: 'United Arab Emirates', flag: '🇦🇪' },
  { name: 'Uruguay', flag: '🇺🇾' },
  { name: 'Uzbekistan', flag: '🇺🇿' },
  { name: 'Vanuatu', flag: '🇻🇺' },
  { name: 'Venezuela', flag: '🇻🇪' },
  { name: 'Vietnam', flag: '🇻🇳' },
  { name: 'Wales', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
  { name: 'Yemen', flag: '🇾🇪' },
  { name: 'Zambia', flag: '🇿🇲' },
  { name: 'Zimbabwe', flag: '🇿🇼' },
  { name: 'Other', flag: '🌍' }
];

// Helper function to get flag for nationality
const getFlagForNationality = (nationality: string): string => {
  const country = COUNTRIES.find(c => c.name === nationality);
  return country?.flag || '';
};

interface PersonalInfoField {
  id: string;
  key: string;
  label: string;
  placeholder: string;
  required: boolean;
  type: 'text' | 'email' | 'phone' | 'multiline';
}

interface FormData {
  personalInfo: { [key: string]: string }; // Dynamic personal info based on admin fields
  ratings: { [key: string]: number }; // Dynamic ratings based on admin categories
  textComment: string;
  handwrittenComment: string;
  photos: string[];
}

function ReviewPreviewScreen() {
  const params = useLocalSearchParams();
  const formData: FormData = params.formData ? JSON.parse(params.formData as string) : null;
  
  // Theme hooks
  const { isDark } = useTheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: '#E0E0E0', dark: '#404040' }, 'text');
  const cardBackgroundColor = useThemeColor({ light: '#FFFFFF', dark: '#1E1E1E' }, 'background');
  
  // Create dynamic styles - optimized with useMemo
  const styles = useMemo(() => 
    createStyles(backgroundColor, textColor, borderColor, cardBackgroundColor, isDark),
    [backgroundColor, textColor, borderColor, cardBackgroundColor, isDark]
  );
  
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmittedSuccessfully, setHasSubmittedSuccessfully] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [personalInfoFields, setPersonalInfoFields] = useState<PersonalInfoField[]>(defaultPersonalInfoFields);
  const [ratingCategories, setRatingCategories] = useState([
    { key: 'generalFlying', title: 'General Flying / Handling Characteristics' },
    { key: 'emergencyProcedures', title: 'Emergency Procedures' },
    { key: 'instrumentFlying', title: 'Instrument Flying System Integration' },
    { key: 'visualEffects', title: 'Visual Effects Take-Off & Landing' },
    { key: 'fidelityRealism', title: 'Characteristics Fidelity & Realism' },
    { key: 'simulatorPerformance', title: 'Simulator Performance' },
  ]);

  // Load personal info fields and rating categories from AsyncStorage
  useEffect(() => {
    const loadPersonalInfoFields = async () => {
      try {
        const saved = await AsyncStorage.getItem('admin_personal_info_fields');
        if (saved) {
          const fields = JSON.parse(saved);
          setPersonalInfoFields(fields);
        }
      } catch (error) {
        console.error('Error loading personal info fields:', error);
      }
    };

    const loadRatingCategories = async () => {
      try {
        const saved = await AsyncStorage.getItem('admin_rating_categories');
        if (saved) {
          const categories = JSON.parse(saved);
          setRatingCategories(categories);
        }
      } catch (error) {
        console.error('Error loading rating categories:', error);
      }
    };

    loadPersonalInfoFields();
    loadRatingCategories();
  }, []);

  const handleBackNavigation = () => {
    if (hasSubmittedSuccessfully) {
      // If review has been submitted, navigate to a fresh add-review page
      router.push('/add-review?fromSubmission=true');
    } else {
      // If review hasn't been submitted, go back normally
      router.back();
    }
  };

  if (!formData) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>No review data found</ThemedText>
          <Button mode="contained" onPress={handleBackNavigation}>
            Go Back
          </Button>
        </View>
      </ThemedView>
    );
  }



  const handleEditSection = (section: string) => {
    // Navigate back to add-review with current form data for editing
    router.push({
      pathname: '/add-review',
      params: { 
        editData: JSON.stringify(formData),
        editSection: section
      }
    });
  };

  const calculateAverageRating = () => {
    const ratingValues = ratingCategories
      .map(category => formData.ratings[category.key])
      .filter(rating => rating !== undefined && rating !== null);
    
    if (ratingValues.length === 0) return '0.0';
    
    const sum = ratingValues.reduce((acc, rating) => acc + rating, 0);
    return (sum / ratingValues.length).toFixed(1);
  };

  const openImageModal = (imageUri: string) => {
    setSelectedImage(imageUri);
    setShowImageModal(true);
  };

  const handleSubmitFinal = async () => {
    setIsSubmitting(true);
    
    try {
      // Initialize storage system before saving
      await initializeDataStorage();
      
      // Calculate overall rating
      const overallRating = parseFloat(calculateAverageRating());
      
      // Create review data with proper structure
      const reviewData = {
        personalInfo: {
          // Persist ALL dynamic fields from the admin configuration
          ...formData.personalInfo,
          // Also add normalized aliases for compatibility
          name: formData.personalInfo.fullName || formData.personalInfo.name || '',
          email: formData.personalInfo.contact || formData.personalInfo.email || '',
        },
        ratings: formData.ratings,
        overallRating: overallRating,
        handwrittenComment: formData.handwrittenComment,
        photos: formData.photos,
        textComment: formData.textComment
      };
      
      const reviewId = await saveReview(reviewData);
      
      if (reviewId) {
        setHasSubmittedSuccessfully(true);
        setShowSuccessDialog(true);
      } else {
        Alert.alert(
          'Error',
          'Failed to save review. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error saving review:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false);
    router.push('/add-review?fromSubmission=true'); // Navigate to new add-review page for next user
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerTitles}>
              <ThemedText type="title" style={styles.title}>
                Review Preview
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                Please review your submission before confirming
              </ThemedText>
            </View>
            <ThemeToggle />
          </View>
        </View>

        {/* Personal Information */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Personal Information</ThemedText>
              <Button
                mode="outlined"
                onPress={() => handleEditSection('personal')}
                style={styles.editButton}
                compact
              >
                Edit
              </Button>
            </View>
            
            {personalInfoFields.map((field) => {
              const fieldValue = formData.personalInfo[field.key] || '';
              
              if (!fieldValue || fieldValue.trim() === '') return null;
              
              return (
                <View key={field.id} style={styles.infoRow}>
                  <ThemedText style={styles.label}>{field.label}:</ThemedText>
                  
                  {field.key === 'nationality' ? (
                    <View style={styles.nationalityContainer}>
                      <ThemedText style={styles.flagText}>{getFlagForNationality(fieldValue)}</ThemedText>
                      <ThemedText style={styles.value}>{fieldValue}</ThemedText>
                    </View>
                  ) : field.key === 'previousSimulatorExperience' || field.key === 'previousFlyingExperience' ? (
                    <Chip 
                      mode="outlined" 
                      style={[styles.chip, (fieldValue?.toLowerCase() === 'yes') ? styles.chipYes : styles.chipNo]}
                    >
                      {fieldValue}
                    </Chip>
                  ) : (
                    <ThemedText style={styles.value}>{fieldValue}</ThemedText>
                  )}
                </View>
              );
            })}
          </Card.Content>
        </Card>

        {/* Overall Rating */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Overall Rating</ThemedText>
              <Button
                mode="outlined"
                onPress={() => handleEditSection('ratings')}
                style={styles.editButton}
                compact
              >
                Edit
              </Button>
            </View>
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
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Detailed Ratings</ThemedText>
              <Button
                mode="outlined"
                onPress={() => handleEditSection('ratings')}
                style={styles.editButton}
                compact
              >
                Edit
              </Button>
            </View>
            
            {ratingCategories.map((category) => (
              <View key={category.key} style={styles.ratingRow}>
                <View style={styles.ratingInfo}>
                  <ThemedText style={styles.ratingTitle}>{category.title}</ThemedText>
                  <View style={styles.ratingDisplay}>
                    <StarRating
                      rating={formData.ratings[category.key as keyof FormData['ratings']]}
                      onChange={() => {}} // Read-only
                      starSize={wp('5%')}
                      color="#FFD700"
                      emptyColor={isDark ? '#404040' : '#E0E0E0'}
                      enableHalfStar={false}
                    />
                    <ThemedText style={styles.ratingValue}>
                      {formData.ratings[category.key as keyof FormData['ratings']]}/5
                    </ThemedText>
                  </View>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Comments */}
        {(formData.textComment || formData.handwrittenComment) && (
          <Card style={styles.sectionCard}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>Comments</ThemedText>
                <Button
                  mode="outlined"
                  onPress={() => handleEditSection('comments')}
                  style={styles.editButton}
                  compact
                >
                  Edit
                </Button>
              </View>
              
              {formData.textComment && (
                <View style={styles.commentSection}>
                  <ThemedText style={styles.commentLabel}>Text Comment:</ThemedText>
                  <ThemedText style={styles.commentText}>{formData.textComment}</ThemedText>
                </View>
              )}
              
              {formData.handwrittenComment && (
                <View style={styles.commentSection}>
                  <ThemedText style={styles.commentLabel}>Handwritten Comment:</ThemedText>
                  <TouchableOpacity onPress={() => openImageModal(formData.handwrittenComment)}>
                    <OptimizedImage
                      source={{ uri: formData.handwrittenComment }}
                      style={styles.handwrittenCommentImage}
                      contentFit="contain"
                      transition={200}
                      cachePolicy="memory-disk"
                      priority="normal"
                      alt="Handwritten comment"
                    />
                  </TouchableOpacity>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Photos */}
        {formData.photos.length > 0 && (
          <Card style={styles.sectionCard}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>
                  Photos ({formData.photos.length})
                </ThemedText>
                <Button
                  mode="outlined"
                  onPress={() => handleEditSection('photos')}
                  style={styles.editButton}
                  compact
                >
                  Edit
                </Button>
              </View>
              <View style={styles.photoGrid}>
                {formData.photos.map((photo, index) => (
                  <TouchableOpacity key={index} onPress={() => openImageModal(photo)}>
                    <OptimizedImage
                      source={{ uri: photo }}
                      style={styles.photoPreview}
                      contentFit="contain"
                      transition={200}
                      cachePolicy="memory-disk"
                      priority="normal"
                      alt={`Photo ${index + 1}`}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <Button
            mode="contained"
            onPress={handleSubmitFinal}
            style={styles.submitButton}
            contentStyle={styles.buttonContent}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </Button>
          
          <Button
            mode="outlined"
            onPress={handleBackNavigation}
            style={styles.backToEditButton}
            contentStyle={styles.buttonContent}
            disabled={isSubmitting}
          >
            {hasSubmittedSuccessfully ? 'Add New Review' : 'Back to Edit'}
          </Button>
          
          <Button
            mode="text"
            onPress={() => router.push('/')}
            style={styles.cancelButton}
            contentStyle={styles.buttonContent}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </View>
      </ScrollView>

      {/* Success Dialog */}
      <Portal>
        <Dialog visible={showSuccessDialog} dismissable={false}>
          <Dialog.Title>Success!</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              Your review has been successfully submitted and saved. Thank you for your feedback! A new review form will be opened for the next user.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleSuccessDialogClose}>Add New Review</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Image Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={() => setShowImageModal(false)}
          >
            <View style={styles.modalContent}>
              <IconButton
                icon="close"
                size={30}
                iconColor="white"
                style={styles.closeButton}
                onPress={() => setShowImageModal(false)}
              />
              {selectedImage && (
                <OptimizedImage
                  source={{ uri: selectedImage }}
                  style={styles.fullImage}
                  contentFit="contain"
                  transition={200}
                  cachePolicy="memory-disk"
                  priority="high"
                  alt="Full size image"
                />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </ThemedView>
  );
}

// Export with React.memo for performance optimization
export default React.memo(ReviewPreviewScreen);

const createStyles = (backgroundColor: string, textColor: string, borderColor: string, cardBackgroundColor: string, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: wp('4%'),
  },
  header: {
    alignItems: 'center',
    marginBottom: hp('3%'),
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
    fontSize: hp('3%'),
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: hp('1.8%'),
    textAlign: 'center',
    opacity: 0.7,
    marginTop: hp('1%'),
  },
  sectionCard: {
    marginBottom: hp('2%'),
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
  },
  sectionTitle: {
    fontSize: hp('2.2%'),
    fontWeight: 'bold',
    flex: 1,
  },
  editButton: {
    minWidth: wp('15%'),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1%'),
    flexWrap: 'wrap',
  },
  label: {
    fontSize: hp('1.8%'),
    fontWeight: '600',
    minWidth: wp('30%'),
    marginRight: wp('2%'),
  },
  value: {
    fontSize: hp('1.8%'),
    flex: 1,
  },
  nationalityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flagText: {
    fontSize: hp('2%'),
    marginRight: wp('2%'),
  },
  chip: {
    marginLeft: wp('2%'),
  },
  chipYes: {
    backgroundColor: isDark ? '#1B4D1B' : '#E8F5E8',
  },
  chipNo: {
    backgroundColor: isDark ? '#4D3D1B' : '#FFF3E0',
  },
  overallRatingContainer: {
    alignItems: 'center',
    paddingVertical: hp('2%'),
    width: '100%',
    paddingHorizontal: wp('2%'),
    overflow: 'hidden',
  },
  overallRatingText: {
    fontSize: rf(22),
    fontWeight: 'bold',
    marginBottom: hp('1%'),
    textAlign: 'center',
    flexShrink: 1,
  },
  ratingRow: {
    marginBottom: hp('1.5%'),
  },
  ratingInfo: {
    flex: 1,
  },
  ratingTitle: {
    fontSize: hp('1.8%'),
    fontWeight: '500',
    marginBottom: hp('0.5%'),
  },
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingValue: {
    fontSize: hp('1.6%'),
    fontWeight: 'bold',
    minWidth: wp('10%'),
    textAlign: 'center',
  },
  commentSection: {
    marginBottom: hp('2%'),
  },
  commentLabel: {
    fontSize: hp('1.8%'),
    fontWeight: '600',
    marginBottom: hp('1%'),
  },
  commentText: {
    fontSize: hp('1.8%'),
    lineHeight: hp('2.5%'),
    textAlign: 'justify',
  },
  handwrittenCommentImage: {
    width: '100%',
    height: hp('20%'),
    borderRadius: 8,
    borderWidth: 1,
    borderColor: borderColor,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  photoPreview: {
    width: wp('25%'),
    minHeight: wp('20%'),
    maxHeight: wp('35%'),
    borderRadius: 8,
    marginBottom: hp('1%'),
  },
  actionContainer: {
    marginTop: hp('2%'),
    marginBottom: hp('4%'),
  },
  submitButton: {
    marginBottom: hp('1.5%'),
  },
  backToEditButton: {
    marginBottom: hp('1%'),
  },
  cancelButton: {
    marginBottom: hp('1%'),
  },
  buttonContent: {
    paddingVertical: rs(12),
    paddingHorizontal: rs(16),
    minHeight: minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp('5%'),
  },
  errorText: {
    fontSize: hp('2.5%'),
    textAlign: 'center',
    marginBottom: hp('3%'),
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    maxWidth: '95%',
    maxHeight: '80%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  fullImage: {
    maxWidth: '100%',
    maxHeight: '100%',
    minWidth: wp('50%'),
    minHeight: hp('30%'),
  },
});