# Code Comments and Explanations

## Overview

This document provides detailed explanations and comments for complex parts of the ReviewsApp codebase. It serves as a guide for understanding the application's architecture, design decisions, and implementation details.

## Core Application Structure

### App Layout (`app/_layout.tsx`)

```typescript
/**
 * Root Layout Component
 * 
 * This is the main entry point for the application that sets up:
 * 1. Theme provider for consistent styling across the app
 * 2. Navigation structure using Expo Router
 * 3. Global app configuration and initialization
 * 
 * Key Design Decisions:
 * - Uses CustomThemeProvider for theme management
 * - Implements stack navigation as the root navigator
 * - Handles app-wide initialization and setup
 */

// The RootLayout component wraps the entire app
export default function RootLayout() {
  return (
    <CustomThemeProvider>
      {/* AppContent contains the actual navigation structure */}
      <AppContent />
    </CustomThemeProvider>
  );
}

/**
 * AppContent Component
 * 
 * Handles the main navigation structure:
 * - Sets up the stack navigator
 * - Configures screen options and headers
 * - Manages navigation state and transitions
 */
```

**Why this structure?**
- Separates theme management from navigation logic
- Allows for easy theme switching without affecting navigation
- Provides a clean separation of concerns

### Tab Navigation (`app/(tabs)/_layout.tsx`)

```typescript
/**
 * Tab Navigation Layout
 * 
 * Currently implements a single-tab structure, but designed for expansion:
 * 1. Home tab with flight simulator icon
 * 2. Easily extensible for additional tabs (Reviews, Admin, Settings)
 * 3. Uses IconSymbol for consistent iconography
 * 
 * Design Rationale:
 * - Single tab keeps the UI simple for current use case
 * - Structure allows for easy addition of more tabs
 * - Icon system is consistent and scalable
 */

const TabLayout = () => {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={28} name="airplane" color={color} />
          ),
        }}
      />
    </Tabs>
  );
};
```

**Why single tab?**
- Keeps navigation simple for users
- Reduces cognitive load
- Easy to expand when needed

## Data Management Layer

### Review Storage (`storage/reviewStorage.js`)

```typescript
/**
 * Review Storage Module
 * 
 * Handles all data persistence operations for flight simulator reviews.
 * Uses AsyncStorage as the primary storage mechanism.
 * 
 * Key Features:
 * 1. CRUD operations for reviews
 * 2. Data validation and sanitization
 * 3. Export/import functionality
 * 4. Unique ID generation
 * 5. Error handling and recovery
 * 
 * Storage Structure:
 * {
 *   id: string,           // Unique identifier
 *   timestamp: number,    // Creation timestamp
 *   personalInfo: {...},  // User personal information
 *   ratings: {...},       // Rating categories and scores
 *   images: string[],     // Base64 encoded images (TODO: move to FileSystem)
 *   signature: string,    // Base64 encoded signature
 *   metadata: {...}       // Additional metadata
 * }
 */

const STORAGE_KEY = 'flight_simulator_reviews';

/**
 * Generates a unique ID for reviews
 * 
 * Uses timestamp + random string for uniqueness
 * Format: timestamp-randomString
 * 
 * @returns {string} Unique identifier
 */
const generateId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${timestamp}-${random}`;
};

/**
 * Retrieves all reviews from storage
 * 
 * Handles data validation and migration:
 * 1. Parses JSON data safely
 * 2. Validates data structure
 * 3. Applies any necessary migrations
 * 4. Returns empty array if no data or errors
 * 
 * @returns {Promise<Array>} Array of review objects
 */
const getReviews = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const reviews = JSON.parse(data);
    
    // Validate data structure
    if (!Array.isArray(reviews)) {
      console.warn('Invalid reviews data structure, resetting...');
      return [];
    }
    
    // Apply data migrations if needed
    return reviews.map(review => migrateReviewData(review));
  } catch (error) {
    console.error('Error retrieving reviews:', error);
    return [];
  }
};

/**
 * Saves a new review to storage
 * 
 * Process:
 * 1. Validates review data structure
 * 2. Generates unique ID and timestamp
 * 3. Adds metadata (version, device info, etc.)
 * 4. Appends to existing reviews
 * 5. Saves to AsyncStorage
 * 
 * @param {Object} reviewData - The review data to save
 * @returns {Promise<string>} The generated review ID
 */
