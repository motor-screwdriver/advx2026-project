import {
  nextOccurrence,
  nextOccurrenceSkippingToday,
  nightLineToClockMin,
  pickDailyLine,
  shiftNightLine,
} from '../scheduleMath';

describe('nightLineToClockMin', () => {
  it('maps the night line onto clock minutes', () => {
    expect(nightLineToClockMin(0)).toBe(720); // night-line 0 = 12:00
    expect(nightLineToClockMin(690)).toBe(1410); // 23:30
    expect(nightLineToClockMin(1140)).toBe(420); // 07:00 next day
  });
});

describe('shiftNightLine', () => {
  it('shifts within the day', () => {
    expect(shiftNightLine(690, -60)).toBe(630);
    expect(shiftNightLine(1140, 15)).toBe(1155);
  });

  it('wraps across the night-line start (noon)', () => {
    expect(shiftNightLine(30, -60)).toBe(1410); // 12:30 − 1 h = 11:30
    expect(shiftNightLine(1410, 60)).toBe(30);
  });
});

describe('nextOccurrence', () => {
  const now = new Date(2026, 6, 23, 10, 0, 0); // 10:00 local

  it('returns the same day when the time is still ahead', () => {
    const at = nextOccurrence(now, 23 * 60 + 30);
    expect(at.getDate()).toBe(23);
    expect(at.getHours()).toBe(23);
    expect(at.getMinutes()).toBe(30);
  });

  it('rolls to tomorrow when the time has passed', () => {
    const at = nextOccurrence(now, 7 * 60);
    expect(at.getDate()).toBe(24);
    expect(at.getHours()).toBe(7);
  });

  it('skipping-today variant always lands tomorrow+', () => {
    const at = nextOccurrenceSkippingToday(now, 23 * 60 + 30);
    expect(at.getDate()).toBe(24);
    expect(at.getHours()).toBe(23);
  });
});

describe('pickDailyLine', () => {
  const pool = ['a', 'b', 'c'] as const;

  it('is stable within a day and rotates between days', () => {
    const day1 = new Date(2026, 6, 23, 8, 0, 0);
    const day1later = new Date(2026, 6, 23, 22, 0, 0);
    const day2 = new Date(2026, 6, 24, 8, 0, 0);
    expect(pickDailyLine(pool, day1)).toBe(pickDailyLine(pool, day1later));
    expect(pool).toContain(pickDailyLine(pool, day1));
    expect(pool).toContain(pickDailyLine(pool, day2));
  });

  it('wraps around the pool', () => {
    const day0 = new Date(2026, 0, 1, 12, 0, 0);
    const day3 = new Date(2026, 0, 4, 12, 0, 0);
    expect(pickDailyLine(pool, day0)).toBe(pickDailyLine(pool, day3));
  });
});
