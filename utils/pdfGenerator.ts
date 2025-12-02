import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export interface ReviewData {
  id: string;
  submittedAt: string;
  personalInfo: { [key: string]: string };
  ratings: { [key: string]: number };
  textComment?: string;
  handwrittenComment?: string;
  photos?: string[];
  simulatorName?: string;
  simulatorType?: string;
}

export interface PersonalInfoField {
  key: string;
  label: string;
}

export interface RatingCategory {
  key: string;
  title: string;
  description: string;
}

const generateStarRating = (rating: number): string => {
  const fullStars = Math.floor(rating);
  const emptyStars = 5 - fullStars;
  return '★'.repeat(fullStars) + '☆'.repeat(emptyStars);
};

const calculateAverageRating = (ratings: { [key: string]: number }): string => {
  const values = Object.values(ratings).filter(rating => rating > 0);
  if (values.length === 0) return '0.0';
  const average = values.reduce((sum, rating) => sum + rating, 0) / values.length;
  return average.toFixed(1);
};

const convertImageToBase64 = async (imageUri: string): Promise<string> => {
  try {
    // Downscale and compress slightly to avoid memory issues with multiple photos
    const result = await manipulateAsync(
      imageUri,
      [{ resize: { width: 1400 } }],
      { base64: true, compress: 0.85, format: SaveFormat.JPEG }
    );
    if (result.base64) {
      return `data:image/jpeg;base64,${result.base64}`;
    }
    return '';
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return '';
  }
};

const generatePage1HTML = (
  review: ReviewData,
  personalInfoFields: PersonalInfoField[],
  ratingCategories: RatingCategory[]
): string => {
  const personalInfoHTML = personalInfoFields
    .map(field => {
      const value = review.personalInfo[field.key];
      if (!value) return '';
      return `
        <div style="margin-bottom: 8px;">
          <strong>${field.label}:</strong> ${value}
        </div>
      `;
    })
    .filter(html => html)
    .join('');

  const averageRating = calculateAverageRating(review.ratings);
  const averageStars = generateStarRating(parseFloat(averageRating));

  const detailedRatingsHTML = ratingCategories
    .map(category => {
      const rating = review.ratings[category.key];
      if (!rating) return '';
      const stars = generateStarRating(rating);
      return `
        <div style="margin-bottom: 12px; padding: 8px; border-left: 3px solid #007AFF;">
          <div style="font-weight: bold; margin-bottom: 4px;">${category.title}</div>
          <div style="font-size: 12px; color: #666; margin-bottom: 4px;">${category.description}</div>
          <div style="display: flex; align-items: center;">
            <span style="font-size: 16px; color: #FFD700; margin-right: 8px;">${stars}</span>
            <span>${rating}/5</span>
          </div>
        </div>
      `;
    })
    .filter(html => html)
    .join('');

  const textCommentHTML = review.textComment ? `
    <div style="margin-top: 20px;">
      <h3 style="color: #007AFF; margin-bottom: 10px;">Comments</h3>
      <div style="padding: 12px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #007AFF;">
        ${review.textComment}
      </div>
    </div>
  ` : '';

  return `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h1 style="color: #007AFF; text-align: center; margin-bottom: 20px;">Review Details</h1>
      <p style="text-align: center; color: #666; margin-bottom: 30px;">Submitted: ${review.submittedAt}</p>
      
      ${(review.simulatorName || review.simulatorType) ? `
        <div style="margin-bottom: 30px; padding: 15px; background-color: #f0f7ff; border-radius: 8px; border: 1px solid #cce5ff;">
          <h2 style="color: #007AFF; margin-top: 0; margin-bottom: 10px; font-size: 18px;">Simulator Details</h2>
          <div style="display: flex; flex-wrap: wrap; gap: 20px;">
            ${review.simulatorName ? `
              <div>
                <strong>Aircraft:</strong> ${review.simulatorName}
              </div>
            ` : ''}
            ${review.simulatorType ? `
              <div>
                <strong>System Type:</strong> ${review.simulatorType}
              </div>
            ` : ''}
          </div>
        </div>
      ` : ''}
      
      ${personalInfoHTML ? `
        <div style="margin-bottom: 30px;">
          <h2 style="color: #007AFF; margin-bottom: 15px;">Personal Information</h2>
          ${personalInfoHTML}
        </div>
      ` : ''}
      
      <div style="margin-bottom: 30px;">
        <h2 style="color: #007AFF; margin-bottom: 15px;">Overall Rating</h2>
        <div style="text-align: center; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
          <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">${averageRating}/5.0</div>
          <div style="font-size: 32px; color: #FFD700;">${averageStars}</div>
        </div>
      </div>
      
      ${detailedRatingsHTML ? `
        <div style="margin-bottom: 30px;">
          <h2 style="color: #007AFF; margin-bottom: 15px;">Detailed Ratings</h2>
          ${detailedRatingsHTML}
        </div>
      ` : ''}
      
      ${textCommentHTML}
    </div>
  `;
};

