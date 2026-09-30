/** Date + time in one value. Tabs (default) or stacked collapsible sections. */
import { format } from 'date-fns';
import { useState } from 'react';
import { View } from 'react-native';
import { combineDateAndTime, defaultTime } from '../../core/dateTime';
import { toZoned } from '../../core/dateUtils';
import { useDateValue } from '../../hooks/useDateValue';
import { cn } from '../../theme/cn';
import { useDatePickerTheme } from '../../theme/DatePickerThemeProvider';
import type { DateTimePickerProps } from '../../types';
import { Calendar } from '../Calendar/Calendar';
import { pickCalendarPassthrough } from '../shared/passthrough';
import { TimePicker } from '../TimePicker/TimePicker';
import { CollapsibleSection } from './CollapsibleSection';
import { SegmentedTabs } from './SegmentedTabs';

const EMPTY = '—';

export function DateTimePicker(props: DateTimePickerProps) {
  const {
    layout = 'tabs',
    hourFormat = '12h',
    minuteStep = 1,
    timeVariant = 'wheel',
    tabLabels,
    locale,
    timeZone,
    hapticFeedback = true,
    themeOverride,
    className,
    classNames,
    testID = 'date-time-picker',
  } = props;

  const { rootStyle } = useDatePickerTheme(themeOverride);
  const [value, setValue] = useDateValue(props);
  const [activeTab, setActiveTab] = useState(0);
  const [expanded, setExpanded] = useState({ date: true, time: false });

  const zoned = value ? toZoned(value, timeZone) : null;
  const dateText = zoned ? format(zoned, 'PP', { locale }) : EMPTY;
  const timeText = zoned ? format(zoned, hourFormat === '12h' ? 'h:mm a' : 'HH:mm', { locale }) : EMPTY;
  const labels = { date: tabLabels?.date ?? 'Date', time: tabLabels?.time ?? 'Time' };

  const onDate = (day: Date) => setValue(combineDateAndTime(day, value ?? defaultTime(minuteStep, timeZone), timeZone));
  const onTime = (time: Date) => setValue(combineDateAndTime(value ?? time, time, timeZone));

  const calendar = (
    <Calendar
      {...pickCalendarPassthrough(props)}
      mode="single"
      value={value}
      onChange={onDate}
      locale={locale}
      timeZone={timeZone}
      hapticFeedback={hapticFeedback}
      themeOverride={themeOverride}
      classNames={classNames?.calendar}
      testID={`${testID}-calendar`}
    />
  );
  const timePicker = (
    <TimePicker
      value={value}
      onChange={onTime}
      variant={timeVariant}
      hourFormat={hourFormat}
      minuteStep={minuteStep}
      locale={locale}
      timeZone={timeZone}
      hapticFeedback={hapticFeedback}
      themeOverride={themeOverride}
      classNames={classNames?.timePicker}
      testID={`${testID}-time`}
    />
  );

  return (
    <View style={rootStyle} className={cn('w-full gap-3 rounded-lg bg-background p-2', className, classNames?.container)} testID={testID}>
      {layout === 'tabs' ? (
        <>
          <SegmentedTabs
            tabs={[
              { key: 'date', title: labels.date, subtitle: dateText },
              { key: 'time', title: labels.time, subtitle: timeText },
            ]}
            activeIndex={activeTab}
            onChange={setActiveTab}
            classNames={classNames}
            testID={testID}
          />
          <View className={classNames?.body}>{activeTab === 0 ? calendar : timePicker}</View>
        </>
      ) : (
        <>
          <CollapsibleSection
            title={labels.date}
            subtitle={dateText}
            expanded={expanded.date}
            onToggle={() => setExpanded((s) => ({ ...s, date: !s.date }))}
            classNames={classNames}
            testID={`${testID}-date-section`}
          >
            {calendar}
          </CollapsibleSection>
          <CollapsibleSection
            title={labels.time}
            subtitle={timeText}
            expanded={expanded.time}
            onToggle={() => setExpanded((s) => ({ ...s, time: !s.time }))}
            classNames={classNames}
            testID={`${testID}-time-section`}
          >
            {timePicker}
          </CollapsibleSection>
        </>
      )}
    </View>
  );
}
