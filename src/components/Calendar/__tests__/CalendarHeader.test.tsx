import { fireEvent, render, screen } from '@testing-library/react-native';
import { CalendarHeader } from '../CalendarHeader';

const handlers = () => ({ onPrev: jest.fn(), onNext: jest.fn(), onMonthPress: jest.fn(), onYearPress: jest.fn() });

describe('CalendarHeader', () => {
  it('shows labels and wires every button', async () => {
    const h = handlers();
    await render(
      <CalendarHeader {...h} monthLabel="September" yearLabel="2026" canGoPrev canGoNext labels={{ previous: 'Prev', next: 'Next' }} testID="cal" />,
    );
    await fireEvent.press(screen.getByTestId('cal-prev'));
    await fireEvent.press(screen.getByTestId('cal-next'));
    await fireEvent.press(screen.getByText('September'));
    await fireEvent.press(screen.getByText('2026'));
    expect([h.onPrev, h.onNext, h.onMonthPress, h.onYearPress].map((f) => f.mock.calls.length)).toEqual([1, 1, 1, 1]);
    expect(screen.getByTestId('cal-prev').props.accessibilityLabel).toBe('Prev');
  });

  it('disables blocked directions', async () => {
    const h = handlers();
    await render(
      <CalendarHeader {...h} monthLabel="September" yearLabel="2026" canGoPrev={false} canGoNext labels={{ previous: 'Prev', next: 'Next' }} testID="cal" />,
    );
    await fireEvent.press(screen.getByTestId('cal-prev'));
    expect(h.onPrev).not.toHaveBeenCalled();
  });
});
