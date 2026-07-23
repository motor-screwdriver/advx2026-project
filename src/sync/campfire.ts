/**
 * Campfire rules (P2, client-side calc per PROMPT D): weekly team points
 * from member nights, campfire levels and the team-chest threshold.
 * Pure functions — fully jest-tested, no network, no store.
 */
import type { NightOutcome } from '../contracts/types';

export type CampfireLevel = 'Ember' | 'Spark' | 'Flame' | 'Blaze' | 'Inferno';

export const OUTCOME_POINTS: Record<NightOutcome, number> = {
  PERFECT: 1,
  GOOD: 0,
  BAD: -1,
  TERRIBLE: -2,
  MISSED: 0,
};

export interface MemberNight {
  deviceId: string;
  date: string; // YYYY-MM-DD
  outcome: NightOutcome;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Weekly points = Σ member nights over the rolling last 7 days:
 * PERFECT +1, GOOD 0, BAD −1, TERRIBLE −2 (floor 0).
 */
export function weeklyPoints(nights: MemberNight[], now: Date): number {
  const cutoff = new Date(now.getTime() - WEEK_MS).toISOString().slice(0, 10);
  const sum = nights
    .filter((night) => night.date > cutoff)
    .reduce((total, night) => total + OUTCOME_POINTS[night.outcome], 0);
  return Math.max(0, sum);
}

/** Ember < Spark < Flame < Blaze < Inferno (by weekly team points). */
export const LEVEL_THRESHOLDS: readonly { level: CampfireLevel; minPoints: number }[] = [
  { level: 'Inferno', minPoints: 30 },
  { level: 'Blaze', minPoints: 20 },
  { level: 'Flame', minPoints: 12 },
  { level: 'Spark', minPoints: 5 },
  { level: 'Ember', minPoints: 0 },
];

export function getCampfireLevel(points: number): CampfireLevel {
  return (LEVEL_THRESHOLDS.find(({ minPoints }) => points >= minPoints) ?? LEVEL_THRESHOLDS[4])
    .level;
}

/** Weekly reward: points ≥ 2 × memberCount → team chest flag for everyone. */
export function teamChestEarned(points: number, memberCount: number): boolean {
  return memberCount >= 2 && points >= 2 * memberCount;
}
