import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptic feedback utility for professional tactile interactions
 * Optimized for tablet use (Samsung Tab S10 FE)
 */

export const hapticFeedback = {
  /**
   * Light impact - for subtle interactions
   * Use for: hover effects, selection changes, small toggles
   */
  light: async () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        // Silently fail if haptics not available
        console.debug('Haptics not available');
      }
    }
  },

  /**
   * Medium impact - for standard button presses
   * Use for: button clicks, card taps, menu selections
   */
  medium: async () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (error) {
        console.debug('Haptics not available');
      }
    }
  },

  /**
   * Heavy impact - for important actions
   * Use for: delete actions, submit forms, critical confirmations
   */
  heavy: async () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (error) {
        console.debug('Haptics not available');
      }
    }
  },

  /**
   * Success feedback - for positive outcomes
   * Use for: save success, rating submission, data sync
   */
  success: async () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        console.debug('Haptics not available');
      }
    }
  },

  /**
   * Warning feedback - for caution situations
   * Use for: form validation errors, low ratings, warnings
   */
  warning: async () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch (error) {
        console.debug('Haptics not available');
      }
    }
  },

  /**
   * Error feedback - for failures
   * Use for: delete actions, errors, failed operations
   */
  error: async () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (error) {
        console.debug('Haptics not available');
      }
    }
  },

  /**
   * Selection feedback - for picker/dropdown changes
   * Use for: scrolling through options, filter selections
   */
  selection: async () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      try {
        await Haptics.selectionAsync();
      } catch (error) {
        console.debug('Haptics not available');
      }
    }
  },

  /**
   * Rigid impact - for precise, mechanical-feeling feedback
   * Use for: star rating selection, precise controls
   */
  rigid: async () => {
    if (Platform.OS === 'ios') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
      } catch (error) {
        console.debug('Haptics not available');
      }
    } else {
      // Fallback to medium for Android
      await hapticFeedback.medium();
    }
  },

  /**
   * Soft impact - for gentle, smooth feedback
   * Use for: swipe gestures, smooth transitions
   */
  soft: async () => {
    if (Platform.OS === 'ios') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
      } catch (error) {
        console.debug('Haptics not available');
      }
    } else {
      // Fallback to light for Android
      await hapticFeedback.light();
    }
  },
};

/**
 * Convenience function for common button press
 */
export const hapticsButtonPress = () => hapticFeedback.medium();

/**
 * Convenience function for star rating selection
 */
export const hapticsRatingSelect = () => hapticFeedback.rigid();

/**
 * Convenience function for successful submission
 */
export const hapticsSuccess = () => hapticFeedback.success();

/**
 * Convenience function for delete action
 */
export const hapticsDelete = () => hapticFeedback.error();

/**
 * Convenience function for filter/sort selection
 */
export const hapticsFilterSelect = () => hapticFeedback.selection();

