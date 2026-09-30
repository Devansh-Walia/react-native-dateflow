/** Month/year navigation limits and the swipe decision (shared by the UI thread and tests). */
import { addMonths, getYear, startOfMonth } from 'date-fns';
import type { DateConstraints } from '../types';
import { clampDate, monthKey, toZoned } from './dateUtils';

export function canNavigate(month: Date, direction: -1 | 1, c: DateConstraints): boolean {
  const target = monthKey(addMonths(month, direction), c.timeZone);
  if (direction < 0 && c.minDate) return target >= monthKey(c.minDate, c.timeZone);
  if (direction > 0 && c.maxDate) return target <= monthKey(c.maxDate, c.timeZone);
  return true;
}

export function isMonthOutOfRange(month: Date, c: DateConstraints): boolean {
  const key = monthKey(month, c.timeZone);
  if (c.minDate && key < monthKey(c.minDate, c.timeZone)) return true;
  return Boolean(c.maxDate && key > monthKey(c.maxDate, c.timeZone));
}

export function isYearOutOfRange(year: number, c: DateConstraints): boolean {
  if (c.minDate && year < getYear(toZoned(c.minDate, c.timeZone))) return true;
  return Boolean(c.maxDate && year > getYear(toZoned(c.maxDate, c.timeZone)));
}

/** Start of the month containing `date`, clamped into [minDate, maxDate]. */
export function clampToMonth(date: Date, c: DateConstraints): Date {
  return startOfMonth(toZoned(clampDate(date, c.minDate, c.maxDate), c.timeZone));
}

/** First visible month: the selection anchor, else today, clamped to the allowed range. */
export function getInitialMonth(anchor: Date | null, c: DateConstraints, today: Date): Date {
  return clampToMonth(anchor ?? today, c);
}

const SWIPE_DISTANCE_RATIO = 0.25;
const SWIPE_VELOCITY = 500;

/** -1 = previous month, 1 = next month, 0 = snap back. Runs as a worklet inside the pan gesture. */
export function resolveSwipe(
  translationX: number,
  velocityX: number,
  width: number,
  canPrev: boolean,
  canNext: boolean,
): -1 | 0 | 1 {
  'worklet';
  const farEnough = Math.abs(translationX) > width * SWIPE_DISTANCE_RATIO;
  const fastEnough = Math.abs(velocityX) > SWIPE_VELOCITY;
  if (!farEnough && !fastEnough) return 0;
  const direction = (farEnough ? translationX : velocityX) < 0 ? 1 : -1;
  if (direction === 1 && !canNext) return 0;
  if (direction === -1 && !canPrev) return 0;
  return direction;
}
