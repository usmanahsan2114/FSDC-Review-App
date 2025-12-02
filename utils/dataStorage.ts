import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { decryptObject, encryptObject, isEncrypted } from './encryption';
import {
    batchMigrateImages,
    cleanupOrphanedImages,
    deleteImagePermanently,
    getAllStoredImages,
    saveImagePermanently
} from './imageStorage';

/**
 * Optimized Data Storage Utility
 * 
 * This utility manages review data with permanent image storage and optimized AsyncStorage usage.
 * It reduces AsyncStorage size by storing only image references instead of Base64 data.
 */

// Storage keys
const REVIEWS_KEY = 'reviews';
const STORAGE_VERSION_KEY = 'storage_version';
const CURRENT_STORAGE_VERSION = '2.0';

// Types
export interface Review {
  id: string;
  timestamp: number;
  reviewType: 'professional' | 'joyride'; // Type of review: professional or joyride
  personalInfo: { [key: string]: string };
  ratings: {
    [key: string]: number;
  };
  overallRating: number;
  handwrittenComment?: string; // Now stores file path instead of Base64
  photos: string[]; // Now stores file paths instead of Base64
  textComment?: string;
  simulatorId?: string;
  simulatorName?: string;
  simulatorType?: string;
}

export interface StorageStats {
  totalReviews: number;
  totalImages: number;
  asyncStorageSize: number;
  imageStorageSize: number;
  formattedAsyncSize: string;
  formattedImageSize: string;
}

/**
 * Initialize data storage and perform migrations if needed
 */
export const initializeDataStorage = async (): Promise<void> => {
  try {
    const currentVersion = await AsyncStorage.getItem(STORAGE_VERSION_KEY);
    
    if (currentVersion !== CURRENT_STORAGE_VERSION) {
      console.log('Storage version mismatch, performing migration...');
      await migrateStorageData();
      await AsyncStorage.setItem(STORAGE_VERSION_KEY, CURRENT_STORAGE_VERSION);
    }
    
    console.log('Data storage initialized successfully');
  } catch (error) {
    console.error('Error initializing data storage:', error);
    throw new Error('Failed to initialize data storage');
  }
};

/**
 * Save review with permanent image storage
 */
export const saveReview = async (reviewData: Omit<Review, 'id' | 'timestamp'>): Promise<string> => {
  try {
    const reviewId = generateReviewId();
    const timestamp = Date.now();
    
    // Save images permanently and get file paths
    const permanentPhotoPaths = await batchMigrateImages(reviewData.photos);
    
    // Save handwritten comment if it exists
    let handwrittenCommentPath: string | undefined;
    if (reviewData.handwrittenComment) {
      // If it's a Base64 string, convert it to image first
      if (reviewData.handwrittenComment.startsWith('data:image')) {
        handwrittenCommentPath = await saveImagePermanently(reviewData.handwrittenComment, 'signature');
      } else {
        // It's already a file path
        handwrittenCommentPath = reviewData.handwrittenComment;
      }
    }
    
    const review: Review = {
      id: reviewId,
      timestamp,
      reviewType: reviewData.reviewType || 'professional', // Default to professional for backward compatibility
      personalInfo: reviewData.personalInfo,
      ratings: reviewData.ratings,
      overallRating: reviewData.overallRating,
      handwrittenComment: handwrittenCommentPath,
      photos: permanentPhotoPaths,
      textComment: reviewData.textComment,
      simulatorId: reviewData.simulatorId,
      simulatorName: reviewData.simulatorName,
      simulatorType: reviewData.simulatorType,
    };
    
    // Get existing reviews
    const existingReviews = await getAllReviews();
    
    // Add new review
    const updatedReviews = [...existingReviews, review];
    
    // Encrypt sensitive data before storing
    const encryptedReviews = encryptObject(updatedReviews);
    
    // Save to AsyncStorage (now much smaller without Base64 data and encrypted)
    await AsyncStorage.setItem(REVIEWS_KEY, encryptedReviews);
    
    console.log(`Review saved with ID: ${reviewId}`);
    return reviewId;
    
  } catch (error) {
    console.error('Error saving review:', error);
    throw new Error('Failed to save review');
  }
};

