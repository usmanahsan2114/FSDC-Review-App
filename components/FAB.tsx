import { useTheme } from '@/contexts/ThemeContext';
import React, { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { hapticsButtonPress } from '../utils/haptics';
import { hp, rs, wp } from '../utils/responsive';
import { ThemedText } from './themed-text';

interface FABAction {
  icon: string;
  label: string;
  onPress: () => void;
  color?: string;
}

interface FABProps {
  actions: FABAction[];
  mainIcon?: string;
  mainColor?: string;
}

export const FAB: React.FC<FABProps> = ({
  actions,
  mainIcon = '+',
  mainColor = '#2196F3',
}) => {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  const toggleMenu = () => {
    hapticsButtonPress();
    const toValue = isOpen ? 0 : 1;
    
    Animated.parallel([
      Animated.spring(animation, {
        toValue,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(rotation, {
        toValue,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
    
    setIsOpen(!isOpen);
  };

  const handleActionPress = (action: FABAction) => {
    hapticsButtonPress();
    toggleMenu();
    setTimeout(() => action.onPress(), 300);
  };

  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <View style={styles.container}>
      {/* Action buttons */}
      {actions.map((action, index) => {
        const translateY = animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -(60 * (index + 1))],
        });

        const opacity = animation.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 0, 1],
        });

        const scale = animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.actionButton,
              {
                transform: [{ translateY }, { scale }],
                opacity,
              },
            ]}
          >
            <View style={styles.actionRow}>
              <View style={[styles.labelContainer, { backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' }]}>
                <ThemedText style={styles.actionLabel}>{action.label}</ThemedText>
              </View>
              <Pressable
                onPress={() => handleActionPress(action)}
                style={[
                  styles.actionIconButton,
                  { backgroundColor: action.color || '#757575' },
                ]}
              >
                <ThemedText style={styles.actionIcon}>{action.icon}</ThemedText>
              </Pressable>
            </View>
          </Animated.View>
        );
      })}

      {/* Main FAB button */}
      <Pressable onPress={toggleMenu} style={[styles.fab, { backgroundColor: mainColor }]}>
        <Animated.Text
          style={[
            styles.fabIcon,
            { transform: [{ rotate: rotateInterpolate }] },
          ]}
        >
          {mainIcon}
        </Animated.Text>
      </Pressable>

      {/* Backdrop */}
      {isOpen && (
        <Pressable
          style={styles.backdrop}
          onPress={toggleMenu}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: hp('3%'),
    right: wp('5%'),
    alignItems: 'flex-end',
    zIndex: 1000,
  },
  fab: {
    width: rs(56),
    height: rs(56),
    borderRadius: rs(28),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabIcon: {
    fontSize: rs(28),
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  actionButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    alignItems: 'flex-end',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
  },
  labelContainer: {
    paddingHorizontal: rs(12),
    paddingVertical: rs(8),
    borderRadius: rs(8),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  actionLabel: {
    fontSize: rs(14),
    fontWeight: '500',
  },
  actionIconButton: {
    width: rs(48),
    height: rs(48),
    borderRadius: rs(24),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  actionIcon: {
    fontSize: rs(24),
    color: '#FFFFFF',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
});

