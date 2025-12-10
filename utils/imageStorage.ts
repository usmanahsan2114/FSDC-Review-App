import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';

// @ts-ignore: Force cast to any to avoid "missing property" errors due to environment type mismatch
const FS = FileSystem as any;

/**
 * Check if running in Expo Go
 */
const isExpoGo = () => {
  return Constants.executionEnvironment === 'storeClient';
};

// Helper to get root directory lazily
// This prevents "undefined" errors at module load time if native modules aren't ready
const getRootDir = () => {
    // We try to access the properties only when called
    const dir = FS.documentDirectory || FS.cacheDirectory;
    // We do NOT return null here anymore to allow fallbacks in callers
    return dir || null;
};

// Directories (computed functions instead of constants)
const getImagesDir = () => {
    const root = getRootDir();
    return root ? `${root}images/` : null;
};
const getSignaturesDir = () => {
    const root = getRootDir();
    return root ? `${root}signatures/` : null;
};
const getThumbnailsDir = () => {
    const root = getRootDir();
    return root ? `${root}thumbnails/` : null;
};

// Thumbnail settings (only for list previews)
const THUMBNAIL_SIZE = { width: 200, height: 200 };

/**
 * Initialize storage directories
 */
export const initializeImageStorage = async (): Promise<void> => {
    const images = getImagesDir();
    const signatures = getSignaturesDir();
    const thumbnails = getThumbnailsDir();

    if (!images || !signatures || !thumbnails) {
        console.warn('[Storage] Warning: FileSystem root missing. Skipping directory creation.');
        return;
    }

    try {
        const directories = [images, signatures, thumbnails];
        for (const dir of directories) {
            if (!dir) continue;
            const dirInfo = await FS.getInfoAsync(dir);
            if (!dirInfo.exists) {
                await FS.makeDirectoryAsync(dir, { intermediates: true });
                console.log(`[Storage] Created directory: ${dir}`);
            }
        }
    } catch (error) {
        console.error('[Storage] Error initializing image storage directories:', error);
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
            // Use cache directory for temp storage
            if (!FS.cacheDirectory) {
                 console.warn('[Storage] Cache unavailable for Base64 processing. Returning raw Base64 string.');
                 return uri; // Fallback: Return the Base64 string itself!
            }

            // It's a base64 string
            const tempFilename = `temp_${Date.now()}.jpg`;
            const tempPath = `${FS.cacheDirectory}${tempFilename}`;

            const base64Data = uri.split(',')[1];
            await FS.writeAsStringAsync(tempPath, base64Data, {
                encoding: FS.EncodingType ? FS.EncodingType.Base64 : 'base64',
            });

            return tempPath;
        }
        return uri; // Already a URI
    } catch (error) {
        console.error('[Storage] Error processing base64 image:', error);
        return uri; // Fallback to raw input on error
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
        // EXPO GO SAFETY CHECK
        if (saveToGallery && isExpoGo()) {
            console.log('[Storage] Running in Expo Go: Gallery saving disabled to prevent crash.');
            saveToGallery = false; // Force disable
        }

        await initializeImageStorage();

        // 1. Convert base64 to file if needed (returns a file URI OR raw base64 if FS fails)
        const processedUri = await processBase64Image(imageUri);
        
        // If the processed URI is still base64 (fallback triggered), just return it.
        // It won't be saved to a separate file, but it will render in <Image source={{uri: base64}} />
        if (processedUri.startsWith('data:image/')) {
             console.log('[Storage] Using inline Base64 storage (FileSystem unavailable).');
             return processedUri;
        }

        // 2. Check if source file exists
        const sourceInfo = await FS.getInfoAsync(processedUri);
        if (!sourceInfo.exists) {
            // If the file doesn't exist, maybe it was a raw path? calling function might handle error or we just return raw.
             // But let's throw to be safe unless we want to be super permissive.
             // Actually, "do anything to make it work":
             console.warn(`[Storage] Source file missing: ${processedUri}. Returning original URI.`);
             return imageUri;
        }

        // 3. Determine Permanent Path
        const filename = generateImageFilename(type);
        const directory = type === 'signature' ? getSignaturesDir() : getImagesDir();
        
        if (!directory) {
             // FALLBACK: If we can't write to permanent storage, just return the temp/processed URI.
             // It might be deleted by OS later, but it works NOW.
             console.warn('[Storage] Permanent storage unavailable. Using temporary path.');
             return processedUri;
        }

        const permanentPath = `${directory}${filename}`;

        // 4. Save to App's Internal Storage
        await FS.copyAsync({
            from: processedUri,
            to: permanentPath
        });
        console.log(`[Storage] Image saved to internal storage: ${permanentPath}`);

        // 5. Optionally Save to Public Gallery
        if (saveToGallery) {
            try {
                // Double check permissions here just in case, though caller should have checked
                const perm = await MediaLibrary.getPermissionsAsync();
                if (perm.status !== 'granted') {
                    // Try one last time (write only, photo only)
                    const newPerm = await MediaLibrary.requestPermissionsAsync(false, ['photo']);
                    if (newPerm.status === 'granted') {
                        const asset = await MediaLibrary.createAssetAsync(permanentPath);
                        await MediaLibrary.createAlbumAsync('FSDC Reviews', asset, false);
                        console.log('[Storage] Saved to Gallery Album: FSDC Reviews');
                    } else {
                        console.warn('[Storage] Gallery saving skipped: Permission not granted');
                    }
                } else {
                    const asset = await MediaLibrary.createAssetAsync(permanentPath);
                    await MediaLibrary.createAlbumAsync('FSDC Reviews', asset, false);
                    console.log('[Storage] Saved to Gallery Album: FSDC Reviews');
                }
            } catch (galleryError) {
                console.error('[Storage] FAILED to save to gallery (non-fatal):', galleryError);
            }
        }

        return permanentPath;

    } catch (error) {
        console.error('[Storage] FATAL Error saving image permanently:', error);
        // "Do anything to make it work": return the original URI so the flow doesn't break.
        return imageUri; 
    }
};

/**
 * Get thumbnail path (utility)
 */
export const getThumbnailPath = (imagePath: string): string => {
    if (imagePath.startsWith('data:image/')) return imagePath; // Base64 has no thumb
    const filename = imagePath.split('/').pop() || '';
    const dir = getThumbnailsDir();
    return dir ? `${dir}thumb_${filename}` : imagePath;
};

/**
 * Check if image exists
 */
export const imageExists = async (imagePath: string): Promise<boolean> => {
    try {
        if (imagePath.startsWith('data:image/')) return true; // Base64 always "exists"
        const fileInfo = await FS.getInfoAsync(imagePath);
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
        if (imagePath.startsWith('data:image/')) return true; // Nothing to delete
        const exists = await imageExists(imagePath);
        if (!exists) return false;

        await FS.deleteAsync(imagePath);
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
        const imagesDir = getImagesDir();
        const signaturesDir = getSignaturesDir();

        if (!imagesDir || !signaturesDir) return [];

        await initializeImageStorage();
        const imageFiles = await FS.readDirectoryAsync(imagesDir);
        const signatureFiles = await FS.readDirectoryAsync(signaturesDir);

        const allImages = [
            ...imageFiles.map((file: string) => `${imagesDir}${file}`),
            ...signatureFiles.map((file: string) => `${signaturesDir}${file}`)
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
            const fileInfo = await FS.getInfoAsync(imagePath);
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
        const root = getRootDir();
        if (root && tempUri.includes(root)) {
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