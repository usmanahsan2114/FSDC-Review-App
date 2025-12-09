import * as FileSystem from 'expo-file-system';

/**
 * Permanent Image Storage Utility
 * 
 * This utility provides reliable, permanent storage for images using expo-file-system.
 * Images are stored in the app's document directory which persists across app updates
 * and device restarts, unlike temporary cache directories.
 */

// Create permanent directories for different types of images
const IMAGES_DIR = `${FileSystem.documentDirectory ?? ''}images/`;
const SIGNATURES_DIR = `${FileSystem.documentDirectory ?? ''}signatures/`;
const THUMBNAILS_DIR = `${FileSystem.documentDirectory ?? ''}thumbnails/`;

// Thumbnail settings (only for list previews, not for actual images)
const THUMBNAIL_SIZE = { width: 200, height: 200 };

/**
 * Initialize storage directories
 */
export const initializeImageStorage = async (): Promise<void> => {
  try {
    // Create directories if they don't exist
    const directories = [IMAGES_DIR, SIGNATURES_DIR, THUMBNAILS_DIR];
    
    for (const dir of directories) {
      const dirInfo = await FileSystem.getInfoAsync(dir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
        console.log(`Created directory: ${dir}`);
      }
    }
  } catch (error) {
    console.error('Error initializing image storage:', error);
    throw new Error('Failed to initialize image storage');
  }
};

/**
 * Generate unique filename for images
 */