/**
 * Get all reviews
 */
export const getAllReviews = async (): Promise<Review[]> => {
  try {
    const reviewsData = await AsyncStorage.getItem(REVIEWS_KEY);
    if (!reviewsData) {
      console.log('No reviews data found, returning empty array');
      return [];
    }
    
    console.log(`Retrieved reviews data: ${reviewsData.length} characters`);
    
    let reviews: Review[] = [];
    
    // Strategy 1: Try to decrypt if data appears encrypted
    if (isEncrypted(reviewsData)) {
      console.log('Data appears encrypted, attempting decryption...');
      const decryptedReviews = decryptObject<Review[]>(reviewsData);
      
      if (Array.isArray(decryptedReviews)) {
        reviews = decryptedReviews;
        console.log(`Successfully decrypted ${reviews.length} reviews`);
      } else {
        console.warn('Decryption returned non-array result, falling back to empty array');
        reviews = [];
      }
    } else {
      // Strategy 2: Try to parse as unencrypted JSON
      try {
        const parsedReviews = JSON.parse(reviewsData);
        if (Array.isArray(parsedReviews)) {
          reviews = parsedReviews;
          console.log(`Successfully parsed ${reviews.length} unencrypted reviews`);
        } else {
          console.warn('Parsed data is not an array, returning empty array');
          reviews = [];
        }
      } catch (parseError) {
        console.error('Failed to parse unencrypted data:', parseError);
        
        // Strategy 3: Try to extract JSON array from corrupted data
        try {
          const arrayMatch = reviewsData.match(/\[.*\]/);
          if (arrayMatch) {
            reviews = JSON.parse(arrayMatch[0]);
            console.log(`Recovered ${reviews.length} reviews from corrupted data`);
          } else {
            console.warn('No JSON array pattern found in corrupted data');
            reviews = [];
          }
        } catch (recoveryError) {
          console.error('Data recovery failed:', recoveryError);
          reviews = [];
        }
      }
    }
    
    // Validate and clean the reviews array
    if (Array.isArray(reviews)) {
      reviews = reviews.filter(review => 
        review && 
        typeof review === 'object' && 
        review.id && 
        typeof review.timestamp === 'number'
      );
      
      // Add reviewType for backward compatibility (old reviews default to 'professional')
      reviews = reviews.map(review => ({
        ...review,
        reviewType: review.reviewType || 'professional'
      }));
      
      return reviews.sort((a, b) => b.timestamp - a.timestamp); // Sort by newest first
    }
    
    console.warn('Reviews data is not a valid array, returning empty array');
    return [];
    
  } catch (error) {
    console.error('Critical error getting reviews:', error);
    
    // Last resort: clear corrupted data and return empty array
    try {
      console.log('Attempting to clear corrupted reviews data...');
      await AsyncStorage.removeItem(REVIEWS_KEY);
      await AsyncStorage.setItem(REVIEWS_KEY, JSON.stringify([]));
      console.log('Corrupted data cleared, starting fresh');
    } catch (clearError) {
      console.error('Failed to clear corrupted data:', clearError);
    }
    
    return [];
  }
};

/**
 * Get review by ID
 */
export const getReviewById = async (reviewId: string): Promise<Review | null> => {
  try {
    const reviews = await getAllReviews();
    return reviews.find(review => review.id === reviewId) || null;
  } catch (error) {
    console.error('Error getting review by ID:', error);
    return null;
  }
};

/**
 * Update existing review
 */
