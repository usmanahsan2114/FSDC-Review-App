import { AnimatedEntry } from '@/components/AnimatedEntry';
import { GlassCard } from '@/components/GlassCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import {
  Button,
  Dialog,
  IconButton,
  Paragraph,
  Portal,
  SegmentedButtons,
  TextInput
} from 'react-native-paper';
import StarRating from 'react-native-star-rating-widget';

import AsyncStorage from '@react-native-async-storage/async-storage';

import OptimizedImage from '@/components/OptimizedImage';
import StylusCanvas from '@/components/StylusCanvas';
import { FSDC_SIMULATORS, Simulator } from '@/constants/simulators';
import { useFormDraft } from '@/hooks/useFormDraft';
import { usePerformance } from '@/hooks/usePerformance';
import * as FileSystem from 'expo-file-system/legacy';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { deleteImagePermanently, initializeImageStorage, saveImagePermanently } from '../utils/imageStorage';
import { getDevicePadding, getPhotoGridSize, hp, isTablet, minTouchTarget, rf, rs, wp } from '../utils/responsive';
import { getSimulators, getSimulatorTypes } from '../utils/simulatorStorage';
import { validateReviewForm } from '../utils/validation';


interface RatingCategory {
  id: string;
  key: string;
  title: string;
  description: string;
}

interface PersonalInfoField {
  id: string;
  key: string;
  label: string;
  placeholder: string;
  required: boolean;
  type: 'text' | 'email' | 'phone' | 'multiline' | 'yesno' | 'scroll';
  options?: string[];
  yesNoValues?: { yes: string; no: string };
}

interface FormData {
  personalInfo: { [key: string]: string }; // Dynamic personal info based on admin fields
  ratings: { [key: string]: number }; // Dynamic ratings based on admin categories
  textComment: string;
  handwrittenComment: string; // New field for handwritten comments
  photos: string[];
  simulatorId?: string;
  simulatorName?: string;
  simulatorType?: string;
  id?: string; // For editing existing reviews
}

import { COUNTRIES, Country } from '@/constants/countries';

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
  { id: '1',  key: 'overallExperience',               title: 'Overall experience rating',               description: '' },
  { id: '2',  key: 'visualQuality',                   title: 'Visual quality and graphics',             description: '' },
  { id: '3',  key: 'motionExperience',                title: 'Motion experience and realism',             description: '' },
  { id: '4',  key: 'easeOfUse',                       title: 'Ease of use and controls',                description: '' },
  { id: '5',  key: 'safetyFeeling',                   title: 'Feeling of safety and security',          description: '' },
  { id: '6',  key: 'thrillLevel',                     title: 'Thrill and excitement level',              description: '' },
  { id: '7',  key: 'wouldRecommend',                  title: 'How much would you recommend this to others?',      description: '' },
  { id: '8',  key: 'overallSatisfaction',             title: 'Overall satisfaction',                    description: '' },
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
    type: 'text'
  }
];

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
    placeholder: 'Enter your email or phone (Optional)',
    required: false,
    type: 'text'
  }
];

const createInitialRatings = (categories: RatingCategory[]) => {
  const ratings: { [key: string]: number } = {};
  categories.forEach(category => {
    ratings[category.key] = 0;
  });
  return ratings;
};

const createInitialPersonalInfo = (fields: PersonalInfoField[]) => {
  const personalInfo: { [key: string]: string } = {};
  fields.forEach(field => {
    personalInfo[field.key] = '';
  });
  return personalInfo;
};

