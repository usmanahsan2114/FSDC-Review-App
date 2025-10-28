import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Form Draft Management
 * Auto-saves form data and allows recovery
 */

const DRAFT_KEY = 'review_form_draft';
const DRAFT_TIMESTAMP_KEY = 'review_form_draft_timestamp';

export interface FormDraft {
  personalInfo: { [key: string]: string };
  ratings: { [key: string]: number };
  textComment: string;
  handwrittenComment: string;
  photos: string[];
  timestamp: number;
}

/**
 * Save form draft to storage
 */
export const saveDraft = async (formData: Omit<FormDraft, 'timestamp'>): Promise<void> => {
  try {
    const draft: FormDraft = {
      ...formData,
      timestamp: Date.now(),
    };
    
    await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    await AsyncStorage.setItem(DRAFT_TIMESTAMP_KEY, draft.timestamp.toString());
    console.log('Draft saved successfully');
  } catch (error) {
    console.error('Error saving draft:', error);
  }
};

/**
 * Load form draft from storage
 */
export const loadDraft = async (): Promise<FormDraft | null> => {
  try {
    const draftString = await AsyncStorage.getItem(DRAFT_KEY);
    if (!draftString) return null;
    
    const draft: FormDraft = JSON.parse(draftString);
    
    // Check if draft is less than 7 days old
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    if (draft.timestamp < sevenDaysAgo) {
      // Draft is too old, delete it
      await clearDraft();
      return null;
    }
    
    return draft;
  } catch (error) {
    console.error('Error loading draft:', error);
    return null;
  }
};

/**
 * Check if a draft exists
 */
export const hasDraft = async (): Promise<boolean> => {
  try {
    const draft = await loadDraft();
    return draft !== null;
  } catch (error) {
    return false;
  }
};

/**
 * Clear the saved draft
 */
export const clearDraft = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(DRAFT_KEY);
    await AsyncStorage.removeItem(DRAFT_TIMESTAMP_KEY);
    console.log('Draft cleared successfully');
  } catch (error) {
    console.error('Error clearing draft:', error);
  }
};

/**
 * Get draft age in minutes
 */
export const getDraftAge = async (): Promise<number | null> => {
  try {
    const timestampString = await AsyncStorage.getItem(DRAFT_TIMESTAMP_KEY);
    if (!timestampString) return null;
    
    const timestamp = parseInt(timestampString, 10);
    const ageMs = Date.now() - timestamp;
    return Math.floor(ageMs / (60 * 1000)); // Convert to minutes
  } catch (error) {
    return null;
  }
};

/**
 * Format draft age for display
 */
export const formatDraftAge = (minutes: number): string => {
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
};

