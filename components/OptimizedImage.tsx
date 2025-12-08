import { useThemeColor } from '@/hooks/use-theme-color';
import { Image } from 'expo-image';
import React, { memo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

interface OptimizedImageProps {
  source: { uri: string } | number;
  style?: any;
  placeholder?: string;
  contentFit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
  transition?: number;
  cachePolicy?: 'memory' | 'disk' | 'memory-disk' | 'none';
  priority?: 'low' | 'normal' | 'high';
  onLoad?: () => void;
  onError?: (error: any) => void;
  alt?: string;
  lazy?: boolean;
  blurRadius?: number;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  style,
  placeholder,
  contentFit = 'contain',
  transition = 200,
  cachePolicy = 'memory-disk',
  priority = 'normal',
  onLoad,
  onError,
  alt,
  lazy = true, // Not used in JS anymore, but kept for API compatibility if needed (expo-image handles it internally usually)
  blurRadius,
}) => {
  const [hasError, setHasError] = useState(false);
  
  const backgroundColor = useThemeColor({}, 'surface');
  // const placeholderColor = useThemeColor({}, 'border'); // Not used with native placeholder

  const handleLoad = () => {
    setHasError(false);
    onLoad?.();
  };

  const handleError = (error: any) => {
    setHasError(true);
    onError?.(error);
  };

  const getPlaceholderSource = () => {
    if (placeholder) {
      return { uri: placeholder };
    }
    // Static 1x1 PNG placeholder (gray)
    const transparentPngBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAuMB9h1dHkQAAAAASUVORK5CYII=';
    return { uri: `data:image/png;base64,${transparentPngBase64}` };
  };

  return (
    <View style={[styles.container, style, { backgroundColor: hasError ? backgroundColor : undefined }]}>
      {hasError ? (
        <Image
          source={getPlaceholderSource()}
          style={[styles.image, style]}
          contentFit={contentFit}
        />
      ) : (
        <Image
          source={source}
          style={[styles.image, style]}
          placeholder={getPlaceholderSource()}
          contentFit={contentFit}
          transition={transition}
          cachePolicy={cachePolicy}
          priority={priority}
          onLoad={handleLoad}
          onError={handleError}
          blurRadius={blurRadius}
          accessible={!!alt}
          accessibilityLabel={alt}
          // native lazy loading is default in expo-image or handled by FlatList windowing
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    zIndex: 1,
  },
});

export default memo(OptimizedImage);