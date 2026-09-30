import { TZDate } from '@date-fns/tz';
import { buildMonthGrid, GRID_WEEKS } from '../monthGrid';

describe('buildMonthGrid', () => {
  it('always returns 6 weeks of 7 days (fixed height on every platform)', () => {
    const grid = buildMonthGrid(new Date(2026, 1, 1), 0); // Feb 2026 fits in 4 weeks
    expect(grid).toHaveLength(GRID_WEEKS);
    grid.forEach((week) => expect(week).toHaveLength(7));
  });

  it('starts on the configured weekday', () => {
    // 1 Sep 2026 is a Tuesday
    expect(buildMonthGrid(new Date(2026, 8, 1), 0)[0]?.[0]?.key).toBe('2026-08-30');
    expect(buildMonthGrid(new Date(2026, 8, 1), 1)[0]?.[0]?.key).toBe('2026-08-31');
  });

  it('flags in-month days', () => {
    const flat = buildMonthGrid(new Date(2026, 8, 1), 0).flat();
    expect(flat.filter((c) => c.inMonth)).toHaveLength(30);
    expect(flat[0]?.inMonth).toBe(false);
  });

  it('yields 42 unique consecutive midnight days across a DST change (review focus)', () => {
    const flat = buildMonthGrid(new TZDate(2026, 10, 1, 'America/New_York'), 0).flat();
    const keys = flat.map((c) => c.key);
    expect(new Set(keys).size).toBe(42);
    expect(keys[0]).toBe('2026-11-01');
    expect(keys[41]).toBe('2026-12-12');
    flat.forEach((c) => expect(c.date.getHours()).toBe(0));
  });
});
