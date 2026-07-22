/**
 * Frozen contract types (M0). Change only after a full-team huddle.
 *
 * Time convention — "night line": minutes from noon, 12:00 → 36:00.
 * Examples: 21:00 = 540, 23:30 = 690, 00:00 = 720, 07:00 next day = 1140.
 * A sleep window therefore always satisfies bedMin < wakeMin within 0..1440.
 */

export type HeroType =
  'monk' | 'ranger' | 'druid' | 'rogue' | 'knight' | 'paladin' | 'ninja' | 'mage' | 'warlock';

export type NightOutcome = 'PERFECT' | 'GOOD' | 'BAD' | 'TERRIBLE' | 'MISSED';

export type PixelColor = 'GOLD' | 'GRAY' | 'BLACK';

export type ArtifactId =
  | 'iron_armor'
  | 'phoenix_feather'
  | 'hourglass'
  | 'coffee_amulet'
  | 'alarm_bell'
  | 'warm_blanket'
  | 'night_watch'
  | 'lucky_coin'
  | 'star_map'
  | 'second_wind';

export interface SleepWindow {
  bedMin: number;
  wakeMin: number;
} // minutes on a 12:00→36:00 "night line"

export interface Hero {
  type: HeroType;
  name: string;
  level: number;
  xp: number;
}

export interface NightRecord {
  date: string; // YYYY-MM-DD
  bedTime: number | null;
  wakeTime: number | null;
  score: number;
  outcome: NightOutcome;
  hpDelta: number;
  pixel: PixelColor;
}

export interface GameState {
  window: SleepWindow | null;
  hero: Hero | null;
  hp: number; // 0..7
  perfectWeekStreak: number; // nights without HP loss
  nights: NightRecord[];
  artifacts: ArtifactId[];
  equipped: { armor: ArtifactId | null; charm: ArtifactId | null };
  lastResurrectionAt: string | null;
  onboardingDone: boolean;
  demoMode: boolean;
}

// ---- Derived types (additive, do not rename the frozen ones above) ----

/** Result of evaluating one night. Echoes the check-in inputs so the
 *  result can be appended to GameState.nights without extra params. */
export interface NightEvaluation {
  bedTime: number | null;
  wakeTime: number | null;
  score: number; // 0..100
  outcome: NightOutcome;
  hpDelta: number; // +1 | 0 | -1 | -2
  xp: number;
  pixel: PixelColor;
}

export type ChestRarity = 'common' | 'rare' | 'epic';

export interface ChestLoot {
  rarity: ChestRarity;
  artifactId: ArtifactId | null; // set when rarity === 'rare'
  cosmeticId: string | null; // set for common/epic cosmetics
}
