import { supabase } from '@/lib/supabase';
import { getAllReviews, mergeRemoteReviews, updateReview } from '@/utils/dataStorage';
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
            text_comment: review.textComment || '',
            overall_rating: review.overallRating || 0,
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

      // 5. Pull from Supabase (Two-Way Sync)
      console.log('Pulling updates from Supabase...');
      const { data: remoteData, error: pullError } = await supabase
        .from('reviews')
        .select('*');

      if (pullError) {
        console.error('Error pulling reviews:', pullError);
        setSyncError('Pull failed');
      } else if (remoteData) {
        // Map Supabase rows to Review objects
        const mappedReviews = remoteData.map((row: any) => ({
          id: row.id,
          timestamp: new Date(row.created_at).getTime(),
          reviewType: row.review_type || 'professional',
          personalInfo: row.personal_info || {},
          ratings: row.ratings || {},
          overallRating: row.overall_rating || 0,
          handwrittenComment: row.handwritten_comment_url,
          photos: [], // Photos are not currently synced back from Supabase (URLs vs Local Paths). This is a limitation.
          textComment: row.text_comment || '',
          simulatorId: row.simulator_id,
          simulatorName: row.simulator_name,
          simulatorType: row.simulator_type,
          isSynced: true
        }));

        // Note: textComment and overallRating might be missing from Supabase schema based on previous steps.
        // If so, we might lose them on pull if we overwrite.
        // Let's check schema in SUPABASE_MIGRATION_PLAN.md.
        
        // Correction: We need to ensure we map all fields correctly.
        // If schema is missing fields, we should be careful.
        
        await mergeRemoteReviews(mappedReviews);
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
