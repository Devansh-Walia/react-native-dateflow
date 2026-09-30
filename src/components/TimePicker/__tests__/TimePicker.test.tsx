import { fireEvent, render, screen } from '@testing-library/react-native';
import { format } from 'date-fns';
import { TimePicker } from '../TimePicker';

const at = (h: number, m: number) => new Date(2026, 8, 29, h, m);
const increment = { nativeEvent: { actionName: 'increment' } };
const decrement = { nativeEvent: { actionName: 'decrement' } };
const last = (fn: jest.Mock): Date => fn.mock.calls.at(-1)?.[0] as Date;
const valueOf = (id: string) => screen.getByTestId(id).props.accessibilityValue.text as string;

describe('<TimePicker /> wheel', () => {
  it('24h: 23 → 00 wraps the hour without changing the date', async () => {
    const onChange = jest.fn();
    await render(<TimePicker hourFormat="24h" defaultValue={at(23, 40)} onChange={onChange} />);
    await fireEvent(screen.getByTestId('time-picker-hours'), 'accessibilityAction', increment);
    expect(format(last(onChange), 'yyyy-MM-dd HH:mm')).toBe('2026-09-29 00:40');
  });

  it('shows a floored minute for unaligned values and emits the snapped one (review focus)', async () => {
    const onChange = jest.fn();
    await render(<TimePicker hourFormat="24h" minuteStep={15} defaultValue={at(10, 7)} onChange={onChange} />);
    expect(valueOf('time-picker-minutes')).toBe('00');
    expect(onChange).not.toHaveBeenCalled();
    await fireEvent(screen.getByTestId('time-picker-hours'), 'accessibilityAction', increment);
    expect(format(last(onChange), 'HH:mm')).toBe('11:00');
  });

  it('12h: 00:15 shows 12 AM and switching to PM gives 12:15 (review focus)', async () => {
    const onChange = jest.fn();
    await render(<TimePicker hourFormat="12h" defaultValue={at(0, 15)} onChange={onChange} />);
    expect(valueOf('time-picker-hours')).toBe('12');
    expect(valueOf('time-picker-period')).toBe('AM');
    await fireEvent(screen.getByTestId('time-picker-period'), 'accessibilityAction', increment);
    expect(format(last(onChange), 'HH:mm')).toBe('12:15');
  });

  it('24h hides the period wheel', async () => {
    await render(<TimePicker hourFormat="24h" defaultValue={at(9, 0)} />);
    expect(screen.queryByTestId('time-picker-period')).toBeNull();
  });

  it('minute steps drive the option count (step 30 = 2 rows, clamped, not looping)', async () => {
    const onChange = jest.fn();
    await render(<TimePicker hourFormat="24h" minuteStep={30} defaultValue={at(9, 0)} onChange={onChange} />);
    await fireEvent(screen.getByTestId('time-picker-minutes'), 'accessibilityAction', decrement);
    expect(onChange).not.toHaveBeenCalled();
    await fireEvent(screen.getByTestId('time-picker-minutes'), 'accessibilityAction', increment);
    expect(format(last(onChange), 'HH:mm')).toBe('09:30');
  });

  it('controlled: reflects the value prop', async () => {
    const { rerender } = await render(<TimePicker hourFormat="24h" value={at(8, 5)} />);
    expect(valueOf('time-picker-hours')).toBe('08');
    await rerender(<TimePicker hourFormat="24h" value={at(17, 5)} />);
    expect(valueOf('time-picker-hours')).toBe('17');
  });

  it('merges container slot classes and injects theme vars on override', async () => {
    await render(<TimePicker themeOverride="dark" classNames={{ container: 'p-6' }} />);
    const root = screen.getByTestId('time-picker');
    expect(root.props.className).toContain('p-6');
    expect(root.props.className).not.toContain('p-3');
    expect(root.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ __vars: expect.any(Object) })]));
  });
});

describe('<TimePicker /> inline', () => {
  it('picks the hour from the grid, then PM → 15:30', async () => {
    const onChange = jest.fn();
    await render(<TimePicker variant="inline" hourFormat="12h" defaultValue={at(9, 30)} onChange={onChange} />);
    await fireEvent.press(screen.getByTestId('time-picker-hour'));
    await fireEvent.press(screen.getByTestId('time-picker-option-hour-3'));
    expect(format(last(onChange), 'HH:mm')).toBe('03:30');
    expect(screen.queryByTestId('time-picker-option-hour-3')).toBeNull();
    await fireEvent.press(screen.getByTestId('time-picker-period-1'));
    expect(format(last(onChange), 'HH:mm')).toBe('15:30');
  });

  it('minute grid honours minuteStep', async () => {
    const onChange = jest.fn();
    await render(<TimePicker variant="inline" hourFormat="24h" minuteStep={15} defaultValue={at(9, 0)} onChange={onChange} />);
    await fireEvent.press(screen.getByTestId('time-picker-minute'));
    expect(screen.queryByTestId('time-picker-option-minute-4')).toBeNull();
    await fireEvent.press(screen.getByTestId('time-picker-option-minute-3'));
    expect(format(last(onChange), 'HH:mm')).toBe('09:45');
  });
});
