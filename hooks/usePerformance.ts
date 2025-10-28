import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus, InteractionManager, Platform } from 'react-native';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  componentMounts: number;
  rerenders: number;
  lastUpdate: number;
}

interface PerformanceOptions {
  enableDebounce?: boolean;
  debounceDelay?: number;
  enableThrottle?: boolean;
  throttleDelay?: number;
  enableMemoization?: boolean;
  maxCacheSize?: number;
  enableMemoryTracking?: boolean;
  enableRenderTracking?: boolean;
  sampleInterval?: number;
}

interface PerformanceHookReturn {
  metrics: PerformanceMetrics;
  startTimer: (label?: string) => void;
  endTimer: (label?: string) => number;
  recordRender: () => void;
  resetMetrics: () => void;
  isTracking: boolean;
  debounce: (func: Function, delay?: number) => (...args: any[]) => void;
  throttle: (func: Function, delay?: number) => (...args: any[]) => void;
  memoize: <T extends (...args: any[]) => any>(func: T, keyGenerator?: (...args: Parameters<T>) => string) => T;
  clearCache: () => void;
  runAfterInteractions: (callback: () => void) => void;
  optimizeForPlatform: <T>(iosValue: T, androidValue: T, webValue?: T) => T;
  utils: {
    isLowEndDevice: () => boolean;
    getOptimalImageSize: (containerWidth: number, containerHeight: number) => { width: number; height: number };
    shouldReduceAnimations: () => boolean;
  };
}

const DEFAULT_OPTIONS: Required<PerformanceOptions> = {
  enableDebounce: true,
  debounceDelay: 300,
  enableThrottle: true,
  throttleDelay: 100,
  enableMemoization: true,
  maxCacheSize: 50,
  enableMemoryTracking: true,
  enableRenderTracking: true,
  sampleInterval: 1000,
};

