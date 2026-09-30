import { pickCalendarPassthrough } from '../passthrough';

describe('pickCalendarPassthrough', () => {
  it('keeps only calendar passthrough keys and drops undefined ones', () => {
    const minDate = new Date(2026, 0, 1);
    const picked = pickCalendarPassthrough({ minDate, firstDayOfWeek: 1, hideHeader: undefined, placeholder: 'x' } as never);
    expect(picked).toEqual({ minDate, firstDayOfWeek: 1 });
  });
});
