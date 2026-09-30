import { monthKey } from '../dateUtils';
import {
  canNavigate,
  clampToMonth,
  getInitialMonth,
  isMonthOutOfRange,
  isYearOutOfRange,
  resolveSwipe,
} from '../navigation';

const sep = new Date(2026, 8, 1);

describe('canNavigate', () => {
  it('blocks moving before the minDate month', () => {
    expect(canNavigate(sep, -1, { minDate: new Date(2026, 8, 10) })).toBe(false);
    expect(canNavigate(sep, -1, { minDate: new Date(2026, 7, 31) })).toBe(true);
  });
  it('blocks moving past the maxDate month', () => {
    expect(canNavigate(sep, 1, { maxDate: new Date(2026, 8, 30) })).toBe(false);
    expect(canNavigate(sep, 1, { maxDate: new Date(2026, 9, 2) })).toBe(true);
  });
  it('is unrestricted without constraints', () => {
    expect(canNavigate(sep, -1, {})).toBe(true);
    expect(canNavigate(sep, 1, {})).toBe(true);
  });
});

describe('range checks', () => {
  const c = { minDate: new Date(2026, 8, 10), maxDate: new Date(2027, 1, 3) };
  it('months', () => {
    expect(isMonthOutOfRange(new Date(2026, 7, 1), c)).toBe(true);
    expect(isMonthOutOfRange(sep, c)).toBe(false);
    expect(isMonthOutOfRange(new Date(2027, 2, 1), c)).toBe(true);
  });
  it('years', () => {
    expect(isYearOutOfRange(2025, c)).toBe(true);
    expect(isYearOutOfRange(2026, c)).toBe(false);
    expect(isYearOutOfRange(2027, c)).toBe(false);
    expect(isYearOutOfRange(2028, c)).toBe(true);
  });
});

describe('getInitialMonth / clampToMonth (review focus)', () => {
  const today = new Date(2026, 8, 29);
  it('opens on the minDate month when today is before it', () => {
    const month = getInitialMonth(null, { minDate: new Date(2027, 2, 10) }, today);
    expect(monthKey(month)).toBe('2027-03');
    expect(month.getDate()).toBe(1);
  });
  it('opens on the maxDate month when today is after it', () => {
    expect(monthKey(getInitialMonth(null, { maxDate: new Date(2026, 0, 15) }, today))).toBe('2026-01');
  });
  it('prefers the anchor (selected value)', () => {
    expect(monthKey(getInitialMonth(new Date(2026, 11, 25), {}, today))).toBe('2026-12');
  });
  it('clampToMonth returns the month start', () => {
    const m = clampToMonth(new Date(2026, 8, 17), {});
    expect(m.getDate()).toBe(1);
    expect(m.getHours()).toBe(0);
  });
});

describe('resolveSwipe', () => {
  it('commits past 25% width or 500px/s', () => {
    expect(resolveSwipe(-120, 0, 300, true, true)).toBe(1);
    expect(resolveSwipe(120, 0, 300, true, true)).toBe(-1);
    expect(resolveSwipe(-30, -800, 300, true, true)).toBe(1);
    expect(resolveSwipe(-30, -100, 300, true, true)).toBe(0);
  });
  it('refuses blocked directions', () => {
    expect(resolveSwipe(-120, 0, 300, true, false)).toBe(0);
    expect(resolveSwipe(120, 0, 300, false, true)).toBe(0);
  });
});
