/** Time of day picker: infinite wheels (default) or the inline pill variant. Never changes the calendar date. */
import { useState } from 'react';
import { Text, View } from 'react-native';
import { toZoned } from '../../core/dateUtils';
import { defaultTime } from '../../core/dateTime';
import {
  buildMinuteOptions,
  HOURS_12,
  HOURS_24,
  indicesToTime,
  pad2,
  periodLabels,
  timeToIndices,
  type WheelIndices,
} from '../../core/time';
import { useDateValue } from '../../hooks/useDateValue';
import { TEXT_RESET } from '../../platform/styles';
import { cn } from '../../theme/cn';
import { useDatePickerTheme } from '../../theme/DatePickerThemeProvider';
import type { HourFormat, MinuteStep, TimePickerProps } from '../../types';
import { InlineTime } from './InlineTime';
import { Wheel, type WheelOption } from './Wheel';

export const hourOptions = (hourFormat: HourFormat): WheelOption[] =>
  (hourFormat === '24h' ? HOURS_24.map(pad2) : HOURS_12.map(String)).map((label, i) => ({ key: `h${i}`, label }));

export const minuteOptions = (step: MinuteStep): WheelOption[] =>
  buildMinuteOptions(step).map((m) => ({ key: `m${m}`, label: pad2(m) }));

export function TimePicker(props: TimePickerProps) {
  const {
    variant = 'wheel',
    hourFormat = '12h',
    minuteStep = 1,
    visibleItemCount = 5,
    itemHeight = 44,
    locale,
    timeZone,
    hapticFeedback = true,
    themeOverride,
    className,
    classNames,
    testID = 'time-picker',
  } = props;

  const { rootStyle } = useDatePickerTheme(themeOverride);
  const [value, setValue] = useDateValue(props);
  // Stable fallback so an empty picker doesn't drift every render.
  const [fallback] = useState(() => defaultTime(minuteStep, timeZone));
  const base = toZoned(value ?? fallback, timeZone);
  const indices = timeToIndices(base, hourFormat, minuteStep);

  const update = (patch: Partial<WheelIndices>) =>
    setValue(indicesToTime(base, { ...indices, ...patch }, hourFormat, minuteStep));

  const containerClass = cn('items-center justify-center rounded-lg bg-background p-3', className, classNames?.container);

  if (variant === 'inline') {
    return (
      <View style={[rootStyle]} className={containerClass} testID={testID}>
        <InlineTime
          indices={indices}
          hourFormat={hourFormat}
          minuteStep={minuteStep}
          locale={locale}
          hapticFeedback={hapticFeedback}
          onChange={update}
          classNames={classNames}
          testID={testID}
        />
      </View>
    );
  }

  const periods: WheelOption[] = periodLabels(locale).map((label, i) => ({ key: `p${i}`, label }));
  const bandTop = ((visibleItemCount - 1) / 2) * itemHeight;
  const shared = { itemHeight, visibleCount: visibleItemCount, hapticFeedback, classNames } as const;

  return (
    <View style={[rootStyle]} className={containerClass} testID={testID}>
      <View className="relative flex-row items-center justify-center gap-1" style={{ height: itemHeight * visibleItemCount }}>
        <View
          pointerEvents="none"
          style={{ position: 'absolute', left: 0, right: 0, top: bandTop, height: itemHeight }}
          className={cn('rounded-lg bg-muted', classNames?.wheelHighlight)}
        />
        <Wheel
          {...shared}
          items={hourOptions(hourFormat)}
          selectedIndex={indices.hour}
          onChange={(hour) => update({ hour })}
          accessibilityLabel="Hours"
          testID={`${testID}-hours`}
        />
        <View className={cn('w-4 items-center', classNames?.separator)}>
          <Text style={TEXT_RESET} className={cn('text-lg font-semibold text-foreground', classNames?.separatorText)}>
            :
          </Text>
        </View>
        <Wheel
          {...shared}
          items={minuteOptions(minuteStep)}
          selectedIndex={indices.minute}
          onChange={(minute) => update({ minute })}
          accessibilityLabel="Minutes"
          testID={`${testID}-minutes`}
        />
        {hourFormat === '12h' && (
          <Wheel
            {...shared}
            items={periods}
            selectedIndex={indices.period}
            onChange={(period) => update({ period: period === 0 ? 0 : 1 })}
            accessibilityLabel="AM/PM"
            testID={`${testID}-period`}
          />
        )}
      </View>
    </View>
  );
}
