import AsyncStorage from '@react-native-async-storage/async-storage';
import { Review } from './dataStorage';
import { initializeImageStorage, saveImagePermanently } from './imageStorage';

interface LegacyReview {
  id: string;
  ratings: { [key: string]: number };
  overallRating: number;
  textComment?: string;
  handwrittenComment?: string; // Base64 or file path
  photos: string[]; // Base64 or file paths
  personalInfo: { [key: string]: string };
  timestamp: number;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

export interface MigrationResult {
  success: boolean;
  migratedReviews: number;
  failedReviews: number;
  errors: string[];
}

/**
 * Checks if a string is Base64 encoded data
 */
function isBase64Image(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  
  // Check for data URL format
  if (str.startsWith('data:image/')) {
    return true;
  }
  
  // Check for raw Base64 (less common but possible)
  try {
    // Base64 strings should be divisible by 4 and contain only valid characters
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    return str.length % 4 === 0 && base64Regex.test(str) && str.length > 100;
  } catch {
    return false;
  }
}

/**
 * Converts Base64 image data to permanent file storage
 */
async function migrateBase64ToFile(base64Data: string, type: 'photo' | 'signature'): Promise<string> {
  try {
    // Call saveImagePermanently with the correct parameters
    const permanentPath = await saveImagePermanently(base64Data, type);
    return permanentPath;
  } catch (error) {
    console.error(`Error migrating ${type}:`, error);
    throw error;
  }
}

/**
 * Migrates a single review from legacy format to new format
 */
async function migrateSingleReview(legacyReview: LegacyReview): Promise<Review> {
  // Migrate photos
  const migratedPhotos: string[] = [];
  for (const photo of legacyReview.photos) {
    if (isBase64Image(photo)) {
      try {
        const permanentPath = await migrateBase64ToFile(photo, 'photo');
        migratedPhotos.push(permanentPath);
      } catch (error) {
        console.error('Failed to migrate photo:', error);
        // Skip this photo rather than failing the entire review
      }
    } else {
      // Already a file path, keep as is
      migratedPhotos.push(photo);
    }
  }
  
  // Migrate handwritten comment
  let migratedHandwrittenComment = legacyReview.handwrittenComment;
  if (legacyReview.handwrittenComment && isBase64Image(legacyReview.handwrittenComment)) {
    try {
      const permanentPath = await migrateBase64ToFile(legacyReview.handwrittenComment, 'signature');
      migratedHandwrittenComment = permanentPath;
    } catch (error) {
      console.error('Failed to migrate handwritten comment:', error);
      // Remove the handwritten comment rather than failing the entire review
      migratedHandwrittenComment = '';
    }
  }
  
  // Create the migrated review with proper Review interface structure
  const migratedReview: Review = {
    id: legacyReview.id,
    timestamp: legacyReview.timestamp,
    reviewType: 'professional',
    personalInfo: {
      name: legacyReview.personalInfo.name || '',
      email: legacyReview.personalInfo.email || '',
      profession: legacyReview.personalInfo.profession || '',
      nationality: legacyReview.personalInfo.nationality || ''
    },
    ratings: legacyReview.ratings,
    overallRating: legacyReview.overallRating,
    photos: migratedPhotos,
    handwrittenComment: migratedHandwrittenComment,
    textComment: legacyReview.textComment
  };
  
  return migratedReview;
}

/**
 * Performs data migration for all existing reviews
 */
export async function migrateExistingData(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    migratedReviews: 0,
    failedReviews: 0,
    errors: []
  };
  
