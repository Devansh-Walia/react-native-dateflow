/** Time-of-day model shared by the wheel and inline TimePicker variants. */
import { format, getHours, getMinutes, set, setHours, type Locale } from 'date-fns';
import type { HourFormat, MinuteStep } from '../types';

export type Period = 'AM' | 'PM';

export const HOURS_24: readonly number[] = Array.from({ length: 24 }, (_, i) => i);
/** 12h wheel order: 12, 1, 2 … 11. Index i ↔ (hours24 % 12). */
export const HOURS_12: readonly number[] = Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i));

export function to12h(hours24: number): { hour12: number; period: Period } {
  const rem = hours24 % 12;
  return { hour12: rem === 0 ? 12 : rem, period: hours24 < 12 ? 'AM' : 'PM' };
}

export function to24h(hour12: number, period: Period): number {
  const base = hour12 % 12;
  return period === 'PM' ? base + 12 : base;
}

export function buildMinuteOptions(step: MinuteStep): number[] {
  return Array.from({ length: 60 / step }, (_, i) => i * step);
}

/** Floor (never round) so a snapped minute never rolls into the next hour or day. */
export function snapMinute(minute: number, step: MinuteStep): number {
  return Math.floor(minute / step) * step;
}

export function withTime(base: Date, hours: number, minutes: number): Date {
  return set(base, { hours, minutes, seconds: 0, milliseconds: 0 });
}

export const pad2 = (n: number): string => String(n).padStart(2, '0');

const PERIOD_REFERENCE = new Date(2026, 0, 1);

export function periodLabels(locale?: Locale): [string, string] {
  return [
    format(setHours(PERIOD_REFERENCE, 9), 'a', { locale }),
    format(setHours(PERIOD_REFERENCE, 21), 'a', { locale }),
  ];
}

export interface WheelIndices {
  readonly hour: number;
  readonly minute: number;
  readonly period: 0 | 1;
}

export function timeToIndices(date: Date, hourFormat: HourFormat, step: MinuteStep): WheelIndices {
  const hours = getHours(date);
  return {
    hour: hourFormat === '24h' ? hours : hours % 12,
    minute: snapMinute(getMinutes(date), step) / step,
    period: hours < 12 ? 0 : 1,
  };
}

export function indicesToTime(
  base: Date,
  { hour, minute, period }: WheelIndices,
  hourFormat: HourFormat,
  step: MinuteStep,
): Date {
  const hours = hourFormat === '24h' ? hour : (hour % 12) + (period === 1 ? 12 : 0);
  return withTime(base, hours, minute * step);
}