const generatePage2HTML = async (review: ReviewData): Promise<string> => {
  if (!review.handwrittenComment) return '';

  const base64Image = await convertImageToBase64(review.handwrittenComment);
  if (!base64Image) return '';

  return `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h1 style="color: #007AFF; text-align: center; margin-bottom: 30px;">Handwritten Comments</h1>
      <div style="text-align: center;">
        <img src="${base64Image}" style="max-width: 100%; max-height: 80vh; border: 1px solid #ddd; border-radius: 8px;" />
      </div>
    </div>
  `;
};

const generatePage3HTML = async (review: ReviewData): Promise<string> => {
  if (!review.photos || review.photos.length === 0) return '';

  // Convert sequentially to reduce peak memory usage on low-memory devices
  const validPhotos: string[] = [];
  let idx = 0;
  for (const photo of review.photos) {
    const base64Image = await convertImageToBase64(photo);
    if (base64Image) {
      validPhotos.push(`
        <div style="margin-bottom: 20px; text-align: center;">
          <h4 style="margin-bottom: 10px;">Photo ${idx + 1}</h4>
          <img src="${base64Image}" style="max-width: 100%; max-height: 40vh; border: 1px solid #ddd; border-radius: 8px;" />
        </div>
      `);
    }
    idx++;
  }

  if (validPhotos.length === 0) return '';

  return `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h1 style="color: #007AFF; text-align: center; margin-bottom: 30px;">Photos (${validPhotos.length})</h1>
      ${validPhotos.join('')}
    </div>
  `;
};

export const generateReviewPDF = async (
  review: ReviewData,
  personalInfoFields: PersonalInfoField[],
  ratingCategories: RatingCategory[]
): Promise<string> => {
  try {
    const fullHTML = await buildReviewHTML(review, personalInfoFields, ratingCategories);

    // Generate PDF
    const { uri } = await Print.printToFileAsync({
      html: fullHTML,
      base64: false,
    });

    return uri;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
};

export const buildReviewHTML = async (
  review: ReviewData,
  personalInfoFields: PersonalInfoField[],
  ratingCategories: RatingCategory[]
): Promise<string> => {
  // Generate all pages
  const page1HTML = generatePage1HTML(review, personalInfoFields, ratingCategories);
  const page2HTML = await generatePage2HTML(review);
  const page3HTML = await generatePage3HTML(review);

  // Combine pages that have content
  const pages = [page1HTML, page2HTML, page3HTML].filter(page => page && page.trim().length > 0);
  
  if (pages.length === 0) {
    throw new Error('No content available to generate PDF');
  }

  // Join pages with page breaks
  const fullHTML = `
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          @page {
            margin: 20px;
            size: A4;
          }
          .page-break {
            page-break-before: always;
          }
          body {
            margin: 0;
            padding: 0;
            line-height: 1.4;
            font-family: Arial, sans-serif;
          }
          h1,h2,h3,h4,p,div,span { line-height: 1.4; }
          h1,h2,h3 { margin: 12px 0; }
          p { margin: 8px 0; }
        </style>
      </head>
      <body>
        ${pages.map((page, index) => 
          index === 0 ? page : `<div class="page-break">${page}</div>`
        ).join('')}
      </body>
    </html>
  `;

  return fullHTML;
};

export const previewHTMLWithPrintDialog = async (html: string): Promise<void> => {
  // Show native print preview (Android shares to Save as PDF)
  await Print.printAsync({ html });
};

export const previewAndSavePDF = async (pdfUri: string): Promise<void> => {
  try {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(pdfUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Save Review PDF',
        UTI: 'com.adobe.pdf',
      });
    } else {
      throw new Error('Sharing is not available on this device');
    }
  } catch (error) {
    console.error('Error sharing PDF:', error);
    throw new Error('Failed to share PDF');
  }
};