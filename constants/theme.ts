/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#2563EB'; // Professional blue
const tintColorDark = '#60A5FA'; // Lighter blue for dark mode

export const Colors = {
  light: {
    // Even in light mode, we keep a technical, high-contrast look, but inverted for visibility if needed.
    // However, the prompt implies a strong brand identity. Let's make "light" mode just a slightly brighter version of the dark mode
    // or strictly adhere to the requested "Deep Space" vibe. 
    // For a true "cockpit" feel, a dark interface is standard. 
    // Let's map "light" to a high-visibility day-mode cockpit (grey/white) and "dark" to night-mode.
    
    text: '#111827',
    background: '#F3F4F6', // Light grey for day mode
    tint: '#0070F3', // Deep blue
    icon: '#4B5563',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#0070F3',
    card: '#FFFFFF',
    border: '#E5E7EB',
    notification: '#EF4444',
    surface: '#FFFFFF',
    primary: '#0070F3',
    secondary: '#64748B',
    accent: '#F59E0B', // Amber for alerts
  },
  dark: {
    // Orbital Command Palette
    text: '#E2E8F0', // High legibility grey-white
    background: '#0B0E14', // Deep Space Black
    tint: '#00F0FF', // Signal Cyan
    icon: '#94A3B8', // Slate lighter
    tabIconDefault: '#475569',
    tabIconSelected: '#00F0FF',
    card: '#151922', // Dark Navy Surface
    border: '#1E293B', // Slate dark
    notification: '#FF4500', // Alert Orange
    surface: '#151922',
    primary: '#00F0FF',
    secondary: '#64748B',
    accent: '#FF4500',
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