const saveReview = async (reviewData) => {
  try {
    // Validate required fields
    if (!reviewData.personalInfo || !reviewData.ratings) {
      throw new Error('Missing required review data');
    }
    
    const reviews = await getReviews();
    const id = generateId();
    
    const review = {
      id,
      timestamp: Date.now(),
      ...reviewData,
      metadata: {
        version: '1.0',
        platform: Platform.OS,
        appVersion: Constants.expoConfig?.version || '1.0.0',
        createdAt: new Date().toISOString()
      }
    };
    
    reviews.push(review);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
    
    return id;
  } catch (error) {
    console.error('Error saving review:', error);
    throw error;
  }
};
```

**Why AsyncStorage?**
- Simple key-value storage suitable for app's needs
- No complex queries required
- Offline-first approach
- Easy to implement and maintain

**Limitations and Future Improvements:**
- Size limitations for large datasets
- No indexing or complex queries
- Base64 image storage is inefficient
- Consider SQLite for complex queries or large datasets

### Theme Management (`contexts/ThemeContext.tsx`)

```typescript
/**
 * Theme Context Provider
 * 
 * Manages application-wide theme state and persistence.
 * Supports three theme modes:
 * 1. 'light' - Light theme
 * 2. 'dark' - Dark theme  
 * 3. 'system' - Follow system preference
 * 
 * Features:
 * - Persistent theme preference storage
 * - System theme detection and following
 * - Smooth theme transitions
 * - Type-safe theme access
 * 
 * Implementation Details:
 * - Uses AsyncStorage for persistence
 * - Listens to system theme changes
 * - Provides theme toggle functionality
 * - Ensures theme consistency across app restarts
 */

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

/**
 * Custom hook for accessing theme context
 * 
 * Provides type-safe access to theme state and functions.
 * Throws error if used outside of ThemeProvider.
 * 
 * @returns {ThemeContextType} Theme context value
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * Theme Provider Component
 * 
 * Manages theme state and provides it to child components.
 * Handles:
 * 1. Initial theme loading from storage
 * 2. System theme change detection
 * 3. Theme persistence
 * 4. Theme state updates
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const colorScheme = useColorScheme();
  
  // Calculate effective theme based on current setting and system preference
  const effectiveTheme = theme === 'system' ? (colorScheme ?? 'light') : theme;
  
  // Load saved theme preference on app start
  useEffect(() => {
    loadTheme();
  }, []);
  
  // Save theme preference when it changes
  const setTheme = useCallback(async (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem('theme', newTheme);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  }, []);
  
  // Toggle between light and dark themes
  const toggleTheme = useCallback(() => {
    const newTheme = effectiveTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [effectiveTheme, setTheme]);
  
  const value = {
    theme,
    effectiveTheme,
    setTheme,
    toggleTheme,
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
```

**Why this approach?**
- Provides consistent theming across the app
- Supports system theme following
- Persists user preference
- Type-safe theme access

## Responsive Design System

### Responsive Utilities (`utils/responsive.ts`)

```typescript
/**
 * Responsive Design Utilities
 * 
 * Provides a comprehensive system for creating responsive layouts
 * that work across different device sizes and orientations.
 * 
 * Key Features:
 * 1. Device type detection (phone, tablet, large tablet)
 * 2. Responsive width/height calculations
 * 3. Font scaling with device-specific adjustments
 * 4. Spacing calculations
 * 5. Accessibility considerations (minimum touch targets)
 * 
 * Design Philosophy:
 * - Mobile-first approach
 * - Consistent scaling across devices
 * - Accessibility compliance
 * - Performance optimized
 */

/**
 * Device Detection Functions
 * 
 * These functions help identify device types for responsive design.
 * Based on screen dimensions and pixel density.
 */

/**
 * Detects if device is a small phone (< 375px width)
 * Used for: Compact layouts, smaller fonts, reduced spacing
 */
export const isSmallPhone = (): boolean => {
  const { width } = Dimensions.get('window');
  return width < 375;
};

/**
 * Detects if device is a tablet (> 768px width)
 * Used for: Multi-column layouts, larger touch targets
 */
export const isTablet = (): boolean => {
  const { width } = Dimensions.get('window');
  return width >= 768;
};

/**
 * Detects if device is a large tablet (> 1024px width)
 * Used for: Desktop-like layouts, maximum content width
 */
export const isLargeTablet = (): boolean => {
  const { width } = Dimensions.get('window');
  return width >= 1024;
};

