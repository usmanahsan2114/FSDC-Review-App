import { supabase } from '@/lib/supabase';
import { getAllReviews, updateReview } from '@/utils/dataStorage';
import NetInfo from '@react-native-community/netinfo';
import { useCallback, useEffect, useState } from 'react';

export const useSupabaseSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const syncReviews = useCallback(async () => {
    const state = await NetInfo.fetch();
    if (!state.isConnected || !state.isInternetReachable) {
      console.log('Offline: Skipping sync');
      return;
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      // 1. Get all local reviews
      const localReviews = await getAllReviews();
      
      // 2. Filter for unsynced reviews
      const unsyncedReviews = localReviews.filter(r => !r.isSynced);

      if (unsyncedReviews.length === 0) {
        console.log('No unsynced reviews found.');
        setIsSyncing(false);
        return;
      }

      console.log(`Syncing ${unsyncedReviews.length} reviews...`);

      // 3. Push to Supabase
      for (const review of unsyncedReviews) {
        const { error } = await supabase
          .from('reviews')
          .upsert({
            id: review.id,
            created_at: new Date(review.timestamp).toISOString(),
            simulator_id: review.simulatorId || 'unknown',
            simulator_name: review.simulatorName || 'Unknown Simulator',
            simulator_type: review.simulatorType || 'unknown',
            review_type: review.reviewType || 'professional', // Default to professional
            personal_info: review.personalInfo || {},
            ratings: review.ratings || {},
            handwritten_comment_url: review.handwrittenComment,
            is_synced: true,
            app_version: '1.0.0'
          });

        if (error) {
          console.error('Error syncing review:', review.id, error);
          // Continue to next review, don't break entire loop
        } else {
          // 4. Mark as synced locally
          await updateReview(review.id, { isSynced: true });
        }
      }

      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncError('Sync failed');
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Auto-sync on mount and when online
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        syncReviews();
      }
    });

    return () => unsubscribe();
  }, [syncReviews]);

  return { isSyncing, lastSyncTime, syncError, syncReviews };
};
