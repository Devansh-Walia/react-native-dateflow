import { fireEvent, render, screen } from '@testing-library/react-native';
import { format } from 'date-fns';
import { DateTimePicker } from '../DateTimePicker';

const VALUE = new Date(2026, 8, 29, 14, 45);
const increment = { nativeEvent: { actionName: 'increment' } };
const last = (fn: jest.Mock): Date => fn.mock.calls.at(-1)?.[0] as Date;

describe('<DateTimePicker /> tabs', () => {
  it('shows the calendar first with date/time subtitles', async () => {
    await render(<DateTimePicker defaultValue={VALUE} />);
    expect(screen.getByTestId('date-time-picker-calendar')).toBeTruthy();
    expect(screen.queryByTestId('date-time-picker-time')).toBeNull();
    expect(screen.getByText('Sep 29, 2026')).toBeTruthy();
    expect(screen.getByText('2:45 PM')).toBeTruthy();
  });

  it('changing the date keeps the time', async () => {
    const onChange = jest.fn();
    await render(<DateTimePicker defaultValue={VALUE} onChange={onChange} />);
    await fireEvent.press(screen.getByTestId('date-time-picker-calendar-day-2026-09-10'));
    expect(format(last(onChange), 'yyyy-MM-dd HH:mm')).toBe('2026-09-10 14:45');
  });

  it('changing the time keeps the date', async () => {
    const onChange = jest.fn();
    await render(<DateTimePicker defaultValue={VALUE} hourFormat="24h" onChange={onChange} />);
    await fireEvent.press(screen.getByTestId('date-time-picker-tab-time'));
    expect(screen.queryByTestId('date-time-picker-calendar')).toBeNull();
    await fireEvent(screen.getByTestId('date-time-picker-time-hours'), 'accessibilityAction', increment);
    expect(format(last(onChange), 'yyyy-MM-dd HH:mm')).toBe('2026-09-29 15:45');
    expect(screen.getByText('15:45')).toBeTruthy();
  });

  it('with no value, picking a date uses now floored to minuteStep', async () => {
    const onChange = jest.fn();
    await render(<DateTimePicker minuteStep={15} onChange={onChange} minDate={new Date(2026, 8, 1)} maxDate={new Date(2026, 8, 30)} />);
    await fireEvent.press(screen.getByTestId('date-time-picker-calendar-day-2026-09-10'));
    const picked = last(onChange);
    expect(format(picked, 'yyyy-MM-dd')).toBe('2026-09-10');
    expect(picked.getMinutes() % 15).toBe(0);
    expect(picked.getSeconds()).toBe(0);
  });

  it('forwards nested classNames and tab labels', async () => {
    await render(
      <DateTimePicker
        defaultValue={VALUE}
        tabLabels={{ date: 'Day', time: 'Clock' }}
        classNames={{ calendar: { container: 'bg-red-500' }, tabs: 'mb-4' }}
      />,
    );
    expect(screen.getByText('Day')).toBeTruthy();
    expect(screen.getByText('Clock')).toBeTruthy();
    expect(screen.getByTestId('date-time-picker-calendar').props.className).toContain('bg-red-500');
    expect(screen.getByTestId('date-time-picker-tabs').props.className).toContain('mb-4');
  });
});

describe('<DateTimePicker /> stacked', () => {
  it('starts with date expanded and time collapsed; sections toggle independently', async () => {
    await render(<DateTimePicker layout="stacked" defaultValue={VALUE} />);
    expect(screen.getByTestId('date-time-picker-calendar')).toBeTruthy();
    expect(screen.queryByTestId('date-time-picker-time')).toBeNull();
    await fireEvent.press(screen.getByTestId('date-time-picker-time-section-header'));
    expect(screen.getByTestId('date-time-picker-time')).toBeTruthy();
    expect(screen.getByTestId('date-time-picker-calendar')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('date-time-picker-date-section-header'));
    expect(screen.queryByTestId('date-time-picker-calendar')).toBeNull();
    expect(screen.getByTestId('date-time-picker-date-section-header').props.accessibilityState).toMatchObject({ expanded: false });
  });
});