/**
 * Responsive Width Percentage
 * 
 * Converts percentage to actual width pixels.
 * Includes device-specific adjustments for optimal layouts.
 * 
 * @param percentage - Width percentage (0-100)
 * @returns Calculated width in pixels
 */
export const wp = (percentage: number): number => {
  const { width } = Dimensions.get('window');
  const value = (percentage * width) / 100;
  
  // Apply device-specific adjustments
  if (isLargeTablet()) {
    // Limit maximum width on large tablets for better readability
    return Math.min(value, width * 0.8);
  }
  
  if (isTablet()) {
    // Slightly reduce width on tablets for better proportions
    return value * 0.95;
  }
  
  return value;
};

/**
 * Responsive Height Percentage
 * 
 * Converts percentage to actual height pixels.
 * Accounts for safe areas and navigation bars.
 * 
 * @param percentage - Height percentage (0-100)
 * @returns Calculated height in pixels
 */
export const hp = (percentage: number): number => {
  const { height } = Dimensions.get('window');
  const value = (percentage * height) / 100;
  
  // Account for device-specific UI elements
  if (Platform.OS === 'ios') {
    // Account for iOS status bar and home indicator
    return value * 0.92;
  }
  
  return value;
};

/**
 * Responsive Font Scaling
 * 
 * Scales font sizes based on device size and user preferences.
 * Ensures readability across all devices while maintaining design consistency.
 * 
 * @param size - Base font size
 * @returns Scaled font size
 */
export const rf = (size: number): number => {
  const { width } = Dimensions.get('window');
  const baseWidth = 375; // iPhone X width as baseline
  const scale = width / baseWidth;
  
  let scaledSize = size * scale;
  
  // Device-specific adjustments
  if (isSmallPhone()) {
    // Slightly smaller fonts on small phones
    scaledSize *= 0.95;
  } else if (isTablet()) {
    // Larger fonts on tablets for better readability
    scaledSize *= 1.1;
  } else if (isLargeTablet()) {
    // Even larger fonts on large tablets
    scaledSize *= 1.2;
  }
  
  // Ensure minimum and maximum font sizes for accessibility
  const minSize = 12;
  const maxSize = 40;
  
  return Math.max(minSize, Math.min(maxSize, scaledSize));
};

/**
 * Responsive Spacing
 * 
 * Calculates spacing values that scale appropriately across devices.
 * Maintains visual hierarchy and touch target accessibility.
 * 
 * @param size - Base spacing size
 * @returns Scaled spacing value
 */
export const rs = (size: number): number => {
  const { width } = Dimensions.get('window');
  const baseWidth = 375;
  const scale = width / baseWidth;
  
  let scaledSize = size * scale;
  
  // Device-specific spacing adjustments
  if (isTablet()) {
    // More generous spacing on tablets
    scaledSize *= 1.2;
  }
  
  // Ensure minimum spacing for touch targets
  const minSpacing = 4;
  return Math.max(minSpacing, scaledSize);
};

/**
 * Minimum Touch Target Size
 * 
 * Ensures all interactive elements meet accessibility guidelines.
 * Based on Apple and Google accessibility standards.
 */
export const minTouchTarget = 44;

/**
 * Device-Specific Padding
 * 
 * Provides appropriate padding for different device types.
 * Accounts for screen edges and safe areas.
 * 
 * @returns Padding object with device-appropriate values
 */
export const getDevicePadding = () => {
  if (isLargeTablet()) {
    return {
      horizontal: wp(8),
      vertical: hp(4),
    };
  }
  
  if (isTablet()) {
    return {
      horizontal: wp(6),
      vertical: hp(3),
    };
  }
  
  return {
    horizontal: wp(4),
    vertical: hp(2),
  };
};
```

**Why this approach?**
- Provides consistent scaling across devices
- Maintains accessibility standards
- Optimizes for different screen sizes
- Easy to use and maintain

## Form Management System

### Add Review Form (`app/add-review.tsx`)

```typescript
/**
 * Add Review Form Component
 * 
 * Complex form for creating flight simulator reviews.
 * Handles multiple data types and user interactions.
 * 
 * Key Features:
 * 1. Multi-step form with validation
 * 2. Image capture and management
 * 3. Signature capture
 * 4. Dynamic rating categories
 * 5. Personal information collection
 * 6. Form state persistence
 * 7. Responsive design
 * 
 * Form Structure:
 * - Personal Information Section
 * - Rating Categories Section
 * - Image Upload Section
 * - Signature Section
 * - Comments Section
 * 
 * State Management:
 * - Uses multiple useState hooks for different form sections
 * - Implements form validation
 * - Handles async operations (image processing, storage)
 */

