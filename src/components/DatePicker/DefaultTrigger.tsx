/** Pre-styled input-like trigger button. */
import { Pressable, Text } from 'react-native';
import { TEXT_RESET } from '../../platform/styles';
import { cn } from '../../theme/cn';
import type { DatePickerClassNames } from '../../types';
import { Chevron } from '../shared/Chevron';

export interface DefaultTriggerProps {
  displayValue: string | null;
  placeholder: string;
  isOpen: boolean;
  onPress: () => void;
  classNames?: DatePickerClassNames;
  testID: string;
}

export function DefaultTrigger({ displayValue, placeholder, isOpen, onPress, classNames, testID }: DefaultTriggerProps) {
  const empty = displayValue === null;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ expanded: isOpen }}
      accessibilityLabel={displayValue ?? placeholder}
      testID={`${testID}-trigger`}
      className={cn(
        'h-11 w-full flex-row items-center justify-between rounded-lg border border-border bg-background px-3 select-none',
        classNames?.trigger,
      )}
    >
      <Text
        style={TEXT_RESET}
        numberOfLines={1}
        className={cn(
          'text-sm text-foreground tabular-nums',
          classNames?.triggerText,
          empty && cn('text-muted-foreground', classNames?.triggerPlaceholder),
        )}
      >
        {displayValue ?? placeholder}
      </Text>
      <Chevron direction={isOpen ? 'up' : 'down'} className="border-muted-foreground" />
    </Pressable>
  );
}
