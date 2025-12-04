import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';

export const DRAFT_KEY = 'review_form_draft';

export const useFormDraft = <T>(initialState: T) => {
  const [data, setData] = useState<T>(initialState);
  const [isLoaded, setIsLoaded] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load draft on mount
  useEffect(() => {
    const loadDraft = async () => {
      try {
        const savedDraft = await AsyncStorage.getItem(DRAFT_KEY);
        if (savedDraft) {
          setData(JSON.parse(savedDraft));
        }
      } catch (error) {
        console.error('Failed to load draft', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadDraft();
  }, []);

  // Save draft on change (debounced)
  const updateData = (newData: T | ((prev: T) => T)) => {
    setData(prev => {
      const resolvedData = typeof newData === 'function' ? (newData as Function)(prev) : newData;
      
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      
      saveTimeout.current = setTimeout(async () => {
        try {
          await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(resolvedData));
        } catch (error) {
          console.error('Failed to save draft', error);
        }
      }, 1000); // Save after 1 second of inactivity

      return resolvedData;
    });
  };

  const clearDraft = async () => {
    try {
      await AsyncStorage.removeItem(DRAFT_KEY);
      setData(initialState);
    } catch (error) {
      console.error('Failed to clear draft', error);
    }
  };

  return { data, updateData, clearDraft, isLoaded };
};
