/** All Calendar state and transitions; the component itself only renders. */
import { addMonths, addYears, getYear, setMonth as setMonthIndex, setYear } from 'date-fns';
import { useCallback, useMemo, useState } from 'react';
import { createDisabledMatcher, dayKey, now, type DayMatcher } from '../../core/dateUtils';
import { canNavigate, clampToMonth, getInitialMonth, isYearOutOfRange } from '../../core/navigation';
import {
  anchorDate,
  applySelection,
  createSelectionMatcher,
  emptySelection,
  type SelectionMatcher,
} from '../../core/selection';
import { useControllableState } from '../../hooks/useControllableState';
import { triggerHaptic } from '../../platform/haptics';
import type { CalendarProps, CalendarView, DateConstraints, SelectionMode, SelectionValue } from '../../types';

export const YEARS_PER_PAGE = 12;
const pageStartFor = (year: number): number => Math.floor(year / YEARS_PER_PAGE) * YEARS_PER_PAGE;

export interface HeaderNav {
  readonly canPrev: boolean;
  readonly canNext: boolean;
  readonly prev: () => void;
  readonly next: () => void;
}

export interface CalendarState {
  readonly mode: SelectionMode;
  readonly value: SelectionValue;
  readonly month: Date;
  readonly view: CalendarView;
  readonly setView: (view: CalendarView) => void;
  readonly yearPageStart: number;
  readonly constraints: DateConstraints;
  readonly isDisabled: DayMatcher;
  readonly selection: SelectionMatcher;
  readonly todayKey: string;
  readonly nav: HeaderNav;
  readonly swipe: { canPrev: boolean; canNext: boolean; navigate: (direction: -1 | 1) => void };
  readonly selectDay: (date: Date, inMonth: boolean) => void;
  readonly selectMonth: (index: number) => void;
  readonly selectYear: (year: number) => void;
  readonly openView: (view: 'months' | 'years') => void;
}

export function useCalendarState(props: CalendarProps): CalendarState {
  const { minDate, maxDate, disabledDates, timeZone, hapticFeedback = true } = props;
  const mode: SelectionMode = props.mode ?? 'single';

  const constraints = useMemo<DateConstraints>(
    () => ({ minDate, maxDate, disabledDates, timeZone }),
    [minDate, maxDate, disabledDates, timeZone],
  );

  const [value, setValue] = useControllableState<SelectionValue>({
    value: props.value,
    defaultValue: props.defaultValue ?? emptySelection(mode),
    onChange: props.onChange as ((next: SelectionValue) => void) | undefined,
  });

  const [initialMonth] = useState(() => getInitialMonth(anchorDate(mode, value), constraints, now(timeZone)));
  const [month, setMonth] = useControllableState<Date>({
    value: props.month ? clampToMonth(props.month, { timeZone }) : undefined,
    defaultValue: props.defaultMonth ? clampToMonth(props.defaultMonth, constraints) : initialMonth,
    onChange: props.onMonthChange,
  });

  const [view, setView] = useState<CalendarView>('days');
  const [yearPageStart, setYearPageStart] = useState(() => pageStartFor(getYear(month)));

  const isDisabled = useMemo(() => createDisabledMatcher(constraints), [constraints]);
  const selection = useMemo(() => createSelectionMatcher(mode, value, timeZone), [mode, value, timeZone]);
  const todayKey = dayKey(now(timeZone), timeZone);
  const year = getYear(month);

  // Memoised; always routes through setMonth so SwipeableMonths recentres after a swipe.
  const navigate = useCallback(
    (direction: -1 | 1) => {
      triggerHaptic('selection', hapticFeedback);
      setMonth(addMonths(month, direction));
    },
    [month, setMonth, hapticFeedback],
  );

  const canPrevMonth = canNavigate(month, -1, constraints);
  const canNextMonth = canNavigate(month, 1, constraints);

  const nav: HeaderNav =
    view === 'days'
      ? { canPrev: canPrevMonth, canNext: canNextMonth, prev: () => navigate(-1), next: () => navigate(1) }
      : view === 'months'
        ? {
            canPrev: !isYearOutOfRange(year - 1, constraints),
            canNext: !isYearOutOfRange(year + 1, constraints),
            prev: () => setMonth(clampToMonth(addYears(month, -1), constraints)),
            next: () => setMonth(clampToMonth(addYears(month, 1), constraints)),
          }
        : {
            canPrev: !isYearOutOfRange(yearPageStart - 1, constraints),
            canNext: !isYearOutOfRange(yearPageStart + YEARS_PER_PAGE, constraints),
            prev: () => setYearPageStart((start) => start - YEARS_PER_PAGE),
            next: () => setYearPageStart((start) => start + YEARS_PER_PAGE),
          };

  const selectDay = useCallback(
    (date: Date, inMonth: boolean) => {
      if (isDisabled(date)) return;
      triggerHaptic('selection', hapticFeedback);
      setValue(applySelection(mode, value, date, timeZone));
      if (!inMonth) setMonth(clampToMonth(date, constraints));
    },
    [isDisabled, hapticFeedback, setValue, mode, value, timeZone, setMonth, constraints],
  );

  const selectMonth = (index: number) => {
    setMonth(clampToMonth(setMonthIndex(month, index), constraints));
    setView('days');
  };

  const selectYear = (nextYear: number) => {
    setMonth(clampToMonth(setYear(month, nextYear), constraints));
    setView('months');
  };

  const openView = (target: 'months' | 'years') => {
    if (target === 'years') setYearPageStart(pageStartFor(year));
    setView((current) => (current === target ? 'days' : target));
  };

  return {
    mode,
    value,
    month,
    view,
    setView,
    yearPageStart,
    constraints,
    isDisabled,
    selection,
    todayKey,
    nav,
    swipe: { canPrev: canPrevMonth, canNext: canNextMonth, navigate },
    selectDay,
    selectMonth,
    selectYear,
    openView,
  };
}
