import { fr } from 'date-fns/locale';
import { monthLabels, monthName, weekdayLabels, yearLabel } from '../locale';

describe('locale labels', () => {
  it('builds weekday labels starting at firstDayOfWeek', () => {
    expect(weekdayLabels(0)).toEqual(['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']);
    expect(weekdayLabels(1)[0]).toBe('Mo');
    expect(weekdayLabels(1, fr)[0]).toBe('lu');
  });

  it('builds month labels', () => {
    const labels = monthLabels();
    expect(labels).toHaveLength(12);
    expect(labels[0]).toBe('Jan');
    expect(labels[11]).toBe('Dec');
  });

  it('formats header parts', () => {
    const sep = new Date(2026, 8, 1);
    expect(monthName(sep)).toBe('September');
    expect(yearLabel(sep)).toBe('2026');
  });
});
