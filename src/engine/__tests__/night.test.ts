import { evaluateNight } from '../night';
import { WINDOW } from './fixtures';

describe('evaluateNight outcome bands (window 23:30 → 07:00, D = 450)', () => {
  it('scores an on-time night as PERFECT (+1 HP, 100 XP, GOLD)', () => {
    expect(evaluateNight(WINDOW, 690, 1140)).toMatchObject({
      score: 100,
      outcome: 'PERFECT',
      hpDelta: 1,
      xp: 100,
      pixel: 'GOLD',
    });
  });

  it('treats S=85 as PERFECT (ranges are inclusive from below)', () => {
    // wake 60 min late (−15); duration 510 ≤ D+120 → no oversleep penalty.
    expect(evaluateNight(WINDOW, 690, 1200)).toMatchObject({ score: 85, outcome: 'PERFECT' });
  });

  it('treats S=60 as GOOD (0 HP, 60 XP, GRAY)', () => {
    // bed 40 late (−10), wake 40 early (−10), shortfall 80 min (−20).
    expect(evaluateNight(WINDOW, 730, 1100)).toMatchObject({
      score: 60,
      outcome: 'GOOD',
      hpDelta: 0,
      xp: 60,
      pixel: 'GRAY',
    });
  });

  it('treats S=40 as BAD (−1 HP, 25 XP, GRAY)', () => {
    // wake 120 early (−30, capped), shortfall 120 min (−30).
    expect(evaluateNight(WINDOW, 690, 1020)).toMatchObject({
      score: 40,
      outcome: 'BAD',
      hpDelta: -1,
      xp: 25,
      pixel: 'GRAY',
    });
  });

  it('scores a wrecked night as TERRIBLE (−2 HP, 0 XP, BLACK)', () => {
    // wake 240 early (−30, capped), shortfall 240 min (−40, capped).
    expect(evaluateNight(WINDOW, 690, 900)).toMatchObject({
      score: 30,
      outcome: 'TERRIBLE',
      hpDelta: -2,
      xp: 0,
      pixel: 'BLACK',
    });
  });
});

describe('evaluateNight session validation', () => {
  it.each([
    [null, 1140],
    [690, null],
    [null, null],
  ])('returns MISSED when a check-in is null (%s → %s)', (bed, wake) => {
    expect(evaluateNight(WINDOW, bed, wake)).toMatchObject({
      score: 0,
      outcome: 'MISSED',
      hpDelta: 0,
      pixel: 'BLACK',
    });
  });

  it.each([
    [1140, 690], // wake before bed
    [690, 690], // zero-length session
    [540, 1700], // session longer than 18 h
  ])('returns MISSED for invalid session [%i → %i]', (bed, wake) => {
    expect(evaluateNight(WINDOW, bed, wake).outcome).toBe('MISSED');
  });
});

describe('evaluateNight edge cases', () => {
  it('handles the midnight crossover (bed 23:30 → wake 07:00)', () => {
    expect(evaluateNight(WINDOW, 690, 1140).score).toBe(100);
    expect(evaluateNight(WINDOW, 700, 1150).score).toBe(95); // +10/+10 min → −5
  });

  it('applies the oversleep penalty beyond D + 2 h', () => {
    const overslept = evaluateNight(WINDOW, 690, 1320); // duration 630 > 450+120
    expect(overslept.score).toBe(60); // 100 − 30 (wake dev) − 10 (oversleep)
  });
});
