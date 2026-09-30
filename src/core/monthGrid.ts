/** Fixed 6×7 month grid model. Constant height means no layout jump when swiping between months. */
import { addDays, isSameMonth, startOfMonth, startOfWeek } from 'date-fns';
import type { WeekdayIndex } from '../types';
import { dayKey } from './dateUtils';

export interface DayCellModel {
  readonly date: Date;
  readonly key: string;
  readonly inMonth: boolean;
}

export const GRID_WEEKS = 6;

/**
 * Build the grid for `month`. Pass a TZDate to compute in a specific zone:
 * date-fns v4 keeps the zone through `addDays`, so wall-clock midnight
 * survives DST changes.
 */
export function buildMonthGrid(month: Date, firstDayOfWeek: WeekdayIndex): DayCellModel[][] {
  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: firstDayOfWeek });
  return Array.from({ length: GRID_WEEKS }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => {
      const date = addDays(gridStart, week * 7 + day);
      return { date, key: dayKey(date), inMonth: isSameMonth(date, month) };
    }),
  );
}
