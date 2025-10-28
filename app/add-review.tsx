import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Picker } from '@react-native-picker/picker';
import { useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    BackHandler,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import {
    Button,
    Card,
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
import { usePerformance } from '@/hooks/usePerformance';
import SignatureCanvas from 'react-native-signature-canvas';
import { deleteImagePermanently, initializeImageStorage, saveImagePermanently } from '../utils/imageStorage';
import { getDevicePadding, getPhotoGridSize, hp, isTablet, minTouchTarget, rf, rs, wp } from '../utils/responsive';


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
}

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
  { name: 'Micronesia', flag: '🇫���2' },
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
  { name: 'South Sudan', flag: '🇸���8' },
  { name: 'Spain', flag: '🇪���8' },
  { name: 'Sri Lanka', flag: '🇱🇰' },
  { name: 'Sudan', flag: '🇸🇩' },
  { name: 'Suriname', flag: '🇸🇷' },
  { name: 'Eswatini', flag: '🇸🇿' },
  { name: 'Sweden', flag: '🇸���5' },
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

const PROFESSIONS = [
  'Select Profession',
  'Commercial Pilot', 'Private Pilot', 'Flight Instructor', 'Air Traffic Controller',
  'Aircraft Mechanic', 'Aerospace Engineer', 'Flight Attendant', 'Airport Manager',
  'Aviation Safety Inspector', 'Airline Operations Manager', 'Aircraft Dispatcher',
  'Avionics Technician', 'Flight Test Engineer', 'Aviation Meteorologist',
  'Student Pilot', 'Military Pilot', 'Helicopter Pilot', 'Cargo Pilot',
  'Charter Pilot', 'Corporate Pilot', 'Flight Simulator Instructor',
  'Aviation Consultant', 'Aircraft Sales Representative', 'Aviation Lawyer',
  'Aviation Insurance Specialist', 'Airport Security Officer', 'Ground Crew',
  'Baggage Handler', 'Ramp Agent', 'Aircraft Cleaner', 'Fuel Technician',
  'Aviation Photographer', 'Aviation Journalist', 'Aviation Enthusiast',
  'Retired Aviation Professional', 'Other'
];

const defaultRatingCategories: RatingCategory[] = [
  {
    id: '1',
    key: 'generalFlying',
    title: 'General Flying / Handling Characteristics',
    description: 'How realistic are the aircraft controls and flight dynamics?'
  },
  {
    id: '2',
    key: 'emergencyProcedures',
    title: 'Emergency Procedures',
    description: 'How well does the simulator handle emergency scenarios?'
  },
  {
    id: '3',
    key: 'instrumentFlying',
    title: 'Instrument Flying System Integration',
    description: 'How accurate and functional are the aircraft instruments?'
  },
  {
    id: '4',
    key: 'visualEffects',
    title: 'Visual Effects Take-Off & Landing',
    description: 'How realistic are the visual effects during critical phases?'
  },
  {
    id: '5',
    key: 'fidelityRealism',
    title: 'Characteristics Fidelity & Realism',
    description: 'Overall realism and attention to detail in the simulation'
  },
  {
    id: '6',
    key: 'simulatorPerformance',
    title: 'Simulator Performance',
    description: 'Technical performance, frame rate, and system stability'
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
    placeholder: 'Enter your email or phone',
    required: false,
    type: 'email'
  }
];

function AddReviewScreen() {
  const params = useLocalSearchParams();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  
  // Theme hooks
  const { isDark } = useTheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: '#E0E0E0', dark: '#404040' }, 'text');
  const cardBackgroundColor = useThemeColor({ light: '#FFFFFF', dark: '#1E1E1E' }, 'background');
  const inputBackgroundColor = useThemeColor({ light: '#FFFFFF', dark: '#2A2A2A' }, 'background');
  
  // Performance optimization
  const { debounce, throttle, memoize, runAfterInteractions } = usePerformance();
  
  // Create dynamic styles - optimized with useMemo
  const styles = useMemo(() => 
    createStyles(backgroundColor, textColor, borderColor, cardBackgroundColor, inputBackgroundColor),
    [backgroundColor, textColor, borderColor, cardBackgroundColor, inputBackgroundColor]
  );
  
  // Rating categories state
  const [ratingCategories, setRatingCategories] = useState<RatingCategory[]>(defaultRatingCategories);
  
  // Personal info fields state
  const [personalInfoFields, setPersonalInfoFields] = useState<PersonalInfoField[]>(defaultPersonalInfoFields);
  
  // Initialize ratings based on current categories
  const initializeRatings = (categories: RatingCategory[]) => {
    const ratings: { [key: string]: number } = {};
    categories.forEach(category => {
      ratings[category.key] = 0;
    });
    return ratings;
  };
  
  // Initialize personal info based on current fields
  const initializePersonalInfo = (fields: PersonalInfoField[]) => {
    const personalInfo: { [key: string]: string } = {};
    fields.forEach(field => {
      personalInfo[field.key] = '';
    });
    return personalInfo;
  };
  
  const [formData, setFormData] = useState<FormData>({
    personalInfo: initializePersonalInfo(defaultPersonalInfoFields),
    ratings: initializeRatings(defaultRatingCategories),
    textComment: '',
    handwrittenComment: '',
    photos: [],
  });

  // Load rating categories from AsyncStorage
  useEffect(() => {
    const loadRatingCategories = async () => {
      try {
        // Initialize image storage system
        await initializeImageStorage();
        
        const saved = await AsyncStorage.getItem('admin_rating_categories');
        if (saved) {
          const categories = JSON.parse(saved);
          setRatingCategories(categories);
          // Update formData ratings to match loaded categories
          setFormData(prev => ({
            ...prev,
            ratings: initializeRatings(categories)
          }));
        }
      } catch (error) {
        console.error('Error loading rating categories:', error);
      }
    };
    
    loadRatingCategories();
  }, []);

  // Load personal info fields from AsyncStorage
  useEffect(() => {
    const loadPersonalInfoFields = async () => {
      try {
        const saved = await AsyncStorage.getItem('admin_personal_info_fields');
        if (saved) {
          const fields = JSON.parse(saved);
          setPersonalInfoFields(fields);
          // Update formData personal info to match loaded fields
          setFormData(prev => ({
            ...prev,
            personalInfo: initializePersonalInfo(fields)
          }));
        }
      } catch (error) {
        console.error('Error loading personal info fields:', error);
      }
    };
    
    loadPersonalInfoFields();
  }, []);

  // Handle edit data when returning from preview
  useEffect(() => {
    if (params.editData) {
      try {
        const editData = JSON.parse(params.editData as string);
        setFormData(editData);
        
        // Initialize Yes/No state variables based on existing data
        if (editData.personalInfo?.previousSimulatorExperience) {
          setHasSimulatorExperience('yes');
        }
        if (editData.personalInfo?.previousFlyingExperience) {
          setHasFlyingExperience('yes');
        }
      } catch (error) {
        console.error('Error parsing edit data:', error);
      }
    }
  }, [params.editData]);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  
  // New state variables for enhanced components
  const [professionQuery, setProfessionQuery] = useState('');
  const [filteredProfessions, setFilteredProfessions] = useState<string[]>([]);
  const [nationalityQuery, setNationalityQuery] = useState('');
  const [filteredNationalities, setFilteredNationalities] = useState<Country[]>([]);
  
  // Handwriting state variables
  const [commentMode, setCommentMode] = useState<'text' | 'handwriting'>('text');
  const [showHandwritingModal, setShowHandwritingModal] = useState(false);
  const signatureRef = useRef<any>(null);
  
  // Experience fields Yes/No state variables
  const [hasSimulatorExperience, setHasSimulatorExperience] = useState<'yes' | 'no' | ''>('');
  const [hasFlyingExperience, setHasFlyingExperience] = useState<'yes' | 'no' | ''>('');

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
    setFormData(prev => ({ ...prev, [field]: value }));
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
    const hasAllRatings = Object.values(formData.ratings).every(rating => rating > 0);
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
    
    const hasAllRatings = Object.values(formData.ratings).every(rating => rating > 0);
    if (!hasAllRatings) {
      setValidationMessage('Please provide ratings for all categories');
      setShowValidationDialog(true);
      return false;
    }
    
    return true;
  }, [formData.personalInfo, formData.ratings, personalInfoFields]);

  // Filter professions based on query - optimized with useCallback
  const filterProfessions = useCallback((query: string) => {
    if (query === '') {
      setFilteredProfessions([]);
      return;
    }
    
    const filtered = PROFESSIONS
      .filter(profession => profession !== 'Select Profession')
      .filter(profession => 
        profession.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 5); // Limit to 5 suggestions
    
    setFilteredProfessions(filtered);
  }, []);

  // Filter nationalities based on query - optimized with useCallback
  const filterNationalities = useCallback((query: string) => {
    if (query === '') {
      setFilteredNationalities([]);
      return;
    }
    
    const filtered = COUNTRIES
      .filter(country => country.name !== 'Select Nationality')
      .filter(country => 
        country.name.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 5); // Limit to 5 suggestions
    
    setFilteredNationalities(filtered);
  }, []);

  // Handle profession input change - optimized with useCallback
  const handleProfessionChange = useCallback((text: string) => {
    setProfessionQuery(text);
    updatePersonalInfo('profession', text);
    filterProfessions(text);
  }, [filterProfessions]);

  // Handle nationality input change - optimized with useCallback
  const handleNationalityChange = useCallback((text: string) => {
    setNationalityQuery(text);
    updatePersonalInfo('nationality', text);
    filterNationalities(text);
  }, [filterNationalities]);



  // Function to process signature - simplified for React Native
  const processSignature = async (signatureDataUrl: string): Promise<string> => {
    try {
      // For React Native, we'll use the signature as-is since it's already optimized
      // The signature canvas already provides a clean white background
      return signatureDataUrl;
    } catch (error) {
      console.error('Error processing signature:', error);
      throw error;
    }
  };

  // Handwriting functions
  const handleSignature = async (signature: string) => {
    try {
      // Save signature permanently (not to gallery to avoid permission dialogs)
      const permanentPath = await saveImagePermanently(signature, 'signature', true, false);
      
      updateFormData('handwrittenComment', permanentPath);
      setShowHandwritingModal(false);
    } catch (error) {
      console.error('Error saving signature permanently:', error);
      Alert.alert('Error', 'Failed to save handwritten comment. Please try again.');
      setShowHandwritingModal(false);
    }
  };

  const clearHandwriting = async () => {
    try {
      // Delete the existing signature file if it exists
      if (formData.handwrittenComment) {
        await deleteImagePermanently(formData.handwrittenComment);
      }
      
      // Clear the signature canvas and form data
      signatureRef.current?.clearSignature();
      updateFormData('handwrittenComment', '');
    } catch (error) {
      console.error('Error clearing handwriting:', error);
      // Still clear the UI even if file deletion fails
      signatureRef.current?.clearSignature();
      updateFormData('handwrittenComment', '');
    }
  };

  const openHandwritingModal = () => {
    setShowHandwritingModal(true);
  };

  const handleSubmit = () => {
    if (validateForm()) {
      // Navigate to preview screen with form data
      router.push({
        pathname: '/review-preview',
        params: { formData: JSON.stringify(formData) }
      });
    }
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

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1.0,
        exif: true,
      });

      if (!result.canceled && result.assets[0]) {
        const photoUri = result.assets[0].uri;
        
        try {
          // Save image permanently AND to gallery
          const permanentPath = await saveImagePermanently(photoUri, 'photo', true, true);
          const newPhotos = [...formData.photos, permanentPath];
          updateFormData('photos', newPhotos);
        } catch (error) {
          console.error('Error saving photo permanently:', error);
          Alert.alert('Error', 'Failed to save photo. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
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
          onChange={(rating) => updateRating(category, rating)}
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
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerTitles}>
              <ThemedText type="title" style={styles.title}>
                Add Flight Simulator Review
              </ThemedText>
            </View>
            <ThemeToggle />
          </View>
        </View>

        {/* Personal Information Section */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <ThemedText style={styles.sectionTitle}>Personal Information</ThemedText>
            
            {personalInfoFields.map((field) => {
              const fieldValue = formData.personalInfo[field.key] || '';
              
              // Special handling for nationality field with autocomplete
              if (field.key === 'nationality') {
                return (
                  <View key={field.id} style={styles.pickerContainer}>
                    <ThemedText style={styles.pickerLabel}>
                      {field.label}{field.required ? ' *' : ''}
                    </ThemedText>
                    <View style={{ position: 'relative', zIndex: 2 }}>
                      <TextInput
                        label={field.placeholder}
                        value={nationalityQuery}
                        onChangeText={handleNationalityChange}
                        style={styles.textInput}
                        mode="outlined"
                        accessibilityLabel={`${field.label} input field`}
                        accessibilityHint="Type to search for your nationality"
                        accessibilityRole="search"
                      />
                      
                      {filteredNationalities.length > 0 && (
                        <View style={styles.autocompleteContainer}>
                          <ScrollView 
                            style={styles.autocompleteList} 
                            nestedScrollEnabled
                            keyboardShouldPersistTaps="handled"
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
              
              // Special handling for profession field with autocomplete
              if (field.key === 'profession') {
                return (
                  <View key={field.id} style={styles.pickerContainer}>
                    <ThemedText style={styles.pickerLabel}>
                      {field.label}{field.required ? ' *' : ''}
                    </ThemedText>
                    <View style={{ position: 'relative', zIndex: 1 }}>
                      <TextInput
                        label={field.placeholder}
                        value={professionQuery}
                        onChangeText={handleProfessionChange}
                        style={styles.textInput}
                        mode="outlined"
                        accessibilityLabel={`${field.label} input field`}
                        accessibilityHint="Type to search for your profession"
                        accessibilityRole="search"
                      />
                      
                      {filteredProfessions.length > 0 && (
                        <View style={styles.autocompleteContainer}>
                          <ScrollView 
                            style={styles.autocompleteList} 
                            nestedScrollEnabled
                            keyboardShouldPersistTaps="handled"
                          >
                            {filteredProfessions.map((item) => (
                              <TouchableOpacity
                                key={item}
                                style={styles.autocompleteItem}
                                activeOpacity={0.7}
                                delayPressIn={0}
                                onPress={() => {
                                  setProfessionQuery(item);
                                  updatePersonalInfo(field.key, item);
                                  setFilteredProfessions([]);
                                }}
                              >
                                <ThemedText>{item}</ThemedText>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      )}
                    </View>
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
                        >
                          Yes
                        </Button>
                        <Button
                          mode={hasFlyingExperience === 'no' ? 'contained' : 'outlined'}
                          onPress={() => handleFlyingExperienceSelection('no')}
                          style={[styles.yesNoButton, { marginLeft: wp('2%') }]}
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
                    mode="outlined"
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
                      >
                        {yesText}
                      </Button>
                      <Button
                        mode={fieldValue === noText ? 'contained' : 'outlined'}
                        onPress={() => updatePersonalInfo(field.key, noText)}
                        style={[styles.yesNoButton, { marginLeft: wp('2%') }]}
                      >
                        {noText}
                      </Button>
                    </View>
                  </View>
                );
              }

              // Handle Scroll field type
              if (field.type === 'scroll') {
                return (
                  <View key={field.id} style={styles.pickerContainer}>
                    <ThemedText style={styles.pickerLabel}>
                      {field.label}{field.required ? ' *' : ''}
                    </ThemedText>
                    <View style={styles.scrollPickerWrapper}>
                      <Picker
                        selectedValue={fieldValue || ''}
                        onValueChange={(itemValue) => {
                          if (itemValue !== '') {
                            updatePersonalInfo(field.key, itemValue);
                          }
                        }}
                        style={styles.scrollPickerComponent}
                        mode="dropdown"
                      >
                        <Picker.Item label="Select an option..." value="" />
                        {(field.options || []).map((option, index) => (
                          <Picker.Item key={index} label={option} value={option} />
                        ))}
                      </Picker>
                    </View>
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
                  mode="outlined"
                  placeholder={field.placeholder}
                  accessibilityLabel={`${field.label} input field${field.required ? ', required' : ''}`}
                  accessibilityHint={`Enter your ${field.label.toLowerCase()}`}
                  accessibilityRole="text"
                  keyboardType={field.type === 'email' ? 'email-address' : field.type === 'phone' ? 'phone-pad' : 'default'}
                />
              );
            })}
          </Card.Content>
        </Card>

        {/* Ratings Section */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <ThemedText style={styles.sectionTitle}>Flight Simulator Ratings</ThemedText>
            <ThemedText style={styles.sectionSubtitle}>
              Rate each aspect from 1 to 5 stars
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
          </Card.Content>
        </Card>

        {/* Comments Section */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <ThemedText style={styles.sectionTitle}>Comments</ThemedText>
            
            {/* Comment Mode Selector */}
            <SegmentedButtons
              value={commentMode}
              onValueChange={(value) => setCommentMode(value as 'text' | 'handwriting')}
              buttons={[
                {
                  value: 'text',
                  label: 'Type',
                  icon: 'keyboard',
                },
                {
                  value: 'handwriting',
                  label: 'Handwrite',
                  icon: 'draw',
                },
              ]}
              style={styles.commentModeSelector}
            />

            {commentMode === 'text' ? (
              <TextInput
                label="Your detailed review"
                value={formData.textComment}
                onChangeText={(text) => updateFormData('textComment', text)}
                style={styles.textArea}
                mode="outlined"
                multiline
                numberOfLines={6}
                placeholder="Share your detailed experience with this flight simulator..."
              />
            ) : (
              <View style={styles.handwritingContainer}>
                {formData.handwrittenComment ? (
                  <View style={styles.handwritingPreview}>
                    <ThemedText style={styles.handwritingLabel}>Handwritten Comment:</ThemedText>
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
                        accessibilityLabel="Edit handwritten comment"
                        accessibilityHint="Opens handwriting canvas to edit your comment"
                        accessibilityRole="button"
                      >
                        Edit
                      </Button>
                      <Button
                        mode="outlined"
                        onPress={() => updateFormData('handwrittenComment', '')}
                        style={styles.clearHandwritingButton}
                        icon="delete"
                        accessibilityLabel="Clear handwritten comment"
                        accessibilityHint="Removes the current handwritten comment"
                        accessibilityRole="button"
                      >
                        Clear
                      </Button>
                    </View>
                  </View>
                ) : (
                  <Button
                    mode="contained"
                    onPress={openHandwritingModal}
                    style={styles.handwritingButton}
                    icon="draw"
                    accessibilityLabel="Start handwriting comment"
                    accessibilityHint="Opens handwriting canvas to write a comment"
                    accessibilityRole="button"
                  >
                    Start Handwriting
                  </Button>
                )}
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Photos Section */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <ThemedText style={styles.sectionTitle}>Add Photos</ThemedText>
            
            <View style={styles.photoButtonsContainer}>
              <Button
                mode="contained"
                onPress={takePhoto}
                style={styles.photoButton}
                icon="camera"
                accessibilityLabel="Take photo with camera"
                accessibilityHint="Opens camera to take a new photo"
                accessibilityRole="button"
              >
                Take Photo
              </Button>
              
              <Button
                mode="outlined"
                onPress={pickFromGallery}
                style={styles.photoButton}
                icon="image"
                accessibilityLabel="Select photo from gallery"
                accessibilityHint="Opens photo gallery to select an existing photo"
                accessibilityRole="button"
              >
                From Gallery
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
                    />
                  </View>
                ))}
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Submit Section */}
        <View style={styles.submitContainer}>
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
          >
            Submit Review
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => router.push('/')}
            style={styles.backButton}
            contentStyle={styles.backButtonContent}
          >
            Back to Home
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
                  contentFit="fill"
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

      {/* Handwriting Modal */}
      <Modal
        visible={showHandwritingModal}
        transparent={true}
        onRequestClose={() => setShowHandwritingModal(false)}
      >
        <View style={styles.handwritingModalContainer}>
          <View style={styles.handwritingModalContent}>
            <View style={styles.handwritingHeader}>
              <ThemedText style={styles.handwritingTitle}>Write Your Comment</ThemedText>
              <IconButton
                icon="close"
                size={wp('6%')}
                onPress={() => setShowHandwritingModal(false)}
                style={styles.handwritingCloseButton}
              />
            </View>
            <View style={styles.signatureContainer}>
              <SignatureCanvas
                ref={signatureRef}
                onOK={handleSignature}
                onEmpty={() => console.log('Signature is empty')}
                descriptionText=""
                clearText="Clear"
                confirmText="Save"
                backgroundColor="#FFFFFF"
                penColor="#000000"
                webStyle={`
                  .m-signature-pad {
                    box-shadow: none;
                    border: 1px solid #E0E0E0;
                    border-radius: 8px;
                    background-color: #FFFFFF !important;
                    width: 100vw !important;
                    height: 100vh !important;
                    max-width: 100% !important;
                    max-height: 100% !important;
                    position: absolute !important;
                    top: 0 !important;
                    left: 0 !important;
                  }
                  .m-signature-pad--body {
                    border: none;
                    background-color: #FFFFFF !important;
                    width: 100% !important;
                    height: 100% !important;
                    position: relative !important;
                  }
                  .m-signature-pad--body canvas {
                    background-color: #FFFFFF !important;
                    background: #FFFFFF !important;
                    width: 100% !important;
                    height: 100% !important;
                    position: absolute !important;
                    top: 0 !important;
                    left: 0 !important;
                  }
                  .m-signature-pad--footer {
                    display: none;
                  }
                  body {
                    background-color: #FFFFFF !important;
                  }
                `}
                style={styles.signatureCanvas}
              />
            </View>
            {/* Floating Action Buttons */}
            <View style={styles.floatingActions}>
              <Button
                mode="outlined"
                onPress={clearHandwriting}
                style={styles.floatingActionButton}
                compact
              >
                Clear
              </Button>
              <Button
                mode="contained"
                onPress={() => signatureRef.current?.readSignature()}
                style={styles.floatingActionButton}
                compact
              >
                Save
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Validation Dialog */}
      <Portal>
        <Dialog visible={showValidationDialog} onDismiss={() => setShowValidationDialog(false)}>
          <Dialog.Title>Validation Error</Dialog.Title>
          <Dialog.Content>
            <Paragraph>{validationMessage}</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowValidationDialog(false)}>OK</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ThemedView>
  );
}

// Export with React.memo for performance optimization
export default React.memo(AddReviewScreen);

const createStyles = (backgroundColor: string, textColor: string, borderColor: string, cardBackgroundColor: string, inputBackgroundColor: string) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: getDevicePadding().horizontal,
  },
  header: {
    alignItems: 'center',
    marginBottom: rs(24),
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    gap: rs(12),
  },
  headerTitles: {
    flex: 1,
  },
  title: {
    fontSize: rf(isTablet ? 28 : 24),
    textAlign: 'center',
    fontWeight: 'bold',
  },
  sectionCard: {
    marginBottom: hp('2%'),
    elevation: 2,
  },
  sectionTitle: {
    fontSize: rf(20),
    fontWeight: 'bold',
    lineHeight: rf(28),
    marginBottom: hp('1%'),
    paddingVertical: rf(2),
  },
  sectionSubtitle: {
    fontSize: rf(16),
    opacity: 0.7,
    lineHeight: rf(24),
    marginBottom: hp('1%'),
    paddingVertical: rf(2),
  },
  textInput: {
    marginBottom: hp('1.5%'),
  },
  textArea: {
    marginBottom: hp('1%'),
  },
  pickerContainer: {
    marginBottom: hp('1.5%'),
  },
  pickerLabel: {
    fontSize: rf(16),
    lineHeight: rf(24),
    marginBottom: hp('0.5%'),
    fontWeight: '500',
    flexShrink: 1,
    paddingHorizontal: wp('1%'),
    paddingVertical: rf(2),
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
    paddingVertical: rf(2),
  },
  ratingCard: {
    marginBottom: hp('1.5%'),
    elevation: 1,
  },
  ratingTitle: {
    fontSize: rf(18),
    lineHeight: rf(26),
    fontWeight: 'bold',
    marginBottom: hp('0.5%'),
    flexShrink: 1,
    paddingHorizontal: wp('2%'),
    paddingVertical: rf(2),
  },
  ratingDescription: {
    fontSize: rf(14),
    lineHeight: rf(22),
    opacity: 0.7,
    marginBottom: hp('1%'),
    flexShrink: 1,
    paddingHorizontal: wp('2%'),
    paddingVertical: rf(2),
  },
  starContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingValue: {
    fontSize: rf(16),
    lineHeight: rf(24),
    fontWeight: 'bold',
    minWidth: wp('12%'),
    textAlign: 'center',
    flexShrink: 1,
    paddingVertical: rf(2),
  },
  photoButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: hp('2%'),
  },
  photoButton: {
    flex: 0.45,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  photoContainer: {
    position: 'relative',
    marginBottom: rs(8),
    width: getPhotoGridSize(),
    minHeight: getPhotoGridSize() * 0.75,
    maxHeight: getPhotoGridSize() * 1.5,
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: rs(8),
  },
  removePhotoButton: {
    position: 'absolute',
    top: -rs(8),
    right: -rs(8),
    backgroundColor: 'red',
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
  },
  submitContainer: {
    marginTop: rs(16),
    marginBottom: rs(32),
  },
  submitButton: {
    marginBottom: rs(12),
    minHeight: minTouchTarget,
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
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    position: 'relative',
    width: '90%',
    height: '70%',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  closeModalButton: {
    position: 'absolute',
    top: hp('2%'),
    right: wp('2%'),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  autocompleteContainer: {
    position: 'absolute',
    top: hp('7%'),
    left: 0,
    right: 0,
    backgroundColor: cardBackgroundColor,
    borderWidth: 1,
    borderColor: borderColor,
    borderRadius: 4,
    maxHeight: hp('20%'),
    zIndex: 1000,
    elevation: 5,
  },
  autocompleteList: {
    maxHeight: hp('20%'),
  },
  autocompleteItem: {
    padding: hp('1.5%'),
    borderBottomWidth: 1,
    borderBottomColor: borderColor,
  },
  autocompleteItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagText: {
    fontSize: rf(18),
    lineHeight: rf(26),
    marginRight: wp('3%'),
    paddingVertical: rf(2),
  },
  countryText: {
    fontSize: rf(16),
    lineHeight: rf(24),
    flex: 1,
    paddingVertical: rf(2),
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  yesNoButton: {
    flex: 0.3,
    minWidth: wp('20%'),
  },
  scrollPickerWrapper: {
    borderWidth: 1,
    borderColor: borderColor,
    borderRadius: 8,
    backgroundColor: cardBackgroundColor,
    overflow: 'hidden',
  },
  scrollPickerComponent: {
    height: hp('6%'),
    width: '100%',
    color: textColor,
  },
  scrollPicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: borderColor,
    borderRadius: 8,
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
    backgroundColor: cardBackgroundColor,
  },
  scrollPickerText: {
    fontSize: rf(16),
    lineHeight: rf(24),
    flex: 1,
    paddingVertical: rf(2),
  },
  scrollPickerArrow: {
    fontSize: rf(14),
    lineHeight: rf(22),
    opacity: 0.6,
    paddingVertical: rf(2),
  },
  handwritingModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    paddingVertical: rf(2),
  },
  handwritingCloseButton: {
    margin: 0,
  },
  signatureContainer: {
    flex: 1,
  },
  signatureCanvas: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderWidth: 1,
    borderColor: borderColor,
    borderRadius: 8,
  },
  floatingActions: {
    position: 'absolute',
    bottom: wp('2%'),
    left: wp('2%'),
    right: wp('2%'),
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1000,
  },
  floatingActionButton: {
    minWidth: wp('20%'),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  editHandwritingButton: {
    marginRight: wp('2%'),
  },
  clearHandwritingButton: {
    marginLeft: wp('2%'),
  },
  handwritingButton: {
    marginTop: hp('1%'),
  },
  handwritingImage: {
    width: '100%',
    height: hp('20%'),
    borderRadius: 8,
    borderWidth: 1,
    borderColor: borderColor,
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
    fontSize: rf(16),
    lineHeight: rf(24),
    fontWeight: '500',
    marginBottom: hp('1%'),
    paddingVertical: rf(2),
  },
  handwritingImageContainer: {
    position: 'relative',
    marginBottom: hp('1%'),
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
    borderBottomColor: borderColor,
  },
});