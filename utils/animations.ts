import { Animated, Easing } from 'react-native';

/**
 * Professional Animation Utilities
 * Lightweight animations for modern UI/UX
 */

/**
 * Button press animation - scales down slightly
 */
export const createButtonPressAnimation = (animatedValue: Animated.Value) => {
  return {
    onPressIn: () => {
      Animated.spring(animatedValue, {
        toValue: 0.97,
        useNativeDriver: true,
        tension: 100,
        friction: 3,
      }).start();
    },
    onPressOut: () => {
      Animated.spring(animatedValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 3,
      }).start();
    },
  };
};

/**
 * Fade in animation
 */
export const fadeIn = (
  animatedValue: Animated.Value,
  duration: number = 300,
  delay: number = 0
): Animated.CompositeAnimation => {
  return Animated.timing(animatedValue, {
    toValue: 1,
    duration,
    delay,
    easing: Easing.out(Easing.ease),
    useNativeDriver: true,
  });
};

/**
 * Slide up animation
 */
export const slideUp = (
  animatedValue: Animated.Value,
  duration: number = 400,
  delay: number = 0
): Animated.CompositeAnimation => {
  return Animated.spring(animatedValue, {
    toValue: 0,
    delay,
    tension: 50,
    friction: 7,
    useNativeDriver: true,
  });
};

/**
 * Stagger animation for list items
 */
export const createStaggerAnimation = (
  index: number,
  fadeAnim: Animated.Value,
  slideAnim: Animated.Value,
  staggerDelay: number = 50
) => {
  return Animated.parallel([
    fadeIn(fadeAnim, 400, index * staggerDelay),
    slideUp(slideAnim, 400, index * staggerDelay),
  ]);
};

/**
 * Scale animation
 */
export const scaleAnimation = (
  animatedValue: Animated.Value,
  toValue: number,
  duration: number = 200
): Animated.CompositeAnimation => {
  return Animated.spring(animatedValue, {
    toValue,
    duration,
    useNativeDriver: true,
    tension: 100,
    friction: 5,
  });
};

/**
 * Pulse animation (for notifications/highlights)
 */
export const pulseAnimation = (animatedValue: Animated.Value): Animated.CompositeAnimation => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1.05,
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ])
  );
};

/**
 * Shake animation (for errors)
 */
export const shakeAnimation = (animatedValue: Animated.Value): Animated.CompositeAnimation => {
  return Animated.sequence([
    Animated.timing(animatedValue, { toValue: 10, duration: 50, useNativeDriver: true }),
    Animated.timing(animatedValue, { toValue: -10, duration: 50, useNativeDriver: true }),
    Animated.timing(animatedValue, { toValue: 10, duration: 50, useNativeDriver: true }),
    Animated.timing(animatedValue, { toValue: 0, duration: 50, useNativeDriver: true }),
  ]);
};

/**
 * Success checkmark animation
 */
export const successAnimation = (
  scaleAnim: Animated.Value,
  rotateAnim: Animated.Value
): Animated.CompositeAnimation => {
  return Animated.parallel([
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 3,
      useNativeDriver: true,
    }),
    Animated.timing(rotateAnim, {
      toValue: 1,
      duration: 400,
      easing: Easing.elastic(1),
      useNativeDriver: true,
    }),
  ]);
};

