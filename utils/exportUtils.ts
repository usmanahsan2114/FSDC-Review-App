import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Review } from './dataStorage';

export const generateReviewsCSV = (reviews: Review[]): string => {
  // Define CSV headers
  const headers = [
    'Date',
    'Review Type',
    'Simulator Name',
    'Simulator Type',
    'Full Name',
    'Nationality',
    'Profession',
    'Email/Contact',
    'Overall Rating',
    'Text Comment',
    'Has Handwriting',
    'Photo Count'
  ];

  // Create CSV rows
  const rows = reviews.map(review => {
    const date = new Date(review.timestamp).toLocaleDateString();
    const type = review.reviewType || 'professional';
    const simName = review.simulatorName || '';
    const simType = review.simulatorType || '';
    
    // Personal Info
    const name = review.personalInfo.name || review.personalInfo.fullName || '';
    const nationality = review.personalInfo.nationality || '';
    const profession = review.personalInfo.profession || '';
    const contact = review.personalInfo.email || review.personalInfo.contact || '';
    
    // Rating
    const rating = review.overallRating ? review.overallRating.toFixed(1) : '0.0';
    
    // Content
    const comment = (review.textComment || '').replace(/"/g, '""'); // Escape quotes
    const hasHandwriting = review.handwrittenComment ? 'Yes' : 'No';
    const photoCount = review.photos ? review.photos.length : 0;

    return [
      `"${date}"`,
      `"${type}"`,
      `"${simName}"`,
      `"${simType}"`,
      `"${name}"`,
      `"${nationality}"`,
      `"${profession}"`,
      `"${contact}"`,
      `"${rating}"`,
      `"${comment}"`,
      `"${hasHandwriting}"`,
      `"${photoCount}"`
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
};

export const exportToExcel = async (reviews: Review[]): Promise<void> => {
  try {
    const csvContent = generateReviewsCSV(reviews);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `reviews_export_${timestamp}.csv`;
    const fileUri = ((FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory) + filename;

    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: 'utf8',
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Reviews to Excel',
        UTI: 'public.comma-separated-values-text',
      });
    } else {
      throw new Error('Sharing is not available on this device');
    }
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw error;
  }
};
