import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Recently Viewed Reviews Tracker
 * Tracks which reviews user has viewed for quick access
 */

const RECENT_KEY = 'recently_viewed_reviews';
const MAX_RECENT = 10; // Keep last 10 viewed reviews

export interface RecentReview {
  id: string;
  name: string;
  timestamp: number;
  rating: number;
}

/**
 * Add a review to recently viewed list
 */
export const addToRecentlyViewed = async (review: RecentReview): Promise<void> => {
  try {
    const recentString = await AsyncStorage.getItem(RECENT_KEY);
    let recentList: RecentReview[] = recentString ? JSON.parse(recentString) : [];
    
    // Remove if already exists (to move to top)
    recentList = recentList.filter(r => r.id !== review.id);
    
    // Add to beginning
    recentList.unshift({
      ...review,
      timestamp: Date.now(),
    });
    
    // Keep only MAX_RECENT items
    recentList = recentList.slice(0, MAX_RECENT);
    
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(recentList));
  } catch (error) {
    console.error('Error adding to recently viewed:', error);
  }
};

/**
 * Get recently viewed reviews
 */
export const getRecentlyViewed = async (): Promise<RecentReview[]> => {
  try {
    const recentString = await AsyncStorage.getItem(RECENT_KEY);
    if (!recentString) return [];
    
    const recentList: RecentReview[] = JSON.parse(recentString);
    
    // Filter out reviews older than 30 days
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    return recentList.filter(r => r.timestamp > thirtyDaysAgo);
  } catch (error) {
    console.error('Error getting recently viewed:', error);
    return [];
  }
};

/**
 * Clear recently viewed list
 */
export const clearRecentlyViewed = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(RECENT_KEY);
  } catch (error) {
    console.error('Error clearing recently viewed:', error);
  }
};

/**
 * Check if a review was recently viewed
 */
export const wasRecentlyViewed = async (reviewId: string): Promise<boolean> => {
  try {
    const recentList = await getRecentlyViewed();
    return recentList.some(r => r.id === reviewId);
  } catch (error) {
    return false;
  }
};

