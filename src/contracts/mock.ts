/**
 * In-memory mock of the future engine API (M0). Lets the UI developer build
 * every screen without waiting for the real engine (Dev B, PROMPT B).
 *
 * Scope: the stateless scoring formula (spec §2 steps 1-6) + Ranger/Rogue/
 * Druid tolerance inputs. Stateful modifiers — Mage/Second Wind weekly charge,
 * Iron Armor, grace night, death/resurrection flow — belong to the real engine.
 * The scoring maths below is spec-shaped, not a replacement for engine tests.
 */
import type {
  GameState,
  HeroType,
  NightEvaluation,
  NightOutcome,
  NightRecord,
  PixelColor,
  SleepWindow,
} from './types';

const MAX_HP = 7;
const PERFECT_WEEK_NIGHTS = 7;
const MAX_DEVIATION_MIN = 120;
const OVERSLEEP_GRACE_MIN = 120;
const OVERSLEEP_PENALTY = 10;
const SESSION_LIMIT_MIN = 18 * 60;

const HERO_GRID: HeroType[][] = [
  ['monk', 'ranger', 'druid'], // early bedtime (before 22:00)
  ['rogue', 'knight', 'paladin'], // normal (22:00-23:59)
  ['ninja', 'mage', 'warlock'], // late (00:00+)
];

interface Tolerances {
  bed: number;
  wake: number;
  oversleepImmune: boolean;
}

const NO_TOLERANCE: Tolerances = { bed: 0, wake: 0, oversleepImmune: false };

const HERO_TOLERANCES: Record<HeroType, Tolerances> = {
  monk: NO_TOLERANCE,
  ranger: { ...NO_TOLERANCE, wake: 15 },
  druid: { ...NO_TOLERANCE, oversleepImmune: true },
  rogue: { ...NO_TOLERANCE, bed: 15 },
  knight: NO_TOLERANCE,
  paladin: NO_TOLERANCE,
  ninja: NO_TOLERANCE,
  mage: NO_TOLERANCE,
  warlock: NO_TOLERANCE,
};

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

export function assignHero(window: SleepWindow): HeroType {
  const row = window.bedMin < 600 ? 0 : window.bedMin < 720 ? 1 : 2;
  const duration = window.wakeMin - window.bedMin;
  const col = duration < 480 ? 0 : duration < 540 ? 1 : 2;
  return HERO_GRID[row][col];
}

export function evaluateNight(
  state: GameState,
  bedTime: number | null,
  wakeTime: number | null,
): NightEvaluation {
  if (!state.window || bedTime === null || wakeTime === null) {
    return missed(bedTime, wakeTime);
  }
  const duration = wakeTime - bedTime;
  if (duration <= 0 || duration > SESSION_LIMIT_MIN) {
    return missed(bedTime, wakeTime);
  }
  const windowMin = state.window.wakeMin - state.window.bedMin;
  const tolerances = state.hero ? HERO_TOLERANCES[state.hero.type] : NO_TOLERANCE;
  const bedPenalty = deviationPenalty(Math.abs(bedTime - state.window.bedMin) - tolerances.bed);
  const wakePenalty = deviationPenalty(Math.abs(wakeTime - state.window.wakeMin) - tolerances.wake);
  const shortfallPenalty = Math.min(Math.max(0, windowMin - duration) * 0.25, 40);
  const overslept = duration > windowMin + OVERSLEEP_GRACE_MIN && !tolerances.oversleepImmune;
  const score = clamp(
    100 - bedPenalty - wakePenalty - shortfallPenalty - (overslept ? OVERSLEEP_PENALTY : 0),
    0,
    100,
  );
  const spec = OUTCOMES.find((candidate) => score >= candidate.min) ?? OUTCOMES[3];
  const { outcome, hpDelta, xp, pixel } = spec;
  return { bedTime, wakeTime, score, outcome, hpDelta, xp, pixel };
}

export function applyNightResult(
  state: GameState,
  evaluation: NightEvaluation,
  date: string = todayDate(),
): GameState {
  const hp = clamp(state.hp + evaluation.hpDelta, 0, MAX_HP);
  const streak = evaluation.hpDelta < 0 ? 0 : state.perfectWeekStreak + 1;
  const leveledUp = streak >= PERFECT_WEEK_NIGHTS;
  const hero = state.hero
    ? {
        ...state.hero,
        level: state.hero.level + (leveledUp ? 1 : 0),
        xp: state.hero.xp + evaluation.xp,
      }
    : null;
  const record: NightRecord = {
    date,
    bedTime: evaluation.bedTime,
    wakeTime: evaluation.wakeTime,
    score: evaluation.score,
    outcome: evaluation.outcome,
    hpDelta: evaluation.hpDelta,
    pixel: evaluation.pixel,
  };
  return {
    ...state,
    hp,
    hero,
    perfectWeekStreak: leveledUp ? 0 : streak,
    nights: [...state.nights, record],
  };
}

const FAKE_NIGHTS: readonly [NightOutcome, number][] = [
  ['PERFECT', 100],
  ['GOOD', 71],
  ['PERFECT', 92],
  ['BAD', 55],
  ['PERFECT', 88],
  ['GOOD', 64],
  ['TERRIBLE', 31],
  ['GOOD', 78],
  ['PERFECT', 95],
  ['GOOD', 83],
];

/** Playable placeholder state: knight, 10 nights of history, one artifact. */
export function mockGameState(): GameState {
  return {
    window: { bedMin: 690, wakeMin: 1140 }, // 23:30 -> 07:00
    hero: { type: 'knight', name: 'Knight', level: 2, xp: 140 },
    hp: 6,
    perfectWeekStreak: 3,
    nights: fakeNights(),
    artifacts: ['iron_armor'],
    equipped: { armor: 'iron_armor', charm: null },
    lastResurrectionAt: null,
    onboardingDone: true,
    demoMode: false,
  };
}

function fakeNights(): NightRecord[] {
  return FAKE_NIGHTS.map(([outcome, score], index) => {
    const spec = OUTCOMES.find((candidate) => candidate.outcome === outcome) ?? OUTCOMES[3];
    return {
      date: `2026-07-${String(index + 12).padStart(2, '0')}`,
      bedTime: 690,
      wakeTime: 1140,
      score,
      outcome,
      hpDelta: spec.hpDelta,
      pixel: spec.pixel,
    };
  });
}

function missed(bedTime: number | null, wakeTime: number | null): NightEvaluation {
  return { bedTime, wakeTime, score: 0, outcome: 'MISSED', hpDelta: 0, xp: 0, pixel: 'BLACK' };
}

function deviationPenalty(minutesOverTolerance: number): number {
  return clamp(minutesOverTolerance, 0, MAX_DEVIATION_MIN) * 0.25;
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
