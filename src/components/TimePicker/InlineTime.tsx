/** Compact time entry: tappable hour/minute pills that open option grids, plus an AM/PM toggle. No TextInput. */
import type { Locale } from 'date-fns';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { buildMinuteOptions, HOURS_12, HOURS_24, pad2, periodLabels, type WheelIndices } from '../../core/time';
import { triggerHaptic } from '../../platform/haptics';
import { TEXT_RESET } from '../../platform/styles';
import { cn } from '../../theme/cn';
import type { HourFormat, MinuteStep, TimePickerClassNames } from '../../types';

type Segment = 'hour' | 'minute';

export interface InlineTimeProps {
  indices: WheelIndices;
  hourFormat: HourFormat;
  minuteStep: MinuteStep;
  locale?: Locale;
  hapticFeedback: boolean;
  onChange: (patch: Partial<WheelIndices>) => void;
  classNames?: TimePickerClassNames;
  testID: string;
}

interface PillProps {
  label: string;
  active: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  classNames?: TimePickerClassNames;
  testID: string;
}

function SegmentPill({ label, active, onPress, accessibilityLabel, classNames, testID }: PillProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ expanded: active }}
      testID={testID}
      className={cn(
        'h-11 min-w-14 items-center justify-center rounded-lg bg-muted px-3 select-none',
        active && 'border-2 border-primary',
        classNames?.inlineSegment,
        active && classNames?.inlineSegmentActive,
      )}
    >
      <Text style={TEXT_RESET} className={cn('text-xl font-semibold text-foreground tabular-nums', classNames?.inlineSegmentText)}>
        {label}
      </Text>
    </Pressable>
  );
}

export function InlineTime({ indices, hourFormat, minuteStep, locale, hapticFeedback, onChange, classNames, testID }: InlineTimeProps) {
  const [open, setOpen] = useState<Segment | null>(null);
  const hours = hourFormat === '24h' ? HOURS_24.map(pad2) : HOURS_12.map(String);
  const minutes = buildMinuteOptions(minuteStep).map(pad2);
  const periods = periodLabels(locale);

  const choose = (patch: Partial<WheelIndices>) => {
    triggerHaptic('selection', hapticFeedback);
    onChange(patch);
    setOpen(null);
  };
  const toggle = (segment: Segment) => setOpen((current) => (current === segment ? null : segment));

  const options = open === 'hour' ? hours : open === 'minute' ? minutes : [];
  const activeIndex = open === 'hour' ? indices.hour : indices.minute;

  return (
    <View className={cn('gap-3', classNames?.inlineContainer)}>
      <View className="flex-row items-center justify-center gap-2">
        <SegmentPill
          label={hours[indices.hour] ?? ''}
          active={open === 'hour'}
          onPress={() => toggle('hour')}
          accessibilityLabel="Hour"
          classNames={classNames}
          testID={`${testID}-hour`}
        />
        <Text style={TEXT_RESET} className={cn('text-xl font-semibold text-foreground', classNames?.separatorText)}>
          :
        </Text>
        <SegmentPill
          label={minutes[indices.minute] ?? ''}
          active={open === 'minute'}
          onPress={() => toggle('minute')}
          accessibilityLabel="Minute"
          classNames={classNames}
          testID={`${testID}-minute`}
        />
        {hourFormat === '12h' && (
          <View className={cn('ml-2 flex-row rounded-lg bg-muted p-1', classNames?.periodToggle)} accessibilityRole="radiogroup">
            {periods.map((label, i) => {
              const active = indices.period === i;
              return (
                <Pressable
                  key={label}
                  onPress={() => choose({ period: i === 0 ? 0 : 1 })}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  testID={`${testID}-period-${i}`}
                  className={cn(
                    'h-9 min-w-12 items-center justify-center rounded-md px-2 select-none',
                    active && 'bg-background',
                    classNames?.periodOption,
                    active && classNames?.periodOptionActive,
                  )}
                >
                  <Text
                    style={TEXT_RESET}
                    className={cn(
                      'text-sm text-muted-foreground',
                      active && 'font-semibold text-foreground',
                      classNames?.periodOptionText,
                      active && classNames?.periodOptionActiveText,
                    )}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {open && (
        <View className={cn('flex-row flex-wrap justify-center gap-2', classNames?.inlineOptions)}>
          {options.map((label, i) => {
            const active = i === activeIndex;
            return (
              <Pressable
                key={label}
                onPress={() => choose(open === 'hour' ? { hour: i } : { minute: i })}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                testID={`${testID}-option-${open}-${i}`}
                className={cn(
                  'h-10 w-12 items-center justify-center rounded-lg select-none',
                  active && 'bg-primary',
                  classNames?.inlineOption,
                  active && classNames?.inlineOptionActive,
                )}
              >
                <Text
                  style={TEXT_RESET}
                  className={cn(
                    'text-sm text-foreground tabular-nums',
                    active && 'font-semibold text-primary-foreground',
                    classNames?.inlineOptionText,
                    active && classNames?.inlineOptionActiveText,
                  )}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