function AddReviewScreen() {
  const params = useLocalSearchParams();
  const getFirstParamValue = (value: string | string[] | undefined): string | undefined => {
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  };
  const rawTypeParam =
    getFirstParamValue(params.type as string | string[] | undefined) ??
    getFirstParamValue(params.reviewType as string | string[] | undefined);
  const rawEditData = getFirstParamValue(params.editData as string | string[] | undefined);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  
  // Determine review type from params
  const reviewType = (rawTypeParam === 'joyride' ? 'joyride' : 'professional') as 'professional' | 'joyride';

  const parsedEditData = useMemo<FormData | null>(() => {
    if (!rawEditData) {
      return null;
    }
    try {
      return JSON.parse(rawEditData as string) as FormData;
    } catch (error) {
      console.error('Error parsing edit data:', error);
      return null;
    }
  }, [rawEditData]);
  
  // Theme hooks
  const { isDark } = useTheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: '#E0E0E0', dark: '#404040' }, 'text');
  const cardBackgroundColor = useThemeColor({ light: '#FFFFFF', dark: '#1E1E1E' }, 'background');
  const inputBackgroundColor = useThemeColor({ light: '#FFFFFF', dark: '#2A2A2A' }, 'background');
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const accentColor = useThemeColor({}, 'accent');
  
  // Performance optimization
  const { debounce, throttle, memoize, runAfterInteractions } = usePerformance();
  
  // Create dynamic styles - optimized with useMemo
  const styles = useMemo(() => 
    createStyles(backgroundColor, textColor, borderColor, cardBackgroundColor, inputBackgroundColor, primaryColor, secondaryColor, accentColor, isDark),
    [backgroundColor, textColor, borderColor, cardBackgroundColor, inputBackgroundColor, primaryColor, secondaryColor, accentColor, isDark]
  );
  
  // Rating categories state - initialize based on review type
  const [ratingCategories, setRatingCategories] = useState<RatingCategory[]>(
    reviewType === 'joyride' ? joyrideRatingCategories : defaultRatingCategories
  );
  
  // Personal info fields state - initialize based on review type
  const [personalInfoFields, setPersonalInfoFields] = useState<PersonalInfoField[]>(
    reviewType === 'joyride' ? joyridePersonalInfoFields : defaultPersonalInfoFields
  );
  
  const initialFormData = useMemo<FormData>(() => {
    const basePersonalFields = reviewType === 'joyride' ? joyridePersonalInfoFields : defaultPersonalInfoFields;
    const baseRatingCategories = reviewType === 'joyride' ? joyrideRatingCategories : defaultRatingCategories;

    if (parsedEditData) {
      return {
        personalInfo: {
          ...createInitialPersonalInfo(basePersonalFields),
          ...(parsedEditData.personalInfo ?? {}),
        },
        ratings: {
          ...createInitialRatings(baseRatingCategories),
          ...(parsedEditData.ratings ?? {}),
        },
        textComment: parsedEditData.textComment ?? '',
        handwrittenComment: parsedEditData.handwrittenComment ?? '',
        simulatorId: parsedEditData.simulatorId,
        simulatorName: parsedEditData.simulatorName,
        simulatorType: parsedEditData.simulatorType,
        photos: parsedEditData.photos ?? [],
        id: parsedEditData.id, // Preserve ID for editing
      };
    }

    return {
      personalInfo: createInitialPersonalInfo(basePersonalFields),
      ratings: createInitialRatings(baseRatingCategories),
      textComment: '',
      handwrittenComment: '',
      photos: [],
      simulatorId: undefined,
      simulatorName: undefined,
      simulatorType: undefined,
    };
  }, [parsedEditData, reviewType]);

  // Form State with Auto-Save Draft
  const { data: formData, updateData: setFormData, clearDraft, isLoaded: isDraftLoaded } = useFormDraft<FormData>(initialFormData);

  // Load rating categories from AsyncStorage (only for professional reviews)
  useEffect(() => {
    const loadRatingCategories = async () => {
      try {
        // Initialize image storage system
        await initializeImageStorage();
        
        // For joyride reviews, use joyride questions directly
        if (reviewType === 'joyride') {
          setRatingCategories(joyrideRatingCategories);
          setFormData((prev: FormData) => ({
            ...prev,
            ratings: {
              ...createInitialRatings(joyrideRatingCategories),
              ...prev.ratings,
            }
          }));
          return;
        }
        
        // For professional reviews, load from admin settings
        const saved = await AsyncStorage.getItem('admin_rating_categories');
        if (saved) {
          const categories = JSON.parse(saved);
          const expectedKeys = new Set(defaultRatingCategories.map(c => c.key));
          const isMismatch = !Array.isArray(categories) || categories.length !== defaultRatingCategories.length || categories.some((c: any) => !expectedKeys.has(c.key));
          const finalCategories = isMismatch ? defaultRatingCategories : categories;
          if (isMismatch) {
            await AsyncStorage.setItem('admin_rating_categories', JSON.stringify(defaultRatingCategories));
            await AsyncStorage.setItem('ratingCategories', JSON.stringify(defaultRatingCategories));
          }
          setRatingCategories(finalCategories);
          setFormData((prev: FormData) => ({
            ...prev,
            ratings: {
              ...createInitialRatings(finalCategories),
              ...prev.ratings,
            }
          }));
        } else {
          await AsyncStorage.setItem('admin_rating_categories', JSON.stringify(defaultRatingCategories));
          await AsyncStorage.setItem('ratingCategories', JSON.stringify(defaultRatingCategories));
          setRatingCategories(defaultRatingCategories);
          setFormData((prev: FormData) => ({
            ...prev,
            ratings: {
              ...createInitialRatings(defaultRatingCategories),
              ...prev.ratings,
            }
          }));
        }
      } catch (error) {
        console.error('Error loading rating categories:', error);
      }
    };
    
    loadRatingCategories();
  }, [reviewType]);

  // Load personal info fields from AsyncStorage (only for professional reviews)
  useEffect(() => {
    const loadPersonalInfoFields = async () => {
      try {
        // For joyride reviews, use joyride fields directly
        if (reviewType === 'joyride') {
          setPersonalInfoFields(joyridePersonalInfoFields);
          setFormData((prev: FormData) => ({
            ...prev,
            personalInfo: {
              ...createInitialPersonalInfo(joyridePersonalInfoFields),
              ...prev.personalInfo,
            }
          }));
          return;
        }
        
        // For professional reviews, load from admin settings
        const saved = await AsyncStorage.getItem('admin_personal_info_fields');
        if (saved) {
          const fields = JSON.parse(saved);
          setPersonalInfoFields(fields);
          // Update formData personal info to match loaded fields
          setFormData((prev: FormData) => ({
            ...prev,
            personalInfo: {
              ...createInitialPersonalInfo(fields),
              ...prev.personalInfo,
            }
          }));
        }
      } catch (error) {
        console.error('Error loading personal info fields:', error);
      }
    };
    
    loadPersonalInfoFields();
  }, [reviewType]);

  // Clear draft when coming from successful submission
  useEffect(() => {
    const fromSubmission = getFirstParamValue(params.fromSubmission as string | string[] | undefined);
    if (fromSubmission === 'true' && isDraftLoaded) {
      clearDraft();
    }
  }, [params.fromSubmission, isDraftLoaded]);

  // Simulator selection state
  const [showSimulatorModal, setShowSimulatorModal] = useState(true); // Show initially
  const [selectedSimulator, setSelectedSimulator] = useState<Simulator | null>(null);
  const [selectedSimulatorType, setSelectedSimulatorType] = useState<string | null>(null);
  const [availableSimulators, setAvailableSimulators] = useState<Simulator[]>([]);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);

  useEffect(() => {
    const loadSimData = async () => {
      const sims = await getSimulators();
      const types = await getSimulatorTypes();
      setAvailableSimulators(sims);
      setAvailableTypes(types);
    };
    loadSimData();
  }, []);

  useEffect(() => {
    // If editing, populate simulator from saved data if available
    if (parsedEditData && parsedEditData.simulatorId && availableSimulators.length > 0) {
      const sim = availableSimulators.find(s => s.id === parsedEditData.simulatorId);
      if (sim) {
        setSelectedSimulator(sim);
        setShowSimulatorModal(false);
      }
    }
  }, [parsedEditData, availableSimulators]);

  const handleSimulatorSelect = (simulator: Simulator) => {
    setSelectedSimulator(simulator);
    // Don't close modal yet, proceed to type selection
  };

  const handleTypeSelect = (type: string) => {
    if (!selectedSimulator) return;
    
    setSelectedSimulatorType(type);
    setFormData(prev => ({
      ...prev,
      simulatorId: selectedSimulator.id,
      simulatorName: selectedSimulator.name,
      simulatorType: type
    }));
    setShowSimulatorModal(false);
  };

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  
  // New state variables for enhanced components
  const [nationalityQuery, setNationalityQuery] = useState('');
  const [filteredNationalities, setFilteredNationalities] = useState<Country[]>([]);
  const [showNationalitySuggestions, setShowNationalitySuggestions] = useState(false);
  
  // Handwriting state variables
  const [commentMode, setCommentMode] = useState<'text' | 'handwriting'>('text');
  const [showHandwritingModal, setShowHandwritingModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const cameraRef = useRef<any>(null);
  
  const deriveYesNoState = (value?: string): 'yes' | 'no' | '' => {
    if (!value || typeof value !== 'string') {
      return '';
    }
    const normalized = value.trim().toLowerCase();
    if (normalized === 'yes' || normalized === 'no') {
      return normalized as 'yes' | 'no';
    }
    return '';
  };
  
  // Experience fields Yes/No state variables
  const [hasSimulatorExperience, setHasSimulatorExperience] = useState<'yes' | 'no' | ''>(() =>
    deriveYesNoState(initialFormData.personalInfo?.previousSimulatorExperience)
  );
  const [hasFlyingExperience, setHasFlyingExperience] = useState<'yes' | 'no' | ''>(() =>
    deriveYesNoState(initialFormData.personalInfo?.previousFlyingExperience)
  );
  const simulatorExperienceValue = formData.personalInfo?.previousSimulatorExperience;
  const flyingExperienceValue = formData.personalInfo?.previousFlyingExperience;

  useEffect(() => {
    const nextState = deriveYesNoState(simulatorExperienceValue);
    if (nextState !== hasSimulatorExperience) {
      setHasSimulatorExperience(nextState);
    }
  }, [simulatorExperienceValue, hasSimulatorExperience]);

  useEffect(() => {
    const nextState = deriveYesNoState(flyingExperienceValue);
    if (nextState !== hasFlyingExperience) {
      setHasFlyingExperience(nextState);
    }
  }, [flyingExperienceValue, hasFlyingExperience]);

  const insets = useSafeAreaInsets();

  // Handle hardware back button to always navigate to home page
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.push('/');
        return true; // Prevent default back behavior
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [])
  );

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev: FormData) => ({ ...prev, [field]: value }));
  };

  const updateRating = (category: string, rating: number) => {
    setFormData(prev => ({
      ...prev,
      ratings: { ...prev.ratings, [category]: rating }
    }));
  };

  const updatePersonalInfo = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }));
  };

  // Handle Yes/No selection for simulator experience
  const handleSimulatorExperienceSelection = (selection: 'yes' | 'no') => {
    setHasSimulatorExperience(selection);
    if (selection === 'no') {
      updatePersonalInfo('previousSimulatorExperience', 'No');
    } else {
      updatePersonalInfo('previousSimulatorExperience', 'Yes');
    }
  };

  // Handle Yes/No selection for flying experience
  const handleFlyingExperienceSelection = (selection: 'yes' | 'no') => {
    setHasFlyingExperience(selection);
    if (selection === 'no') {
      updatePersonalInfo('previousFlyingExperience', 'No');
    } else {
      updatePersonalInfo('previousFlyingExperience', 'Yes');
    }
  };

  // Memoized validation state for performance
  const isFormValid = useMemo(() => {
    // Check required personal info fields
    for (const field of personalInfoFields) {
      if (field.required) {
        const value = formData.personalInfo[field.key];
        if (!value || !value.trim()) {
          return false;
        }
      }
    }
    
    // Check if all ratings are provided
    const hasAllRatings = Object.values(formData.ratings).every((rating: number) => rating > 0);
    return hasAllRatings;
  }, [formData.personalInfo, formData.ratings, personalInfoFields]);

  const validateForm = useCallback((): boolean => {
    // Validate required personal info fields
    for (const field of personalInfoFields) {
      if (field.required) {
        const value = formData.personalInfo[field.key];
        if (!value || !value.trim()) {
          setValidationMessage(`Please enter your ${field.label.toLowerCase()}`);
          setShowValidationDialog(true);
          return false;
        }
      }
    }
    
    const hasAllRatings = Object.values(formData.ratings).every((rating: number) => rating > 0);
    if (!hasAllRatings) {
      setValidationMessage('Please provide ratings for all categories');
      setShowValidationDialog(true);
      return false;
    }
    
    return true;
  }, [formData.personalInfo, formData.ratings, personalInfoFields]);

  // Filter nationalities based on query - optimized with useCallback
  const filterNationalities = useCallback((query: string) => {
    if (query === '') {
      setFilteredNationalities([]);
      return;
    }
    
    const filtered = COUNTRIES
      .filter(country => country.name !== 'Select Country')
      .filter(country => 
        country.name.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 5); // Limit to 5 suggestions
    
    setFilteredNationalities(filtered);
  }, []);

  // Handle nationality input change - optimized with useCallback
  const handleNationalityChange = useCallback((text: string) => {
    setNationalityQuery(text);
    updatePersonalInfo('nationality', text);
    filterNationalities(text);
    setShowNationalitySuggestions(text.trim().length > 0);
  }, [filterNationalities]);



  // Handwriting functions - Stylus-only canvas handlers
  const handleStylusCanvasSave = async (dataUrl: string) => {
    try {
      // Initialize image storage
      await initializeImageStorage();
      
      // Generate filename for ORIGINAL: handwriting_{timestamp}_orig.png
      const timestamp = Date.now();
      const filenameOrig = `handwriting_${timestamp}_orig.png`;
      const directory = ((FileSystem as any).documentDirectory ?? '') + 'images/';
      const filePathOrig = directory + filenameOrig;
      
      // Ensure directory exists
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true });

      // Remove header from base64 data to save original
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
      
      // Write ORIGINAL to file system
      await FileSystem.writeAsStringAsync(filePathOrig, base64Data, {
        encoding: 'base64',
      });

      console.log(`Original handwriting saved: ${filePathOrig}`);

      // 1. Save ORIGINAL to Gallery (as requested)
      const hasPermission = await requestMediaLibraryPermission();
      if (hasPermission) {
        try {
          await MediaLibrary.createAssetAsync(filePathOrig);
          console.log('Original handwriting saved to Gallery');
        } catch (galleryError) {
          console.error('Failed to save to gallery:', galleryError);
          // Don't block flow if gallery save fails
        }
      }

      // 2. Compress image for Supabase/App usage
      // "compress the hand written image to max and put it in supabase database then"
      const compressed = await ImageManipulator.manipulateAsync(
        filePathOrig,
        [{ resize: { width: 600 } }], // Resize to reasonable width
        { compress: 0.1, format: ImageManipulator.SaveFormat.JPEG } // High compression
      );

      // Move compressed file to our images directory
      const filenameCompressed = `handwriting_${timestamp}_comp.jpg`;
      const filePathCompressed = directory + filenameCompressed;
      
      // ImageManipulator saves to cache, move it to our dir
      await FileSystem.moveAsync({
        from: compressed.uri,
        to: filePathCompressed
      });

      console.log(`Compressed handwriting saved: ${filePathCompressed}`);
      
      // Update form data with COMPRESSED file path
      updateFormData('handwrittenComment', filePathCompressed);
      setShowHandwritingModal(false);
    } catch (error) {
      console.error('Error saving handwriting:', error);
      Alert.alert('Error', 'Failed to save handwritten comment. Please try again.');
      setShowHandwritingModal(false);
    }
  };

  const handleStylusCanvasClear = () => {
    // Clear action is handled by the WebView canvas itself
    // This is just a callback for any additional clearing needed
    console.log('Canvas cleared');
  };

  const handleStylusCanvasClose = () => {
    setShowHandwritingModal(false);
  };

  const openHandwritingModal = async () => {
    setShowHandwritingModal(true);
  };

  const handleSubmit = () => {
    // 1. Run Validation
    const validation = validateReviewForm(formData, personalInfoFields, ratingCategories);

    if (!validation.isValid) {
      // Construct error message
      const errorMessages = Object.values(validation.errors).join('\n');
      Alert.alert("Incomplete Form", errorMessages);
      return;
    }

    // 2. Proceed if valid
    router.push({
      pathname: '/review-preview',
      params: { 
        formData: JSON.stringify(formData),
        reviewType: reviewType
      }
    });
    // Note: We don't clear draft here immediately in case user comes back to edit.
    // Ideally clear it after final submission in review-preview, or offer a "Clear" button.
    // For now, let's keep it until final save.
  };

  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  };

  const takePhoto = async () => {
    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Camera permission is required to take photos');
        return;
      }
    }
    setShowCameraModal(true);
  };

  const capturePhoto = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 1, skipProcessing: true, exif: true });
      if (photo?.uri) {
        try {
          // Request gallery permission (non-blocking save fallback handled in utils)
          try {
            const { status } = await MediaLibrary.requestPermissionsAsync(true, ['photo']);
            if (status !== 'granted') {
              console.warn('MediaLibrary permission not granted; will skip gallery save');
            }
          } catch (permErr) {
            console.warn('MediaLibrary permission request failed:', permErr);
          }

          // Save image permanently and also to gallery (creates/uses album "FSDC Reviews")
          const permanentPath = await saveImagePermanently(photo.uri, 'photo', true, true);
          const newPhotos = [...formData.photos, permanentPath];
          updateFormData('photos', newPhotos);
        } catch (error) {
          console.error('Error saving photo permanently:', error);
          Alert.alert('Error', 'Failed to save photo. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    } finally {
      setShowCameraModal(false);
    }
  };

  const pickFromGallery = async () => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) {
      Alert.alert('Permission needed', 'Media library permission is required to select photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1.0, // Preserve original quality and size
    });

    if (!result.canceled && result.assets[0]) {
      try {
        // Save image permanently (not to gallery to avoid permission dialogs)
        const permanentPath = await saveImagePermanently(result.assets[0].uri, 'photo', true, false);
        const newPhotos = [...formData.photos, permanentPath];
        updateFormData('photos', newPhotos);
      } catch (error) {
        console.error('Error saving photo permanently:', error);
        Alert.alert('Error', 'Failed to save photo. Please try again.');
      }
    }
  };

  const removePhoto = async (index: number) => {
    try {
      const photoToRemove = formData.photos[index];
      
      // Delete the permanent file
      await deleteImagePermanently(photoToRemove);
      
      // Update the form data
      const newPhotos = formData.photos.filter((_, i) => i !== index);
      updateFormData('photos', newPhotos);
    } catch (error) {
      console.error('Error removing photo:', error);
      // Still remove from form data even if file deletion fails
      const newPhotos = formData.photos.filter((_, i) => i !== index);
      updateFormData('photos', newPhotos);
    }
  };

  const openImageModal = (imageUri: string) => {
    setSelectedImage(imageUri);
    setShowImageModal(true);
  };

  const renderStarRating = (
    title: string,
    category: string,
    description: string
  ) => (
    <View style={styles.ratingItem} key={category}>
      <ThemedText style={styles.ratingTitle}>{title}</ThemedText>
      <ThemedText style={styles.ratingDescription}>{description}</ThemedText>
      <View style={styles.starContainer}>
        <StarRating
          rating={formData.ratings[category]}
          onChange={(rating) => updateRating(category, Math.round(rating))}
          starSize={wp('8%')}
          color="#FFD700"
          emptyColor="#E0E0E0"
          enableHalfStar={false}
        />
        <ThemedText style={styles.ratingValue}>
          {formData.ratings[category]}/5
        </ThemedText>
      </View>
    </View>
  );

  return (
    <AnimatedEntry style={{ flex: 1 }}>
    <ThemedView style={styles.container} variant="grid-background">
      {/* Simulator Selection Modal */}
      <Modal
        visible={showSimulatorModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          // If no simulator selected, go back to home
          if (!selectedSimulator) {
            router.back();
          } else if (!selectedSimulatorType) {
            // If simulator selected but type not, go back to simulator selection
            setSelectedSimulator(null);
          } else {
            setShowSimulatorModal(false);
          }
        }}
      >
        <ThemedView style={[styles.container, { paddingTop: rs(20) }]} variant="grid-background">
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <IconButton
                icon="arrow-left"
                size={24}
                onPress={() => {
                  if (!selectedSimulator) {
                    router.back(); // Go back to home if no simulator selected
                  } else if (!selectedSimulatorType) {
                    setSelectedSimulator(null); // Go back to simulator selection
                  } else {
                    setShowSimulatorModal(false); // Close modal
                  }
                }}
                style={styles.backButton}
                iconColor={primaryColor}
              />
              <ThemedText type="title" style={styles.title}>
                {!selectedSimulator ? 'Select Simulator' : 'Select System Type'}
              </ThemedText>
            </View>
            <ThemeToggle />
          </View>
          
          <ScrollView contentContainerStyle={{ padding: rs(16), gap: rs(16) }}>
            {!selectedSimulator ? (
              // Step 1: Select Simulator
              availableSimulators.map((sim) => (
                <TouchableOpacity key={sim.id} onPress={() => handleSimulatorSelect(sim)} activeOpacity={0.7}>
                  <GlassCard 
                    style={{ marginBottom: rs(8) }}
                    variant="glass-panel"
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View>
                        <ThemedText type="subtitle" style={{ fontWeight: 'bold', color: primaryColor }}>{sim.name}</ThemedText>
                      </View>
                      <IconButton icon="chevron-right" iconColor={secondaryColor} />
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              ))
            ) : (
              // Step 2: Select Type
              availableTypes.map((type) => (
                <TouchableOpacity key={type} onPress={() => handleTypeSelect(type as string)} activeOpacity={0.7}>
                  <GlassCard 
                    style={{ marginBottom: rs(8) }}
                    variant="glass-panel"
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View>
                        <ThemedText type="subtitle" style={{ fontWeight: 'bold', color: primaryColor }}>{type}</ThemedText>
                      </View>
                      <IconButton icon="check" iconColor={accentColor} />
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </ThemedView>
      </Modal>

      {/* Simulator Info Banner (if selected) */}
      {!showSimulatorModal && selectedSimulator && (
        <TouchableOpacity onPress={() => setShowSimulatorModal(true)}>
          <GlassCard style={{ 
            padding: rs(12), 
            marginHorizontal: wp('4%'), 
            marginTop: rs(8), 
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }} variant="glass-panel">
            <View>
              <ThemedText style={{ fontSize: rf(12), color: secondaryColor, fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace' }) }}>SELECTED SYSTEM:</ThemedText>
              <ThemedText style={{ fontWeight: 'bold', color: primaryColor, fontSize: rf(16) }}>{selectedSimulator.name} ({selectedSimulatorType})</ThemedText>
            </View>
            <IconButton icon="pencil" size={20} iconColor={accentColor} />
          </GlassCard>
        </TouchableOpacity>
      )}

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, hp('10%')) }}
      >
        <View style={[styles.header, { paddingTop: Math.max(insets.top, rs(24)) }]}>
          <View style={styles.headerTop}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => router.back()}
              style={{ margin: 0, marginRight: 4 }}
              iconColor={primaryColor}
            />
            <View style={styles.headerTitles}>
              <ThemedText type="hero-title" style={styles.title}>
                {reviewType === 'joyride' ? 'Joyride Review' : 'Flight Log'}
              </ThemedText>
              {reviewType === 'joyride' && (
                <ThemedText style={styles.subtitle}>
                  MISSION FEEDBACK
                </ThemedText>
              )}
            </View>
            <ThemeToggle />
          </View>
        </View>

        {/* Aircraft Selection Section - WOW Factor */}
        <GlassCard style={styles.sectionCard} variant="glass-panel">
          <View style={{ padding: 16 }}>
            <View style={{ marginBottom: 12 }}>
              <ThemedText style={styles.sectionTitle}>SELECT AIRCRAFT</ThemedText>
            </View>

            <View style={{ 
              height: 300, 
              marginBottom: 16, 
              padding: 32, // "A lot of padding"
              backgroundColor: 'rgba(0,0,0,0.2)', 
              borderRadius: 16,
              borderWidth: 1, 
              borderColor: 'rgba(255,255,255,0.1)',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <OptimizedImage 
                source={{ uri: FSDC_SIMULATORS.find(s => s.name === formData.simulatorName)?.imageUrl ?? 'https://fsdcpak.com/assets/img/home/super-mushak.webp' }}
                style={{ width: '100%', height: '100%' }}
                contentFit="contain"
              />
            </View>
          </View>
        </GlassCard>

        {/* Personal Information Section */}
        <GlassCard style={styles.sectionCard} variant="glass-panel">
          <View style={{ padding: 16 }}>
            <ThemedText style={styles.sectionTitle}>PILOT DATA</ThemedText>
            
            {personalInfoFields.map((field) => {
              const fieldValue = formData.personalInfo[field.key] || '';
              
              // Special handling for nationality field with autocomplete
              if (field.key === 'nationality') {
                return (
                  <View key={field.id} style={styles.pickerContainer}>
                    <ThemedText style={styles.pickerLabel}>
                      {field.label}{field.required ? ' *' : ''}
                    </ThemedText>
                    <View style={{ position: 'relative', zIndex: (showNationalitySuggestions && filteredNationalities.length > 0 ? 1000 : 1) }}>
                      <TextInput
                        label={field.placeholder}
                        value={nationalityQuery}
                        onChangeText={handleNationalityChange}
                        style={styles.textInput}
                        mode="flat"
                        underlineColor="transparent"
                        activeUnderlineColor={primaryColor}
                        textColor={textColor}
                        theme={{ colors: { onSurfaceVariant: secondaryColor } }}
                        accessibilityLabel={`${field.label} input field`}
                        accessibilityHint="Type to search for your nationality"
                        accessibilityRole="search"
                        autoCapitalize="words"
                        returnKeyType="done"
                        blurOnSubmit={false}
                        onSubmitEditing={() => { /* keep focus */ }}
                        onFocus={() => setShowNationalitySuggestions(nationalityQuery.trim().length > 0)}
                        onBlur={() => setShowNationalitySuggestions(false)}
                      />
                      
                      {showNationalitySuggestions && filteredNationalities.length > 0 && (
                        <View style={styles.autocompleteContainer}>
                          <ScrollView 
                            style={styles.autocompleteList} 
                            nestedScrollEnabled
                            keyboardShouldPersistTaps="always"
                          >
                            {filteredNationalities.map((item) => (
                              <TouchableOpacity
                                key={item.name}
                                style={styles.autocompleteItem}
                                activeOpacity={0.7}
                                delayPressIn={0}
                                onPress={() => {
                                  setNationalityQuery(item.name);
                                  updatePersonalInfo(field.key, item.name);
                                  setFilteredNationalities([]);
                                  setShowNationalitySuggestions(false);
                                }}
                              >
                                <View style={styles.autocompleteItemContent}>
                                  {item.flag && <ThemedText style={styles.flagText}>{item.flag}</ThemedText>}
                                  <ThemedText style={styles.countryText}>{item.name}</ThemedText>
                                </View>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      )}
                    </View>
                  </View>
                );
              }
              
              // Special handling for profession field (simple text input for all review types)
              if (field.key === 'profession') {
                return (
                      <TextInput
                    key={field.id}
                    label={`${field.label}${field.required ? ' *' : ''}`}
                    value={fieldValue}
                    onChangeText={(text) => updatePersonalInfo(field.key, text)}
                        style={styles.textInput}
                        mode="flat"
                        underlineColor="transparent"
                        activeUnderlineColor={primaryColor}
                        textColor={textColor}
                        theme={{ colors: { onSurfaceVariant: secondaryColor } }}
                    placeholder={field.placeholder}
                    accessibilityLabel={`${field.label} input field${field.required ? ', required' : ''}`}
                    accessibilityHint={`Enter your ${field.label.toLowerCase()}`}
                    accessibilityRole="text"
                    autoCapitalize="words"
                      />
                );
              }

              if (field.key === 'priceSuggestion' || field.key === 'simulatorCostEstimate') {
                const isCostEstimate = field.key === 'simulatorCostEstimate';
                const keyboardType = Platform.select({ ios: 'decimal-pad', default: 'numeric' }) as 'numeric' | 'decimal-pad';
                return (
                  <View key={field.id} style={styles.pickerContainer}>
                    <ThemedText style={styles.priceNote}>{field.label}</ThemedText>
                    <TextInput
                      label={isCostEstimate ? 'Your estimate (USD millions)' : 'Your price suggestion (USD)'}
                      value={fieldValue}
                      onChangeText={(text) => updatePersonalInfo(field.key, text)}
                      style={styles.textInput}
                      mode="flat"
                      underlineColor="transparent"
                      activeUnderlineColor={primaryColor}
                      textColor={textColor}
                      theme={{ colors: { onSurfaceVariant: secondaryColor } }}
                      placeholder={field.placeholder || (isCostEstimate ? 'e.g., 2.0' : 'e.g., 75')}
                      accessibilityLabel={
                        isCostEstimate
                          ? 'Flight simulator cost estimate input'
                          : 'Joyride price suggestion input'
                      }
                      accessibilityHint={
                        isCostEstimate
                          ? 'Enter how much you believe the flight simulator costs in USD millions'
                          : 'Enter how much you would pay for a 15-minute joyride in USD'
                      }
                      accessibilityRole="text"
                      autoCapitalize="none"
                      keyboardType={keyboardType}
                    />
                  </View>
                );
              }
              
              // Handle multiline text fields
              if (field.type === 'multiline') {
                // Special handling for experience fields with Yes/No buttons
                if (field.key === 'previousSimulatorExperience') {
                  return (
                    <View key={field.id} style={styles.pickerContainer}>
                      <ThemedText style={styles.pickerLabel}>
                        {field.label}{field.required ? ' *' : ''}
                      </ThemedText>
                      <View style={styles.buttonGroup}>
                        <Button
                          mode={hasSimulatorExperience === 'yes' ? 'contained' : 'outlined'}
                          onPress={() => handleSimulatorExperienceSelection('yes')}
                          style={styles.yesNoButton}
                          buttonColor={hasSimulatorExperience === 'yes' ? primaryColor : undefined}
                          textColor={hasSimulatorExperience === 'yes' ? '#000' : primaryColor}
                          accessibilityLabel="Yes, I have simulator experience"
                          accessibilityHint="Select if you have previous simulator experience"
                          accessibilityRole="button"
                          accessibilityState={{ selected: hasSimulatorExperience === 'yes' }}
                        >
                          Yes
                        </Button>
                        <Button
                          mode={hasSimulatorExperience === 'no' ? 'contained' : 'outlined'}
                          onPress={() => handleSimulatorExperienceSelection('no')}
                          style={[styles.yesNoButton, { marginLeft: wp('2%') }]}
                          buttonColor={hasSimulatorExperience === 'no' ? primaryColor : undefined}
                          textColor={hasSimulatorExperience === 'no' ? '#000' : primaryColor}
                          accessibilityLabel="No, I don't have simulator experience"
                          accessibilityHint="Select if you don't have previous simulator experience"
                          accessibilityRole="button"
                          accessibilityState={{ selected: hasSimulatorExperience === 'no' }}
                        >
                          No
                        </Button>
                      </View>
                    </View>
                  );
                }
                
                if (field.key === 'previousFlyingExperience') {
                  return (
                    <View key={field.id} style={styles.pickerContainer}>
                      <ThemedText style={styles.pickerLabel}>
                        {field.label}{field.required ? ' *' : ''}
                      </ThemedText>
                      <View style={styles.buttonGroup}>
                        <Button
                          mode={hasFlyingExperience === 'yes' ? 'contained' : 'outlined'}
                          onPress={() => handleFlyingExperienceSelection('yes')}
                          style={styles.yesNoButton}
                          buttonColor={hasFlyingExperience === 'yes' ? primaryColor : undefined}
                          textColor={hasFlyingExperience === 'yes' ? '#000' : primaryColor}
                        >
                          Yes
                        </Button>
                        <Button
                          mode={hasFlyingExperience === 'no' ? 'contained' : 'outlined'}
                          onPress={() => handleFlyingExperienceSelection('no')}
                          style={[styles.yesNoButton, { marginLeft: wp('2%') }]}
                          buttonColor={hasFlyingExperience === 'no' ? primaryColor : undefined}
                          textColor={hasFlyingExperience === 'no' ? '#000' : primaryColor}
                        >
                          No
                        </Button>
                      </View>
                    </View>
                  );
                }
                
                // Default multiline handling for other fields
                return (
                  <TextInput
                    key={field.id}
                    label={`${field.label}${field.required ? ' *' : ''}`}
                    value={fieldValue}
                    onChangeText={(text) => updatePersonalInfo(field.key, text)}
                    style={styles.textArea}
                    mode="flat"
                    underlineColor="transparent"
                    activeUnderlineColor={primaryColor}
                    textColor={textColor}
                    theme={{ colors: { onSurfaceVariant: secondaryColor } }}
                    multiline
                    numberOfLines={3}
                    placeholder={field.placeholder}
                  />
                );
              }
              
              // Handle Yes/No field type
              if (field.type === 'yesno') {
                const yesText = field.yesNoValues?.yes || 'Yes';
                const noText = field.yesNoValues?.no || 'No';
                return (
                  <View key={field.id} style={styles.pickerContainer}>
                    <ThemedText style={styles.pickerLabel}>
                      {field.label}{field.required ? ' *' : ''}
                    </ThemedText>
                    <View style={styles.buttonGroup}>
                      <Button
                        mode={fieldValue === yesText ? 'contained' : 'outlined'}
                        onPress={() => updatePersonalInfo(field.key, yesText)}
                        style={styles.yesNoButton}
                        buttonColor={fieldValue === yesText ? primaryColor : undefined}
                        textColor={fieldValue === yesText ? '#000' : primaryColor}
                      >
                        {yesText}
                      </Button>
                      <Button
                        mode={fieldValue === noText ? 'contained' : 'outlined'}
                        onPress={() => updatePersonalInfo(field.key, noText)}
                        style={[styles.yesNoButton, { marginLeft: wp('2%') }]}
                        buttonColor={fieldValue === noText ? primaryColor : undefined}
                        textColor={fieldValue === noText ? '#000' : primaryColor}
                      >
                        {noText}
                      </Button>
                    </View>
                  </View>
                );
              }

              // Handle Scroll field type (text input with quick-select options)
              if (field.type === 'scroll') {
                const options = field.options ?? [];
                return (
                  <View key={field.id} style={styles.pickerContainer}>
                    <ThemedText style={styles.pickerLabel}>
                      {field.label}{field.required ? ' *' : ''}
                    </ThemedText>
                    <TextInput
                      label={field.placeholder || 'Select or type an option'}
                      value={fieldValue}
                      onChangeText={(text) => updatePersonalInfo(field.key, text)}
                      style={styles.textInput}
                      mode="flat"
                      underlineColor="transparent"
                      activeUnderlineColor={primaryColor}
                      textColor={textColor}
                      theme={{ colors: { onSurfaceVariant: secondaryColor } }}
                      placeholder={field.placeholder || 'Type your answer'}
                      accessibilityLabel={`${field.label} input field${field.required ? ', required' : ''}`}
                      accessibilityHint={`Type or pick an option for ${field.label.toLowerCase()}`}
                      accessibilityRole="text"
                      autoCapitalize="sentences"
                    />
                    {options.length > 0 && (
                      <View style={styles.scrollOptionsContainer}>
                        <ThemedText style={styles.scrollOptionsHint} accessibilityRole="text">
                          QUICK SELECT:
                        </ThemedText>
                        <View style={styles.scrollOptionsChips}>
                          {options.map((option) => (
                            <TouchableOpacity
                              key={option}
                              style={[
                                styles.scrollOptionChip,
                                fieldValue === option && styles.scrollOptionChipSelected,
                              ]}
                              onPress={() => updatePersonalInfo(field.key, option)}
                              accessibilityRole="button"
                              accessibilityLabel={`Select ${option}`}
                              accessibilityState={{ selected: fieldValue === option }}
                            >
                              <ThemedText
                                style={[
                                  styles.scrollOptionChipText,
                                  fieldValue === option && styles.scrollOptionChipTextSelected,
                                ]}
                              >
                                {option}
                              </ThemedText>
                            </TouchableOpacity>
                          ))}
                    </View>
                      </View>
                    )}
                  </View>
                );
              }
              
              // Handle regular text, email, and phone fields
              return (
                <TextInput
                  key={field.id}
                  label={`${field.label}${field.required ? ' *' : ''}`}
                  value={fieldValue}
                  onChangeText={(text) => updatePersonalInfo(field.key, text)}
                  style={styles.textInput}
                  mode="flat"
                  underlineColor="transparent"
                  activeUnderlineColor={primaryColor}
                  textColor={textColor}
                  theme={{ colors: { onSurfaceVariant: secondaryColor } }}
                  placeholder={field.placeholder}
                  accessibilityLabel={`${field.label} input field${field.required ? ', required' : ''}`}
                  accessibilityHint={`Enter your ${field.label.toLowerCase()}`}
                  accessibilityRole="text"
                  keyboardType={field.key === 'priceSuggestion' ? 'numeric' : (field.type === 'email' ? 'email-address' : field.type === 'phone' ? 'phone-pad' : 'default')}
                />
              );
            })}
          </View>
        </GlassCard>

        {/* Ratings Section */}
        <GlassCard style={styles.sectionCard} variant="glass-panel">
          <View style={{ padding: 16 }}>
            <ThemedText style={styles.sectionTitle}>
              {reviewType === 'joyride' ? 'EXPERIENCE METRICS' : 'SYSTEM EVALUATION'}
            </ThemedText>
            <ThemedText style={styles.sectionSubtitle}>
              RATE SYSTEMS 1-5
            </ThemedText>
            
            <View style={styles.ratingsContainer}>
              {ratingCategories.map((category) => 
                renderStarRating(
                  category.title,
                  category.key,
                  category.description
                )
              )}
            </View>
          </View>
        </GlassCard>

        {/* Comments Section */}
        <GlassCard style={styles.sectionCard} variant="glass-panel">
          <View style={{ padding: 16 }}>
            <ThemedText style={styles.sectionTitle}>MISSION LOG</ThemedText>
            
            {/* Comment Mode Selector */}
            <SegmentedButtons
              value={commentMode}
              onValueChange={(value) => setCommentMode(value as 'text' | 'handwriting')}
              buttons={[
                {
                  value: 'text',
                  label: 'TEXT ENTRY',
                  icon: 'keyboard',
                },
                {
                  value: 'handwriting',
                  label: 'MANUAL LOG',
                  icon: 'draw',
                },
              ]}
              style={styles.commentModeSelector}
              theme={{ colors: { secondaryContainer: 'rgba(0, 240, 255, 0.2)', onSecondaryContainer: primaryColor, outline: primaryColor } }}
            />

            {commentMode === 'text' ? (
              <TextInput
                label="DETAILED OBSERVATIONS"
                value={formData.textComment}
                onChangeText={(text) => updateFormData('textComment', text)}
                style={styles.textArea}
                mode="flat"
                underlineColor="transparent"
                activeUnderlineColor={primaryColor}
                textColor={textColor}
                theme={{ colors: { onSurfaceVariant: secondaryColor } }}
                multiline
                numberOfLines={6}
                placeholder="Enter detailed flight log..."
              />
            ) : (
              <View style={styles.handwritingContainer}>
                {formData.handwrittenComment ? (
                  <View style={styles.handwritingPreview}>
                    <ThemedText style={styles.handwritingLabel}>LOG ENTRY:</ThemedText>
                    <TouchableOpacity 
                      style={styles.handwritingImageContainer}
                      onPress={() => openImageModal(formData.handwrittenComment)}
                    >
                      <Image 
                        source={{ uri: formData.handwrittenComment }} 
                        style={styles.handwritingImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                    <View style={styles.handwritingButtons}>
                      <Button
                        mode="outlined"
                        onPress={openHandwritingModal}
                        style={styles.editHandwritingButton}
                        icon="pencil"
                        textColor={primaryColor}
                        accessibilityLabel="Edit handwritten comment"
                        accessibilityHint="Opens handwriting canvas to edit your comment"
                        accessibilityRole="button"
                      >
                        EDIT
                      </Button>
                      <Button
                        mode="outlined"
                        onPress={() => updateFormData('handwrittenComment', '')}
                        style={styles.clearHandwritingButton}
                        icon="delete"
                        textColor={accentColor}
                        accessibilityLabel="Clear handwritten comment"
                        accessibilityHint="Removes the current handwritten comment"
                        accessibilityRole="button"
                      >
                        CLEAR
                      </Button>
                    </View>
                  </View>
                ) : (
                  <Button
                    mode="contained"
                    onPress={openHandwritingModal}
                    style={styles.handwritingButton}
                    icon="draw"
                    buttonColor={primaryColor}
                    textColor="#000"
                    accessibilityLabel="Start handwriting comment"
                    accessibilityHint="Opens handwriting canvas to write a comment"
                    accessibilityRole="button"
                  >
                    START MANUAL LOG
                  </Button>
                )}
              </View>
            )}
          </View>
        </GlassCard>

        {/* Photos Section */}
        <GlassCard style={styles.sectionCard} variant="glass-panel">
          <View style={{ padding: 16 }}>
            <ThemedText style={styles.sectionTitle}>VISUAL EVIDENCE</ThemedText>
            
            <View style={styles.photoButtonsContainer}>
              <Button
                mode="contained"
                onPress={takePhoto}
                style={styles.photoButton}
                icon="camera"
                buttonColor={primaryColor}
                textColor="#000"
                accessibilityLabel="Take photo with camera"
                accessibilityHint="Opens camera to take a new photo"
                accessibilityRole="button"
              >
                CAMERA
              </Button>
              
              <Button
                mode="outlined"
                onPress={pickFromGallery}
                style={styles.photoButton}
                icon="image"
                textColor={primaryColor}
                accessibilityLabel="Select photo from gallery"
                accessibilityHint="Opens photo gallery to select an existing photo"
                accessibilityRole="button"
              >
                GALLERY
              </Button>
            </View>

            {formData.photos.length > 0 && (
              <View style={styles.photoGrid}>
                {formData.photos.map((photo, index) => (
                  <View key={index} style={styles.photoContainer}>
                    <TouchableOpacity onPress={() => openImageModal(photo)}>
                      <OptimizedImage 
                  source={{ uri: photo }} 
                  style={styles.photoThumbnail}
                  contentFit="contain"
                  transition={200}
                  cachePolicy="memory-disk"
                  priority="normal"
                  placeholder="blur"
                  alt="Review photo"
                />
                    </TouchableOpacity>
                    <IconButton
                      icon="close"
                      size={wp('4%')}
                      onPress={() => removePhoto(index)}
                      style={styles.removePhotoButton}
                      iconColor="#FFF"
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        </GlassCard>

        {/* Submit Section */}
        <View style={styles.submitContainer}>
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
            buttonColor={primaryColor}
            textColor="#000"
            labelStyle={{ fontWeight: 'bold', fontSize: rf(16), letterSpacing: 1 }}
          >
            SUBMIT LOG
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => router.push('/')}
            style={styles.backButton}
            contentStyle={styles.backButtonContent}
            textColor={secondaryColor}
          >
            ABORT MISSION
          </Button>
        </View>
      </ScrollView>

      {/* Image Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalBackground}
            onPress={() => setShowImageModal(false)}
          >
            <View style={styles.modalContent}>
              {selectedImage && (
                <OptimizedImage 
                  source={{ uri: selectedImage }} 
                  style={styles.fullImage}
                  contentFit="contain"
                  transition={300}
                  cachePolicy="memory-disk"
                  priority="high"
                  alt="Full size review photo"
                />
              )}
              <IconButton
                icon="close"
                size={wp('8%')}
                onPress={() => setShowImageModal(false)}
                style={styles.closeModalButton}
                iconColor="white"
              />
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Handwriting Modal - Stylus-Only Canvas */}
      <Modal
        visible={showHandwritingModal}
        transparent={false}
        animationType="slide"
        onRequestClose={handleStylusCanvasClose}
      >
        <View style={styles.stylusCanvasContainer}>
          <StylusCanvas
            onSave={handleStylusCanvasSave}
            onClear={handleStylusCanvasClear}
            onClose={handleStylusCanvasClose}
                backgroundColor="#FFFFFF"
                penColor="#000000"
            initialImage={formData.handwrittenComment || undefined}
          />
        </View>
      </Modal>

      {/* Validation Dialog */}
      <Portal>
        <Dialog visible={showValidationDialog} onDismiss={() => setShowValidationDialog(false)} style={{ backgroundColor: cardBackgroundColor }}>
          <Dialog.Title style={{ color: accentColor }}>VALIDATION ERROR</Dialog.Title>
          <Dialog.Content>
            <Paragraph style={{ color: textColor }}>{validationMessage}</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowValidationDialog(false)} textColor={primaryColor}>ACKNOWLEDGE</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Camera Modal - custom capture (no OK/Retry, no edit UI) */}
      <Modal
        visible={showCameraModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCameraModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' }}>
          <CameraView
            ref={(r) => { cameraRef.current = r; }}
            style={{ flex: 1 }}
            ratio="16:9"
          />
          <View style={{ position: 'absolute', bottom: Math.max(hp('4%'), insets.bottom + hp('2%')), width: '100%', alignItems: 'center' }}>
            <Button mode="contained" onPress={capturePhoto} buttonColor={primaryColor} textColor="#000" style={{ marginBottom: 16 }}>
              CAPTURE EVIDENCE
            </Button>
            <Button mode="text" onPress={() => setShowCameraModal(false)} textColor="#FFF">
              CANCEL
            </Button>
          </View>
        </View>
      </Modal>
    </ThemedView>

    </AnimatedEntry>
  );
}

// Export with React.memo for performance optimization
export default React.memo(AddReviewScreen);


const createStyles = (
  backgroundColor: string, 
  textColor: string, 
  borderColor: string, 
  cardBackgroundColor: string, 
  inputBackgroundColor: string,
  primaryColor: string,
  secondaryColor: string,
  accentColor: string,
  isDark: boolean
) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: getDevicePadding().horizontal,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('4%'),
    paddingBottom: hp('2%'),
    paddingTop: hp('1%'),
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitles: {
    flex: 1,
    marginLeft: rs(8),
  },
  title: {
    fontSize: rf(isTablet ? 28 : 24),
    textAlign: 'left',
    fontWeight: 'bold',
    paddingVertical: rf(6),
    color: primaryColor,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: rf(12),
    textAlign: 'left',
    opacity: 0.8,
    lineHeight: rf(16),
    marginTop: rs(2),
    color: secondaryColor,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace' }),
  },
  sectionCard: {
    marginBottom: hp('2%'),
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
  },
  sectionTitle: {
    fontSize: rf(18),
    fontWeight: 'bold',
    lineHeight: rf(24),
    marginBottom: hp('1%'),
    paddingVertical: rf(5),
    color: primaryColor,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  sectionSubtitle: {
    fontSize: rf(14),
    opacity: 0.7,
    lineHeight: rf(20),
    marginBottom: hp('1.5%'),
    paddingVertical: rf(4),
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace' }),
  },
  textInput: {
    marginBottom: hp('1.5%'),
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
  },
  textArea: {
    marginBottom: hp('1%'),
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
  },
  pickerContainer: {
    marginBottom: hp('1.5%'),
  },
  pickerLabel: {
    fontSize: rf(14),
    lineHeight: rf(20),
    marginBottom: hp('0.5%'),
    fontWeight: '600',
    flexShrink: 1,
    paddingHorizontal: wp('1%'),
    paddingVertical: rf(1),
    color: secondaryColor,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  picker: {
    borderWidth: 1,
    borderColor: borderColor,
    borderRadius: 4,
    backgroundColor: inputBackgroundColor,
  },
  pickerStyle: {
    height: hp('6%'),
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
    paddingVertical: hp('1%'),
  },
  switchLabel: {
    fontSize: rf(16),
    lineHeight: rf(24),
    flex: 1,
    flexShrink: 1,
    paddingRight: wp('2%'),
    paddingVertical: rf(4),
  },
  ratingCard: {
    marginBottom: hp('1.5%'),
    elevation: 1,
  },
  ratingTitle: {
    fontSize: rf(16),
    lineHeight: rf(22),
    fontWeight: 'bold',
    marginBottom: hp('0%'),
    flexShrink: 1,
    paddingHorizontal: wp('2%'),
    paddingVertical: rf(0),
    color: textColor,
  },
  ratingDescription: {
    fontSize: rf(12),
    lineHeight: rf(18),
    opacity: 0.7,
    marginBottom: hp('0%'),
    flexShrink: 1,
    paddingHorizontal: wp('2%'),
    paddingVertical: rf(3),
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace' }),
  },
  starContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: rs(8),
    paddingHorizontal: rs(8),
  },
  ratingValue: {
    fontSize: rf(18),
    lineHeight: rf(24),
    fontWeight: 'bold',
    minWidth: wp('12%'),
    textAlign: 'center',
    flexShrink: 1,
    paddingVertical: rf(4),
    color: accentColor,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace' }),
  },
  photoButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: hp('2%'),
    gap: rs(12),
  },
  photoButton: {
    flex: 1,
    borderColor: primaryColor,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: rs(12),
  },
  photoContainer: {
    position: 'relative',
    marginBottom: rs(8),
    width: getPhotoGridSize(),
    minHeight: getPhotoGridSize() * 0.75,
    maxHeight: getPhotoGridSize() * 1.5,
    borderRadius: rs(8),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: rs(8),
  },
  removePhotoButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
    borderBottomLeftRadius: 8,
  },
  submitContainer: {
    marginTop: rs(16),
    marginBottom: rs(32),
    gap: rs(12),
  },
  submitButton: {
    marginBottom: rs(0),
    minHeight: minTouchTarget,
    backgroundColor: primaryColor,
    borderColor: primaryColor,
  },
  submitButtonContent: {
    paddingVertical: rs(12),
    paddingHorizontal: rs(16),
    minHeight: minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    marginBottom: hp('1%'),
    borderColor: secondaryColor,
  },
  backButtonContent: {
    paddingVertical: rs(12),
    paddingHorizontal: rs(16),
    minHeight: minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    position: 'relative',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '80%',
  },
  closeModalButton: {
    position: 'absolute',
    top: hp('5%'),
    right: wp('5%'),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  autocompleteContainer: {
    position: 'absolute',
    top: hp('7%'),
    left: 0,
    right: 0,
    backgroundColor: cardBackgroundColor,
    borderWidth: 1,
    borderColor: primaryColor,
    borderRadius: 4,
    maxHeight: hp('20%'),
    zIndex: 10000,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  autocompleteList: {
    maxHeight: hp('20%'),
  },
  autocompleteItem: {
    padding: hp('1.5%'),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  autocompleteItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagText: {
    fontSize: rf(18),
    lineHeight: rf(26),
    marginRight: wp('3%'),
    paddingVertical: rf(4),
  },
  countryText: {
    fontSize: rf(16),
    lineHeight: rf(24),
    flex: 1,
    paddingVertical: rf(4),
    color: textColor,
  },
  priceNote: {
    fontSize: rf(14),
    lineHeight: rf(20),
    marginBottom: hp('1%'),
    color: secondaryColor,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace' }),
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: wp('2%'),
  },
  yesNoButton: {
    flex: 0.3,
    minWidth: wp('20%'),
    marginTop: hp('0.8%'),
    marginBottom: hp('0.8%'),
    borderColor: primaryColor,
  },
  scrollOptionsContainer: {
    marginTop: hp('1%'),
  },
  scrollOptionsHint: {
    fontSize: rf(12),
    lineHeight: rf(16),
    opacity: 0.7,
    marginBottom: hp('0.5%'),
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace' }),
    color: secondaryColor,
  },
  scrollOptionsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp('2%'),
  },
  scrollOptionChip: {
    paddingVertical: hp('0.8%'),
    paddingHorizontal: wp('4%'),
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  scrollOptionChipSelected: {
    backgroundColor: 'rgba(0, 240, 255, 0.2)', // Cyan with opacity
    borderColor: primaryColor,
  },
  scrollOptionChipText: {
    fontSize: rf(14),
    lineHeight: rf(20),
    color: textColor,
  },
  scrollOptionChipTextSelected: {
    color: primaryColor,
    fontWeight: 'bold',
  },
  handwritingModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  handwritingModalContent: {
    width: '98%',
    height: '98%',
    backgroundColor: cardBackgroundColor,
    borderRadius: 12,
    padding: wp('0.5%'),
  },
  handwritingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('0.5%'),
    paddingVertical: hp('0.5%'),
  },
  handwritingTitle: {
    fontSize: rf(20),
    lineHeight: rf(28),
    fontWeight: 'bold',
    paddingVertical: rf(5),
    color: primaryColor,
  },
  handwritingCloseButton: {
    margin: 0,
  },
  stylusCanvasContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  editHandwritingButton: {
    marginRight: wp('2%'),
    borderColor: primaryColor,
  },
  clearHandwritingButton: {
    marginLeft: wp('2%'),
    borderColor: accentColor,
  },
  handwritingButton: {
    marginTop: hp('1%'),
    borderColor: primaryColor,
  },
  handwritingImage: {
    width: '100%',
    height: hp('20%'),
    borderRadius: 8,
    borderWidth: 1,
    borderColor: borderColor,
    backgroundColor: '#FFFFFF',
  },
  handwritingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp('1%'),
  },
  handwritingPreview: {
    marginTop: hp('1%'),
  },
  handwritingLabel: {
    fontSize: rf(14),
    lineHeight: rf(20),
    fontWeight: '600',
    marginBottom: hp('1%'),
    paddingVertical: rf(4),
    color: secondaryColor,
    textTransform: 'uppercase',
  },
  handwritingImageContainer: {
    position: 'relative',
    marginBottom: hp('1%'),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  commentModeSelector: {
    marginBottom: hp('2%'),
  },
  handwritingContainer: {
    marginTop: hp('1%'),
  },
  ratingsContainer: {
    marginTop: hp('1%'),
  },
  ratingItem: {
    marginBottom: hp('2%'),
    paddingBottom: hp('1.5%'),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
});