/**
 * Night scoring (spec §2, steps 1–6). Pure: no state, no React, no Expo.
 *
 * Inputs are night-line minutes (12:00 → 36:00). Stateful modifiers
 * (Second Wind, Iron Armor, grace night) live in levels.ts / turn.ts.
 */
import type { NightEvaluation, NightOutcome, PixelColor, SleepWindow } from '../contracts/types';

const MAX_DEVIATION_MIN = 120; // deviation is capped at 2 h
const SHORTFALL_CAP_MIN = 160; // 160 min × 0.25 = max 40 points
const OVERSLEEP_GRACE_MIN = 120;
const OVERSLEEP_PENALTY = 10;
const SESSION_LIMIT_MIN = 18 * 60;
const PENALTY_PER_MIN = 0.25;

interface OutcomeSpec {
  min: number; // inclusive lower bound of the score range
  outcome: NightOutcome;
  hpDelta: number;
  xp: number;
  pixel: PixelColor;
}

const OUTCOMES: OutcomeSpec[] = [
  { min: 85, outcome: 'PERFECT', hpDelta: 1, xp: 100, pixel: 'GOLD' },
  { min: 60, outcome: 'GOOD', hpDelta: 0, xp: 60, pixel: 'GRAY' },
  { min: 40, outcome: 'BAD', hpDelta: -1, xp: 25, pixel: 'GRAY' },
  { min: 0, outcome: 'TERRIBLE', hpDelta: -2, xp: 0, pixel: 'BLACK' },
];

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function missedEvaluation(
  bedTime: number | null,
  wakeTime: number | null,
): NightEvaluation {
  return { bedTime, wakeTime, score: 0, outcome: 'MISSED', hpDelta: 0, xp: 0, pixel: 'BLACK' };
}

/** Spec §2.2: evaluate one night against the sleep window. */
export function evaluateNight(
  window: SleepWindow,
  bedTime: number | null,
  wakeTime: number | null,
): NightEvaluation {
  if (bedTime === null || wakeTime === null) {
    return missedEvaluation(bedTime, wakeTime);
  }
  const duration = wakeTime - bedTime;
  if (duration <= 0 || duration > SESSION_LIMIT_MIN) {
    return missedEvaluation(bedTime, wakeTime);
  }
  const windowMin = window.wakeMin - window.bedMin;
  const bedPenalty = deviationPenalty(Math.abs(bedTime - window.bedMin));
  const wakePenalty = deviationPenalty(Math.abs(wakeTime - window.wakeMin));
  const shortfallPenalty = Math.min(Math.max(0, windowMin - duration), SHORTFALL_CAP_MIN) * 0.25;
  const overslept = duration > windowMin + OVERSLEEP_GRACE_MIN;
  const score = clamp(
    100 - bedPenalty - wakePenalty - shortfallPenalty - (overslept ? OVERSLEEP_PENALTY : 0),
    0,
    100,
  );
  const spec = OUTCOMES.find((candidate) => score >= candidate.min) ?? OUTCOMES[3];
  const { outcome, hpDelta, xp, pixel } = spec;
  return { bedTime, wakeTime, score, outcome, hpDelta, xp, pixel };
}

function deviationPenalty(minutes: number): number {
  return clamp(minutes, 0, MAX_DEVIATION_MIN) * PENALTY_PER_MIN;
}
