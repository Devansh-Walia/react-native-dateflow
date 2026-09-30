import { combineDateAndTime, defaultTime } from '../dateTime';

describe('combineDateAndTime', () => {
  it('takes the calendar day from one and the clock from the other', () => {
    const out = combineDateAndTime(new Date(2026, 8, 10, 8, 0), new Date(2026, 0, 1, 14, 45, 12));
    expect([out.getFullYear(), out.getMonth(), out.getDate(), out.getHours(), out.getMinutes(), out.getSeconds()]).toEqual([
      2026, 8, 10, 14, 45, 0,
    ]);
  });

  it('works in an explicit zone', () => {
    const tz = 'Asia/Tokyo';
    const datePart = new Date(Date.UTC(2026, 8, 9, 20)); // 10 Sep 05:00 in Tokyo
    const timePart = new Date(Date.UTC(2026, 8, 1, 5, 30)); // 14:30 in Tokyo
    const out = combineDateAndTime(datePart, timePart, tz);
    expect(out.getTime()).toBe(Date.UTC(2026, 8, 10, 5, 30));
  });
});

describe('defaultTime', () => {
  it('floors now to the minute step', () => {
    expect(defaultTime(15).getMinutes() % 15).toBe(0);
    expect(defaultTime(15).getSeconds()).toBe(0);
  });
});
