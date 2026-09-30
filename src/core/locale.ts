/** Locale labels through date-fns only (no Intl), so output is identical on Hermes and browsers. */
import { addDays, format, startOfWeek, type Locale } from 'date-fns';
import type { WeekdayIndex } from '../types';

/** Any fixed date; labels must not depend on "today". */
const REFERENCE_DAY = new Date(2026, 0, 4);

export function weekdayLabels(firstDayOfWeek: WeekdayIndex, locale?: Locale): string[] {
  const start = startOfWeek(REFERENCE_DAY, { weekStartsOn: firstDayOfWeek });
  return Array.from({ length: 7 }, (_, i) => format(addDays(start, i), 'EEEEEE', { locale }));
}

export function monthLabels(locale?: Locale): string[] {
  return Array.from({ length: 12 }, (_, i) => format(new Date(2026, i, 1), 'LLL', { locale }));
}

export function monthName(month: Date, locale?: Locale): string {
  return format(month, 'LLLL', { locale });
}

export function yearLabel(month: Date, locale?: Locale): string {
  return format(month, 'yyyy', { locale });
}
