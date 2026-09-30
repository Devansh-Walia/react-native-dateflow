import { fireEvent, render, screen } from '@testing-library/react-native';
import { format } from 'date-fns';
import { Text } from 'react-native';
import { DatePicker } from '../DatePicker';

const VALUE = new Date(2026, 8, 29);
const last = (fn: jest.Mock): unknown => fn.mock.calls.at(-1)?.[0];

describe('<DatePicker />', () => {
  it('shows the placeholder when empty', async () => {
    await render(<DatePicker />);
    expect(screen.getByText('Select date')).toBeTruthy();
    expect(screen.queryByTestId('date-picker-modal')).toBeNull();
  });

  it('formats the value with displayFormat (default PP)', async () => {
    const { rerender } = await render(<DatePicker defaultValue={VALUE} />);
    expect(screen.getByText('Sep 29, 2026')).toBeTruthy();
    await rerender(<DatePicker value={VALUE} displayFormat="dd/MM/yyyy" />);
    expect(screen.getByText('29/09/2026')).toBeTruthy();
  });

  it('modal: opens from the trigger, selects, and closes', async () => {
    const onChange = jest.fn();
    const onOpenChange = jest.fn();
    await render(<DatePicker defaultValue={VALUE} onChange={onChange} onOpenChange={onOpenChange} />);
    await fireEvent.press(screen.getByTestId('date-picker-trigger'));
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByTestId('date-picker-modal')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('date-picker-calendar-day-2026-09-10'));
    expect(format(last(onChange) as Date, 'yyyy-MM-dd')).toBe('2026-09-10');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.getByText('Sep 10, 2026')).toBeTruthy();
  });

  it('closeOnSelect=false keeps it open', async () => {
    const onOpenChange = jest.fn();
    await render(<DatePicker defaultValue={VALUE} defaultOpen closeOnSelect={false} onOpenChange={onOpenChange} />);
    await fireEvent.press(screen.getByTestId('date-picker-calendar-day-2026-09-10'));
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('backdrop press requests close; controlled open stays open until the parent changes it', async () => {
    const onOpenChange = jest.fn();
    await render(<DatePicker defaultValue={VALUE} open onOpenChange={onOpenChange} />);
    await fireEvent.press(screen.getByTestId('date-picker-backdrop'));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.getByTestId('date-picker-modal')).toBeTruthy();
  });

  it('sheet: renders the sheet and its drag handle', async () => {
    await render(<DatePicker presentation="sheet" defaultValue={VALUE} defaultOpen />);
    expect(screen.getByTestId('date-picker-sheet')).toBeTruthy();
    expect(screen.getByTestId('date-picker-sheet-handle')).toBeTruthy();
    expect(screen.queryByTestId('date-picker-modal')).toBeNull();
  });

  it('popover: expands inline under the trigger, with no Modal', async () => {
    await render(<DatePicker presentation="popover" defaultValue={VALUE} />);
    await fireEvent.press(screen.getByTestId('date-picker-trigger'));
    expect(screen.getByTestId('date-picker-popover')).toBeTruthy();
    expect(screen.queryByTestId('date-picker-backdrop')).toBeNull();
    await fireEvent.press(screen.getByTestId('date-picker-trigger'));
    expect(screen.queryByTestId('date-picker-popover')).toBeNull();
  });

  it('renderTrigger replaces the default trigger', async () => {
    await render(
      <DatePicker
        defaultValue={VALUE}
        renderTrigger={({ open, displayValue, isOpen }) => <Text onPress={open}>{`${displayValue ?? 'none'}:${String(isOpen)}`}</Text>}
      />,
    );
    expect(screen.queryByTestId('date-picker-trigger')).toBeNull();
    await fireEvent.press(screen.getByText('Sep 29, 2026:false'));
    expect(screen.getByText('Sep 29, 2026:true')).toBeTruthy();
    expect(screen.getByTestId('date-picker-modal')).toBeTruthy();
  });

  it('forwards calendar props and nested classNames', async () => {
    await render(
      <DatePicker
        defaultValue={VALUE}
        defaultOpen
        firstDayOfWeek={1}
        minDate={new Date(2026, 8, 5)}
        classNames={{ trigger: 'h-14', calendar: { container: 'bg-red-500' } }}
      />,
    );
    expect(screen.getByTestId('date-picker-trigger').props.className).toContain('h-14');
    expect(screen.getByTestId('date-picker-trigger').props.className).not.toContain('h-11');
    expect(screen.getByTestId('date-picker-calendar').props.className).toContain('bg-red-500');
    expect(screen.getByTestId('date-picker-calendar-weekday-0', { includeHiddenElements: true })).toHaveTextContent('Mo');
    expect(screen.getByTestId('date-picker-calendar-day-2026-09-04').props.accessibilityState).toMatchObject({ disabled: true });
  });
});
