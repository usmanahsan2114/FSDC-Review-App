import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage Cleanup Utility
 * 
 * This utility helps clear corrupted storage data that's causing decryption failures.
 */

// Storage keys that might contain corrupted data
const STORAGE_KEYS = [
  'reviews',
  'storage_version',
  'rating_categories',
  'personal_info_fields',
  // Add any other keys that might be corrupted
];

/**
 * Clear all app storage data
 */
export const clearAllStorage = async (): Promise<void> => {
  try {
    console.log('Starting storage cleanup...');
    
    // Get all keys in AsyncStorage
    const allKeys = await AsyncStorage.getAllKeys();
    console.log('Found storage keys:', allKeys);
    
    // Clear all keys
    await AsyncStorage.multiRemove(allKeys);
    console.log('All storage data cleared successfully');
    
  } catch (error) {
    console.error('Error clearing storage:', error);
    throw error;
  }
};

/**
 * Clear specific app-related storage keys
 */
export const clearAppStorage = async (): Promise<void> => {
  try {
    console.log('Starting app storage cleanup...');
    
    // Clear specific app keys
    await AsyncStorage.multiRemove(STORAGE_KEYS);
    console.log('App storage data cleared successfully');
    
  } catch (error) {
    console.error('Error clearing app storage:', error);
    throw error;
  }
};

/**
 * Check storage status and show what's stored
 */
export const checkStorageStatus = async (): Promise<void> => {
  try {
    console.log('Checking storage status...');
    
    const allKeys = await AsyncStorage.getAllKeys();
    console.log('Current storage keys:', allKeys);
    
    for (const key of allKeys) {
      try {
        const value = await AsyncStorage.getItem(key);
        console.log(`Key: ${key}, Length: ${value?.length || 0}, First 50 chars: ${value?.substring(0, 50) || 'null'}`);
      } catch (error) {
        console.log(`Key: ${key}, Error reading: ${error}`);
      }
    }
    
  } catch (error) {
    console.error('Error checking storage status:', error);
  }
};

/**
 * Reset storage to clean state with proper initialization
 */
export const resetStorageToCleanState = async (): Promise<void> => {
  try {
    console.log('Resetting storage to clean state...');
    
    // Clear all storage
    await clearAllStorage();
    
    // Set storage version
    await AsyncStorage.setItem('storage_version', '2.0');
    
    // Initialize empty reviews array
    await AsyncStorage.setItem('reviews', JSON.stringify([]));
    
    console.log('Storage reset to clean state successfully');
    
  } catch (error) {
    console.error('Error resetting storage:', error);
    throw error;
  }
};