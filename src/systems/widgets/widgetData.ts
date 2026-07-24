/**
 * Data shaping for the Android home-screen widgets. The widget renderer runs
 * in a headless JS context (no React tree, no GameProvider), so it re-reads
 * the persisted zustand snapshot from AsyncStorage; the app process passes
 * live state through the same builder. Native-free and pure, so jest can
 * import it without the widget native module.
 */
import AsyncStorage from '@react-native-async-storage/async-storage'

import type { GameState, HeroType, NightRecord } from '../../contracts/types'
import { MAX_HP } from '../../engine/levels'

export interface HomeWidgetData {
  /** Onboarding done and a hero summoned — drives the empty state. */
  onboarded: boolean
  heroType: HeroType | null
  level: number
  /** Consecutive recent nights without HP loss (MISSED neither counts nor breaks). */
  sleepStreak: number
  hp: number
  maxHp: number
  /** True while the hero is tucked in (bed check-in pending). */
  asleep: boolean
  /** Perfect-week streak capped — hero wears the gold skin. */
  gold: boolean
}

const STORAGE_KEY = '8bit-sleep/game'

export function computeSleepStreak(nights: NightRecord[]): number {
  let streak = 0
  for (let i = nights.length - 1; i >= 0; i--) {
    const night = nights[i]
    if (night.hpDelta < 0) {
      break
    }
    if (night.outcome !== 'MISSED') {
      streak++
    }
  }
  return streak
}

export function buildWidgetData(game: GameState, pendingBedTime: number | null): HomeWidgetData {
  return {
    onboarded: game.onboardingDone && game.hero !== null,
    heroType: game.hero?.type ?? null,
    level: game.hero?.level ?? 0,
    sleepStreak: computeSleepStreak(game.nights),
    hp: game.hp,
    maxHp: MAX_HP,
    asleep: pendingBedTime !== null,
    gold: game.perfectWeekStreak >= MAX_HP,
  }
}

function emptyGameState(): GameState {
  return {
    window: null,
    hero: null,
    hp: MAX_HP,
    perfectWeekStreak: 0,
    nights: [],
    artifacts: [],
    equipped: { armor: null, charm: null },
    lastResurrectionAt: null,
    onboardingDone: false,
    demoMode: false,
  }
}

interface PersistedSnapshot {
  state?: { game?: GameState; pendingBedTime?: number | null }
}

/** Headless entry: rebuild widget data from the persisted store snapshot. */
export async function readWidgetData(): Promise<HomeWidgetData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    const snapshot = (raw ? JSON.parse(raw) : null) as PersistedSnapshot | null
    return buildWidgetData(
      snapshot?.state?.game ?? emptyGameState(),
      snapshot?.state?.pendingBedTime ?? null,
    )
  } catch (error) {
    console.log('[widgets] failed to read persisted state (silent):', error)
    return buildWidgetData(emptyGameState(), null)
  }
}
