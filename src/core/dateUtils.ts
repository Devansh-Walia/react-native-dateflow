/**
 * Zone-aware day arithmetic. Every calendar-day comparison goes through
 * `dayKey`, so min/max/disabled checks don't depend on time of day or device zone.
 */
import { TZDate } from '@date-fns/tz';
import { format } from 'date-fns';
import type { DateConstraints } from '../types';

/** `date` viewed in `timeZone` (TZDate), or the same instance when no zone is given. */
export function toZoned(date: Date, timeZone?: string): Date {
  return timeZone ? new TZDate(date.getTime(), timeZone) : date;
}

/** The current instant, viewed in `timeZone`. */
export function now(timeZone?: string): Date {
  return toZoned(new Date(), timeZone);
}

/** Calendar-day key `yyyy-MM-dd`; lexicographic order equals chronological order. */
export function dayKey(date: Date, timeZone?: string): string {
  return format(toZoned(date, timeZone), 'yyyy-MM-dd');
}

/** Month key `yyyy-MM`. */
export function monthKey(date: Date, timeZone?: string): string {
  return format(toZoned(date, timeZone), 'yyyy-MM');
}

/** Clamp an instant into [minDate, maxDate]. */
export function clampDate(date: Date, minDate?: Date, maxDate?: Date): Date {
  if (minDate && date.getTime() < minDate.getTime()) return minDate;
  if (maxDate && date.getTime() > maxDate.getTime()) return maxDate;
  return date;
}

export type DayMatcher = (date: Date) => boolean;

/** Build a predicate that returns true when a day may NOT be selected. Keys are precomputed once. */
export function createDisabledMatcher(constraints: DateConstraints): DayMatcher {
  const { minDate, maxDate, disabledDates, timeZone } = constraints;
  const minKey = minDate ? dayKey(minDate, timeZone) : undefined;
  const maxKey = maxDate ? dayKey(maxDate, timeZone) : undefined;
  const predicate = typeof disabledDates === 'function' ? disabledDates : undefined;
  const listed =
    disabledDates && typeof disabledDates !== 'function'
      ? new Set(disabledDates.map((d) => dayKey(d, timeZone)))
      : undefined;

  return (date) => {
    const key = dayKey(date, timeZone);
    if (minKey !== undefined && key < minKey) return true;
    if (maxKey !== undefined && key > maxKey) return true;
    if (listed?.has(key)) return true;
    return predicate ? predicate(date) : false;
  };
}