export const updateReview = async (reviewId: string, updatedData: Partial<Review>): Promise<boolean> => {
  try {
    const reviews = await getAllReviews();
    const reviewIndex = reviews.findIndex(review => review.id === reviewId);
    
    if (reviewIndex === -1) {
      console.warn(`Review with ID ${reviewId} not found`);
      return false;
    }
    
    // Handle image updates
    if (updatedData.photos) {
      updatedData.photos = await batchMigrateImages(updatedData.photos);
    }
    
    if (updatedData.handwrittenComment && updatedData.handwrittenComment.startsWith('data:image')) {
      updatedData.handwrittenComment = await saveImagePermanently(updatedData.handwrittenComment, 'signature');
    }
    
    // Update review
    reviews[reviewIndex] = { ...reviews[reviewIndex], ...updatedData };
    
    // Encrypt and save updated reviews
    const encryptedReviews = encryptObject(reviews);
    await AsyncStorage.setItem(REVIEWS_KEY, encryptedReviews);
    
    console.log(`Review ${reviewId} updated successfully`);
    return true;
    
  } catch (error) {
    console.error('Error updating review:', error);
    return false;
  }
};

/**
 * Delete review and associated images
 */
export const deleteReview = async (reviewId: string): Promise<boolean> => {
  try {
    const reviews = await getAllReviews();
    const reviewToDelete = reviews.find(review => review.id === reviewId);
    
    if (!reviewToDelete) {
      console.warn(`Review with ID ${reviewId} not found`);
      return false;
    }
    
    // Delete associated images
    const imagesToDelete = [
      ...reviewToDelete.photos,
      ...(reviewToDelete.handwrittenComment ? [reviewToDelete.handwrittenComment] : [])
    ];
    
    for (const imagePath of imagesToDelete) {
      await deleteImagePermanently(imagePath);
    }
    
    // Remove review from list
    const updatedReviews = reviews.filter(review => review.id !== reviewId);
    
    // Save updated reviews (keep storage format consistent with encryption)
    const encryptedReviews = encryptObject(updatedReviews);
    await AsyncStorage.setItem(REVIEWS_KEY, encryptedReviews);
    
    console.log(`Review ${reviewId} deleted successfully`);
    return true;
    
  } catch (error) {
    console.error('Error deleting review:', error);
    return false;
  }
};

/**
 * Get storage statistics
 */
export const getStorageStats = async (): Promise<StorageStats> => {
  try {
    const reviews = await getAllReviews();
    const reviewsJson = JSON.stringify(reviews);
    const asyncStorageSize = new Blob([reviewsJson]).size;
    
    // Get image storage info
    const allImages = await getAllStoredImages();
    let imageStorageSize = 0;
    
    for (const imagePath of allImages) {
      try {
        const info = await FileSystem.getInfoAsync(imagePath);
        if (info.exists && info.size) {
          imageStorageSize += info.size;
        }
      } catch (error) {
        console.warn(`Error getting size for ${imagePath}:`, error);
      }
    }
    
    return {
      totalReviews: reviews.length,
      totalImages: allImages.length,
      asyncStorageSize,
      imageStorageSize,
      formattedAsyncSize: formatBytes(asyncStorageSize),
      formattedImageSize: formatBytes(imageStorageSize),
    };
    
  } catch (error) {
    console.error('Error getting storage stats:', error);
    return {
      totalReviews: 0,
      totalImages: 0,
      asyncStorageSize: 0,
      imageStorageSize: 0,
      formattedAsyncSize: '0 B',
      formattedImageSize: '0 B',
    };
  }
};

/**
 * Export all reviews data
 */
export const exportReviewsData = async (): Promise<string> => {
  try {
    const reviews = await getAllReviews();
    const exportData = {
      version: CURRENT_STORAGE_VERSION,
      exportDate: new Date().toISOString(),
      totalReviews: reviews.length,
      reviews: reviews,
    };
    
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Error exporting reviews data:', error);
    throw new Error('Failed to export reviews data');
  }
};

/**
 * Clean up orphaned images
 */
export const cleanupStorage = async (): Promise<{ deletedImages: number; savedSpace: string }> => {
  try {
    const reviews = await getAllReviews();
    
    // Get all referenced images
    const referencedImages: string[] = [];
    reviews.forEach(review => {
      referencedImages.push(...review.photos);
      if (review.handwrittenComment) {
        referencedImages.push(review.handwrittenComment);
      }
    });
    
    const deletedCount = await cleanupOrphanedImages(referencedImages);
    
    return {
      deletedImages: deletedCount,
      savedSpace: 'Unknown', // Would need to track sizes before deletion
    };
    
  } catch (error) {
    console.error('Error cleaning up storage:', error);
    return {
      deletedImages: 0,
      savedSpace: '0 B',
    };
  }
};

