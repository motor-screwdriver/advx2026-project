/**
 * Store action helpers, kept apart from store.ts so both files stay under
 * the 250-line lint budget. Only called from store.ts.
 */
import type { GameEvent, GameEventType } from '../contracts/events'
import type {
  ArtifactId,
  ChestLoot,
  CosmeticId,
  GameState,
  NightEvaluation,
  SleepWindow,
} from '../contracts/types'
import { applyHourglass, consumeArtifact } from '../engine/artifacts'
import { rollChestLoot } from '../engine/chest'
import { assignHero, heroName } from '../engine/hero'
import { MAX_HP } from '../engine/levels'
import { missedEvaluation } from '../engine/night'
import {
  applyDeathPenalty,
  applyResurrection as applyResurrectionEngine,
} from '../engine/resurrection'
import { isWithinMs, todayDate, WEEK_MS } from '../engine/time'
import { applyNightTurn, NightTurnResult } from '../engine/turn'
import type { GameStore } from './store'

export type GetState = () => GameStore
export type SetState = (partial: Partial<GameStore>) => void

export const freshHero = (window: SleepWindow) => {
  const type = assignHero(window)
  return { type, name: heroName(type), level: 1, xp: 0 }
}

/** Start a new hero after permanent death: apply death penalty (partial loot loss),
 *  then assign a fresh hero. Surviving artifacts carry over. */
export function startNewHeroWithPenalty(game: GameState): GameState {
  if (!game.window) {
    return {
      ...game,
      hero: null,
      hp: MAX_HP,
      perfectWeekStreak: 0,
      artifacts: [],
      equipped: { armor: null, utilities: null, charm: null },
    }
  }
  // Apply death penalty: lose ~50% of artifacts
  const penalized = applyDeathPenalty(game)
  return {
    ...penalized,
    hero: freshHero(game.window),
    hp: MAX_HP,
    perfectWeekStreak: 0,
  }
}

const event = (type: GameEventType, now: Date, payload?: Record<string, unknown>): GameEvent => ({
  type,
  at: now.toISOString(),
  payload,
})

function pushEvents(events: GameEvent[], next: GameEvent[]): GameEvent[] {
  return [...events, ...next].slice(-100)
}

/**
 * Soul Tether result: success revives at 3 HP, failure is permanent death.
 * Entry is never blocked — the death screen always offers the tether; the
 * lastResurrectionAt stamp is kept for stats only.
 */
export function tryResurrect(get: GetState, set: SetState, success: boolean, now: Date): void {
  const { game, events } = get()
  set({
    game: applyResurrectionEngine(game, success, now),
    events: success ? pushEvents(events, [event('RESURRECTED', now)]) : events,
  })
}

/** Window change: max 1 per 7 days; HP carries over, streak resets, new hero. */
export function tryChangeWindow(
  get: GetState,
  set: SetState,
  window: SleepWindow,
  now: Date,
): boolean {
  const s = get()
  if (isWithinMs(s.meta.windowChangedAt, now, WEEK_MS)) {
    return false
  }
  set({
    game: { ...s.game, window, hero: freshHero(window), perfectWeekStreak: 0 },
    meta: { ...s.meta, windowChangedAt: now.toISOString() },
    events: pushEvents(s.events, [event('WINDOW_CHANGED', now)]),
  })
  return true
}

function nightEvents(prev: GameState, result: NightTurnResult, now: Date): GameEvent[] {
  const events: GameEvent[] = [
    event('NIGHT_EVALUATED', now, { outcome: result.evaluation.outcome }),
  ]
  if (result.game.hp !== prev.hp) {
    events.push(event('HP_CHANGED', now, { hp: result.game.hp }))
  }
  if (result.leveledUp) {
    events.push(event('LEVEL_UP', now, { level: result.game.hero?.level }))
  }
  if (result.died) {
    events.push(event('DEATH', now))
  }
  return events
}

/** Evaluate the pending check-ins, apply the result and stamp weekly charges. */
export function runNightTurn(get: GetState, set: SetState, now: Date): NightEvaluation {
  const s = get()
  if (s.pendingBedTime === null && s.pendingWakeTime === null) {
    return missedEvaluation(null, null) // nothing pending — re-entrant tap, not a night
  }
  const nightWatchEquipped = s.game.equipped.utilities === 'night_watch'
  const result = applyNightTurn(s.game, {
    bedTime: s.pendingBedTime,
    wakeTime: s.pendingWakeTime,
    secondWindAvailable:
      s.game.equipped.utilities === 'second_wind' &&
      !isWithinMs(s.meta.secondWindUsedAt, now, WEEK_MS),
    nightWatchAvailable: nightWatchEquipped && !isWithinMs(s.meta.nightWatchUsedAt, now, WEEK_MS),
    date: todayDate(now),
  })
  const meta = { ...s.meta }
  if (result.secondWindUsed) {
    meta.secondWindUsedAt = now.toISOString()
  }
  if (result.nightWatchUsed) {
    meta.nightWatchUsedAt = now.toISOString()
  }
  set({
    game: result.game,
    meta,
    pendingBedTime: null,
    pendingWakeTime: null,
    lastEvaluation: result.evaluation,
    pendingChest: s.pendingChest || result.leveledUp,
    events: pushEvents(s.events, nightEvents(s.game, result, now)),
  })
  return result.evaluation
}

/** Hourglass artifact: rewrite one recorded night (see engine/artifacts). */
export function tryUseHourglass(get: GetState, set: SetState, date: string, now: Date): boolean {
  const next = applyHourglass(get().game, date, now)
  if (!next) {
    return false
  }
  set({ game: next })
  return true
}

/** Roll a granted chest (Lucky Coin guarantees Rare+), then consume both. */
export function openGrantedChest(
  get: GetState,
  set: SetState,
  rng: () => number,
): ChestLoot | null {
  const s = get()
  if (!s.pendingChest) {
    return null
  }
  const loot = rollChestLoot(rng, s.game.artifacts.indexOf('lucky_coin') >= 0)
  const artifacts: ArtifactId[] = s.game.artifacts.filter((id) => id !== 'lucky_coin')
  if (loot.artifactId) {
    artifacts.push(loot.artifactId)
  }
  let cosmetics = s.game.cosmetics ?? []
  if (loot.cosmeticId && cosmetics.indexOf(loot.cosmeticId as CosmeticId) < 0) {
    cosmetics = [...cosmetics, loot.cosmeticId as CosmeticId]
  }
  set({
    game: { ...s.game, artifacts, cosmetics },
    pendingChest: false,
    events: pushEvents(s.events, [event('CHEST_AWARDED', new Date(), { rarity: loot.rarity })]),
  })
  return loot
}

/** Phoenix Feather: manual use on death screen. Consumes feather, revives at 3 HP. */
export function usePhoenixFeather(get: GetState, set: SetState): boolean {
  const s = get()
  if (s.game.hp !== 0 || s.game.artifacts.indexOf('phoenix_feather') < 0) {
    return false
  }
  const artifacts = consumeArtifact(s.game.artifacts, 'phoenix_feather')
  const equipped = { ...s.game.equipped }
  if (equipped.utilities === ('phoenix_feather' as ArtifactId)) {
    equipped.utilities = null
  }
  set({
    game: { ...s.game, hp: 3, artifacts, equipped },
    events: pushEvents(s.events, [
      event('RESURRECTED', new Date(), { artifact: 'phoenix_feather' }),
    ]),
  })
  return true
}
