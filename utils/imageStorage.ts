import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

// Explicitly log the detected directories for debugging
console.log('[Storage] Document Directory:', FileSystem.documentDirectory);
console.log('[Storage] Cache Directory:', FileSystem.cacheDirectory);

// Use documentDirectory if available, otherwise fallback to cacheDirectory (but warn heavily)
const ROOT_DIR = FileSystem.documentDirectory || FileSystem.cacheDirectory;

if (!ROOT_DIR) {
  console.error("[Storage] CRITICAL: Both documentDirectory and cacheDirectory are null! Storage will fail.");
}

const IMAGES_DIR = `${ROOT_DIR}images/`;
const SIGNATURES_DIR = `${ROOT_DIR}signatures/`;
const THUMBNAILS_DIR = `${ROOT_DIR}thumbnails/`;

// Thumbnail settings (only for list previews)
const THUMBNAIL_SIZE = { width: 200, height: 200 };

/**
 * Initialize storage directories
 */
export const initializeImageStorage = async (): Promise<void> => {
  if (!ROOT_DIR) return; // Cannot do anything
  try {
    const directories = [IMAGES_DIR, SIGNATURES_DIR, THUMBNAILS_DIR];
    for (const dir of directories) {
      const dirInfo = await FileSystem.getInfoAsync(dir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
        console.log(`[Storage] Created directory: ${dir}`);
      }
    }
  } catch (error) {
    console.error('[Storage] Error initializing image storage directories:', error);
    // Don't throw here, let individual saves try to create/fail so we get more specific errors
  }
};

/**
 * Generate unique filename
 */
const generateImageFilename = (prefix: string = 'img'): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}.jpg`;
};

/**
 * Process base64 data URL to file URI (direct conversion only)
 */
const processBase64Image = async (uri: string): Promise<string> => {
  try {
    if (uri.startsWith('data:image/')) {
      // It's a base64 string
      const tempFilename = `temp_${Date.now()}.jpg`;
      const tempPath = `${FileSystem.cacheDirectory}${tempFilename}`;
      
      const base64Data = uri.split(',')[1];
      await FileSystem.writeAsStringAsync(tempPath, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      return tempPath;
    }
    return uri; // Already a URI
  } catch (error) {
    console.error('[Storage] Error processing base64 image:', error);
    throw error;
  }
};

/**
 * Save image permanently to device storage AND optionally to global gallery
 */
export const saveImagePermanently = async (
  imageUri: string, 
  type: 'photo' | 'signature' = 'photo',
  preserveOriginal: boolean = true,
  saveToGallery: boolean = false 
): Promise<string> => {
  try {
    if (!ROOT_DIR) throw new Error("FileSystem root directory logic failed.");

    await initializeImageStorage();
    
    // 1. Convert base64 to file if needed (returns a file URI)
    //    If it's already a file URI from camera/picker, this returns it as-is.
    const processedUri = await processBase64Image(imageUri);
    
    // 2. Check if source file exists
    const sourceInfo = await FileSystem.getInfoAsync(processedUri);
    if (!sourceInfo.exists) {
      throw new Error(`Source file does not exist at path: ${processedUri}`);
    }

    // 3. Determine Permanent Path
    const filename = generateImageFilename(type);
    const directory = type === 'signature' ? SIGNATURES_DIR : IMAGES_DIR;
    const permanentPath = `${directory}${filename}`;
    
    // 4. Save to App's Internal Storage
    await FileSystem.copyAsync({
      from: processedUri,
      to: permanentPath
    });
    console.log(`[Storage] Image saved to internal storage: ${permanentPath}`);

    // 5. Optionally Save to Public Gallery
    if (saveToGallery) {
      try {
        const perm = await MediaLibrary.getPermissionsAsync();
        if (perm.status !== 'granted') {
          console.warn('[Storage] Gallery saving skipped: Permission not granted');
        } else {
          const asset = await MediaLibrary.createAssetAsync(permanentPath);
          await MediaLibrary.createAlbumAsync('FSDC Reviews', asset, false);
          console.log('[Storage] Saved to Gallery Album: FSDC Reviews');
        }
      } catch (galleryError) {
        console.error('[Storage] FAILED to save to gallery (non-fatal):', galleryError);
        // We do NOT throw here because the internal save was successful, which is what matters for the app.
      }
    }

    return permanentPath;
    
  } catch (error) {
    console.error('[Storage] FATAL Error saving image permanently:', error);
    throw new Error(`Failed to save image: ${(error as any).message}`);
  }
};

/**
 * Get thumbnail path (utility)
 */
export const getThumbnailPath = (imagePath: string): string => {
  const filename = imagePath.split('/').pop() || '';
  return `${THUMBNAILS_DIR}thumb_${filename}`;
};

/**
 * Check if image exists
 */
export const imageExists = async (imagePath: string): Promise<boolean> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(imagePath);
    return fileInfo.exists;
  } catch (error) {
    return false;
  }
};

/**
 * Delete image
 */
export const deleteImagePermanently = async (imagePath: string): Promise<boolean> => {
  try {
    const exists = await imageExists(imagePath);
    if (!exists) return false;
    
    await FileSystem.deleteAsync(imagePath);
    console.log(`[Storage] Deleted: ${imagePath}`);
    return true;
  } catch (error) {
    console.error('[Storage] Error deleting image:', error);
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
    
    // Fix: readDirectoryAsync returns file names, not paths. We must prepend the dir.
    const allImages = [
      ...imageFiles.map(file => `${IMAGES_DIR}${file}`),
      ...signatureFiles.map(file => `${SIGNATURES_DIR}${file}`)
    ];
    return allImages;
  } catch (error) {
    console.error('[Storage] Error listing images:', error);
    return [];
  }
};

/**
 * Get Storage Info
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
      const fileInfo = await FileSystem.getInfoAsync(imagePath);
      if (fileInfo.exists && fileInfo.size) {
        totalSize += fileInfo.size;
      }
    }
    
    return {
      totalImages: allImages.length,
      totalSize,
      formattedSize: (totalSize / (1024 * 1024)).toFixed(2) + ' MB'
    };
  } catch (error) {
    return { totalImages: 0, totalSize: 0, formattedSize: '0 MB' };
  }
};

/**
 * Migrate Temporary Image
 */
export const migrateTemporaryImage = async (tempUri: string): Promise<string | null> => {
  try {
    // If it's already in our document directory, leave it be.
    if (ROOT_DIR && tempUri.includes(ROOT_DIR)) {
      return tempUri;
    }
    
    return await saveImagePermanently(tempUri, 'photo');
  } catch (error) {
    console.error('[Storage] Error migrating temp image:', error);
    return null;
  }
};

/**
 * Batch Migrate
 */
export const batchMigrateImages = async (tempUris: string[]): Promise<string[]> => {
  const migratedPaths: string[] = [];
  for (const tempUri of tempUris) {
    const res = await migrateTemporaryImage(tempUri);
    if (res) migratedPaths.push(res);
  }
  return migratedPaths;
};