export const usePerformance = (options: PerformanceOptions = {}): PerformanceHookReturn => {
  const finalOptions = { ...DEFAULT_OPTIONS, ...options };
  
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    componentMounts: 0,
    rerenders: 0,
    lastUpdate: Date.now(),
  });

  const [isTracking, setIsTracking] = useState(true);
  
  // Use refs to avoid stale closures and memory leaks
  const timersRef = useRef<Map<string, number>>(new Map());
  const mountCountRef = useRef(0);
  const rerenderCountRef = useRef(0);
  const intervalRef = useRef<number | null>(null);
  const appStateRef = useRef<AppStateStatus>('active');
  const isUnmountedRef = useRef(false);
  const debounceTimerRef = useRef<number | undefined>(undefined);
  const throttleTimerRef = useRef<number | undefined>(undefined);
  const lastThrottleTimeRef = useRef<number>(0);
  const memoCache = useRef<Map<string, any>>(new Map());

  // Cleanup function to prevent memory leaks
  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (throttleTimerRef.current) {
      clearTimeout(throttleTimerRef.current);
    }
    timersRef.current.clear();
    memoCache.current.clear();
  }, []);

  // Safe state update function
  const safeSetMetrics = useCallback((updater: (prev: PerformanceMetrics) => PerformanceMetrics) => {
    if (!isUnmountedRef.current) {
      setMetrics(updater);
    }
  }, []);

  // Memory tracking with error handling
  const trackMemory = useCallback(() => {
    if (!finalOptions.enableMemoryTracking || isUnmountedRef.current) return;
    
    try {
      // Estimate memory usage (React Native doesn't have direct memory API)
      const estimatedMemory = performance.now() % 100; // Placeholder estimation
      
      safeSetMetrics(prev => ({
        ...prev,
        memoryUsage: estimatedMemory,
        lastUpdate: Date.now(),
      }));
    } catch (error) {
      console.warn('Memory tracking error:', error);
    }
  }, [finalOptions.enableMemoryTracking, safeSetMetrics]);

  // App state change handler
  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    appStateRef.current = nextAppState;
    
    if (nextAppState === 'background') {
      setIsTracking(false);
      cleanup();
    } else if (nextAppState === 'active') {
      setIsTracking(true);
    }
  }, [cleanup]);

  // Timer functions with improved error handling
  const startTimer = useCallback((label: string = 'default') => {
    if (!isTracking || isUnmountedRef.current) return;
    
    try {
      timersRef.current.set(label, performance.now());
    } catch (error) {
      console.warn('Timer start error:', error);
    }
  }, [isTracking]);

  const endTimer = useCallback((label: string = 'default'): number => {
    if (!isTracking || isUnmountedRef.current) return 0;
    
    try {
      const startTime = timersRef.current.get(label);
      if (startTime === undefined) {
        console.warn(`Timer "${label}" was not started`);
        return 0;
      }
      
      const duration = performance.now() - startTime;
      timersRef.current.delete(label);
      
      if (finalOptions.enableRenderTracking) {
        safeSetMetrics(prev => ({
          ...prev,
          renderTime: duration,
          lastUpdate: Date.now(),
        }));
      }
      
      return duration;
    } catch (error) {
      console.warn('Timer end error:', error);
      return 0;
    }
  }, [isTracking, finalOptions.enableRenderTracking, safeSetMetrics]);

  // Record render with bounds checking
  const recordRender = useCallback(() => {
    if (!finalOptions.enableRenderTracking || isUnmountedRef.current) return;
    
    try {
      rerenderCountRef.current += 1;
      
      safeSetMetrics(prev => ({
        ...prev,
        rerenders: rerenderCountRef.current,
        lastUpdate: Date.now(),
      }));
    } catch (error) {
      console.warn('Render recording error:', error);
    }
  }, [finalOptions.enableRenderTracking, safeSetMetrics]);

  // Reset metrics function
  const resetMetrics = useCallback(() => {
    if (isUnmountedRef.current) return;
    
    try {
      mountCountRef.current = 0;
      rerenderCountRef.current = 0;
      timersRef.current.clear();
      
      safeSetMetrics(() => ({
        renderTime: 0,
        memoryUsage: 0,
        componentMounts: 0,
        rerenders: 0,
        lastUpdate: Date.now(),
      }));
    } catch (error) {
      console.warn('Metrics reset error:', error);
    }
  }, [safeSetMetrics]);

  // Debounce function
  const debounce = useCallback(
    (func: Function, delay: number = finalOptions.debounceDelay) => {
      return (...args: any[]) => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => func(...args), delay) as unknown as number;
      };
    },
    [finalOptions.debounceDelay]
  );

  // Throttle function
  const throttle = useCallback(
    (func: Function, delay: number = finalOptions.throttleDelay) => {
      return (...args: any[]) => {
        const now = Date.now();
        if (now - lastThrottleTimeRef.current >= delay) {
          lastThrottleTimeRef.current = now;
          func(...args);
        }
      };
    },
    [finalOptions.throttleDelay]
  );

  // Memoization with cache size limit
  const memoize = useCallback(
    <T extends (...args: any[]) => any>(func: T, keyGenerator?: (...args: Parameters<T>) => string): T => {
      return ((...args: Parameters<T>) => {
        const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
        
        if (memoCache.current.has(key)) {
          return memoCache.current.get(key);
        }

        const result = func(...args);
        
        // Manage cache size
        if (memoCache.current.size >= finalOptions.maxCacheSize) {
          const firstKey = memoCache.current.keys().next().value;
          if (firstKey !== undefined) {
            memoCache.current.delete(firstKey);
          }
        }
        
        memoCache.current.set(key, result);
        return result;
      }) as T;
    },
    [finalOptions.maxCacheSize]
  );

  // Clear cache
  const clearCache = useCallback(() => {
    memoCache.current.clear();
  }, []);

  // Run after interactions (for heavy operations)
  const runAfterInteractions = useCallback((callback: () => void) => {
    InteractionManager.runAfterInteractions(callback);
  }, []);

  // Optimize for platform
  const optimizeForPlatform = useCallback(<T>(iosValue: T, androidValue: T, webValue?: T): T => {
    if (Platform.OS === 'ios') return iosValue;
    if (Platform.OS === 'android') return androidValue;
    return webValue || androidValue;
  }, []);

  // Performance utilities
  const utils = useMemo(() => ({
    isLowEndDevice: () => {
      // Simple heuristic for low-end device detection
      return Platform.OS === 'android' && Platform.Version < 28;
    },
    
    getOptimalImageSize: (containerWidth: number, containerHeight: number) => {
      const pixelRatio = Platform.select({
        ios: 2,
        android: 1.5,
        default: 1,
      });
      
      return {
        width: Math.round(containerWidth * pixelRatio),
        height: Math.round(containerHeight * pixelRatio),
      };
    },
    
    shouldReduceAnimations: () => {
      // Check if we should reduce animations for performance
      return Platform.OS === 'android' && Platform.Version < 26;
    },
  }), []);

  // Setup effect with proper cleanup
  useEffect(() => {
    isUnmountedRef.current = false;
    mountCountRef.current += 1;
    
    safeSetMetrics(prev => ({
      ...prev,
      componentMounts: mountCountRef.current,
      lastUpdate: Date.now(),
    }));

    // Setup app state listener
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Setup memory tracking interval
    if (finalOptions.enableMemoryTracking && isTracking) {
      intervalRef.current = setInterval(trackMemory, finalOptions.sampleInterval) as unknown as number;
    }

    // Cleanup function
    return () => {
      isUnmountedRef.current = true;
      cleanup();
      subscription?.remove();
    };
  }, [finalOptions.enableMemoryTracking, finalOptions.sampleInterval, isTracking, trackMemory, handleAppStateChange, cleanup, safeSetMetrics]);

  // Tracking state effect
  useEffect(() => {
    if (isTracking && finalOptions.enableMemoryTracking && !intervalRef.current) {
      intervalRef.current = setInterval(trackMemory, finalOptions.sampleInterval) as unknown as number;
    } else if (!isTracking && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [isTracking, finalOptions.enableMemoryTracking, finalOptions.sampleInterval, trackMemory]);

  return {
    metrics,
    startTimer,
    endTimer,
    recordRender,
    resetMetrics,
    isTracking,
    debounce: finalOptions.enableDebounce ? debounce : (func: Function, delay?: number) => (...args: any[]) => func(...args),
    throttle: finalOptions.enableThrottle ? throttle : (func: Function, delay?: number) => (...args: any[]) => func(...args),
    memoize: finalOptions.enableMemoization ? memoize : <T extends Function>(func: T) => func,
    clearCache,
    runAfterInteractions,
    optimizeForPlatform,
    utils,
  };
};

export default usePerformance;