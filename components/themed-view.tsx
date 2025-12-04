import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: 'default' | 'glass-panel' | 'grid-background';
};

export function ThemedView({ style, lightColor, darkColor, variant = 'default', ...otherProps }: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  const surfaceColor = useThemeColor({}, 'surface');

  if (variant === 'glass-panel') {
    return (
      <View 
        style={[
          { 
            backgroundColor: surfaceColor, 
            opacity: 0.9,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)'
          }, 
          style
        ]} 
        {...otherProps} 
      />
    );
  }

  // Grid background could be implemented with an image or SVG, but for now we'll use a subtle color shift
  // In a real implementation, we'd add a grid pattern here.
  if (variant === 'grid-background') {
    return <View style={[{ backgroundColor }, style]} {...otherProps} />;
  }

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
