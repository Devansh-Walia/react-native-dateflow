import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { dayKey } from '../../../core/dateUtils';
import type { DaySelectionState } from '../../../core/selection';
import { DayCell } from '../DayCell';

const NONE: DaySelectionState = { isSelected: false, isRangeStart: false, isRangeEnd: false, isInRange: false, rangePosition: 'none' };
const cell = (inMonth = true) => {
  const date = new Date(2026, 8, 15);
  return { date, key: dayKey(date), inMonth };
};
const base = { isToday: false, isDisabled: false, showOutsideDays: true, testID: 'd' };

describe('DayCell', () => {
  it('renders the day number and fires onPress with the date and month flag', async () => {
    const onPress = jest.fn();
    await render(<DayCell {...base} cell={cell()} selection={NONE} onPress={onPress} />);
    expect(screen.getByText('15')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('d'));
    expect(onPress).toHaveBeenCalledWith(cell().date, true);
  });

  it('applies selected styling plus the selectedDay slot', async () => {
    await render(
      <DayCell {...base} cell={cell()} selection={{ ...NONE, isSelected: true }} onPress={jest.fn()} classNames={{ selectedDay: 'bg-red-500' }} />,
    );
    expect(screen.getByTestId('d-circle').props.className).toContain('bg-red-500');
    expect(screen.getByTestId('d-circle').props.className).not.toContain('bg-primary');
    expect(screen.getByTestId('d').props.accessibilityState).toMatchObject({ selected: true });
  });

  it('does not fire when disabled', async () => {
    const onPress = jest.fn();
    await render(<DayCell {...base} isDisabled cell={cell()} selection={NONE} onPress={onPress} />);
    await fireEvent.press(screen.getByTestId('d'));
    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByTestId('d').props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('renders an empty same-size placeholder for hidden outside days', async () => {
    await render(<DayCell {...base} showOutsideDays={false} cell={cell(false)} selection={NONE} onPress={jest.fn()} />);
    expect(screen.queryByText('15')).toBeNull();
  });

  it('draws the range band and lets classNames override the cell size', async () => {
    await render(
      <DayCell {...base} cell={cell()} selection={{ ...NONE, isInRange: true, rangePosition: 'middle' }} onPress={jest.fn()} classNames={{ dayCell: 'h-12' }} />,
    );
    const cls = screen.getByTestId('d').props.className as string;
    expect(cls).toContain('bg-accent');
    expect(cls).toContain('h-12');
    expect(cls).not.toContain('h-10');
  });

  it('delegates to renderDay', async () => {
    const onPress = jest.fn();
    await render(
      <DayCell
        {...base}
        isToday
        cell={cell()}
        selection={NONE}
        onPress={onPress}
        renderDay={(info) => <Text onPress={info.onPress}>{`custom-${info.label}-${String(info.isToday)}`}</Text>}
      />,
    );
    await fireEvent.press(screen.getByText('custom-15-true'));
    expect(onPress).toHaveBeenCalled();
  });
});