interface FormData {
  personalInfo: { [key: string]: string };
  ratings: { [key: string]: number };
  images: string[];
  signature: string;
  comments: string;
}

/**
 * Form Validation System
 * 
 * Validates form data before submission.
 * Provides user feedback for validation errors.
 */
const validateForm = (formData: FormData): ValidationResult => {
  const errors: string[] = [];
  
  // Validate required personal information
  const requiredFields = ['fullName', 'email'];
  requiredFields.forEach(field => {
    if (!formData.personalInfo[field]?.trim()) {
      errors.push(`${field} is required`);
    }
  });
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (formData.personalInfo.email && !emailRegex.test(formData.personalInfo.email)) {
    errors.push('Please enter a valid email address');
  }
  
  // Validate ratings
  Object.entries(formData.ratings).forEach(([category, rating]) => {
    if (rating < 1 || rating > 5) {
      errors.push(`Rating for ${category} must be between 1 and 5`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Image Handling System
 * 
 * Manages image capture, selection, and processing.
 * Supports both camera capture and gallery selection.
 */
const handleImageSelection = async (type: 'camera' | 'gallery') => {
  try {
    // Request appropriate permissions
    if (type === 'camera') {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Gallery permission is required to select photos.');
        return;
      }
    }
    
    // Configure image picker options
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8, // Compress to reduce file size
    };
    
    // Launch appropriate picker
    const result = type === 'camera' 
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
    
    if (!result.canceled && result.assets[0]) {
      // Process and add image
      const imageUri = result.assets[0].uri;
      await processAndAddImage(imageUri);
    }
  } catch (error) {
    console.error('Error selecting image:', error);
    Alert.alert('Error', 'Failed to select image. Please try again.');
  }
};

/**
 * Form Submission Handler
 * 
 * Processes form data and saves to storage.
 * Handles validation, data transformation, and error handling.
 */
const handleSubmit = async () => {
  try {
    setIsSubmitting(true);
    
    // Validate form data
    const validation = validateForm(formData);
    if (!validation.isValid) {
      Alert.alert('Validation Error', validation.errors.join('\n'));
      return;
    }
    
    // Transform data for storage
    const reviewData = {
      personalInfo: formData.personalInfo,
      ratings: formData.ratings,
      images: formData.images,
      signature: formData.signature,
      comments: formData.comments,
      submittedAt: new Date().toISOString(),
    };
    
    // Save to storage
    const reviewId = await saveReview(reviewData);
    
    // Show success message
    Alert.alert(
      'Success',
      'Review submitted successfully!',
      [
        {
          text: 'OK',
          onPress: () => {
            // Reset form and navigate
            resetForm();
            router.push('/reviews-list');
          }
        }
      ]
    );
    
  } catch (error) {
    console.error('Error submitting review:', error);
    Alert.alert('Error', 'Failed to submit review. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};
```

**Why this structure?**
- Separates concerns (validation, image handling, submission)
- Provides clear error handling and user feedback
- Maintains form state consistency
- Handles async operations properly

## Component Architecture

### Responsive Layout System (`components/ResponsiveLayout.tsx`)

```typescript
/**
 * Responsive Layout Components
 * 
 * Provides a set of layout components that automatically adapt
 * to different screen sizes and orientations.
 * 
 * Components:
 * 1. ResponsiveLayout - Main container with responsive padding
 * 2. ResponsiveGrid - Dynamic grid system
 * 3. ResponsiveCard - Consistent card component
 * 
 * Design Principles:
 * - Mobile-first responsive design
 * - Consistent spacing and proportions
 * - Accessibility compliance
 * - Performance optimized
 */

/**
 * ResponsiveLayout Component
 * 
 * Main container component that provides:
 * - Responsive padding based on device size
 * - Safe area handling
 * - Scroll behavior management
 * - Consistent background styling
 */
interface ResponsiveLayoutProps {
  children: React.ReactNode;
  scrollable?: boolean;
  centered?: boolean;
  backgroundColor?: string;
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  scrollable = true,
  centered = false,
  backgroundColor,
  padding = 'medium'
}) => {
  const { effectiveTheme } = useTheme();
  const colors = Colors[effectiveTheme];
  
  // Calculate responsive padding
  const getPadding = () => {
    const devicePadding = getDevicePadding();
    
    switch (padding) {
      case 'none': return 0;
      case 'small': return devicePadding.horizontal * 0.5;
      case 'large': return devicePadding.horizontal * 1.5;
      default: return devicePadding.horizontal;
    }
  };
  
  const containerStyle = {
    flex: 1,
    backgroundColor: backgroundColor || colors.background,
    paddingHorizontal: getPadding(),
    paddingVertical: getDevicePadding().vertical,
  };
  
  const contentStyle = {
    flexGrow: 1,
    ...(centered && {
      justifyContent: 'center',
      alignItems: 'center',
    }),
  };
  
  if (scrollable) {
    return (
      <ScrollView 
        style={containerStyle}
        contentContainerStyle={contentStyle}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    );
  }
  
  return (
    <View style={[containerStyle, contentStyle]}>
      {children}
    </View>
  );
};

/**
 * ResponsiveGrid Component
 * 
 * Dynamic grid system that adjusts columns based on device size.
 * Automatically calculates item widths and spacing.
 */
interface ResponsiveGridProps {
  children: React.ReactNode[];
  minItemWidth?: number;
  spacing?: number;
  maxColumns?: number;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  minItemWidth = 150,
  spacing = rs(16),
  maxColumns = 4
}) => {
  const screenWidth = wp(100);
  
  // Calculate optimal number of columns
  const calculateColumns = () => {
    const availableWidth = screenWidth - (spacing * 2); // Account for container padding
    const possibleColumns = Math.floor(availableWidth / (minItemWidth + spacing));
    return Math.min(Math.max(1, possibleColumns), maxColumns);
  };
  
  const columns = calculateColumns();
  const itemWidth = (screenWidth - (spacing * (columns + 1))) / columns;
  
  // Group children into rows
  const rows = [];
  for (let i = 0; i < children.length; i += columns) {
    rows.push(children.slice(i, i + columns));
  }
  
  return (
    <View style={{ padding: spacing / 2 }}>
      {rows.map((row, rowIndex) => (
        <View 
          key={rowIndex}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: spacing,
          }}
        >
          {row.map((child, itemIndex) => (
            <View 
              key={itemIndex}
              style={{
                width: itemWidth,
                marginHorizontal: spacing / 2,
              }}
            >
              {child}
            </View>
          ))}
          {/* Fill empty spaces in last row */}
          {row.length < columns && 
            Array.from({ length: columns - row.length }).map((_, index) => (
              <View 
                key={`empty-${index}`}
                style={{ width: itemWidth, marginHorizontal: spacing / 2 }}
              />
            ))
          }
        </View>
      ))}
    </View>
  );
};
```

**Why this approach?**
- Provides consistent layouts across devices
- Automatically adapts to screen size changes
- Maintains design system consistency
- Easy to use and customize

## Performance Optimization Patterns

### Memory Management

```typescript
/**
 * Memory Management Best Practices
 * 
 * The app implements several patterns to optimize memory usage:
 * 
 * 1. Component Cleanup
 * 2. Image Memory Management
 * 3. Event Listener Cleanup
 * 4. State Optimization
 */

// Example: Proper useEffect cleanup
useEffect(() => {
  let isMounted = true;
  
  const loadData = async () => {
    try {
      const data = await fetchData();
      if (isMounted) {
        setData(data);
      }
    } catch (error) {
      if (isMounted) {
        setError(error);
      }
    }
  };
  
  loadData();
  
  // Cleanup function
  return () => {
    isMounted = false;
  };
}, []);

// Example: Image memory optimization
const optimizeImage = async (imageUri: string): Promise<string> => {
  try {
    // Compress image to reduce memory usage
    const compressedImage = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        { resize: { width: 800 } }, // Limit width to 800px
      ],
      {
        compress: 0.7, // 70% quality
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
    
    return compressedImage.uri;
  } catch (error) {
    console.error('Image optimization failed:', error);
    return imageUri; // Return original if optimization fails
  }
};
```

### State Optimization

```typescript
/**
 * State Optimization Patterns
 * 
 * The app uses several patterns to optimize state management:
 * 
 * 1. State Splitting
 * 2. Memoization
 * 3. Callback Optimization
 * 4. Conditional Rendering
 */

// Example: State splitting for better performance
const useFormState = () => {
  // Split large form state into smaller pieces
  const [personalInfo, setPersonalInfo] = useState({});
  const [ratings, setRatings] = useState({});
  const [images, setImages] = useState([]);
  const [signature, setSignature] = useState('');
  
  // Memoized form data
  const formData = useMemo(() => ({
    personalInfo,
    ratings,
    images,
    signature,
  }), [personalInfo, ratings, images, signature]);
  
  // Optimized update functions
  const updatePersonalInfo = useCallback((field: string, value: string) => {
    setPersonalInfo(prev => ({ ...prev, [field]: value }));
  }, []);
  
  const updateRating = useCallback((category: string, rating: number) => {
    setRatings(prev => ({ ...prev, [category]: rating }));
  }, []);
  
  return {
    formData,
    updatePersonalInfo,
    updateRating,
    // ... other functions
  };
};
```

## Error Handling Patterns

### Global Error Boundary

```typescript
/**
 * Error Boundary Implementation
 * 
 * Provides graceful error handling throughout the app.
 * Prevents app crashes and provides user-friendly error messages.
 */

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }
  
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Log error to crash reporting service
    // logErrorToService(error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback 
          error={this.state.error}
          resetError={() => this.setState({ hasError: false, error: null, errorInfo: null })}
        />
      );
    }
    
    return this.props.children;
  }
}

