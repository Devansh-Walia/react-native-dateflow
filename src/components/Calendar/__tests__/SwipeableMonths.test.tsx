import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { monthKey } from '../../../core/dateUtils';
import { SwipeableMonths } from '../SwipeableMonths';

const renderMonth = (m: Date, isCurrent: boolean) => <Text>{`${monthKey(m)}${isCurrent ? '*' : ''}`}</Text>;

describe('SwipeableMonths', () => {
  it('renders only the current month until width is known', async () => {
    await render(
      <SwipeableMonths month={new Date(2026, 8, 1)} canPrev canNext enabled onNavigate={jest.fn()} renderMonth={renderMonth} testID="s" />,
    );
    expect(screen.getByText('2026-09*')).toBeTruthy();
    expect(screen.queryByText('2026-08')).toBeNull();
  });

  it('renders prev/current/next pages after layout', async () => {
    await render(
      <SwipeableMonths month={new Date(2026, 8, 1)} canPrev canNext enabled onNavigate={jest.fn()} renderMonth={renderMonth} testID="s" />,
    );
    await fireEvent(screen.getByTestId('s'), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 280 } } });
    // Side pages are aria-hidden, so opt in to hidden elements explicitly.
    expect(screen.getByText('2026-08', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByText('2026-09*')).toBeTruthy();
    expect(screen.getByText('2026-10', { includeHiddenElements: true })).toBeTruthy();
  });
});
