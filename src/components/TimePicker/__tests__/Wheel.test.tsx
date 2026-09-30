import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { State } from 'react-native-gesture-handler';
import { Wheel, type WheelOption } from '../Wheel';

const options = (n: number): WheelOption[] =>
  Array.from({ length: n }, (_, i) => ({ key: String(i), label: String(i).padStart(2, '0') }));

const action = (actionName: 'increment' | 'decrement') => ({ nativeEvent: { actionName } });

const setup = async (count: number, selectedIndex: number, onChange = jest.fn()) => {
  const utils = await render(
    <Wheel
      items={options(count)}
      selectedIndex={selectedIndex}
      onChange={onChange}
      itemHeight={44}
      visibleCount={5}
      hapticFeedback={false}
      accessibilityLabel="Minutes"
      testID="w"
    />,
  );
  return { ...utils, onChange };
};

describe('<Wheel />', () => {
  it('exposes an adjustable element with the selected label', async () => {
    await setup(60, 7);
    const wheel = screen.getByTestId('w');
    expect(wheel.props.accessibilityRole).toBe('adjustable');
    expect(wheel.props.accessibilityValue).toEqual({ text: '07' });
    expect(wheel.props['aria-valuetext']).toBe('07');
    expect(wheel.props.accessibilityLabel).toBe('Minutes');
  });

  it('renders every option (looping wheels keep all rows mounted)', async () => {
    await setup(12, 0);
    expect(screen.getByText('00')).toBeTruthy();
    expect(screen.getByText('11')).toBeTruthy();
  });

  it('wraps forward past the last item when looping (review focus)', async () => {
    const { onChange } = await setup(12, 11);
    await fireEvent(screen.getByTestId('w'), 'accessibilityAction', action('increment'));
    expect(onChange).toHaveBeenLastCalledWith(0);
  });

  it('wraps backward past the first item when looping', async () => {
    const { onChange } = await setup(12, 0);
    await fireEvent(screen.getByTestId('w'), 'accessibilityAction', action('decrement'));
    expect(onChange).toHaveBeenLastCalledWith(11);
  });

  it('clamps when there are too few items to loop', async () => {
    const { onChange } = await setup(2, 1);
    await fireEvent(screen.getByTestId('w'), 'accessibilityAction', action('increment'));
    expect(onChange).not.toHaveBeenCalled();
    await fireEvent(screen.getByTestId('w'), 'accessibilityAction', action('decrement'));
    expect(onChange).toHaveBeenLastCalledWith(0);
  });

  it('follows controlled selectedIndex changes (59 → 0, then +1 = 1)', async () => {
    const onChange = jest.fn();
    const { rerender } = await setup(60, 59, onChange);
    await rerender(
      <Wheel
        items={options(60)}
        selectedIndex={0}
        onChange={onChange}
        itemHeight={44}
        visibleCount={5}
        hapticFeedback={false}
        accessibilityLabel="Minutes"
        testID="w"
      />,
    );
    expect(screen.getByTestId('w').props.accessibilityValue).toEqual({ text: '00' });
    await fireEvent(screen.getByTestId('w'), 'accessibilityAction', action('increment'));
    expect(onChange).toHaveBeenLastCalledWith(1);
  });

  it('sizes the viewport to visibleCount rows', async () => {
    await setup(60, 0);
    expect(screen.getByTestId('w-viewport').props.style).toEqual(expect.objectContaining({ height: 220 }));
  });

  describe('gesture finalize', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());
    const pan = () => getByGestureTestId('w-pan');
    const finalize = (state: (typeof State)[keyof typeof State], extra: Record<string, number>) => [
      { state: State.BEGAN, translationX: 0, translationY: 0 },
      { state, y: 44 * 3.5, velocityY: 0, translationX: 0, translationY: 0, ...extra },
    ];

    it('a genuine tap on a row selects it', async () => {
      const { onChange } = await setup(60, 10);
      fireGestureHandler(pan(), finalize(State.FAILED, {}));
      // row 3 of 5 (0-based) is one below centre -> index 11
      await act(async () => {
        jest.advanceTimersByTime(3000);
      });
      expect(onChange).toHaveBeenCalledWith(11);
    });

    it('a cancelled (stolen) touch does not change the selection', async () => {
      const { onChange } = await setup(60, 10);
      fireGestureHandler(pan(), finalize(State.CANCELLED, {}));
      await act(async () => {
        jest.advanceTimersByTime(3000);
      });
      expect(onChange).not.toHaveBeenCalled();
    });

    it('a mostly-horizontal touch does not change the selection', async () => {
      const { onChange } = await setup(60, 10);
      fireGestureHandler(pan(), finalize(State.FAILED, { translationX: 40 }));
      await act(async () => {
        jest.advanceTimersByTime(3000);
      });
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
