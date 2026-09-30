import {
  buildMinuteOptions,
  HOURS_12,
  indicesToTime,
  periodLabels,
  snapMinute,
  timeToIndices,
  to12h,
  to24h,
} from '../time';

describe('12h ↔ 24h (review focus: midnight/noon)', () => {
  it('converts to 12h', () => {
    expect(to12h(0)).toEqual({ hour12: 12, period: 'AM' });
    expect(to12h(12)).toEqual({ hour12: 12, period: 'PM' });
    expect(to12h(13)).toEqual({ hour12: 1, period: 'PM' });
    expect(to12h(11)).toEqual({ hour12: 11, period: 'AM' });
  });
  it('converts to 24h', () => {
    expect(to24h(12, 'AM')).toBe(0);
    expect(to24h(12, 'PM')).toBe(12);
    expect(to24h(1, 'PM')).toBe(13);
    expect(to24h(11, 'AM')).toBe(11);
  });
  it('orders 12h wheel with 12 first', () => {
    expect(HOURS_12).toEqual([12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });
});

describe('minute steps (review focus: unaligned minutes)', () => {
  it('builds options', () => {
    expect(buildMinuteOptions(15)).toEqual([0, 15, 30, 45]);
    expect(buildMinuteOptions(1)).toHaveLength(60);
  });
  it('floors to the step so the hour never carries', () => {
    expect(snapMinute(7, 15)).toBe(0);
    expect(snapMinute(53, 15)).toBe(45);
    expect(snapMinute(59, 1)).toBe(59);
  });
  it('shows 10:07 at step 15 as minute index 0 and emits 11:00 on hour change', () => {
    const base = new Date(2026, 8, 29, 10, 7);
    const idx = timeToIndices(base, '24h', 15);
    expect(idx.minute).toBe(0);
    const next = indicesToTime(base, { ...idx, hour: 11 }, '24h', 15);
    expect([next.getHours(), next.getMinutes(), next.getDate()]).toEqual([11, 0, 29]);
  });
});

describe('wheel indices', () => {
  it('maps 00:15 in 12h to hour index 0 (label 12) AM', () => {
    expect(timeToIndices(new Date(2026, 8, 29, 0, 15), '12h', 5)).toEqual({ hour: 0, minute: 3, period: 0 });
  });
  it('maps 13:40 in 24h', () => {
    expect(timeToIndices(new Date(2026, 8, 29, 13, 40), '24h', 10)).toEqual({ hour: 13, minute: 4, period: 1 });
  });
  it('12h index 0 + PM is noon', () => {
    const t = indicesToTime(new Date(2026, 8, 29), { hour: 0, minute: 3, period: 1 }, '12h', 5);
    expect([t.getHours(), t.getMinutes()]).toEqual([12, 15]);
  });
  it('clears seconds', () => {
    const t = indicesToTime(new Date(2026, 8, 29, 1, 2, 33, 400), { hour: 1, minute: 2, period: 0 }, '24h', 1);
    expect([t.getSeconds(), t.getMilliseconds()]).toEqual([0, 0]);
  });
});

describe('periodLabels', () => {
  it('uses locale day periods', () => {
    expect(periodLabels()).toEqual(['AM', 'PM']);
  });
});
