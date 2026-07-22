import { assignHero, applyNightResult, evaluateNight, mockGameState } from '../mock';
import type { GameState, HeroType } from '../types';

// Night-line minutes: 23:30 = 690, 07:00 = 1140 → window D = 450 (7.5 h).
const stateWith = (heroType: HeroType, hp = 6): GameState => {
  const base = mockGameState();
  const hero = { ...base.hero!, type: heroType };
  return { ...base, hp, hero, nights: [] };
};

describe('assignHero (3×3 grid: bedtime × duration)', () => {
  it.each([
    [{ bedMin: 540, wakeMin: 960 }, 'monk'], // early, 7.0h
    [{ bedMin: 540, wakeMin: 1050 }, 'ranger'], // early, 8.5h
    [{ bedMin: 540, wakeMin: 1080 }, 'druid'], // early, 9.0h (inclusive)
    [{ bedMin: 690, wakeMin: 1140 }, 'rogue'], // normal, 7.5h
    [{ bedMin: 660, wakeMin: 1170 }, 'knight'], // normal, 8.5h
    [{ bedMin: 630, wakeMin: 1170 }, 'paladin'], // normal, 9.0h
    [{ bedMin: 750, wakeMin: 1170 }, 'ninja'], // late, 7.0h
    [{ bedMin: 720, wakeMin: 1230 }, 'mage'], // late, 8.5h
    [{ bedMin: 750, wakeMin: 1290 }, 'warlock'], // late, 9.0h
  ] as const)('window %j → %s', (window, hero) => {
    expect(assignHero(window)).toBe(hero);
  });

  it.each([
    [{ bedMin: 599, wakeMin: 1019 }, 'monk'], // 21:59 is still "early"
    [{ bedMin: 600, wakeMin: 1020 }, 'rogue'], // 22:00 starts "normal"
    [{ bedMin: 719, wakeMin: 1139 }, 'rogue'], // 23:59 is still "normal"
    [{ bedMin: 720, wakeMin: 1140 }, 'ninja'], // 00:00 starts "late"
  ] as const)('bedtime boundary %j → %s', (window, hero) => {
    expect(assignHero(window)).toBe(hero);
  });
});

describe('evaluateNight', () => {
  it('scores an on-time night as PERFECT (+1 HP, 100 XP, GOLD)', () => {
    expect(evaluateNight(stateWith('knight'), 690, 1140)).toMatchObject({
      score: 100,
      outcome: 'PERFECT',
      hpDelta: 1,
      xp: 100,
      pixel: 'GOLD',
    });
  });

  it('treats S=85 as PERFECT (ranges are inclusive from below)', () => {
    // wake 60 min late (−15); duration 510 ≤ D+120 → no oversleep penalty.
    expect(evaluateNight(stateWith('knight'), 690, 1200)).toMatchObject({
      score: 85,
      outcome: 'PERFECT',
    });
  });

  it('treats S=60 as GOOD (0 HP, 60 XP, GRAY)', () => {
    // bed 40 late (−10), wake 40 early (−10), shortfall 80 min (−20).
    expect(evaluateNight(stateWith('knight'), 730, 1100)).toMatchObject({
      score: 60,
      outcome: 'GOOD',
      hpDelta: 0,
      xp: 60,
      pixel: 'GRAY',
    });
  });

  it('treats S=40 as BAD (−1 HP, 25 XP, GRAY)', () => {
    // wake 120 early (−30, capped), shortfall 120 min (−30).
    expect(evaluateNight(stateWith('knight'), 690, 1020)).toMatchObject({
      score: 40,
      outcome: 'BAD',
      hpDelta: -1,
      xp: 25,
      pixel: 'GRAY',
    });
  });

  it('scores a wrecked night as TERRIBLE (−2 HP, 0 XP, BLACK)', () => {
    // wake 240 early (−30, capped), shortfall 240 min (−40, capped).
    expect(evaluateNight(stateWith('knight'), 690, 900)).toMatchObject({
      score: 30,
      outcome: 'TERRIBLE',
      hpDelta: -2,
      xp: 0,
      pixel: 'BLACK',
    });
  });
});

describe('evaluateNight session validation', () => {
  it('returns MISSED (S=0, no HP change) when a check-in is null', () => {
    expect(evaluateNight(stateWith('knight'), null, 1140)).toMatchObject({
      score: 0,
      outcome: 'MISSED',
      hpDelta: 0,
      pixel: 'BLACK',
    });
  });

  it.each([
    [1140, 690], // wake before bed
    [540, 1700], // session longer than 18 h
  ])('returns MISSED for invalid session [%i → %i]', (bed, wake) => {
    expect(evaluateNight(stateWith('knight'), bed, wake).outcome).toBe('MISSED');
  });
});

describe('evaluateNight hero tolerances', () => {
  it('applies Rogue bedtime tolerance (+15 min)', () => {
    const rogue = evaluateNight(stateWith('rogue'), 750, 1140);
    const knight = evaluateNight(stateWith('knight'), 750, 1140);
    expect(rogue.score).toBe(73.75);
    expect(knight.score).toBe(70);
  });

  it('applies Druid oversleep immunity', () => {
    const druid = evaluateNight(stateWith('druid'), 690, 1320);
    const knight = evaluateNight(stateWith('knight'), 690, 1320);
    expect(druid.score).toBe(70);
    expect(knight.score).toBe(60);
  });
});

describe('applyNightResult', () => {
  const date = '2026-07-22';

  it('caps HP at 7 on PERFECT with full hearts', () => {
    const next = applyNightResult(
      stateWith('knight', 7),
      evaluateNight(stateWith('knight'), 690, 1140),
      date,
    );
    expect(next.hp).toBe(7);
  });

  it('never drops HP below 0', () => {
    const next = applyNightResult(
      stateWith('knight', 1),
      evaluateNight(stateWith('knight'), 690, 900),
      date,
    );
    expect(next.hp).toBe(0);
  });

  it('resets the perfect-week streak on HP loss', () => {
    const state = { ...stateWith('knight', 5), perfectWeekStreak: 4 };
    const next = applyNightResult(state, evaluateNight(state, 690, 1020), date);
    expect(next.perfectWeekStreak).toBe(0);
    expect(next.hp).toBe(4);
  });

  it('levels up and resets the streak after 7 nights without HP loss', () => {
    const state = { ...stateWith('knight', 6), perfectWeekStreak: 6 };
    const next = applyNightResult(state, evaluateNight(state, 690, 1140), date);
    expect(next.hero!.level).toBe(state.hero!.level + 1);
    expect(next.perfectWeekStreak).toBe(0);
  });

  it('adds XP and appends a night record with the given date', () => {
    const state = stateWith('knight', 6);
    const next = applyNightResult(state, evaluateNight(state, 690, 1140), date);
    expect(next.hero!.xp).toBe(state.hero!.xp + 100);
    expect(next.nights).toHaveLength(1);
    expect(next.nights[0]).toMatchObject({ date, outcome: 'PERFECT', hpDelta: 1, pixel: 'GOLD' });
  });
});

describe('mockGameState', () => {
  it('returns a playable state with 10 fake nights', () => {
    const state = mockGameState();
    expect(state.nights).toHaveLength(10);
    expect(state.onboardingDone).toBe(true);
    expect(state.hero).not.toBeNull();
    expect(state.window).not.toBeNull();
  });
});
