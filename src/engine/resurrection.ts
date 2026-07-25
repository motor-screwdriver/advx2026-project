/**
 * Death & resurrection (spec §3). Soul Tether success → 3 HP and the
 * 7-day cooldown restarts; failure → permanent death (hero = null).
 * Phoenix Feather bypasses both and is handled in turn.ts.
 *
 * Permanent death penalty (§4.4): ~50% of artifacts randomly lost,
 * equipped slots synced, perfectWeekStreak reset. Level resets when
 * startNewHero creates a fresh hero (level 1).
 */
import type { ArtifactId, GameState } from '../contracts/types'
import { WEEK_MS } from './time'

export const RESURRECT_HP = 3

/** Available only when more than 7 days passed since the last resurrection. */
export function canResurrect(lastResurrectionAt: string | null, now: Date = new Date()): boolean {
  if (!lastResurrectionAt) {
    return true
  }
  return now.getTime() - new Date(lastResurrectionAt).getTime() > WEEK_MS
}

export function applyResurrection(
  state: GameState,
  success: boolean,
  now: Date = new Date(),
): GameState {
  if (success) {
    return { ...state, hp: RESURRECT_HP, lastResurrectionAt: now.toISOString() }
  }
  return { ...state, hero: null }
}

/**
 * Permanent death penalty: randomly remove ~50% of artifacts (min 1 if
 * inventory is non-empty). Equipped slots are cleared if their artifact
 * was lost. Cosmetics are kept. perfectWeekStreak is reset.
 * RNG is injectable for deterministic tests.
 */
export function applyDeathPenalty(state: GameState, rng: () => number = Math.random): GameState {
  const remaining = stripArtifacts(state.artifacts, rng)
  const equipped = {
    armor: remaining.indexOf(state.equipped.armor as ArtifactId) >= 0 ? state.equipped.armor : null,
    utilities:
      remaining.indexOf(state.equipped.utilities as ArtifactId) >= 0
        ? state.equipped.utilities
        : null,
    charm: state.equipped.charm, // cosmetics persist through death
  }
  return { ...state, artifacts: remaining, equipped, perfectWeekStreak: 0 }
}

/** Remove ~50% of artifacts (min 1). Uses Fisher-Yates for stable RNG. */
function stripArtifacts(artifacts: ArtifactId[], rng: () => number): ArtifactId[] {
  if (artifacts.length === 0) return []
  const removeCount = Math.max(1, Math.round(artifacts.length * 0.5))
  const shuffled = fisherYates([...artifacts], rng)
  return shuffled.slice(removeCount)
}

function fisherYates<T>(arr: T[], rng: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
