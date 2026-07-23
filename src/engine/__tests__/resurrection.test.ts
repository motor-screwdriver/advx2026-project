import { applyResurrection, canResurrect, RESURRECT_HP } from '../resurrection';
import { makeGame } from './fixtures';

const NOW = new Date('2026-07-22T08:00:00Z');
const daysAgo = (days: number) =>
  new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

describe('canResurrect (7-day cooldown)', () => {
  it('is available when never used', () => {
    expect(canResurrect(null, NOW)).toBe(true);
  });

  it('is blocked within 7 days of the last resurrection', () => {
    expect(canResurrect(daysAgo(3), NOW)).toBe(false);
    expect(canResurrect(daysAgo(7), NOW)).toBe(false); // exactly 7 days is not > 7 days
  });

  it('is available again after 7 days', () => {
    expect(canResurrect(daysAgo(8), NOW)).toBe(true);
  });
});

describe('applyResurrection', () => {
  it('success revives with 3 HP and stamps the cooldown', () => {
    const next = applyResurrection(makeGame({ hp: 0 }), true, NOW);
    expect(next.hp).toBe(RESURRECT_HP);
    expect(next.lastResurrectionAt).toBe(NOW.toISOString());
  });

  it('failure is a permanent death — hero is gone', () => {
    const next = applyResurrection(makeGame({ hp: 0 }), false, NOW);
    expect(next.hero).toBeNull();
    expect(next.lastResurrectionAt).toBeNull();
  });
});
