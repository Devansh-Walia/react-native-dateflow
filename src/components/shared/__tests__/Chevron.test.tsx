import { render, screen } from '@testing-library/react-native';
import { Chevron } from '../Chevron';

describe('Chevron', () => {
  it.each([
    ['left', '45deg'],
    ['right', '-135deg'],
    ['up', '135deg'],
    ['down', '-45deg'],
  ] as const)('rotates the border corner to point %s', async (direction, rotate) => {
    await render(<Chevron direction={direction} testID="c" className="border-primary" />);
    const el = screen.getByTestId('c');
    expect(el.props.style).toEqual({ transform: [{ rotate }] });
    expect(el.props.className).toContain('border-primary');
    expect(el.props.className).not.toContain('border-foreground');
  });
});
