/** Renders one month page (always 6 weeks). */
import type { Locale } from 'date-fns';
import { useMemo } from 'react';
import { View } from 'react-native';
import type { DayMatcher } from '../../core/dateUtils';
import { buildMonthGrid } from '../../core/monthGrid';
import type { SelectionMatcher } from '../../core/selection';
import { cn } from '../../theme/cn';
import type { CalendarBaseProps, CalendarClassNames, WeekdayIndex } from '../../types';
import { DayCell } from './DayCell';

export interface MonthGridProps {
  month: Date;
  firstDayOfWeek: WeekdayIndex;
  showOutsideDays: boolean;
  isDisabled: DayMatcher;
  selection: SelectionMatcher;
  todayKey: string;
  locale?: Locale;
  classNames?: CalendarClassNames;
  renderDay?: CalendarBaseProps['renderDay'];
  onDayPress: (date: Date, inMonth: boolean) => void;
  /** Only the visible page gets testIDs, so ids stay unique across the 3 swipe pages. */
  testID?: string;
}

export function MonthGrid({
  month,
  firstDayOfWeek,
  showOutsideDays,
  isDisabled,
  selection,
  todayKey,
  locale,
  classNames,
  renderDay,
  onDayPress,
  testID,
}: MonthGridProps) {
  const monthTime = month.getTime();
  // Keyed by the instant (not Date identity, which changes every render).
  const weeks = useMemo(() => buildMonthGrid(month, firstDayOfWeek), [monthTime, firstDayOfWeek]);
  return (
    <View className={cn('gap-1', classNames?.grid)}>
      {weeks.map((week, index) => (
        <View key={week[0]?.key ?? index} className={cn('flex-row', classNames?.week)}>
          {week.map((cell) => (
            <DayCell
              key={cell.key}
              cell={cell}
              selection={selection(cell.date)}
              isToday={cell.key === todayKey}
              isDisabled={isDisabled(cell.date)}
              showOutsideDays={showOutsideDays}
              locale={locale}
              classNames={classNames}
              renderDay={renderDay}
              onPress={onDayPress}
              testID={testID ? `${testID}-day-${cell.key}` : undefined}
            />
          ))}
        </View>
      ))}
    </View>
  );
}