const generateImageFilename = (prefix: string = 'img'): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}.jpg`;
};

/**
 * Process base64 data URL to file URI (NO EDITING - direct conversion only)
 */
const processBase64Image = async (uri: string): Promise<string> => {
  try {
    if (uri.startsWith('data:image/')) {
      // For base64 data (handwritten signatures), save as temporary file without any modifications
      const tempFilename = `temp_${Date.now()}.jpg`;
      const tempPath = `${FileSystem.cacheDirectory}${tempFilename}`;
      
      // Write base64 data directly to file
      await FileSystem.writeAsStringAsync(tempPath, uri.split(',')[1], {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      return tempPath;
    }
    
    // For file URIs, return as-is with NO modifications
    return uri;
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
};

/**
 * Save image permanently to device storage
 */
export const saveImagePermanently = async (
  imageUri: string, 
  type: 'photo' | 'signature' = 'photo',
  preserveOriginal: boolean = true,
  saveToGallery: boolean = false // Don't save to gallery by default to avoid "modify photo" permission
): Promise<string> => {
  try {
    await initializeImageStorage();
    
    // Process image WITHOUT any editing - just handle base64 conversion if needed
    const processedUri = await processBase64Image(imageUri);
    
    // Generate filename and determine directory
    const filename = generateImageFilename(type);
    const directory = type === 'signature' ? SIGNATURES_DIR : IMAGES_DIR;
    const permanentPath = `${directory}${filename}`;
    
    // Copy image to permanent location WITHOUT any modifications
    await FileSystem.copyAsync({
      from: processedUri,
      to: permanentPath
    });
    
    console.log(`Image saved permanently (no edits): ${permanentPath}`);

    // Optionally save to device gallery (photos and signatures)
    return permanentPath;
    
  } catch (error) {
    console.error('Error saving image permanently:', error);
    throw new Error('Failed to save image permanently');
  }
};

/**
 * Create thumbnail for faster loading
 */
// Thumbnail creation removed - images are displayed in their original size

/**
 * Get thumbnail path for an image
 */
export const getThumbnailPath = (imagePath: string): string => {
  const filename = imagePath.split('/').pop() || '';
  return `${THUMBNAILS_DIR}thumb_${filename}`;
};

/**
 * Check if image exists in permanent storage
 */
export const imageExists = async (imagePath: string): Promise<boolean> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(imagePath);
    return fileInfo.exists;
  } catch (error) {
    console.error('Error checking image existence:', error);
    return false;
  }
};

/**
 * Delete image from permanent storage
 */
export const deleteImagePermanently = async (imagePath: string): Promise<boolean> => {
  try {
    const exists = await imageExists(imagePath);
    if (!exists) {
      console.warn(`Image does not exist: ${imagePath}`);
      return false;
    }
    
    // Delete main image
    await FileSystem.deleteAsync(imagePath);
    
    // Delete thumbnail if it exists
    const thumbnailPath = getThumbnailPath(imagePath);
    const thumbnailExists = await imageExists(thumbnailPath);
    if (thumbnailExists) {
      await FileSystem.deleteAsync(thumbnailPath);
    }
    
    console.log(`Image deleted: ${imagePath}`);
    return true;
    
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};

/**
 * Get all stored images
 */
export const getAllStoredImages = async (): Promise<string[]> => {
  try {
    await initializeImageStorage();
    
    const imageFiles = await FileSystem.readDirectoryAsync(IMAGES_DIR);
    const signatureFiles = await FileSystem.readDirectoryAsync(SIGNATURES_DIR);
    
    const allImages = [
      ...imageFiles.map(file => `${IMAGES_DIR}${file}`),
      ...signatureFiles.map(file => `${SIGNATURES_DIR}${file}`)
    ];
    
    return allImages;
  } catch (error) {
    console.error('Error getting stored images:', error);
    return [];
  }
};

/**
 * Get storage usage information
 */
export const getStorageInfo = async (): Promise<{
  totalImages: number;
  totalSize: number;
  formattedSize: string;
}> => {
  try {
    const allImages = await getAllStoredImages();
    let totalSize = 0;
    
    for (const imagePath of allImages) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(imagePath);
        if (fileInfo.exists && fileInfo.size) {
          totalSize += fileInfo.size;
        }
      } catch (error) {
        console.warn(`Error getting size for ${imagePath}:`, error);
      }
    }
    
    const formattedSize = formatBytes(totalSize);
    
    return {
      totalImages: allImages.length,
      totalSize,
      formattedSize
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    return {
      totalImages: 0,
      totalSize: 0,
      formattedSize: '0 B'
    };
  }
};

/**
 * Format bytes to human readable string
 */
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Clean up orphaned images (images not referenced in any review)
 */
export const cleanupOrphanedImages = async (referencedImages: string[]): Promise<number> => {
  try {
    const allImages = await getAllStoredImages();
    let deletedCount = 0;
    
    for (const imagePath of allImages) {
      if (!referencedImages.includes(imagePath)) {
        const deleted = await deleteImagePermanently(imagePath);
        if (deleted) {
          deletedCount++;
        }
      }
    }
    
    console.log(`Cleaned up ${deletedCount} orphaned images`);
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up orphaned images:', error);
    return 0;
  }
};

/**
 * Migrate temporary image URIs to permanent storage
 */
export const migrateTemporaryImage = async (tempUri: string): Promise<string | null> => {
  try {
    // Check if it's already a permanent path
    if (FileSystem.documentDirectory && tempUri.includes(FileSystem.documentDirectory)) {
      return tempUri;
    }
    
    // Check if temporary file exists
    const tempFileInfo = await FileSystem.getInfoAsync(tempUri);
    if (!tempFileInfo.exists) {
      console.warn('Temporary file does not exist:', tempUri);
      return null;
    }
    
    // Save to permanent storage
    const permanentPath = await saveImagePermanently(tempUri, 'photo');
    return permanentPath;
    
  } catch (error) {
    console.error('Error migrating temporary image:', error);
    return null;
  }
};

/**
 * Batch migrate multiple images
 */
export const batchMigrateImages = async (tempUris: string[]): Promise<string[]> => {
  const migratedPaths: string[] = [];
  
  for (const tempUri of tempUris) {
    try {
      const permanentPath = await migrateTemporaryImage(tempUri);
      if (permanentPath) {
        migratedPaths.push(permanentPath);
      }
    } catch (error) {
      console.error(`Error migrating image ${tempUri}:`, error);
    }
  }
  
  return migratedPaths;
};