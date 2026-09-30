/** Chevron drawn from two borders of a rotated square, so it's identical on every platform (no font glyphs). */
import { View } from 'react-native';
import { cn } from '../../theme/cn';

export type ChevronDirection = 'left' | 'right' | 'up' | 'down';

const ROTATION: Record<ChevronDirection, string> = {
  left: '45deg',
  right: '-135deg',
  up: '135deg',
  down: '-45deg',
};

export interface ChevronProps {
  direction: ChevronDirection;
  className?: string;
  testID?: string;
}

export function Chevron({ direction, className, testID }: ChevronProps) {
  return (
    <View
      testID={testID}
      pointerEvents="none"
      className={cn('h-2.5 w-2.5 border-b-2 border-l-2 border-foreground', className)}
      style={{ transform: [{ rotate: ROTATION[direction] }] }}
    />
  );
}
