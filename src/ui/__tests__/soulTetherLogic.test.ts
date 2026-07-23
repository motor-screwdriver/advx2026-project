import { isHit, roundZoneWidth, ZONE_WIDTHS } from '../soulTetherLogic';

describe('roundZoneWidth', () => {
  it('shrinks 25% / 18% / 12% across the 3 rounds', () => {
    expect(ZONE_WIDTHS).toEqual([25, 18, 12]);
    expect(roundZoneWidth(0, false)).toBe(25);
    expect(roundZoneWidth(1, false)).toBe(18);
    expect(roundZoneWidth(2, false)).toBe(12);
  });

  it('widens the zone by 20% for Paladin', () => {
    expect(roundZoneWidth(0, true)).toBe(30);
    expect(roundZoneWidth(2, true)).toBeCloseTo(14.4, 10);
  });
});

describe('isHit (cursor inside golden zone, inclusive edges)', () => {
  const zone = { startPct: 40, widthPct: 18 };

  it.each([
    [40, true], // left edge
    [58, true], // right edge
    [49, true], // center
    [39.9, false],
    [58.1, false],
  ])('cursor %f in %j -> %s', (cursorPct, expected) => {
    expect(isHit(cursorPct, zone)).toBe(expected);
  });
});
