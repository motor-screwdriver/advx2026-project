/**
 * Soul Tether mini-game rules (spec §3). Pure functions — the component
 * (SoulTether.tsx) only renders and wires taps to these.
 */

export interface GoldenZone {
  startPct: number;
  widthPct: number;
}

export const ZONE_WIDTHS = [25, 18, 12] as const;
export const ROUNDS_TO_WIN = 2;
export const ROUND_COUNT = 3;
export const PALADIN_ZONE_MULTIPLIER = 1.2;

/** Zone width for a round; Paladin's passive widens it by 20%. */
export function roundZoneWidth(round: number, isPaladin: boolean): number {
  const base = ZONE_WIDTHS[Math.min(round, ZONE_WIDTHS.length - 1)];
  return isPaladin ? base * PALADIN_ZONE_MULTIPLIER : base;
}

/** Inclusive edges: tapping exactly on the zone border counts as a hit. */
export function isHit(cursorPct: number, zone: GoldenZone): boolean {
  return cursorPct >= zone.startPct && cursorPct <= zone.startPct + zone.widthPct;
}
