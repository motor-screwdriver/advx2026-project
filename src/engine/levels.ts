/**
 * HP, Perfect-Week streaks and night-outcome modifiers (spec §2 step 7–8, §4.1).
 * Pure functions; the store wires them into GameState.
 */
import type { ArtifactId, NightEvaluation, NightOutcome } from '../contracts/types';
import { clamp } from './night';

export const MAX_HP = 7;
export const PERFECT_WEEK_NIGHTS = 7;

export interface NightModifierContext {
  artifacts: ArtifactId[];
  hp: number;
  graceNight: boolean; // first evaluated night after onboarding cannot kill
  secondWindAvailable: boolean; // Second Wind artifact charge not used this week
}

export interface AppliedOutcome {
  hp: number;
  hpDelta: number; // final applied delta after all modifiers
  xp: number;
  died: boolean;
  ironArmorConsumed: boolean;
  secondWindUsed: boolean;
}

/**
 * Spec §2 step 7–8, order matters:
 * (a) Second Wind softens the first TERRIBLE per 7 days to −1;
 * (b) Iron Armor absorbs the whole remaining HP loss (consumed);
 * (c) grace night caps the loss so HP stays ≥ 1; HP clamps to [0, 7].
 */
export function applyNightOutcome(
  evaluation: NightEvaluation,
  ctx: NightModifierContext,
): AppliedOutcome {
  let hpDelta = evaluation.hpDelta;
  const secondWindUsed =
    hpDelta < 0 && evaluation.outcome === 'TERRIBLE' && ctx.secondWindAvailable;
  if (secondWindUsed) {
    hpDelta = -1;
  }
  const ironArmorConsumed = hpDelta < 0 && ctx.artifacts.includes('iron_armor');
  if (ironArmorConsumed) {
    hpDelta = 0;
  }
  if (ctx.graceNight) {
    hpDelta = Math.max(hpDelta, 1 - ctx.hp);
  }
  const hp = clamp(ctx.hp + hpDelta, 0, MAX_HP);
  return {
    hp,
    hpDelta,
    xp: evaluation.xp,
    died: hp === 0,
    ironArmorConsumed,
    secondWindUsed,
  };
}

export interface StreakUpdate {
  streak: number;
  leveledUp: boolean;
}

/**
 * Perfect Week (spec §4.1): 7 consecutive nights without HP loss → level up.
 * Any HP loss resets the streak; a MISSED night neither builds nor breaks it.
 */
export function updateStreak(
  streak: number,
  hpDelta: number,
  outcome: NightOutcome,
): StreakUpdate {
  if (hpDelta < 0) {
    return { streak: 0, leveledUp: false };
  }
  if (outcome === 'MISSED') {
    return { streak, leveledUp: false };
  }
  const next = streak + 1;
  return next >= PERFECT_WEEK_NIGHTS
    ? { streak: 0, leveledUp: true }
    : { streak: next, leveledUp: false };
}
