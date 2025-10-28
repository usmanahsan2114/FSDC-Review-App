import { useTheme } from '@/contexts/ThemeContext';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { rf, rs, wp } from '../utils/responsive';
import { ThemedText } from './themed-text';

interface FormProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

export const FormProgress: React.FC<FormProgressProps> = ({
  currentStep,
  totalSteps,
  stepLabels,
}) => {
  const { isDark } = useTheme();
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: currentStep,
      tension: 50,
      friction: 7,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, totalSteps],
    outputRange: ['0%', '100%'],
  });

  const percentage = Math.round((currentStep / totalSteps) * 100);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.stepText}>
          Step {currentStep} of {totalSteps}
        </ThemedText>
        <ThemedText style={styles.percentageText}>{percentage}%</ThemedText>
      </View>

      <View style={[styles.progressBar, { backgroundColor: isDark ? '#2A2A2A' : '#E0E0E0' }]}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressWidth,
              backgroundColor: percentage === 100 ? '#4CAF50' : '#2196F3',
            },
          ]}
        />
      </View>

      {stepLabels[currentStep - 1] && (
        <ThemedText style={styles.currentStepLabel}>
          {stepLabels[currentStep - 1]}
        </ThemedText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: rs(12),
    paddingHorizontal: wp('5%'),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: rs(8),
  },
  stepText: {
    fontSize: rf(14),
    fontWeight: '600',
  },
  percentageText: {
    fontSize: rf(14),
    fontWeight: 'bold',
    color: '#2196F3',
  },
  progressBar: {
    height: rs(8),
    borderRadius: rs(4),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: rs(4),
  },
  currentStepLabel: {
    fontSize: rf(12),
    marginTop: rs(6),
    opacity: 0.7,
    fontStyle: 'italic',
  },
});

