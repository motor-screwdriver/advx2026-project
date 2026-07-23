import type { GameState, NightRecord } from '../../contracts/types';

export const WINDOW = { bedMin: 690, wakeMin: 1140 }; // 23:30 → 07:00, D = 450

export function makeGame(overrides: Partial<GameState> = {}): GameState {
  return {
    window: WINDOW,
    hero: { type: 'knight', name: 'Knight', level: 1, xp: 0 },
    hp: 7,
    perfectWeekStreak: 0,
    nights: [],
    artifacts: [],
    equipped: { armor: null, charm: null },
    lastResurrectionAt: null,
    onboardingDone: true,
    demoMode: false,
    ...overrides,
  };
}

export function makeNight(overrides: Partial<NightRecord> = {}): NightRecord {
  return {
    date: '2026-07-21',
    bedTime: 690,
    wakeTime: 1140,
    score: 100,
    outcome: 'PERFECT',
    hpDelta: 1,
    pixel: 'GOLD',
    ...overrides,
  };
}

/** Options for a plain turn with no weekly charges involved. */
export const TURN = { secondWindAvailable: false, date: '2026-07-22' };
