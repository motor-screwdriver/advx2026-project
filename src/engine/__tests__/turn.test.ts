import { applyNightTurn } from '../turn';
import { makeGame, makeNight, TURN, WINDOW } from './fixtures';

describe('applyNightTurn basic flow', () => {
  it('applies a PERFECT night: HP cap, XP, streak, record', () => {
    const result = applyNightTurn(makeGame({ hp: 7 }), { ...TURN, bedTime: 690, wakeTime: 1140 });
    expect(result.game.hp).toBe(7);
    expect(result.game.hero!.xp).toBe(100);
    expect(result.game.perfectWeekStreak).toBe(1);
    expect(result.game.nights[0]).toMatchObject({
      date: '2026-07-22',
      outcome: 'PERFECT',
      hpDelta: 1,
      pixel: 'GOLD',
    });
    expect(result.died).toBe(false);
  });

  it('levels up and flags the chest after 7 clean nights', () => {
    const result = applyNightTurn(makeGame({ perfectWeekStreak: 6 }), {
      ...TURN,
      bedTime: 690,
      wakeTime: 1140,
    });
    expect(result.leveledUp).toBe(true);
    expect(result.game.hero!.level).toBe(2);
    expect(result.game.perfectWeekStreak).toBe(0);
  });

  it('records a MISSED night without check-ins', () => {
    const result = applyNightTurn(makeGame(), { ...TURN, bedTime: null, wakeTime: null });
    expect(result.evaluation.outcome).toBe('MISSED');
    expect(result.game.hp).toBe(7);
    expect(result.game.nights[0].outcome).toBe('MISSED');
  });
});

describe('applyNightTurn consumables', () => {
  it('Iron Armor absorbs one HP loss, then is gone (consumed once)', () => {
    const state = makeGame({
      artifacts: ['iron_armor'],
      equipped: { armor: 'iron_armor', charm: null },
    });
    const first = applyNightTurn(state, { ...TURN, bedTime: 690, wakeTime: 900 });
    expect(first.game.hp).toBe(7);
    expect(first.ironArmorConsumed).toBe(true);
    expect(first.game.artifacts).toEqual([]);
    expect(first.game.equipped.armor).toBeNull();
    const second = applyNightTurn(first.game, { ...TURN, bedTime: 690, wakeTime: 900 });
    expect(second.game.hp).toBe(5);
    expect(second.ironArmorConsumed).toBe(false);
  });

  it('Phoenix Feather auto-revives at 3 HP without touching the cooldown', () => {
    const state = makeGame({ hp: 1, artifacts: ['phoenix_feather'], nights: [makeNight()] });
    const result = applyNightTurn(state, { ...TURN, bedTime: 690, wakeTime: 900 });
    expect(result.died).toBe(false);
    expect(result.phoenixUsed).toBe(true);
    expect(result.game.hp).toBe(3);
    expect(result.game.artifacts).toEqual([]);
    expect(result.game.lastResurrectionAt).toBeNull();
  });

  it('without a feather, HP 1 + TERRIBLE is death', () => {
    const state = makeGame({ hp: 1, nights: [makeNight()] });
    const result = applyNightTurn(state, { ...TURN, bedTime: 690, wakeTime: 900 });
    expect(result.died).toBe(true);
    expect(result.game.hp).toBe(0);
  });

  it('Second Wind softens TERRIBLE when the weekly charge is ready', () => {
    const state = makeGame({ artifacts: ['second_wind'] });
    const result = applyNightTurn(state, {
      ...TURN,
      secondWindAvailable: true,
      bedTime: 690,
      wakeTime: 900,
    });
    expect(result.game.hp).toBe(6);
    expect(result.secondWindUsed).toBe(true);
  });
});

describe('applyNightTurn without a window', () => {
  it('scores MISSED when no sleep window is set', () => {
    const result = applyNightTurn(makeGame({ window: null }), {
      ...TURN,
      bedTime: WINDOW.bedMin,
      wakeTime: WINDOW.wakeMin,
    });
    expect(result.evaluation.outcome).toBe('MISSED');
  });
});
