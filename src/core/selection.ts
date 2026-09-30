/** Pure selection model for single / multiple / range calendars. */
import type { DateRange, RangePosition, SelectionMode, SelectionValue } from '../types';
import { dayKey } from './dateUtils';

const EMPTY_RANGE: DateRange = { start: null, end: null };

const asArray = (value: SelectionValue): readonly Date[] => (Array.isArray(value) ? value : []);

const asRange = (value: SelectionValue): DateRange =>
  value !== null && !Array.isArray(value) && !(value instanceof Date) ? value : EMPTY_RANGE;

export function emptySelection(mode: SelectionMode): SelectionValue {
  if (mode === 'single') return null;
  if (mode === 'multiple') return [];
  return EMPTY_RANGE;
}

function toggleMultiple(values: readonly Date[], date: Date, timeZone?: string): Date[] {
  const key = dayKey(date, timeZone);
  return values.some((v) => dayKey(v, timeZone) === key)
    ? values.filter((v) => dayKey(v, timeZone) !== key)
    : [...values, date];
}

function selectRange(range: DateRange, date: Date, timeZone?: string): DateRange {
  const { start, end } = range;
  if (!start || end) return { start: date, end: null };
  if (dayKey(date, timeZone) < dayKey(start, timeZone)) return { start: date, end: null };
  return { start, end: date };
}

/** Next selection after the user taps `date`. */
export function applySelection(
  mode: SelectionMode,
  value: SelectionValue,
  date: Date,
  timeZone?: string,
): SelectionValue {
  switch (mode) {
    case 'single':
      return date;
    case 'multiple':
      return toggleMultiple(asArray(value), date, timeZone);
    case 'range':
      return selectRange(asRange(value), date, timeZone);
  }
}

export interface DaySelectionState {
  readonly isSelected: boolean;
  readonly isRangeStart: boolean;
  readonly isRangeEnd: boolean;
  readonly isInRange: boolean;
  readonly rangePosition: RangePosition;
}

export type SelectionMatcher = (date: Date) => DaySelectionState;

const NONE: DaySelectionState = {
  isSelected: false,
  isRangeStart: false,
  isRangeEnd: false,
  isInRange: false,
  rangePosition: 'none',
};

const SELECTED: DaySelectionState = { ...NONE, isSelected: true };

/** Precompute keys once per render; the returned matcher is O(1) per cell. */
export function createSelectionMatcher(
  mode: SelectionMode,
  value: SelectionValue,
  timeZone?: string,
): SelectionMatcher {
  if (mode === 'single') {
    const key = value instanceof Date ? dayKey(value, timeZone) : undefined;
    return (date) => (key !== undefined && dayKey(date, timeZone) === key ? SELECTED : NONE);
  }
  if (mode === 'multiple') {
    const keys = new Set(asArray(value).map((v) => dayKey(v, timeZone)));
    return (date) => (keys.has(dayKey(date, timeZone)) ? SELECTED : NONE);
  }
  const { start, end } = asRange(value);
  const s = start ? dayKey(start, timeZone) : undefined;
  const e = end ? dayKey(end, timeZone) : undefined;
  const hasBand = s !== undefined && e !== undefined && s !== e;
  return (date) => {
    const key = dayKey(date, timeZone);
    const isRangeStart = key === s;
    const isRangeEnd = key === e;
    const isInRange = hasBand && key > (s as string) && key < (e as string);
    const rangePosition: RangePosition = !hasBand
      ? 'none'
      : isRangeStart
        ? 'start'
        : isRangeEnd
          ? 'end'
          : isInRange
            ? 'middle'
            : 'none';
    return { isSelected: isRangeStart || isRangeEnd, isRangeStart, isRangeEnd, isInRange, rangePosition };
  };
}

/** The date the calendar should open on, if any. */
export function anchorDate(mode: SelectionMode, value: SelectionValue): Date | null {
  if (mode === 'single') return value instanceof Date ? value : null;
  if (mode === 'multiple') return asArray(value)[0] ?? null;
  return asRange(value).start;
}
