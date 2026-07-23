import type { NightEvaluation } from '../../contracts/types';
import { applyNightOutcome, NightModifierContext, updateStreak } from '../levels';

const terrible: NightEvaluation = {
  bedTime: 690,
  wakeTime: 900,
  score: 30,
  outcome: 'TERRIBLE',
  hpDelta: -2,
  xp: 0,
  pixel: 'BLACK',
};

const perfect: NightEvaluation = {
  ...terrible,
  score: 100,
  outcome: 'PERFECT',
  hpDelta: 1,
  xp: 100,
  pixel: 'GOLD',
};

const ctx = (overrides: Partial<NightModifierContext> = {}): NightModifierContext => ({
  artifacts: [],
  hp: 7,
  graceNight: false,
  secondWindAvailable: false,
  ...overrides,
});

describe('applyNightOutcome HP rules', () => {
  it('caps HP at 7 on PERFECT with full hearts', () => {
    expect(applyNightOutcome(perfect, ctx({ hp: 7 })).hp).toBe(7);
  });

  it('kills at HP 0 (HP=1 + TERRIBLE → DEATH, not −1)', () => {
    const applied = applyNightOutcome(terrible, ctx({ hp: 1 }));
    expect(applied.hp).toBe(0);
    expect(applied.died).toBe(true);
  });

  it('grace night cannot kill — HP loss capped so hp ≥ 1', () => {
    const applied = applyNightOutcome(terrible, ctx({ hp: 1, graceNight: true }));
    expect(applied.hp).toBe(1);
    expect(applied.died).toBe(false);
  });
});

describe('applyNightOutcome modifiers (spec §2 step 7 order)', () => {
  it('Second Wind softens the first TERRIBLE of the week to −1', () => {
    const applied = applyNightOutcome(terrible, ctx({ secondWindAvailable: true }));
    expect(applied.hpDelta).toBe(-1);
    expect(applied.secondWindUsed).toBe(true);
  });

  it('does not soften when the weekly charge is spent', () => {
    const applied = applyNightOutcome(terrible, ctx({ secondWindAvailable: false }));
    expect(applied.hpDelta).toBe(-2);
    expect(applied.secondWindUsed).toBe(false);
  });

  it('Iron Armor absorbs the whole HP loss and is consumed', () => {
    const bad: NightEvaluation = { ...perfect, outcome: 'BAD', hpDelta: -1, xp: 25, pixel: 'GRAY' };
    const applied = applyNightOutcome(bad, ctx({ artifacts: ['iron_armor'] }));
    expect(applied.hpDelta).toBe(0);
    expect(applied.ironArmorConsumed).toBe(true);
  });

  it('Iron Armor absorbs the softened −1 after Second Wind (order a → b)', () => {
    const applied = applyNightOutcome(
      terrible,
      ctx({ secondWindAvailable: true, artifacts: ['iron_armor'] }),
    );
    expect(applied.hpDelta).toBe(0);
    expect(applied.secondWindUsed).toBe(true);
    expect(applied.ironArmorConsumed).toBe(true);
  });
});

describe('updateStreak (Perfect Week, spec §4.1)', () => {
  it('increments on nights without HP loss', () => {
    expect(updateStreak(3, 0, 'GOOD')).toEqual({ streak: 4, leveledUp: false });
    expect(updateStreak(3, 1, 'PERFECT')).toEqual({ streak: 4, leveledUp: false });
  });

  it('resets on any HP loss', () => {
    expect(updateStreak(6, -1, 'BAD')).toEqual({ streak: 0, leveledUp: false });
  });

  it('levels up and resets at 7 consecutive nights', () => {
    expect(updateStreak(6, 1, 'PERFECT')).toEqual({ streak: 0, leveledUp: true });
  });

  it('a MISSED night neither builds nor breaks the streak', () => {
    expect(updateStreak(4, 0, 'MISSED')).toEqual({ streak: 4, leveledUp: false });
  });
});
