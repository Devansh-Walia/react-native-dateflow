/** One day in the grid: range band (outer), selection circle (inner), label. */
import { format, type Locale } from 'date-fns';
import { Pressable, Text, View } from 'react-native';
import type { DayCellModel } from '../../core/monthGrid';
import type { DaySelectionState } from '../../core/selection';
import { TEXT_RESET } from '../../platform/styles';
import { cn } from '../../theme/cn';
import type { CalendarBaseProps, CalendarClassNames } from '../../types';
import { dayCellVariants, dayCircleVariants, dayTextVariants, dayVisualState } from './calendarVariants';

export interface DayCellProps {
  cell: DayCellModel;
  selection: DaySelectionState;
  isToday: boolean;
  isDisabled: boolean;
  showOutsideDays: boolean;
  locale?: Locale;
  classNames?: CalendarClassNames;
  renderDay?: CalendarBaseProps['renderDay'];
  onPress: (date: Date, inMonth: boolean) => void;
  testID?: string;
}

export function DayCell({
  cell,
  selection,
  isToday,
  isDisabled,
  showOutsideDays,
  locale,
  classNames,
  renderDay,
  onPress,
  testID,
}: DayCellProps) {
  const { rangePosition } = selection;
  const cellClass = cn(
    dayCellVariants({ range: rangePosition }),
    classNames?.dayCell,
    rangePosition === 'start' && classNames?.rangeStart,
    rangePosition === 'middle' && classNames?.rangeMiddle,
    rangePosition === 'end' && classNames?.rangeEnd,
    !cell.inMonth && classNames?.outsideDay,
  );

  if (!cell.inMonth && !showOutsideDays) return <View className={cellClass} />;

  const label = format(cell.date, 'd', { locale });
  const press = () => onPress(cell.date, cell.inMonth);

  if (renderDay) {
    return (
      <View className={cellClass} testID={testID}>
        {renderDay({
          date: cell.date,
          label,
          isSelected: selection.isSelected,
          isToday,
          isDisabled,
          isOutside: !cell.inMonth,
          isRangeStart: selection.isRangeStart,
          isRangeEnd: selection.isRangeEnd,
          isInRange: selection.isInRange,
          onPress: press,
        })}
      </View>
    );
  }

  const visual = dayVisualState({ isDisabled, isSelected: selection.isSelected, isToday, inMonth: cell.inMonth });
  const isMiddle = rangePosition === 'middle';

  return (
    <Pressable
      onPress={press}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={format(cell.date, 'PPPP', { locale })}
      accessibilityState={{ selected: selection.isSelected, disabled: isDisabled }}
      className={cellClass}
      testID={testID}
    >
      <View
        testID={testID ? `${testID}-circle` : undefined}
        className={cn(
          dayCircleVariants({ state: visual }),
          visual === 'selected' && classNames?.selectedDay,
          visual === 'today' && classNames?.todayIndicator,
          visual === 'disabled' && classNames?.disabledDay,
        )}
      >
        <Text
          style={TEXT_RESET}
          className={cn(
            dayTextVariants({ state: visual }),
            isMiddle && visual === 'idle' && 'text-accent-foreground',
            classNames?.dayText,
            visual === 'selected' && classNames?.selectedDayText,
            visual === 'today' && classNames?.todayText,
            visual === 'disabled' && classNames?.disabledDayText,
            visual === 'outside' && classNames?.outsideDayText,
            isMiddle && classNames?.rangeMiddleText,
          )}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
