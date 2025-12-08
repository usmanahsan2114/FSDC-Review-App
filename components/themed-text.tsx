import { Platform, StyleSheet, Text, type TextProps } from 'react-native';
import { rf } from '../utils/responsive';

import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'technical-label' | 'hero-title' | 'data-value';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        type === 'technical-label' ? [styles.technicalLabel, { color: secondaryColor }] : undefined,
        type === 'hero-title' ? styles.heroTitle : undefined,
        type === 'data-value' ? [styles.dataValue, { color: primaryColor }] : undefined,
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

    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  },
  defaultSemiBold: {
    fontSize: rf(16),
    lineHeight: rf(26),
    fontWeight: '600',

    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-medium' }),
  },
  title: {
    fontSize: rf(32),
    fontWeight: 'bold',
    lineHeight: rf(44),

    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  },
  subtitle: {
    fontSize: rf(20),
    fontWeight: 'bold',
    lineHeight: rf(30),

    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  },
  link: {
    lineHeight: rf(30),
    fontSize: rf(16),
    color: '#0a7ea4',

    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  },
  technicalLabel: {
    fontSize: rf(12),
    lineHeight: rf(20),
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace' }),
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: rf(40),
    lineHeight: rf(48),
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-black' }),
  },
  dataValue: {
    fontSize: rf(24),
    lineHeight: rf(32),
    fontWeight: 'bold',
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace' }),
  },
});