/**
 * Migrate old storage format to new format
 */
const migrateStorageData = async (): Promise<void> => {
  try {
    console.log('Starting storage migration...');
    
    const reviewsJson = await AsyncStorage.getItem(REVIEWS_KEY);
    if (!reviewsJson) {
      console.log('No existing reviews to migrate');
      return;
    }
    
    const reviews: Review[] = JSON.parse(reviewsJson);
    let migratedCount = 0;
    
    for (const review of reviews) {
      let needsUpdate = false;
      
      // Migrate photos from Base64 to file paths
      if (review.photos && review.photos.length > 0) {
        const migratedPhotos = await batchMigrateImages(review.photos);
        if (migratedPhotos.length > 0) {
          review.photos = migratedPhotos;
          needsUpdate = true;
        }
      }
      
      // Migrate handwritten comment from Base64 to file path
      if (review.handwrittenComment && review.handwrittenComment.startsWith('data:image')) {
        try {
          const migratedPath = await saveImagePermanently(review.handwrittenComment, 'signature');
          review.handwrittenComment = migratedPath;
          needsUpdate = true;
        } catch (error) {
          console.warn('Failed to migrate handwritten comment for review:', review.id);
        }
      }
      
      if (needsUpdate) {
        migratedCount++;
      }
    }
    
    // Save migrated reviews
    await AsyncStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
    
    console.log(`Migration completed. ${migratedCount} reviews migrated.`);
    
  } catch (error) {
    console.error('Error during storage migration:', error);
    throw new Error('Storage migration failed');
  }
};

/**
 * Generate unique review ID
 */
const generateReviewId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `review_${timestamp}_${random}`;
};

/**
 * Format bytes to human readable string
 */
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Clear corrupted storage data and reset to clean state
 */
export const clearCorruptedStorage = async (): Promise<boolean> => {
  try {
    console.log('Clearing corrupted storage data...');
    
    // Get all keys to see what's stored
    const allKeys = await AsyncStorage.getAllKeys();
    console.log('Found storage keys:', allKeys);
    
    // Clear all app-related storage
    await AsyncStorage.multiRemove(allKeys);
    
    // Reset to clean state
    await AsyncStorage.setItem('storage_version', '2.0');
    await AsyncStorage.setItem(REVIEWS_KEY, JSON.stringify([]));
    
    console.log('Storage cleared and reset successfully');
    return true;
    
  } catch (error) {
    console.error('Error clearing corrupted storage:', error);
    return false;
  }
};

/**
 * Diagnose storage issues
 */
export const diagnoseStorageIssues = async (): Promise<void> => {
  try {
    console.log('=== Storage Diagnosis ===');
    
    const allKeys = await AsyncStorage.getAllKeys();
    console.log('Storage keys found:', allKeys);
    
    for (const key of allKeys) {
      try {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          console.log(`Key: ${key}`);
          console.log(`  Length: ${value.length}`);
          console.log(`  First 100 chars: ${value.substring(0, 100)}`);
          
          // Check if it's encrypted
          if (isEncrypted(value)) {
            console.log(`  Status: Encrypted`);
            try {
              const decrypted = decryptObject(value);
              console.log(`  Decryption: Success`);
            } catch (error) {
              console.log(`  Decryption: Failed - ${error}`);
            }
          } else {
            console.log(`  Status: Not encrypted`);
            try {
              JSON.parse(value);
              console.log(`  JSON Parse: Success`);
            } catch (error) {
              console.log(`  JSON Parse: Failed - ${error}`);
            }
          }
        }
      } catch (error) {
        console.log(`Key: ${key} - Error reading: ${error}`);
      }
    }
    
    console.log('=== End Diagnosis ===');
    
  } catch (error) {
    console.error('Error during storage diagnosis:', error);
  }
};