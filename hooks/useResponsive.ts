import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';
import { wp, hp, rf, rs, deviceInfo } from '../utils/responsive';

interface ResponsiveHookReturn {
  width: number;
  height: number;
  isPortrait: boolean;
  isLandscape: boolean;
  isSmallPhone: boolean;
  isPhone: boolean;
  isTablet: boolean;
  isLargeTablet: boolean;
  isTargetDevice: boolean;
  wp: (percentage: number) => number;
  hp: (percentage: number) => number;
  rf: (size: number) => number;
  rs: (size: number) => number;
  getOptimalColumns: () => number;
  getOptimalImageSize: () => number;
  getOptimalModalWidth: () => number;
}

export const useResponsive = (): ResponsiveHookReturn => {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }: { window: ScaledSize }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  const { width, height } = dimensions;
  const isPortrait = height > width;
  const isLandscape = width > height;
  
  // Device type detection based on current dimensions
  const isSmallPhone = width < 375;
  const isPhone = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isLargeTablet = width >= 1024;
  const isTargetDevice = width >= 1200 || (width >= 800 && height >= 1200);

  // Responsive functions that update with orientation
  const responsiveWp = (percentage: number): number => (width * percentage) / 100;
  const responsiveHp = (percentage: number): number => (height * percentage) / 100;
  
  const responsiveRf = (size: number): number => {
    const scale = width / 375; // Base on iPhone X width
    const newSize = size * scale;
    
    if (isSmallPhone) {
      return Math.max(newSize * 0.9, size * 0.8);
    } else if (isTablet || isLargeTablet) {
      return Math.min(newSize * 1.1, size * 1.3);
    }
    
    return newSize;
  };

  const responsiveRs = (size: number): number => {
    if (isSmallPhone) {
      return size * 0.8;
    } else if (isTablet) {
      return size * 1.2;
    } else if (isLargeTablet) {
      return size * 1.4;
    }
    return size;
  };

  // Optimal layout calculations
  const getOptimalColumns = (): number => {
    if (isLandscape) {
      // More columns in landscape
      if (isSmallPhone) return 2;
      if (isPhone) return 3;
      if (isTablet) return 4;
      return 5;
    } else {
      // Standard columns in portrait
      if (isSmallPhone) return 1;
      if (isPhone) return 2;
      if (isTablet) return 3;
      return 4;
    }
  };

  const getOptimalImageSize = (): number => {
    const columns = getOptimalColumns();
    const padding = responsiveWp(4) * 2; // Left and right padding
    const spacing = responsiveRs(8) * (columns - 1); // Spacing between items
    
    return (width - padding - spacing) / columns;
  };

  const getOptimalModalWidth = (): number => {
    if (isLandscape) {
      // Smaller modal width in landscape to leave space for content
      if (isPhone) return responsiveWp(80);
      if (isTablet) return responsiveWp(60);
      return responsiveWp(50);
    } else {
      // Standard modal width in portrait
      if (isPhone) return responsiveWp(95);
      if (isTablet) return responsiveWp(80);
      return responsiveWp(70);
    }
  };

  return {
    width,
    height,
    isPortrait,
    isLandscape,
    isSmallPhone,
    isPhone,
    isTablet,
    isLargeTablet,
    isTargetDevice,
    wp: responsiveWp,
    hp: responsiveHp,
    rf: responsiveRf,
    rs: responsiveRs,
    getOptimalColumns,
    getOptimalImageSize,
    getOptimalModalWidth,
  };
};

export default useResponsive;