/**
 * Error Fallback Component
 * 
 * Displays user-friendly error message with recovery options.
 */
const ErrorFallback: React.FC<{
  error: Error | null;
  resetError: () => void;
}> = ({ error, resetError }) => {
  return (
    <ResponsiveLayout centered>
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
        <Text style={styles.errorMessage}>
          We're sorry for the inconvenience. Please try again.
        </Text>
        
        {__DEV__ && error && (
          <Text style={styles.errorDetails}>
            {error.message}
          </Text>
        )}
        
        <TouchableOpacity style={styles.retryButton} onPress={resetError}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    </ResponsiveLayout>
  );
};
```

## Security Considerations

### Data Protection

```typescript
/**
 * Data Protection Patterns
 * 
 * The app implements several security measures:
 * 
 * 1. Input Sanitization
 * 2. Data Validation
 * 3. Secure Storage (for sensitive data)
 * 4. Privacy Protection
 */

// Example: Input sanitization
const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
};

// Example: Data validation
const validatePersonalInfo = (info: PersonalInfo): ValidationResult => {
  const errors: string[] = [];
  
  // Validate email
  if (info.email && !isValidEmail(info.email)) {
    errors.push('Invalid email format');
  }
  
  // Validate phone number
  if (info.phone && !isValidPhoneNumber(info.phone)) {
    errors.push('Invalid phone number format');
  }
  
  // Check for suspicious patterns
  if (containsSuspiciousContent(info)) {
    errors.push('Invalid content detected');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Example: Secure storage for sensitive data
const storeSecureData = async (key: string, value: string) => {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error('Failed to store secure data:', error);
    throw new Error('Failed to store sensitive information');
  }
};
```

## Testing Considerations

### Component Testing Strategy

```typescript
/**
 * Testing Strategy
 * 
 * The app should implement comprehensive testing:
 * 
 * 1. Unit Tests - Individual functions and utilities
 * 2. Component Tests - UI components and interactions
 * 3. Integration Tests - Data flow and navigation
 * 4. E2E Tests - Complete user workflows
 */

// Example: Component test structure
describe('AddReviewForm', () => {
  it('should validate required fields', () => {
    // Test form validation
  });
  
  it('should handle image selection', () => {
    // Test image handling
  });
  
  it('should submit form successfully', () => {
    // Test form submission
  });
  
  it('should handle errors gracefully', () => {
    // Test error handling
  });
});

// Example: Storage test structure
describe('ReviewStorage', () => {
  it('should save and retrieve reviews', () => {
    // Test CRUD operations
  });
  
  it('should handle data migration', () => {
    // Test data migration
  });
  
  it('should validate data integrity', () => {
    // Test data validation
  });
});
```

## Conclusion

This codebase demonstrates several good practices:

1. **Modular Architecture** - Clear separation of concerns
2. **Responsive Design** - Comprehensive device support
3. **Type Safety** - TypeScript usage throughout
4. **Error Handling** - Graceful error management
5. **Performance Optimization** - Memory and state management

Areas for improvement include:
1. **Testing Coverage** - Add comprehensive tests
2. **Data Storage** - Optimize image storage
3. **State Management** - Consider centralized state
4. **Performance** - Implement virtualization for large lists
5. **Security** - Add input sanitization and validation

The code is well-structured and follows React Native best practices, making it maintainable and scalable for future development.