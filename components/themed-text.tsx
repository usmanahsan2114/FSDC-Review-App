import { Platform, StyleSheet, Text, type TextProps } from 'react-native';
import { rf } from '../utils/responsive';

import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: rf(16),
    lineHeight: rf(24),
    paddingVertical: rf(4), // Increased padding to prevent descender clipping
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  },
  defaultSemiBold: {
    fontSize: rf(16),
    lineHeight: rf(24),
    fontWeight: '600',
    paddingVertical: rf(4), // Increased padding to prevent descender clipping
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-medium' }),
  },
  title: {
    fontSize: rf(32),
    fontWeight: 'bold',
    lineHeight: rf(44), // Increased to accommodate descenders
    paddingVertical: rf(8), // Increased padding to prevent descender clipping
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  },
  subtitle: {
    fontSize: rf(20),
    fontWeight: 'bold',
    lineHeight: rf(30), // Increased line height to prevent cutoff
    paddingVertical: rf(6), // Increased padding to prevent descender clipping
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  },
  link: {
    lineHeight: rf(30),
    fontSize: rf(16),
    color: '#0a7ea4',
    paddingVertical: rf(4), // Increased padding to prevent descender clipping
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  },
});
