import { supabase } from '@/lib/supabase';
import { getAllReviews, mergeRemoteReviews, updateReview } from '@/utils/dataStorage';
import { getDeviceId, getDeviceName } from '@/utils/deviceConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useCallback, useEffect, useRef, useState } from 'react';

const INITIAL_SYNC_KEY = 'initial_sync_complete';

export const useSupabaseSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isInitialSyncDone, setIsInitialSyncDone] = useState(false);
  const initialSyncRef = useRef(false);

  /**
   * Initial sync: Downloads ALL reviews from Supabase on first app install.
   */
  const performInitialSync = useCallback(async () => {
    // Prevent duplicate calls
    if (initialSyncRef.current) return;
    
    try {
      const syncComplete = await AsyncStorage.getItem(INITIAL_SYNC_KEY);
      if (syncComplete === 'true') {
        console.log('Initial sync already completed.');
        setIsInitialSyncDone(true);
        return;
      }

      const state = await NetInfo.fetch();
      if (!state.isConnected || !state.isInternetReachable) {
        console.log('Offline: Cannot perform initial sync.');
        return;
      }

      initialSyncRef.current = true;
      setIsSyncing(true);
      console.log('Performing initial sync - downloading all reviews from Supabase...');

      const { data: remoteData, error } = await supabase
        .from('reviews')
        .select('*');

      if (error) {
        console.error('Initial sync failed:', error);
        setSyncError(`Initial sync failed: ${error.message}`);
        initialSyncRef.current = false;
        return;
      }

      if (remoteData && remoteData.length > 0) {
        // ... (data processing) ...
        const mappedReviews = remoteData.map((row: any) => ({
          id: row.id,
          timestamp: new Date(row.created_at).getTime(),
          reviewType: row.review_type || 'professional',
          personalInfo: row.personal_info || {},
          ratings: row.ratings || {},
          overallRating: row.overall_rating || 0,
          handwrittenComment: row.handwritten_comment_url,
          photos: row.photos || [],
          textComment: row.text_comment || '',
          simulatorId: row.simulator_id,
          simulatorName: row.simulator_name,
          simulatorType: row.simulator_type,
          isSynced: true
        }));

        await mergeRemoteReviews(mappedReviews);
        console.log(`Initial sync complete: Downloaded ${mappedReviews.length} reviews.`);
      } else {
        console.log('Initial sync complete: No remote reviews found.');
      }

      await AsyncStorage.setItem(INITIAL_SYNC_KEY, 'true');
      setIsInitialSyncDone(true);
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Initial sync error:', error);
      setSyncError(`Initial sync failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSyncing(false);
      initialSyncRef.current = false;
    }
  }, []);

  /**
   * Regular sync: Pushes unsynced local reviews and pulls remote updates.
   */
  const syncReviews = useCallback(async () => {
    const state = await NetInfo.fetch();
    if (!state.isConnected || !state.isInternetReachable) {
      console.log('Offline: Skipping sync');
      return;
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      // Get device info for tracking
      const deviceId = await getDeviceId();
      const deviceName = await getDeviceName();

      // 1. Get all local reviews
      const localReviews = await getAllReviews();
      
      // 2. Filter for unsynced reviews
      const unsyncedReviews = localReviews.filter(r => !r.isSynced);

      if (unsyncedReviews.length > 0) {
        console.log(`Syncing ${unsyncedReviews.length} reviews...`);

        // 3. Push to Supabase
        for (const review of unsyncedReviews) {
          const { error } = await supabase
            .from('reviews')
            .upsert({
              id: review.id,
              created_at: new Date(review.timestamp).toISOString(),
              updated_at: new Date(review.updatedAt || review.timestamp).toISOString(),
              simulator_id: review.simulatorId || 'unknown',
              simulator_name: review.simulatorName || 'Unknown Simulator',
              simulator_type: review.simulatorType || 'unknown',
              review_type: review.reviewType || 'professional',
              personal_info: review.personalInfo || {},
              ratings: review.ratings || {},
              text_comment: review.textComment || '',
              overall_rating: review.overallRating || 0,
              handwritten_comment_url: review.handwrittenComment,
              photos_url: review.photos || [],
              device_id: deviceId,
              device_name: deviceName,
              is_synced: true,
              app_version: '1.0.0'
            });

          if (error) {
            console.error('Error syncing review:', review.id, error);
          } else {
            await updateReview(review.id, { isSynced: true });
          }
        }
      } else {
        console.log('No unsynced reviews found.');
      }

      // 4. Pull from Supabase (Two-Way Sync)
      console.log('Pulling updates from Supabase...');
      const { data: remoteData, error: pullError } = await supabase
        .from('reviews')
        .select('*');

      if (pullError) {
        console.error('Error pulling reviews:', pullError);
        setSyncError(`Pull failed: ${pullError.message}`);
      } else if (remoteData) {
        const mappedReviews = remoteData.map((row: any) => ({
          id: row.id,
          timestamp: new Date(row.created_at).getTime(),
          reviewType: row.review_type || 'professional',
          personalInfo: row.personal_info || {},
          ratings: row.ratings || {},
          overallRating: row.overall_rating || 0,
          handwrittenComment: row.handwritten_comment_url,
          photos: row.photos || [],
          textComment: row.text_comment || '',
          simulatorId: row.simulator_id,
          simulatorName: row.simulator_name,
          simulatorType: row.simulator_type,
          isSynced: true
        }));

        await mergeRemoteReviews(mappedReviews);
      }

      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncError(`Sync failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Perform initial sync on mount, then auto-sync when online
  useEffect(() => {
    // Initial sync on first load
    performInitialSync();

    // Listen for connectivity changes
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        syncReviews();
      }
    });

    return () => unsubscribe();
  }, [performInitialSync, syncReviews]);

  return { isSyncing, lastSyncTime, syncError, syncReviews, isInitialSyncDone };
};
