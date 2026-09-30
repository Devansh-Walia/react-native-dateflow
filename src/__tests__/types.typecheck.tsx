/** Compile-time contract for the public types. Checked by `pnpm typecheck`. */
import type {
  CalendarClassNames,
  CalendarProps,
  DateRange,
  DateTimePickerProps,
  TimePickerProps,
} from '../types';

const range: CalendarProps = { mode: 'range', onChange: (v: DateRange) => void v };
const single: CalendarProps = { onChange: (v: Date) => void v };
const multiple: CalendarProps = { mode: 'multiple', value: [new Date()] };
const dateTime: DateTimePickerProps = { layout: 'stacked', classNames: { calendar: { dayCell: 'h-12' } } };

// @ts-expect-error range mode never receives a single Date
const badRange: CalendarProps = { mode: 'range', value: new Date() };
// @ts-expect-error 7 is not a supported minute step
const badStep: TimePickerProps = { minuteStep: 7 };
// @ts-expect-error unknown slot names are rejected
const badSlot: CalendarClassNames = { notASlot: 'x' };
// @ts-expect-error firstDayOfWeek is 0-6
const badWeek: CalendarProps = { firstDayOfWeek: 7 };

export const typeFixtures = [range, single, multiple, dateTime, badRange, badStep, badSlot, badWeek];
