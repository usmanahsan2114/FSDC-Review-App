import { Dimensions, PixelRatio } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Device type detection
export const isSmallPhone = screenWidth < 375;
export const isPhone = screenWidth < 768;
export const isTablet = screenWidth >= 768 && screenWidth < 1024;
export const isLargeTablet = screenWidth >= 1024;

// Your main target device specs: 10.4" tablet with 1200x2000 resolution
export const isTargetDevice = screenWidth >= 1200 || (screenWidth >= 800 && screenHeight >= 1200);

// Responsive width percentage
export const wp = (percentage: string | number): number => {
  const percent = typeof percentage === 'string' 
    ? parseFloat(percentage.replace('%', '')) 
    : percentage;
  return (screenWidth * percent) / 100;
};

// Responsive height percentage
export const hp = (percentage: string | number): number => {
  const percent = typeof percentage === 'string' 
    ? parseFloat(percentage.replace('%', '')) 
    : percentage;
  return (screenHeight * percent) / 100;
};

// Responsive font size with device-specific scaling
export const rf = (size: number): number => {
  const fontScale = PixelRatio.getFontScale();
  
  // Cap font scale to prevent extremely large text
  const cappedFontScale = Math.min(fontScale, 1.3);
  
  // For target device (1200x2000), use more conservative scaling
  if (isTargetDevice) {
    const scale = Math.min(screenWidth / 375, 2.2); // Reduced cap for target device
    let scaledSize = size * scale * 0.8; // More conservative scaling
    
    // Apply capped font scale
    scaledSize = scaledSize * cappedFontScale;
    
    // Add absolute maximum limits based on text size
    if (size >= 32) scaledSize = Math.min(scaledSize, 48); // XXL text max
    if (size >= 24) scaledSize = Math.min(scaledSize, 36); // XL text max
    if (size >= 20) scaledSize = Math.min(scaledSize, 28); // Large text max
    
    return Math.max(scaledSize, size * 0.9);
  }
  
  const scale = screenWidth / 375; // Base on iPhone X width
  let newSize = size * scale;
  
  // Apply capped font scale from system settings
  newSize = newSize * cappedFontScale;
  
  if (isSmallPhone) {
    newSize = Math.max(newSize * 0.9, size * 0.8); // Slightly smaller for small phones
  } else if (isTablet) {
    newSize = Math.min(newSize * 0.95, size * 1.15); // More conservative for tablets
    // Add size-specific caps for tablets
    if (size >= 32) newSize = Math.min(newSize, 42);
    if (size >= 24) newSize = Math.min(newSize, 32);
  } else if (isLargeTablet) {
    newSize = Math.min(newSize * 1.0, size * 1.25); // Slightly larger for large tablets
    // Add size-specific caps for large tablets
    if (size >= 32) newSize = Math.min(newSize, 45);
    if (size >= 24) newSize = Math.min(newSize, 34);
  }
  
  // Global maximum limits to prevent text overflow
  if (size >= 32) newSize = Math.min(newSize, 40); // XXL text global max
  if (size >= 24) newSize = Math.min(newSize, 30); // XL text global max
  
  return Math.max(newSize, size * 0.85); // Ensure minimum readability
};

// Responsive spacing with device-specific adjustments
export const rs = (size: number): number => {
  if (isSmallPhone) {
    return size * 0.8;
  } else if (isTablet) {
    return size * 1.2;
  } else if (isLargeTablet) {
    return size * 1.4;
  }
  return size;
};

// Minimum touch target size (44px for accessibility)
export const minTouchTarget = Math.max(44, wp(12));

// Device-specific padding
export const getDevicePadding = () => {
  if (isSmallPhone) {
    return {
      horizontal: wp(3),
      vertical: hp(1.5),
    };
  } else if (isTablet || isLargeTablet) {
    return {
      horizontal: wp(6),
      vertical: hp(3),
    };
  }
  return {
    horizontal: wp(4),
    vertical: hp(2),
  };
};

// Grid columns based on device size
export const getGridColumns = () => {
  if (isSmallPhone) return 1;
  if (isPhone) return 2;
  if (isTablet) return 3;
  return 4; // Large tablets
};

// Card width for different devices
export const getCardWidth = () => {
  if (isSmallPhone) return wp(90);
  if (isPhone) return wp(85);
  if (isTablet) return wp(45);
  return wp(30); // Large tablets
};

// Modal width for different devices
export const getModalWidth = () => {
  if (isPhone) return wp(95);
  if (isTablet) return wp(80);
  return wp(70); // Large tablets
};

// Image dimensions for photo grids
export const getPhotoGridSize = () => {
  const columns = getGridColumns();
  const padding = getDevicePadding().horizontal;
  const spacing = rs(8);
  
  return (screenWidth - (padding * 2) - (spacing * (columns - 1))) / columns;
};

export const deviceInfo = {
  width: screenWidth,
  height: screenHeight,
  isSmallPhone,
  isPhone,
  isTablet,
  isLargeTablet,
  isTargetDevice,
  pixelRatio: PixelRatio.get(),
  fontScale: PixelRatio.getFontScale(),
};