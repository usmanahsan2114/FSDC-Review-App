import { supabase } from '@/lib/supabase';
import NetInfo from '@react-native-community/netinfo';
import { getAllReviews, getReviewById, updateReview } from './dataStorage';
import { getDeviceId, getDeviceName } from './deviceConfig';

/**
 * Sync a single review to Supabase immediately (real-time sync on submit).
 * Returns true if sync succeeded, false otherwise.
 */
export const syncSingleReview = async (reviewId: string): Promise<boolean> => {
  const state = await NetInfo.fetch();
  if (!state.isConnected) {
    console.log('No internet connection, review will sync later');
    return false;
  }

  try {
    const review = await getReviewById(reviewId);
    if (!review) {
      console.error(`Review ${reviewId} not found`);
      return false;
    }

    const deviceId = await getDeviceId();
    const deviceName = await getDeviceName();

    const { error } = await supabase
      .from('reviews')
      .upsert({
        id: review.id,
        created_at: new Date(review.timestamp).toISOString(),
        review_type: review.reviewType || 'professional',
        personal_info: review.personalInfo,
        ratings: review.ratings,
        overall_rating: review.overallRating,
        text_comment: review.textComment,
        handwritten_comment_url: review.handwrittenComment,
        photos: review.photos,
        simulator_id: review.simulatorId,
        simulator_name: review.simulatorName,
        simulator_type: review.simulatorType,
        device_id: deviceId,
        device_name: deviceName,
        is_synced: true,
        app_version: '1.0.0',
      });

    if (error) {
      console.error(`Failed to sync review ${reviewId}:`, error);
      return false;
    }

    // Mark as synced locally
    await updateReview(reviewId, { isSynced: true });
    console.log(`Review ${reviewId} synced successfully in real-time`);
    return true;
  } catch (err) {
    console.error(`Error syncing review ${reviewId}:`, err);
    return false;
  }
};

/**
 * Sync all unsynced reviews to Supabase (background sync).
 */
export const syncReviewsToSupabase = async (): Promise<number> => {
  const state = await NetInfo.fetch();
  if (!state.isConnected) {
    console.log('No internet connection, skipping sync');
    return 0;
  }

  try {
    const allReviews = await getAllReviews();
    const unsyncedReviews = allReviews.filter(r => !r.isSynced);

    if (unsyncedReviews.length === 0) {
      console.log('No unsynced reviews found');
      return 0;
    }

    console.log(`Found ${unsyncedReviews.length} unsynced reviews, starting sync...`);
    
    const deviceId = await getDeviceId();
    const deviceName = await getDeviceName();
    let syncedCount = 0;

    for (const review of unsyncedReviews) {
      try {
        const { error } = await supabase
          .from('reviews')
          .upsert({
            id: review.id,
            created_at: new Date(review.timestamp).toISOString(),
            review_type: review.reviewType || 'professional',
            personal_info: review.personalInfo,
            ratings: review.ratings,
            overall_rating: review.overallRating,
            text_comment: review.textComment,
            handwritten_comment_url: review.handwrittenComment,
            photos: review.photos,
            simulator_id: review.simulatorId,
            simulator_name: review.simulatorName,
            simulator_type: review.simulatorType,
            device_id: deviceId,
            device_name: deviceName,
            is_synced: true,
            app_version: '1.0.0',
          });

        if (error) {
          console.error(`Failed to sync review ${review.id}:`, error);
          continue;
        }

        await updateReview(review.id, { isSynced: true });
        syncedCount++;
      } catch (err) {
        console.error(`Error syncing review ${review.id}:`, err);
      }
    }

    console.log(`Successfully synced ${syncedCount} reviews`);
    return syncedCount;
  } catch (error) {
    console.error('Global sync error:', error);
    return 0;
  }
};

