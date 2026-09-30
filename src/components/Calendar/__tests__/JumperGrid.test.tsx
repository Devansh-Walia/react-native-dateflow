import { fireEvent, render, screen } from '@testing-library/react-native';
import { JumperGrid, type JumperItem } from '../JumperGrid';

const items = (onPress: jest.Mock): JumperItem[] =>
  Array.from({ length: 12 }, (_, i) => ({ key: `m-${i}`, label: `M${i}`, selected: i === 2, disabled: i === 5, onPress: () => onPress(i) }));

describe('JumperGrid', () => {
  it('lays out 12 items as 4 rows of 3 and marks the selected one', async () => {
    await render(<JumperGrid items={items(jest.fn())} testID="j" />);
    expect(screen.getByTestId('j-row-3')).toBeTruthy();
    expect(screen.queryByTestId('j-row-4')).toBeNull();
    expect(screen.getByTestId('j-m-2').props.className).toContain('bg-primary');
  });

  it('fires enabled items only', async () => {
    const onPress = jest.fn();
    await render(<JumperGrid items={items(onPress)} testID="j" />);
    await fireEvent.press(screen.getByTestId('j-m-1'));
    await fireEvent.press(screen.getByTestId('j-m-5'));
    expect(onPress.mock.calls).toEqual([[1]]);
  });
});
