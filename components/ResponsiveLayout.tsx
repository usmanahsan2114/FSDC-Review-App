import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { deviceInfo, getDevicePadding, isSmallPhone, isTablet, rf, rs, wp } from '../utils/responsive';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  style?: any;
  scrollable?: boolean;
  centerContent?: boolean;
  maxWidth?: boolean;
  padding?: boolean;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  style,
  scrollable = false,
  centerContent = false,
  maxWidth = true,
  padding = true,
}) => {
  const containerStyle = [
    styles.container,
    padding && { padding: getDevicePadding().horizontal },
    centerContent && styles.centered,
    maxWidth && styles.maxWidth,
    style,
  ];

  if (scrollable) {
    return (
      <ScrollView 
        style={containerStyle}
        contentContainerStyle={centerContent ? styles.scrollCentered : undefined}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={containerStyle}>{children}</View>;
};

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: number;
  spacing?: number;
  style?: any;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns,
  spacing = rs(16),
  style,
}) => {
  const getColumns = () => {
    if (columns) return columns;
    if (isSmallPhone) return 1;
    if (deviceInfo.width < 768) return 2;
    if (isTablet) return 3;
    return 4;
  };

  const numColumns = getColumns();
  const itemWidth = (deviceInfo.width - (getDevicePadding().horizontal * 2) - (spacing * (numColumns - 1))) / numColumns;

  return (
    <View style={[styles.grid, { gap: spacing }, style]}>
      {React.Children.map(children, (child, index) => (
        <View style={[styles.gridItem, { width: itemWidth }]}>
          {child}
        </View>
      ))}
    </View>
  );
};

interface ResponsiveCardProps {
  children: React.ReactNode;
  style?: any;
  elevated?: boolean;
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  style,
  elevated = true,
}) => {
  return (
    <View style={[
      styles.card,
      elevated && styles.cardElevated,
      style,
    ]}>
      {children}
    </View>
  );
};

interface ResponsiveTextProps {
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  weight?: 'normal' | 'bold';
  style?: any;
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  size = 'medium',
  weight = 'normal',
  style,
}) => {
  const getFontSize = () => {
    switch (size) {
      case 'small': return rf(12);
      case 'medium': return rf(16);
      case 'large': return rf(20);
      case 'xlarge': return rf(28);
      default: return rf(16);
    }
  };

  return (
    <Text
      style={[
        styles.text,
        {
          fontSize: getFontSize(),
          fontWeight: weight === 'bold' ? 'bold' : 'normal',
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  maxWidth: {
    maxWidth: isTablet ? wp(80) : wp(100),
    alignSelf: 'center',
  },
  scrollCentered: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    marginBottom: rs(16),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: rs(12),
    padding: rs(16),
    marginBottom: rs(16),
  },
  cardElevated: {
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  text: {
    color: '#000',
  },
});

export default ResponsiveLayout;