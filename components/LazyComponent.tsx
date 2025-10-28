import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, ScrollView } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';

interface LazyComponentProps {
  children: React.ReactNode;
  placeholder?: React.ReactNode;
  threshold?: number;
  delay?: number;
  style?: any;
  fallback?: React.ReactNode;
  onVisible?: () => void;
  rootMargin?: number;
  enabled?: boolean;
}

const LazyComponent: React.FC<LazyComponentProps> = ({
  children,
  placeholder,
  threshold = 100,
  delay = 0,
  style,
  fallback,
  onVisible,
  rootMargin = 50,
  enabled = true,
}) => {
  const [isVisible, setIsVisible] = useState(!enabled);
  const [isLoading, setIsLoading] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const viewRef = useRef<View>(null);
  const timeoutRef = useRef<number | undefined>(undefined);
  const intervalRef = useRef<number | undefined>(undefined);
  const isUnmountedRef = useRef(false);
  const lastCheckTimeRef = useRef(0);
  
  const backgroundColor = useThemeColor({}, 'surface');
  const placeholderColor = useThemeColor({}, 'border');

  // Cleanup function to prevent memory leaks
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }, []);

  // Optimized visibility check with throttling
  const checkVisibility = useCallback(() => {
    if (!enabled || isVisible || hasBeenVisible || isUnmountedRef.current || !viewRef.current) {
      return;
    }

    const now = Date.now();
    // Throttle visibility checks to improve performance
    if (now - lastCheckTimeRef.current < 100) {
      return;
    }
    lastCheckTimeRef.current = now;

    try {
      viewRef.current.measure((x, y, width, height, pageX, pageY) => {
        if (isUnmountedRef.current) return;

        const screenHeight = Dimensions.get('window').height;
        const screenWidth = Dimensions.get('window').width;
        
        // Enhanced visibility detection
        const isInViewportVertically = pageY < screenHeight + threshold && pageY + height > -threshold;
        const isInViewportHorizontally = pageX < screenWidth + threshold && pageX + width > -threshold;
        const isInViewport = isInViewportVertically && isInViewportHorizontally;
        
        // Additional checks for better accuracy
        const hasValidDimensions = width > 0 && height > 0;
        const isWithinRootMargin = pageY < screenHeight + rootMargin && pageY + height > -rootMargin;
        
        if (isInViewport && hasValidDimensions && isWithinRootMargin) {
          setHasBeenVisible(true);
          setIsLoading(true);
          
          if (delay > 0) {
            timeoutRef.current = setTimeout(() => {
              if (!isUnmountedRef.current) {
                setIsVisible(true);
                setIsLoading(false);
                onVisible?.();
              }
            }, delay) as unknown as number;
          } else {
            setIsVisible(true);
            setIsLoading(false);
            onVisible?.();
          }
        }
      });
    } catch (error) {
      console.warn('LazyComponent visibility check error:', error);
      // Fallback: show content if measurement fails
      if (!isUnmountedRef.current) {
        setIsVisible(true);
        setIsLoading(false);
      }
    }
  }, [enabled, isVisible, hasBeenVisible, threshold, delay, onVisible, rootMargin]);

  // Setup intersection observer alternative for React Native
  useEffect(() => {
    if (!enabled) {
      setIsVisible(true);
      return;
    }

    isUnmountedRef.current = false;

    // Initial check after a short delay to ensure layout is complete
    const initialTimer = setTimeout(() => {
      if (!isUnmountedRef.current) {
        checkVisibility();
      }
    }, 50);

    // Set up periodic checks only if not visible yet
    if (!isVisible && !hasBeenVisible) {
      intervalRef.current = setInterval(() => {
        if (!isUnmountedRef.current && !isVisible && !hasBeenVisible) {
          checkVisibility();
        } else if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = undefined;
        }
      }, 200) as unknown as number; // Check every 200ms for better performance
    }

    return () => {
      clearTimeout(initialTimer);
      cleanup();
    };
  }, [enabled, isVisible, hasBeenVisible, checkVisibility, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
      cleanup();
    };
  }, [cleanup]);

  // Stop checking once visible
  useEffect(() => {
    if (isVisible && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }, [isVisible]);

  const renderPlaceholder = useCallback(() => {
    if (placeholder) {
      return placeholder;
    }
    
    if (fallback) {
      return fallback;
    }

    return (
      <View style={[styles.defaultPlaceholder, { backgroundColor }]}>
        {isLoading && (
          <ActivityIndicator 
            size="small" 
            color={placeholderColor} 
            testID="lazy-loading-indicator"
          />
        )}
      </View>
    );
  }, [placeholder, fallback, backgroundColor, isLoading, placeholderColor]);

  // Memoize the content to prevent unnecessary re-renders
  const content = isVisible ? children : renderPlaceholder();

  return (
    <View 
      ref={viewRef} 
      style={[styles.container, style]}
      testID="lazy-component-container"
    >
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  defaultPlaceholder: {
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    opacity: 0.7,
  },
});

export default memo(LazyComponent, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.enabled === nextProps.enabled &&
    prevProps.threshold === nextProps.threshold &&
    prevProps.delay === nextProps.delay &&
    prevProps.children === nextProps.children &&
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.fallback === nextProps.fallback
  );
});