/**
 * Full night turn: scoring + modifiers + streak/level + consumables.
 * Pure orchestration over night.ts / levels.ts — the store stays thin.
 */
import type { GameState, NightEvaluation, NightRecord } from '../contracts/types'
import { consumeArtifact } from './artifacts'
import { applyNightOutcome, updateStreak } from './levels'
import { evaluateNight, missedEvaluation, type ScoringModifiers } from './night'

export interface NightTurnOptions {
  bedTime: number | null
  wakeTime: number | null
  secondWindAvailable: boolean // Second Wind artifact weekly charge ready
  nightWatchAvailable: boolean // Night Watch equipped + weekly charge ready
  date: string // YYYY-MM-DD stamp for the NightRecord
}

export interface NightTurnResult {
  game: GameState
  evaluation: NightEvaluation // hpDelta is the final applied delta
  leveledUp: boolean
  died: boolean
  ironArmorConsumed: boolean
  secondWindUsed: boolean
  nightWatchUsed: boolean
}

export function applyNightTurn(state: GameState, options: NightTurnOptions): NightTurnResult {
  const window = state.window
  const isMissed = options.bedTime === null && options.wakeTime === null
  const nightWatchUsed = isMissed && options.nightWatchAvailable

  const raw = scoreNight(state, options, nightWatchUsed)
  const applied = applyNightOutcome(raw, {
    artifacts: state.artifacts,
    hp: state.hp,
    graceNight: state.nights.length === 0,
    secondWindAvailable: options.secondWindAvailable,
    ironArmorEquipped: state.equipped.armor === 'iron_armor',
  })
  const streak = updateStreak(state.perfectWeekStreak, applied.hpDelta, raw.outcome)
  let artifacts = applied.ironArmorConsumed
    ? consumeArtifact(state.artifacts, 'iron_armor')
    : state.artifacts
  const game: GameState = {
    ...state,
    hp: applied.hp,
    hero: state.hero
      ? {
          ...state.hero,
          level: state.hero.level + (streak.leveledUp ? 1 : 0),
          xp: state.hero.xp + applied.xp,
        }
      : null,
    perfectWeekStreak: streak.streak,
    nights: [...state.nights, buildRecord(options, raw, applied.hpDelta, nightWatchUsed, window)],
    artifacts,
    equipped: unequipConsumed(state, applied.ironArmorConsumed),
  }
  return {
    game,
    evaluation: { ...raw, hpDelta: applied.hpDelta },
    leveledUp: streak.leveledUp,
    died: applied.died,
    ironArmorConsumed: applied.ironArmorConsumed,
    secondWindUsed: applied.secondWindUsed,
    nightWatchUsed,
  }
}

function scoreNight(
  state: GameState,
  options: NightTurnOptions,
  nightWatchUsed: boolean,
): NightEvaluation {
  const window = state.window
  if (nightWatchUsed) {
    return goodFillEvaluation(window ? window.bedMin : 690, window ? window.wakeMin : 1140)
  }
  const modifiers = deriveScoringModifiers(state)
  return window
    ? evaluateNight(window, options.bedTime, options.wakeTime, modifiers)
    : missedEvaluation(options.bedTime, options.wakeTime)
}

function buildRecord(
  options: NightTurnOptions,
  raw: NightEvaluation,
  hpDelta: number,
  nightWatchUsed: boolean,
  window: GameState['window'],
): NightRecord {
  return {
    date: options.date,
    bedTime: nightWatchUsed ? (window ? window.bedMin : null) : options.bedTime,
    wakeTime: nightWatchUsed ? (window ? window.wakeMin : null) : options.wakeTime,
    score: raw.score,
    outcome: raw.outcome,
    hpDelta,
    pixel: raw.pixel,
  }
}

/** Derive scoring modifiers from equipped / inventory artifacts. */
function deriveScoringModifiers(state: GameState): ScoringModifiers {
  const mods: ScoringModifiers = {}
  if (state.equipped.utilities === 'warm_blanket') {
    mods.skipOversleepPenalty = true
  }
  if (state.equipped.utilities === 'coffee_amulet') {
    mods.bedTolerance = 30
  }
  if (state.equipped.utilities === 'alarm_bell') {
    mods.wakeTolerance = 30
  }
  return mods
}

/** Synthetic GOOD evaluation for night_watch auto-fill. */
function goodFillEvaluation(bedTime: number, wakeTime: number): NightEvaluation {
  return { bedTime, wakeTime, score: 60, outcome: 'GOOD', hpDelta: 0, xp: 60, pixel: 'GRAY' }
}

function unequipConsumed(state: GameState, ironArmorConsumed: boolean): GameState['equipped'] {
  const equipped = { ...state.equipped }
  if (ironArmorConsumed && equipped.armor === 'iron_armor') {
    equipped.armor = null
  }
  return equipped
}
