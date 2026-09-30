/** Picks the Calendar props that DatePicker / DateTimePicker forward unchanged. */
import type { CalendarPassthroughProps } from '../../types';

const KEYS = [
  'minDate',
  'maxDate',
  'disabledDates',
  'firstDayOfWeek',
  'showOutsideDays',
  'hideHeader',
  'hideWeekdays',
  'swipeEnabled',
  'labels',
  'renderDay',
  'renderHeader',
  'renderFooter',
] as const satisfies readonly (keyof CalendarPassthroughProps)[];

export function pickCalendarPassthrough<P extends CalendarPassthroughProps>(props: P): CalendarPassthroughProps {
  return Object.fromEntries(
    KEYS.filter((key) => props[key] !== undefined).map((key) => [key, props[key]]),
  ) as CalendarPassthroughProps;
}
