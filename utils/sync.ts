import { supabase } from '@/lib/supabase';
import NetInfo from '@react-native-community/netinfo';
import { getAllReviews, updateReview } from './dataStorage';

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
    let syncedCount = 0;

    for (const review of unsyncedReviews) {
      try {
        // Prepare data for Supabase (match table structure)
        const { error } = await supabase
          .from('reviews')
          .upsert({
            id: review.id,
            timestamp: new Date(review.timestamp).toISOString(),
            review_type: review.reviewType,
            personal_info: review.personalInfo,
            ratings: review.ratings,
            overall_rating: review.overallRating,
            text_comment: review.textComment,
            handwritten_comment_path: review.handwrittenComment, // Store path, image upload handled separately if needed
            photos: review.photos, // Store paths
            simulator_id: review.simulatorId,
            simulator_name: review.simulatorName,
            simulator_type: review.simulatorType,
            created_at: new Date().toISOString(),
          });

        if (error) {
          console.error(`Failed to sync review ${review.id}:`, error);
          continue;
        }

        // Mark as synced locally
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
