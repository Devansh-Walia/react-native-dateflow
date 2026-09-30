/** Controllable `Date | null` whose public onChange only ever receives a Date. */
import { useCallback } from 'react';
import { useControllableState } from './useControllableState';

export interface DateValueOptions {
  value?: Date | null;
  defaultValue?: Date | null;
  onChange?: (value: Date) => void;
}

export function useDateValue({ value, defaultValue, onChange }: DateValueOptions): [Date | null, (next: Date) => void] {
  const [current, setCurrent] = useControllableState<Date | null>({ value, defaultValue: defaultValue ?? null });
  const set = useCallback(
    (next: Date) => {
      setCurrent(next);
      onChange?.(next);
    },
    [setCurrent, onChange],
  );
  return [current, set];
}
