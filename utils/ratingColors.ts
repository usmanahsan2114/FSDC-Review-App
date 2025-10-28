/**
 * Rating Color System
 * Professional color gradients for different rating levels
 */

export interface RatingColorScheme {
  background: string;
  backgroundDark: string;
  text: string;
  gradient: string[];
}

/**
 * Get color scheme based on rating
 */
export const getRatingColors = (rating: number): RatingColorScheme => {
  if (rating >= 4.5) {
    return {
      background: '#E8F5E9',
      backgroundDark: '#1B5E20',
      text: '#2E7D32',
      gradient: ['#4CAF50', '#66BB6A'],
    };
  } else if (rating >= 4.0) {
    return {
      background: '#E3F2FD',
      backgroundDark: '#0D47A1',
      text: '#1976D2',
      gradient: ['#2196F3', '#42A5F5'],
    };
  } else if (rating >= 3.0) {
    return {
      background: '#FFF3E0',
      backgroundDark: '#E65100',
      text: '#F57C00',
      gradient: ['#FF9800', '#FFA726'],
    };
  } else if (rating >= 2.0) {
    return {
      background: '#FFE0B2',
      backgroundDark: '#BF360C',
      text: '#E64A19',
      gradient: ['#FF5722', '#FF7043'],
    };
  } else {
    return {
      background: '#FFEBEE',
      backgroundDark: '#B71C1C',
      text: '#C62828',
      gradient: ['#F44336', '#EF5350'],
    };
  }
};

/**
 * Get star color based on rating
 */
export const getStarColor = (rating: number): string => {
  if (rating >= 4.5) return '#4CAF50'; // Green
  if (rating >= 4.0) return '#2196F3'; // Blue
  if (rating >= 3.0) return '#FF9800'; // Orange
  if (rating >= 2.0) return '#FF5722'; // Deep Orange
  return '#F44336'; // Red
};

/**
 * Get rating label
 */
export const getRatingLabel = (rating: number): string => {
  if (rating >= 4.5) return 'Excellent';
  if (rating >= 4.0) return 'Very Good';
  if (rating >= 3.0) return 'Good';
  if (rating >= 2.0) return 'Fair';
  return 'Needs Improvement';
};

/**
 * Get rating emoji
 */
export const getRatingEmoji = (rating: number): string => {
  if (rating >= 4.5) return '🌟';
  if (rating >= 4.0) return '😊';
  if (rating >= 3.0) return '🙂';
  if (rating >= 2.0) return '😐';
  return '😕';
};

/**
 * Format rating for display
 */
export const formatRating = (rating: number): string => {
  return rating.toFixed(1);
};

