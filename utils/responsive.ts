import { Dimensions, PixelRatio, useWindowDimensions } from 'react-native';

// TEMPORARY: Get initial dimensions (will be replaced by hook usage in components)
const getInitialDimensions = () => {
  const { width, height } = Dimensions.get('window');
  return { width, height };
};

const initial = getInitialDimensions();

/**
 * Hook for getting current window dimensions
 * This replaces the deprecated Dimensions.get('window') pattern
 */
export const useResponsiveDimensions = () => {
  const { width, height } = useWindowDimensions();
  return { width, height };
};

// Device type detection functions
const calcIsSmallPhone = (width: number) => width < 375;
const calcIsPhone = (width: number) => width < 768;
const calcIsTablet = (width: number) => width >= 768 && width < 1024;
const calcIsLargeTablet = (width: number) => width >= 1024;
const calcIsTargetDevice = (width: number, height: number) => width >= 1200 || (width >= 800 && height >= 1200);

export const isSmallPhone = calcIsSmallPhone(initial.width);
export const isPhone = calcIsPhone(initial.width);
export const isTablet = calcIsTablet(initial.width);
export const isLargeTablet = calcIsLargeTablet(initial.width);
export const isTargetDevice = calcIsTargetDevice(initial.width, initial.height);

// Responsive width percentage
export const wp = (percentage: string | number, screenWidth: number = initial.width): number => {
  const percent = typeof percentage === 'string' 
    ? parseFloat(percentage.replace('%', '')) 
    : percentage;
  return (screenWidth * percent) / 100;
};

// Responsive height percentage
export const hp = (percentage: string | number, screenHeight: number = initial.height): number => {
  const percent = typeof percentage === 'string' 
    ? parseFloat(percentage.replace('%', '')) 
    : percentage;
  return (screenHeight * percent) / 100;
};

// Responsive font size with device-specific scaling
// Responsive font size with device-specific scaling
export const rf = (size: number, screenWidth: number = initial.width, screenHeight: number = initial.height): number => {
  const fontScale = PixelRatio.getFontScale();
  
  const cappedFontScale = Math.min(fontScale, 1.3);
  
  if (calcIsTargetDevice(screenWidth, screenHeight)) {
    const scale = Math.min(screenWidth / 375, 2.2);
    let scaledSize = size * scale * 0.8;
    
    scaledSize = scaledSize * cappedFontScale;
    
    if (size >= 32) scaledSize = Math.min(scaledSize, 48);
    if (size >= 24) scaledSize = Math.min(scaledSize, 36);
    if (size >= 20) scaledSize = Math.min(scaledSize, 28);
    
    return Math.max(scaledSize, size * 0.9);
  }
  
  const scale = screenWidth / 375;
  let newSize = size * scale;
  
  newSize = newSize * cappedFontScale;
  
  if (calcIsSmallPhone(screenWidth)) {
    newSize = Math.max(newSize * 0.9, size * 0.8);
  } else if (calcIsTablet(screenWidth)) {
    newSize = Math.min(newSize * 0.95, size * 1.15);
    if (size >= 32) newSize = Math.min(newSize, 42);
    if (size >= 24) newSize = Math.min(newSize, 32);
  } else if (calcIsLargeTablet(screenWidth)) {
    newSize = Math.min(newSize * 1.0, size * 1.25);
    if (size >= 32) newSize = Math.min(newSize, 45);
    if (size >= 24) newSize = Math.min(newSize, 34);
  }
  
  if (size >= 32) newSize = Math.min(newSize, 40);
  if (size >= 24) newSize = Math.min(newSize, 30);
  
  return Math.max(newSize, size * 0.85);
};

// Responsive spacing with device-specific adjustments
export const rs = (size: number, screenWidth: number = initial.width): number => {
  if (calcIsSmallPhone(screenWidth)) {
    return size * 0.8;
  } else if (calcIsTablet(screenWidth)) {
    return size * 1.2;
  } else if (calcIsLargeTablet(screenWidth)) {
    return size * 1.4;
  }
  return size;
};

// Minimum touch target size (44px for accessibility)
export const minTouchTarget = 44;

// Device-specific padding
export const getDevicePadding = (screenWidth: number = initial.width, screenHeight: number = initial.height) => {
  if (isSmallPhone(screenWidth)) {
    return {
      horizontal: wp(3, screenWidth),
      vertical: hp(1.5, screenHeight),
    };
  } else if (calcIsTablet(screenWidth) || calcIsLargeTablet(screenWidth)) {
    return {
      horizontal: wp(6, screenWidth),
      vertical: hp(3, screenHeight),
    };
  }
  return {
    horizontal: wp(4, screenWidth),
    vertical: hp(2, screenHeight),
  };
};

// Grid columns based on device size
export const getGridColumns = (screenWidth: number = initial.width) => {
  if (calcIsSmallPhone(screenWidth)) return 1;
  if (calcIsPhone(screenWidth)) return 2;
  if (calcIsTablet(screenWidth)) return 3;
  return 4;
};

// Card width for different devices
export const getCardWidth = (screenWidth: number = initial.width) => {
  if (calcIsSmallPhone(screenWidth)) return wp(90, screenWidth);
  if (calcIsPhone(screenWidth)) return wp(85, screenWidth);
  if (calcIsTablet(screenWidth)) return wp(45, screenWidth);
  return wp(30, screenWidth);
};

// Modal width for different devices
export const getModalWidth = (screenWidth: number = initial.width) => {
  if (calcIsPhone(screenWidth)) return wp(95, screenWidth);
  if (calcIsTablet(screenWidth)) return wp(80, screenWidth);
  return wp(70, screenWidth);
};

// Image dimensions for photo grids
export const getPhotoGridSize = (screenWidth: number = initial.width, screenHeight: number = initial.height) => {
  const columns = getGridColumns(screenWidth);
  const padding = getDevicePadding(screenWidth, screenHeight).horizontal;
  const spacing = rs(8, screenWidth);
  
  return (screenWidth - (padding * 2) - (spacing * (columns - 1))) / columns;
};

// Device info getter function
export const getDeviceInfo = (screenWidth: number = initial.width, screenHeight: number = initial.height) => ({
  width: screenWidth,
  height: screenHeight,
  isSmallPhone: calcIsSmallPhone(screenWidth),
  isPhone: calcIsPhone(screenWidth),
  isTablet: calcIsTablet(screenWidth),
  isLargeTablet: calcIsLargeTablet(screenWidth),
  isTargetDevice: calcIsTargetDevice(screenWidth, screenHeight),
  pixelRatio: PixelRatio.get(),
  fontScale: PixelRatio.getFontScale(),
});

// Legacy export for backwards compatibility
export const deviceInfo = getDeviceInfo();