/** Combines a calendar day and a time of day for DateTimePicker. */
import { getHours, getMinutes, set } from 'date-fns';
import type { MinuteStep } from '../types';
import { now, toZoned } from './dateUtils';
import { snapMinute, withTime } from './time';

/** Day (Y/M/D) from `datePart`, clock (h:m) from `timePart`, both read in `timeZone`. Seconds are cleared. */
export function combineDateAndTime(datePart: Date, timePart: Date, timeZone?: string): Date {
  const time = toZoned(timePart, timeZone);
  return set(toZoned(datePart, timeZone), {
    hours: getHours(time),
    minutes: getMinutes(time),
    seconds: 0,
    milliseconds: 0,
  });
}

/** "Now", floored to `step`. Used when the user picks a date before any time exists. */
export function defaultTime(step: MinuteStep, timeZone?: string): Date {
  const current = now(timeZone);
  return withTime(current, getHours(current), snapMinute(getMinutes(current), step));
}
