import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Chip } from 'react-native-paper';
import { deviceInfo, getDevicePadding, getGridColumns, getPhotoGridSize, isLargeTablet, isPhone, isSmallPhone, isTablet, isTargetDevice, minTouchTarget, rf, rs, useResponsiveDimensions, wp } from '../utils/responsive';
import { ThemedText } from './themed-text';

export const ResponsiveTest: React.FC = () => {
  const { width, height } = useResponsiveDimensions();
  const isPortrait = height > width;

  function getDeviceType(): string {
    if (isTargetDevice) return 'Target Device (10.4" Tablet)';
    if (isLargeTablet) return 'Large Tablet';
    if (isTablet) return 'Tablet';
    if (isSmallPhone) return 'Small Phone';
    if (isPhone) return 'Phone';
    return 'Unknown';
  }

  const deviceSpecs = [
    { label: 'Width', value: `${width.toFixed(0)}px` },
    { label: 'Height', value: `${height.toFixed(0)}px` },
    { label: 'Orientation', value: isPortrait ? 'Portrait' : 'Landscape' },
    { label: 'Device Type', value: getDeviceType() },
    { label: 'Pixel Ratio', value: deviceInfo.pixelRatio.toFixed(2) },
    { label: 'Font Scale', value: deviceInfo.fontScale.toFixed(2) },
    { label: 'Optimal Columns', value: getGridColumns(width).toString() },
    { label: 'Min Touch Target', value: `${minTouchTarget}px` },
  ];

  const testSizes = [
    { label: 'Small Text', size: rf(12) },
    { label: 'Medium Text', size: rf(16) },
    { label: 'Large Text', size: rf(20) },
    { label: 'XL Text', size: rf(24) },
    { label: 'XXL Text', size: rf(32) },
  ];

  const testSpacing = [
    { label: 'Small Spacing', size: rs(8) },
    { label: 'Medium Spacing', size: rs(16) },
    { label: 'Large Spacing', size: rs(24) },
    { label: 'XL Spacing', size: rs(32) },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedText style={styles.title}>Responsive Design Test</ThemedText>
      
      {/* Device Information */}
      <Card style={styles.card}>
        <Card.Content>
          <ThemedText style={styles.sectionTitle}>Device Information</ThemedText>
          {deviceSpecs.map((spec, index) => (
            <View key={index} style={styles.specRow}>
              <ThemedText style={styles.specLabel}>{spec.label}:</ThemedText>
              <ThemedText style={styles.specValue}>{spec.value}</ThemedText>
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Responsive Text Sizes */}
      <Card style={styles.card}>
        <Card.Content>
          <ThemedText style={styles.sectionTitle}>Responsive Text Sizes</ThemedText>
          {testSizes.map((test, index) => (
            <View key={index} style={styles.textContainer}>
              <ThemedText style={[styles.testText, { fontSize: test.size }]}>
                {test.label} ({test.size.toFixed(1)}px)
              </ThemedText>
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Responsive Spacing */}
      <Card style={styles.card}>
        <Card.Content>
          <ThemedText style={styles.sectionTitle}>Responsive Spacing</ThemedText>
          {testSpacing.map((test, index) => (
            <View key={index} style={[styles.spacingTest, { marginBottom: test.size }]}>
              <ThemedText style={styles.spacingLabel}>
                {test.label} ({test.size.toFixed(1)}px)
              </ThemedText>
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Touch Target Test */}
      <Card style={styles.card}>
        <Card.Content>
          <ThemedText style={styles.sectionTitle}>Touch Target Test</ThemedText>
          <ThemedText style={styles.description}>
            All buttons should be at least {minTouchTarget}px for accessibility
          </ThemedText>
          <View style={styles.buttonRow}>
            <Button 
              mode="contained" 
              style={[styles.testButton, { minHeight: minTouchTarget }]}
              contentStyle={{ minHeight: minTouchTarget }}
            >
              Button 1
            </Button>
            <Button 
              mode="outlined" 
              style={[styles.testButton, { minHeight: minTouchTarget }]}
              contentStyle={{ minHeight: minTouchTarget }}
            >
              Button 2
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Grid Layout Test */}
      <Card style={styles.card}>
        <Card.Content>
          <ThemedText style={styles.sectionTitle}>Grid Layout Test</ThemedText>
          <ThemedText style={styles.description}>
            Optimal columns for this device: {getGridColumns(width)}
          </ThemedText>
          <View style={styles.gridContainer}>
            {Array.from({ length: 8 }, (_, index) => (
              <View 
                key={index} 
                style={[
                  styles.gridItem, 
                  { width: getPhotoGridSize(width, height) }
                ]}
              >
                <Chip mode="outlined">Item {index + 1}</Chip>
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Responsive Percentages */}
      <Card style={styles.card}>
        <Card.Content>
          <ThemedText style={styles.sectionTitle}>Responsive Percentages</ThemedText>
          <View style={styles.percentageTest}>
            <View style={[styles.percentageBar, { width: wp(25, width) }]}>
              <ThemedText style={styles.percentageText}>25%</ThemedText>
            </View>
            <View style={[styles.percentageBar, { width: wp(50, width) }]}>
              <ThemedText style={styles.percentageText}>50%</ThemedText>
            </View>
            <View style={[styles.percentageBar, { width: wp(75, width) }]}>
              <ThemedText style={styles.percentageText}>75%</ThemedText>
            </View>
            <View style={[styles.percentageBar, { width: wp(100, width) }]}>
              <ThemedText style={styles.percentageText}>100%</ThemedText>
            </View>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: getDevicePadding().horizontal,
    paddingBottom: rs(32),
  },
  title: {
    fontSize: rf(24),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: rs(24),
  },
  card: {
    marginBottom: rs(16),
    borderRadius: rs(12),
  },
  sectionTitle: {
    fontSize: rf(18),
    fontWeight: 'bold',
    marginBottom: rs(12),
  },
  description: {
    fontSize: rf(14),
    opacity: 0.7,
    marginBottom: rs(12),
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: rs(8),
  },
  specLabel: {
    fontSize: rf(14),
    fontWeight: '500',
  },
  specValue: {
    fontSize: rf(14),
    opacity: 0.8,
  },
  textContainer: {
    width: '100%',
    overflow: 'hidden',
    marginBottom: rs(8),
  },
  testText: {
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  spacingTest: {
    backgroundColor: '#f0f0f0',
    padding: rs(8),
    borderRadius: rs(4),
  },
  spacingLabel: {
    fontSize: rf(14),
  },
  buttonRow: {
    flexDirection: 'row',
    gap: rs(12),
    marginTop: rs(8),
  },
  testButton: {
    flex: 1,
    borderRadius: rs(8),
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: rs(8),
    marginTop: rs(8),
  },
  gridItem: {
    marginBottom: rs(8),
  },
  percentageTest: {
    gap: rs(8),
    marginTop: rs(8),
  },
  percentageBar: {
    backgroundColor: '#2196F3',
    height: rs(32),
    borderRadius: rs(4),
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: {
    color: 'white',
    fontSize: rf(12),
    fontWeight: 'bold',
  },
});

export default ResponsiveTest;