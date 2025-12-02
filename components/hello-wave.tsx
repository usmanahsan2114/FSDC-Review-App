import Animated from 'react-native-reanimated';
import { rf } from '../utils/responsive';

export function HelloWave() {
  return (
    <Animated.Text
      style={{
        fontSize: rf(28),
        lineHeight: rf(32),
        paddingVertical: rf(2),
        marginTop: -6,
        animationName: {
          '50%': { transform: [{ rotate: '25deg' }] },
        },
        animationIterationCount: 4,
        animationDuration: '300ms',
      }}>
      👋
    </Animated.Text>
  );
}
