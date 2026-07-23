import { ARTIFACTS, applyHourglass, consumeArtifact } from '../artifacts';
import { makeGame, makeNight } from './fixtures';

const NOW = new Date('2026-07-22T08:00:00Z');

describe('ARTIFACTS registry', () => {
  it('defines all 10 artifacts with the P1 ones implemented', () => {
    expect(Object.keys(ARTIFACTS)).toHaveLength(10);
    const implemented = Object.values(ARTIFACTS).filter((a) => a.implemented);
    expect(implemented.map((a) => a.id).sort()).toEqual([
      'hourglass',
      'iron_armor',
      'lucky_coin',
      'phoenix_feather',
      'second_wind',
    ]);
  });
});

describe('consumeArtifact', () => {
  it('removes a single instance and leaves duplicates', () => {
    expect(consumeArtifact(['iron_armor', 'hourglass', 'iron_armor'], 'iron_armor')).toEqual([
      'hourglass',
      'iron_armor',
    ]);
    expect(consumeArtifact(['hourglass'], 'iron_armor')).toEqual(['hourglass']);
  });
});

describe('applyHourglass', () => {
  const badNight = makeNight({
    date: '2026-07-21',
    score: 55,
    outcome: 'BAD',
    hpDelta: -1,
    pixel: 'GRAY',
  });

  it('upgrades a recent BAD night to GOOD, refunds HP, consumes the hourglass', () => {
    const state = makeGame({ hp: 5, artifacts: ['hourglass'], nights: [badNight] });
    const next = applyHourglass(state, '2026-07-21', NOW);
    expect(next).not.toBeNull();
    expect(next!.nights[0]).toMatchObject({ outcome: 'GOOD', score: 60, hpDelta: 0 });
    expect(next!.hp).toBe(6);
    expect(next!.artifacts).toEqual([]);
    expect(next!.perfectWeekStreak).toBe(1);
  });

  it('refuses a night older than 24 h', () => {
    const state = makeGame({ artifacts: ['hourglass'], nights: [badNight] });
    const later = new Date('2026-07-24T08:00:00Z');
    expect(applyHourglass(state, '2026-07-21', later)).toBeNull();
  });

  it('refuses when there is no hourglass or the night is already GOOD+', () => {
    expect(applyHourglass(makeGame({ nights: [badNight] }), '2026-07-21', NOW)).toBeNull();
    const goodState = makeGame({ artifacts: ['hourglass'], nights: [makeNight()] });
    expect(applyHourglass(goodState, '2026-07-21', NOW)).toBeNull();
  });
});
