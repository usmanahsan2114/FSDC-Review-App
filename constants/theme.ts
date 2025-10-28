/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#2563EB'; // Professional blue
const tintColorDark = '#60A5FA'; // Lighter blue for dark mode

export const Colors = {
  light: {
    text: '#1F2937', // Dark gray instead of black
    background: '#FFFFFF',
    tint: tintColorLight,
    icon: '#6B7280', // Medium gray
    tabIconDefault: '#9CA3AF', // Light gray
    tabIconSelected: tintColorLight,
    card: '#FFFFFF',
    border: '#E5E7EB', // Light border
    notification: '#EF4444', // Professional red
    surface: '#F9FAFB', // Very light gray
    primary: tintColorLight,
    secondary: '#6B7280', // Medium gray
    accent: '#8B5CF6', // Professional purple
  },
  dark: {
    text: '#F9FAFB', // Light gray instead of white
    background: '#111827', // Dark gray instead of black
    tint: tintColorDark,
    icon: '#9CA3AF', // Medium gray
    tabIconDefault: '#6B7280', // Darker gray
    tabIconSelected: tintColorDark,
    card: '#1F2937', // Dark gray card
    border: '#374151', // Medium dark border
    notification: '#F87171', // Softer red for dark mode
    surface: '#1F2937', // Dark gray surface
    primary: tintColorDark,
    secondary: '#9CA3AF', // Light gray
    accent: '#A78BFA', // Lighter purple for dark mode
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
