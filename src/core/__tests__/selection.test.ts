import type { DateRange } from '../../types';
import { dayKey } from '../dateUtils';
import { anchorDate, applySelection, createSelectionMatcher, emptySelection } from '../selection';

const d = (day: number) => new Date(2026, 8, day);
const keys = (v: unknown) => (v as Date[]).map((x) => dayKey(x));
const rangeKeys = (v: unknown) => {
  const r = v as DateRange;
  return [r.start ? dayKey(r.start) : null, r.end ? dayKey(r.end) : null];
};

describe('emptySelection', () => {
  it('returns the empty shape per mode', () => {
    expect(emptySelection('single')).toBeNull();
    expect(emptySelection('multiple')).toEqual([]);
    expect(emptySelection('range')).toEqual({ start: null, end: null });
  });
});

describe('applySelection', () => {
  it('single replaces', () => {
    expect(dayKey(applySelection('single', d(1), d(2)) as Date)).toBe('2026-09-02');
    expect(dayKey(applySelection('single', null, d(3)) as Date)).toBe('2026-09-03');
  });

  it('multiple toggles by calendar day', () => {
    const added = applySelection('multiple', [d(1)], d(2));
    expect(keys(added)).toEqual(['2026-09-01', '2026-09-02']);
    const removed = applySelection('multiple', added, new Date(2026, 8, 1, 15));
    expect(keys(removed)).toEqual(['2026-09-02']);
  });

  it('range: start → end → restart', () => {
    const empty = emptySelection('range');
    const started = applySelection('range', empty, d(10));
    expect(rangeKeys(started)).toEqual(['2026-09-10', null]);
    const done = applySelection('range', started, d(14));
    expect(rangeKeys(done)).toEqual(['2026-09-10', '2026-09-14']);
    expect(rangeKeys(applySelection('range', done, d(20)))).toEqual(['2026-09-20', null]);
  });

  it('range: tapping before start restarts from the new day', () => {
    const started = applySelection('range', emptySelection('range'), d(10));
    expect(rangeKeys(applySelection('range', started, d(5)))).toEqual(['2026-09-05', null]);
  });

  it('range: tapping start again makes a single-day range', () => {
    const started = applySelection('range', emptySelection('range'), d(10));
    expect(rangeKeys(applySelection('range', started, d(10)))).toEqual(['2026-09-10', '2026-09-10']);
  });
});

describe('createSelectionMatcher', () => {
  it('marks range positions', () => {
    const match = createSelectionMatcher('range', { start: d(10), end: d(14) });
    expect(match(d(10))).toMatchObject({ isSelected: true, isRangeStart: true, rangePosition: 'start' });
    expect(match(d(12))).toMatchObject({ isSelected: false, isInRange: true, rangePosition: 'middle' });
    expect(match(d(14))).toMatchObject({ isSelected: true, isRangeEnd: true, rangePosition: 'end' });
    expect(match(d(15)).rangePosition).toBe('none');
  });

  it('single-day range shows as selected without a band', () => {
    const match = createSelectionMatcher('range', { start: d(10), end: d(10) });
    expect(match(d(10))).toMatchObject({ isSelected: true, rangePosition: 'none' });
  });

  it('single and multiple', () => {
    expect(createSelectionMatcher('single', d(3))(d(3)).isSelected).toBe(true);
    expect(createSelectionMatcher('single', null)(d(3)).isSelected).toBe(false);
    expect(createSelectionMatcher('multiple', [d(1), d(4)])(d(4)).isSelected).toBe(true);
  });
});

describe('anchorDate', () => {
  it('picks the first meaningful date', () => {
    expect(anchorDate('single', null)).toBeNull();
    expect(anchorDate('multiple', [])).toBeNull();
    expect(dayKey(anchorDate('range', { start: d(7), end: null }) as Date)).toBe('2026-09-07');
  });
});