  try {
    // Initialize image storage
    await initializeImageStorage();
    
    // Get all existing reviews
    const reviewsData = await AsyncStorage.getItem('reviews');
    if (!reviewsData) {
      result.success = true;
      return result; // No reviews to migrate
    }
    
    // Validate JSON before parsing
    if (typeof reviewsData !== 'string' || reviewsData.trim() === '') {
      console.warn('Invalid reviews data format during migration, clearing corrupted data');
      await AsyncStorage.removeItem('reviews');
      result.success = true;
      return result;
    }
    
    let legacyReviews: LegacyReview[];
    try {
      legacyReviews = JSON.parse(reviewsData);
    } catch (parseError) {
      console.error('Failed to parse reviews data during migration, clearing corrupted data:', parseError);
      await AsyncStorage.removeItem('reviews');
      result.errors.push('Corrupted data cleared due to JSON parse error');
      result.success = true;
      return result;
    }
    
    // Ensure reviews is an array
    if (!Array.isArray(legacyReviews)) {
      console.warn('Reviews data is not an array during migration, clearing corrupted data');
      await AsyncStorage.removeItem('reviews');
      result.errors.push('Invalid data format cleared');
      result.success = true;
      return result;
    }
    const migratedReviews: Review[] = [];
    
    console.log(`Starting migration of ${legacyReviews.length} reviews...`);
    
    for (const legacyReview of legacyReviews) {
      try {
        const migratedReview = await migrateSingleReview(legacyReview);
        migratedReviews.push(migratedReview);
        result.migratedReviews++;
        console.log(`Migrated review: ${migratedReview.id}`);
      } catch (error) {
        result.failedReviews++;
        const errorMsg = `Failed to migrate review ${legacyReview.id}: ${error}`;
        result.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }
    
    // Save migrated reviews back to AsyncStorage
    if (migratedReviews.length > 0) {
      await AsyncStorage.setItem('reviews', JSON.stringify(migratedReviews));
      console.log(`Migration completed: ${result.migratedReviews} reviews migrated successfully`);
    }
    
    result.success = true;
    return result;
    
  } catch (error) {
    const errorMsg = `Migration failed: ${error}`;
    result.errors.push(errorMsg);
    console.error(errorMsg);
    return result;
  }
}

/**
 * Checks if migration is needed by looking for Base64 data in existing reviews
 */
export async function isMigrationNeeded(): Promise<boolean> {
  try {
    const reviewsData = await AsyncStorage.getItem('reviews');
    if (!reviewsData) return false;
    
    // Validate JSON before parsing
    if (typeof reviewsData !== 'string' || reviewsData.trim() === '') {
      console.warn('Invalid reviews data format, clearing corrupted data');
      await AsyncStorage.removeItem('reviews');
      return false;
    }
    
    // Debug: Log first few characters to identify the issue
    console.log('Reviews data first 50 chars:', reviewsData.substring(0, 50));
    console.log('Reviews data char codes:', reviewsData.substring(0, 10).split('').map(c => c.charCodeAt(0)));
    
    // Data may be obfuscated; ignore migration if encrypted
    if (/^[A-Za-z0-9+/=]+$/.test(reviewsData.substring(0, 50))) {
      // Looks base64-like; assume our encrypted format and skip migration
      return false;
    }

    let reviews: LegacyReview[];
    try {
      const cleanedData = reviewsData.trim().replace(/^\uFEFF/, '');
      reviews = JSON.parse(cleanedData);
    } catch (parseError) {
      console.error('Failed to parse reviews data, clearing corrupted data:', parseError);
      console.error('Raw data length:', reviewsData.length);
      console.error('First 100 chars:', reviewsData.substring(0, 100));
      await AsyncStorage.removeItem('reviews');
      return false;
    }
    
    // Ensure reviews is an array
    if (!Array.isArray(reviews)) {
      console.warn('Reviews data is not an array, clearing corrupted data');
      await AsyncStorage.removeItem('reviews');
      return false;
    }
    
    for (const review of reviews) {
      // Ensure review has required properties
      if (!review || typeof review !== 'object' || !review.photos) {
        continue;
      }
      
      // Check photos for Base64 data
      if (Array.isArray(review.photos)) {
        for (const photo of review.photos) {
          if (isBase64Image(photo)) {
            return true;
          }
        }
      }
      
      // Check handwritten comment for Base64 data
      if (review.handwrittenComment && isBase64Image(review.handwrittenComment)) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking migration status:', error);
    return false;
  }
}

/**
 * Gets migration statistics without performing migration
 */
export async function getMigrationStats(): Promise<{
  totalReviews: number;
  reviewsNeedingMigration: number;
  base64Photos: number;
  base64Signatures: number;
}> {
  const stats = {
    totalReviews: 0,
    reviewsNeedingMigration: 0,
    base64Photos: 0,
    base64Signatures: 0
  };
  
  try {
    const reviewsData = await AsyncStorage.getItem('reviews');
    if (!reviewsData) return stats;
    
    // Validate JSON before parsing
    if (typeof reviewsData !== 'string' || reviewsData.trim() === '') {
      console.warn('Invalid reviews data format in getMigrationStats');
      return stats;
    }
    
    let reviews: LegacyReview[];
    try {
      reviews = JSON.parse(reviewsData);
    } catch (parseError) {
      console.error('Failed to parse reviews data in getMigrationStats:', parseError);
      return stats;
    }
    
    // Ensure reviews is an array
    if (!Array.isArray(reviews)) {
      console.warn('Reviews data is not an array in getMigrationStats');
      return stats;
    }
    stats.totalReviews = reviews.length;
    
    for (const review of reviews) {
      let reviewNeedsMigration = false;
      
      // Count Base64 photos
      for (const photo of review.photos) {
        if (isBase64Image(photo)) {
          stats.base64Photos++;
          reviewNeedsMigration = true;
        }
      }
      
      // Count Base64 signatures
      if (review.handwrittenComment && isBase64Image(review.handwrittenComment)) {
        stats.base64Signatures++;
        reviewNeedsMigration = true;
      }
      
      if (reviewNeedsMigration) {
        stats.reviewsNeedingMigration++;
      }
    }
    
    return stats;
  } catch (error) {
    console.error('Error getting migration stats:', error);
    return stats;
  }
}