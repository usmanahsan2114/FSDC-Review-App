import AsyncStorage from '@react-native-async-storage/async-storage';

const REVIEWS_STORAGE_KEY = 'flight_simulator_reviews';

/**
 * Generate a unique ID for a review
 * @returns {string} Unique ID based on timestamp and random number
 */
const generateUniqueId = () => {
  return `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get all reviews from local storage
 * @returns {Promise<Array>} Array of review objects
 */
export const getAllReviews = async () => {
  try {
    const reviewsJson = await AsyncStorage.getItem(REVIEWS_STORAGE_KEY);
    if (reviewsJson) {
      const reviews = JSON.parse(reviewsJson);
      // Sort by creation date (newest first)
      return reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return [];
  } catch (error) {
    console.error('Error getting all reviews:', error);
    throw new Error('Failed to retrieve reviews');
  }
};

/**
 * Update an existing review
 * @param {string} id - The ID of the review to update
 * @param {Object} reviewObject - The updated review object
 * @returns {Promise<Object>} The updated review object
 */
export const updateReview = async (id, reviewObject) => {
  try {
    if (!id) {
      throw new Error('Review ID is required for update');
    }

    // Get existing reviews
    const existingReviews = await getAllReviews();
    
    // Find the review to update
    const reviewIndex = existingReviews.findIndex(review => review.id === id);
    
    if (reviewIndex === -1) {
      throw new Error(`Review with ID ${id} not found`);
    }

    // Update the review while preserving metadata
    const existingReview = existingReviews[reviewIndex];
    const updatedReview = {
      ...reviewObject,
      id: existingReview.id,
      createdAt: existingReview.createdAt,
      updatedAt: new Date().toISOString(),
      version: (existingReview.version || 1) + 1
    };

    // Replace in array
    existingReviews[reviewIndex] = updatedReview;
    
    // Save back to storage
    await AsyncStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(existingReviews));
    
    console.log('Review updated successfully:', id);
    return updatedReview;
  } catch (error) {
    console.error('Error updating review:', error);
    throw new Error('Failed to update review');
  }
};

/**
 * Delete a review by ID
 * @param {string} id - The ID of the review to delete
 * @returns {Promise<boolean>} True if deletion was successful
 */
export const deleteReview = async (id) => {
  try {
    if (!id) {
      throw new Error('Review ID is required for deletion');
    }

    // Get existing reviews
    const existingReviews = await getAllReviews();
    
    // Find the review to delete
    const reviewIndex = existingReviews.findIndex(review => review.id === id);
    
    if (reviewIndex === -1) {
      throw new Error(`Review with ID ${id} not found`);
    }

    // Remove from array
    const updatedReviews = existingReviews.filter(review => review.id !== id);
    
    // Save back to storage
    await AsyncStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(updatedReviews));
    
    console.log('Review deleted successfully:', id);
    return true;
  } catch (error) {
    console.error('Error deleting review:', error);
    throw new Error('Failed to delete review');
  }
};

/**
 * Get a single review by ID
 * @param {string} id - The ID of the review to retrieve
 * @returns {Promise<Object|null>} The review object or null if not found
 */
export const getReviewById = async (id) => {
  try {
    const reviews = await getAllReviews();
    return reviews.find(review => review.id === id) || null;
  } catch (error) {
    console.error('Error getting review by ID:', error);
    throw new Error('Failed to retrieve review');
  }
};

/**
 * Clear all reviews (useful for testing or reset functionality)
 * @returns {Promise<boolean>} True if clearing was successful
 */
export const clearAllReviews = async () => {
  try {
    await AsyncStorage.removeItem(REVIEWS_STORAGE_KEY);
    console.log('All reviews cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing all reviews:', error);
    throw new Error('Failed to clear reviews');
  }
};

/**
 * Get reviews count
 * @returns {Promise<number>} Number of stored reviews
 */
export const getReviewsCount = async () => {
  try {
    const reviews = await getAllReviews();
    return reviews.length;
  } catch (error) {
    console.error('Error getting reviews count:', error);
    return 0;
  }
};

/**
 * Export all reviews as JSON string (useful for backup)
 * @returns {Promise<string>} JSON string of all reviews
 */
export const exportReviews = async () => {
  try {
    const reviews = await getAllReviews();
    return JSON.stringify(reviews, null, 2);
  } catch (error) {
    console.error('Error exporting reviews:', error);
    throw new Error('Failed to export reviews');
  }
};

/**
 * Import reviews from JSON string (useful for restore)
 * @param {string} reviewsJson - JSON string of reviews to import
 * @param {boolean} merge - Whether to merge with existing reviews or replace
 * @returns {Promise<number>} Number of reviews imported
 */
export const importReviews = async (reviewsJson, merge = false) => {
  try {
    const importedReviews = JSON.parse(reviewsJson);
    
    if (!Array.isArray(importedReviews)) {
      throw new Error('Invalid reviews data format');
    }

    let finalReviews = importedReviews;
    
    if (merge) {
      const existingReviews = await getAllReviews();
      // Merge, avoiding duplicates by ID
      const existingIds = new Set(existingReviews.map(r => r.id));
      const newReviews = importedReviews.filter(r => !existingIds.has(r.id));
      finalReviews = [...existingReviews, ...newReviews];
    }
    
    await AsyncStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(finalReviews));
    console.log(`Imported ${importedReviews.length} reviews successfully`);
    return importedReviews.length;
  } catch (error) {
    console.error('Error importing reviews:', error);
    throw new Error('Failed to import reviews');
  }
};