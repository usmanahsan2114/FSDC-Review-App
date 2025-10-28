import { useThemeColor } from '@/hooks/use-theme-color';
import { Image } from 'expo-image';
import React, { memo, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

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
  lazy = true,
  blurRadius,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(!lazy);
  
  const backgroundColor = useThemeColor({}, 'surface');
  const placeholderColor = useThemeColor({}, 'border');

  useEffect(() => {
    if (lazy) {
      // Simulate intersection observer for lazy loading
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [lazy]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  const handleError = (error: any) => {
    setIsLoading(false);
    setHasError(true);
    onError?.(error);
  };

  const getPlaceholderSource = () => {
    if (placeholder) {
      return { uri: placeholder };
    }
    // Static 1x1 PNG placeholder (gray) to avoid btoa usage in RN
    const transparentPngBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAuMB9h1dHkQAAAAASUVORK5CYII=';
    return { uri: `data:image/png;base64,${transparentPngBase64}` };
  };

  if (!isVisible) {
    return (
      <View style={[styles.container, style, { backgroundColor }]}>
        <ActivityIndicator size="small" color={placeholderColor} />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {isLoading && (
        <View style={[styles.loadingContainer, StyleSheet.absoluteFill]}>
          <ActivityIndicator size="small" color={placeholderColor} />
        </View>
      )}
      
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
          // Default to 'contain' to avoid cropping/distortion; callers may override
          contentFit={contentFit}
          transition={transition}
          cachePolicy={cachePolicy}
          priority={priority}
          onLoad={handleLoad}
          onError={handleError}
          blurRadius={blurRadius}
          accessible={!!alt}
          accessibilityLabel={alt}
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