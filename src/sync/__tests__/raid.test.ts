import {
  getCampfireLevel,
  OUTCOME_POINTS,
  teamChestEarned,
  weeklyPoints,
  type MemberNight,
} from '../campfire';
import { generateRaidCode, isValidRaidCode, RAID_CODE_LENGTH } from '../raidCode';

describe('raidCode', () => {
  it('generates 6-char codes from the unambiguous alphabet', () => {
    for (let i = 0; i < 50; i += 1) {
      const code = generateRaidCode();
      expect(code).toHaveLength(RAID_CODE_LENGTH);
      expect(code).not.toMatch(/[01OI]/);
      expect(isValidRaidCode(code)).toBe(true);
    }
  });

  it('is deterministic with an injected RNG', () => {
    expect(generateRaidCode(() => 0)).toBe('AAAAAA');
    expect(generateRaidCode(() => 0.999)).toBe('999999');
  });

  it('validates strictly', () => {
    expect(isValidRaidCode('ABC234')).toBe(true);
    expect(isValidRaidCode('ABC23')).toBe(false); // too short
    expect(isValidRaidCode('ABC2345')).toBe(false); // too long
    expect(isValidRaidCode('ABC01O')).toBe(false); // ambiguous chars
    expect(isValidRaidCode('abc234')).toBe(false); // lowercase
  });
});

describe('campfire', () => {
  const now = new Date('2026-07-23T12:00:00Z');
  const recent = (day: string, outcome: MemberNight['outcome']): MemberNight => ({
    deviceId: 'dev-a',
    date: `2026-07-${day}`,
    outcome,
  });

  it('maps outcomes to points per the spec', () => {
    expect(OUTCOME_POINTS).toEqual({ PERFECT: 1, GOOD: 0, BAD: -1, TERRIBLE: -2, MISSED: 0 });
  });

  it('sums the rolling last 7 days and drops older nights', () => {
    const nights = [
      recent('22', 'PERFECT'), // +1
      recent('21', 'TERRIBLE'), // −2
      recent('20', 'BAD'), // −1
      recent('10', 'PERFECT'), // 13 days old → excluded
    ];
    expect(weeklyPoints(nights, now)).toBe(0); // max(0, 1 − 2 − 1)
  });

  it('never goes below zero', () => {
    expect(weeklyPoints([recent('22', 'TERRIBLE'), recent('21', 'TERRIBLE')], now)).toBe(0);
  });

  it('accumulates across members', () => {
    const nights: MemberNight[] = [
      { deviceId: 'a', date: '2026-07-22', outcome: 'PERFECT' },
      { deviceId: 'b', date: '2026-07-22', outcome: 'PERFECT' },
      { deviceId: 'b', date: '2026-07-21', outcome: 'GOOD' },
    ];
    expect(weeklyPoints(nights, now)).toBe(2);
  });

  it('orders the campfire levels Ember < Spark < Flame < Blaze < Inferno', () => {
    expect(getCampfireLevel(0)).toBe('Ember');
    expect(getCampfireLevel(4)).toBe('Ember');
    expect(getCampfireLevel(5)).toBe('Spark');
    expect(getCampfireLevel(12)).toBe('Flame');
    expect(getCampfireLevel(20)).toBe('Blaze');
    expect(getCampfireLevel(30)).toBe('Inferno');
    expect(getCampfireLevel(35)).toBe('Inferno');
  });

  it('awards the team chest at points ≥ 2 × memberCount (2+ members)', () => {
    expect(teamChestEarned(4, 2)).toBe(true);
    expect(teamChestEarned(3, 2)).toBe(false);
    expect(teamChestEarned(10, 5)).toBe(true);
    expect(teamChestEarned(9, 5)).toBe(false);
    expect(teamChestEarned(100, 1)).toBe(false); // raids need 2–5 members
  });
});
