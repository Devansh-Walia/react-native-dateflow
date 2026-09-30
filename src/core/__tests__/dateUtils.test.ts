import { TZDate } from '@date-fns/tz';
import { clampDate, createDisabledMatcher, dayKey, monthKey, toZoned } from '../dateUtils';

describe('toZoned', () => {
  it('returns the same instance when no zone is given', () => {
    const d = new Date(2026, 8, 29);
    expect(toZoned(d)).toBe(d);
  });

  it('wraps the same instant in a TZDate when a zone is given', () => {
    const d = new Date(Date.UTC(2026, 8, 29, 12));
    const zoned = toZoned(d, 'Asia/Tokyo');
    expect(zoned).toBeInstanceOf(TZDate);
    expect(zoned.getTime()).toBe(d.getTime());
  });
});

describe('dayKey / monthKey', () => {
  it('formats local dates', () => {
    expect(dayKey(new Date(2026, 8, 5))).toBe('2026-09-05');
    expect(monthKey(new Date(2026, 8, 5))).toBe('2026-09');
  });

  it('evaluates the calendar day in the requested zone', () => {
    const instant = new Date(Date.UTC(2026, 8, 30, 2, 0));
    expect(dayKey(instant, 'America/Los_Angeles')).toBe('2026-09-29');
    expect(dayKey(instant, 'Asia/Tokyo')).toBe('2026-09-30');
  });
});

describe('clampDate', () => {
  const min = new Date(2026, 8, 10);
  const max = new Date(2026, 8, 20);
  it('clamps below, above and passes through inside', () => {
    expect(clampDate(new Date(2026, 8, 1), min, max)).toBe(min);
    expect(clampDate(new Date(2026, 8, 25), min, max)).toBe(max);
    const inside = new Date(2026, 8, 15);
    expect(clampDate(inside, min, max)).toBe(inside);
  });
});

describe('createDisabledMatcher', () => {
  it('treats min/max as inclusive calendar days regardless of time', () => {
    const isDisabled = createDisabledMatcher({
      minDate: new Date(2026, 8, 10, 18, 30),
      maxDate: new Date(2026, 8, 20, 6, 0),
      disabledDates: [new Date(2026, 8, 15, 12)],
    });
    expect(isDisabled(new Date(2026, 8, 9))).toBe(true);
    expect(isDisabled(new Date(2026, 8, 10))).toBe(false);
    expect(isDisabled(new Date(2026, 8, 20, 23, 59))).toBe(false);
    expect(isDisabled(new Date(2026, 8, 21))).toBe(true);
    expect(isDisabled(new Date(2026, 8, 15))).toBe(true);
  });

  it('supports a predicate', () => {
    const weekends = createDisabledMatcher({
      disabledDates: (d) => d.getDay() === 0 || d.getDay() === 6,
    });
    expect(weekends(new Date(2026, 8, 26))).toBe(true); // Saturday
    expect(weekends(new Date(2026, 8, 28))).toBe(false); // Monday
  });
});
