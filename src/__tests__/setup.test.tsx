import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

function Probe() {
  const value = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: value.value }));
  return (
    <Animated.View style={animatedStyle}>
      <Text>ok</Text>
    </Animated.View>
  );
}

describe('test environment', () => {
  it('renders Reanimated components with the Reanimated 4 test setup', async () => {
    await render(<Probe />);
    expect(screen.getByText('ok')).toBeTruthy();
  });
});
