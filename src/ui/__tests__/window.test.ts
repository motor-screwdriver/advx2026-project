import { formatClock, formatDuration, isValidWindow, nowNightLine } from '../window';

describe('isValidWindow (spec: duration 7-12 h)', () => {
  it.each([
    [{ bedMin: 690, wakeMin: 1140 }, true], // 23:30 -> 07:00 = 7.5 h
    [{ bedMin: 720, wakeMin: 1140 }, true], // exactly 7 h (inclusive)
    [{ bedMin: 690, wakeMin: 1410 }, true], // exactly 12 h (inclusive)
    [{ bedMin: 720, wakeMin: 1139 }, false], // under 7 h
    [{ bedMin: 690, wakeMin: 1411 }, false], // over 12 h
  ] as const)('window %j valid=%s', (window, expected) => {
    expect(isValidWindow(window)).toBe(expected);
  });
});

describe('formatClock (night line minutes -> HH:MM)', () => {
  it.each([
    [0, '12:00'],
    [600, '22:00'],
    [690, '23:30'],
    [720, '00:00'],
    [1140, '07:00'],
    [1439, '11:59'],
  ] as const)('%i -> %s', (nightLine, clock) => {
    expect(formatClock(nightLine)).toBe(clock);
  });
});

describe('formatDuration', () => {
  it.each([
    [420, '7h 00m'],
    [450, '7h 30m'],
    [720, '12h 00m'],
  ] as const)('%i min -> %s', (minutes, text) => {
    expect(formatDuration(minutes)).toBe(text);
  });
});

describe('nowNightLine', () => {
  it.each([
    [new Date(2026, 6, 22, 23, 40), 700], // 23:40 -> 700
    [new Date(2026, 6, 22, 12, 0), 0], // noon -> 0
    [new Date(2026, 6, 23, 7, 0), 1140], // 07:00 -> next-day 1140
    [new Date(2026, 6, 23, 0, 30), 750], // 00:30 -> 750
  ] as const)('%s -> %i', (date, expected) => {
    expect(nowNightLine(date)).toBe(expected);
  });
});
