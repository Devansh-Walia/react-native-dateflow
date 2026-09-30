import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { dayKey } from '../../../core/dateUtils';
import type { DateRange } from '../../../types';
import { Calendar } from '../Calendar';

const SEP = new Date(2026, 8, 1);
const day = (key: string) => screen.getByTestId(`calendar-day-${key}`);
const lastArg = <T,>(fn: jest.Mock): T => fn.mock.calls.at(-1)?.[0] as T;
// WeekdayRow is hidden from the accessibility tree, so RNTL needs to be told to include it.
const HIDDEN = { includeHiddenElements: true } as const;

describe('<Calendar />', () => {
  it('renders the header for defaultMonth', async () => {
    await render(<Calendar defaultMonth={SEP} />);
    expect(screen.getByText('September')).toBeTruthy();
    expect(screen.getByText('2026')).toBeTruthy();
  });

  it('opens on the minDate month when today is outside the range (review focus)', async () => {
    await render(<Calendar minDate={new Date(2099, 2, 10)} />);
    expect(screen.getByText('March')).toBeTruthy();
    expect(screen.getByText('2099')).toBeTruthy();
  });

  it('single: selects a day (uncontrolled)', async () => {
    const onChange = jest.fn();
    await render(<Calendar defaultMonth={SEP} onChange={onChange} />);
    await fireEvent.press(day('2026-09-15'));
    expect(dayKey(lastArg<Date>(onChange))).toBe('2026-09-15');
    expect(day('2026-09-15').props.accessibilityState).toMatchObject({ selected: true });
  });

  it('multiple: toggles days', async () => {
    const onChange = jest.fn();
    await render(<Calendar mode="multiple" defaultMonth={SEP} onChange={onChange} />);
    await fireEvent.press(day('2026-09-03'));
    await fireEvent.press(day('2026-09-05'));
    await fireEvent.press(day('2026-09-03'));
    expect(lastArg<Date[]>(onChange).map((d) => dayKey(d))).toEqual(['2026-09-05']);
  });

  it('range: selects start and end and paints the band', async () => {
    const onChange = jest.fn();
    await render(<Calendar mode="range" defaultMonth={SEP} onChange={onChange} />);
    await fireEvent.press(day('2026-09-10'));
    await fireEvent.press(day('2026-09-14'));
    const range = lastArg<DateRange>(onChange);
    expect([range.start && dayKey(range.start), range.end && dayKey(range.end)]).toEqual(['2026-09-10', '2026-09-14']);
    expect(day('2026-09-12').props.className).toContain('bg-accent');
  });

  it('respects minDate / disabledDates', async () => {
    const onChange = jest.fn();
    await render(
      <Calendar defaultMonth={SEP} minDate={new Date(2026, 8, 10)} disabledDates={[new Date(2026, 8, 20)]} onChange={onChange} />,
    );
    await fireEvent.press(day('2026-09-05'));
    await fireEvent.press(day('2026-09-20'));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByTestId('calendar-prev').props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('navigates with header buttons and reports onMonthChange', async () => {
    const onMonthChange = jest.fn();
    await render(<Calendar defaultMonth={SEP} onMonthChange={onMonthChange} />);
    await fireEvent.press(screen.getByTestId('calendar-next'));
    expect(screen.getByText('October')).toBeTruthy();
    expect(dayKey(lastArg<Date>(onMonthChange))).toBe('2026-10-01');
  });

  it('pressing an outside day selects it and moves to its month', async () => {
    const onChange = jest.fn();
    await render(<Calendar defaultMonth={SEP} onChange={onChange} />);
    await fireEvent.press(day('2026-10-01'));
    expect(dayKey(lastArg<Date>(onChange))).toBe('2026-10-01');
    expect(screen.getByText('October')).toBeTruthy();
  });

  it('month jumper', async () => {
    await render(<Calendar defaultMonth={SEP} />);
    await fireEvent.press(screen.getByTestId('calendar-month-label'));
    await fireEvent.press(screen.getByTestId('calendar-jumper-month-11'));
    expect(screen.getByText('December')).toBeTruthy();
    expect(screen.getByTestId('calendar-day-2026-12-25')).toBeTruthy();
  });

  it('year jumper leads into the month jumper', async () => {
    await render(<Calendar defaultMonth={SEP} maxDate={new Date(2031, 0, 1)} />);
    await fireEvent.press(screen.getByTestId('calendar-year-label'));
    // 2026 sits on the 2016–2027 page; move to 2028–2039.
    expect(screen.getByTestId('calendar-jumper-year-2016')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('calendar-next'));
    expect(screen.getByTestId('calendar-jumper-year-2032').props.accessibilityState).toMatchObject({ disabled: true });
    await fireEvent.press(screen.getByTestId('calendar-jumper-year-2030'));
    expect(screen.getByTestId('calendar-jumper-month-0')).toBeTruthy();
    expect(screen.getByText('2030')).toBeTruthy();
  });

  it('firstDayOfWeek, hideHeader and hideWeekdays', async () => {
    const { rerender } = await render(<Calendar defaultMonth={SEP} firstDayOfWeek={1} />);
    expect(screen.getByTestId('calendar-weekday-0', HIDDEN)).toHaveTextContent('Mo');
    expect(screen.queryByTestId('calendar-prev')).not.toBeNull();
    await rerender(<Calendar defaultMonth={SEP} hideHeader hideWeekdays />);
    expect(screen.queryByTestId('calendar-prev')).toBeNull();
    expect(screen.queryByTestId('calendar-weekday-0', HIDDEN)).toBeNull();
  });

  it('merges classNames slots and supports render overrides', async () => {
    const onChange = jest.fn();
    await render(
      <Calendar
        defaultMonth={SEP}
        onChange={onChange}
        classNames={{ dayCell: 'h-12', container: 'bg-red-500' }}
        renderHeader={({ monthLabel, goNext }) => <Text onPress={goNext}>{`H:${monthLabel}`}</Text>}
        renderFooter={({ month }) => <Text>{`F:${dayKey(month)}`}</Text>}
      />,
    );
    expect(day('2026-09-15').props.className).toContain('h-12');
    expect(screen.getByTestId('calendar').props.className).toContain('bg-red-500');
    await fireEvent.press(screen.getByText('H:September'));
    expect(screen.getByText('F:2026-10-01')).toBeTruthy();
  });

  it('themeOverride injects variables on the root', async () => {
    await render(<Calendar defaultMonth={SEP} themeOverride="dark" />);
    expect(screen.getByTestId('calendar').props.style).toHaveProperty('__vars');
  });
});
