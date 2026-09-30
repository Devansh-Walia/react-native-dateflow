/** Month/year title (tappable → jumper views) with prev/next chevrons. */
import { Pressable, Text, View } from 'react-native';
import { TEXT_RESET } from '../../platform/styles';
import { cn } from '../../theme/cn';
import type { CalendarClassNames, CalendarLabels } from '../../types';
import { Chevron, type ChevronDirection } from '../shared/Chevron';

export interface CalendarHeaderProps {
  monthLabel: string;
  yearLabel: string;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onMonthPress: () => void;
  onYearPress: () => void;
  labels: CalendarLabels;
  classNames?: CalendarClassNames;
  testID: string;
}

interface NavButtonProps {
  direction: ChevronDirection;
  disabled: boolean;
  onPress: () => void;
  label: string;
  classNames?: CalendarClassNames;
  testID: string;
}

function NavButton({ direction, disabled, onPress, label, classNames, testID }: NavButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      testID={testID}
      className={cn('h-9 w-9 items-center justify-center rounded-full select-none', disabled && 'opacity-30', classNames?.headerButton)}
    >
      <Chevron direction={direction} className={classNames?.chevron} />
    </Pressable>
  );
}

function TitleButton({ text, onPress, classNames, testID }: { text: string; onPress: () => void; classNames?: CalendarClassNames; testID: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      testID={testID}
      className={cn('rounded-md px-2 py-1 select-none', classNames?.headerTitle)}
    >
      <Text style={TEXT_RESET} className={cn('text-base font-semibold text-foreground', classNames?.headerTitleText)}>
        {text}
      </Text>
    </Pressable>
  );
}

export function CalendarHeader({
  monthLabel,
  yearLabel,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  onMonthPress,
  onYearPress,
  labels,
  classNames,
  testID,
}: CalendarHeaderProps) {
  return (
    <View className={cn('h-12 flex-row items-center justify-between px-1', classNames?.header)}>
      <NavButton direction="left" disabled={!canGoPrev} onPress={onPrev} label={labels.previous} classNames={classNames} testID={`${testID}-prev`} />
      <View className="flex-row items-center">
        <TitleButton text={monthLabel} onPress={onMonthPress} classNames={classNames} testID={`${testID}-month-label`} />
        <TitleButton text={yearLabel} onPress={onYearPress} classNames={classNames} testID={`${testID}-year-label`} />
      </View>
      <NavButton direction="right" disabled={!canGoNext} onPress={onNext} label={labels.next} classNames={classNames} testID={`${testID}-next`} />
    </View>
  );
}
