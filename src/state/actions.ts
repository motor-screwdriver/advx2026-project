/**
 * Store action helpers, kept apart from store.ts so both files stay under
 * the 250-line lint budget. Only called from store.ts.
 */
import type { GameEvent, GameEventType } from '../contracts/events';
import type { ArtifactId, ChestLoot, GameState, NightEvaluation, SleepWindow } from '../contracts/types';
import { rollChestLoot } from '../engine/chest';
import { assignHero, heroName } from '../engine/hero';
import {
  applyResurrection as applyResurrectionEngine,
  canResurrect as canResurrectEngine,
} from '../engine/resurrection';
import { isWithinMs, todayDate, WEEK_MS } from '../engine/time';
import { applyNightTurn, NightTurnResult } from '../engine/turn';
import type { GameStore } from './store';

export type GetState = () => GameStore;
export type SetState = (partial: Partial<GameStore>) => void;

export const freshHero = (window: SleepWindow) => {
  const type = assignHero(window);
  return { type, name: heroName(type), level: 1, xp: 0 };
};

const event = (type: GameEventType, now: Date, payload?: Record<string, unknown>): GameEvent => ({
  type,
  at: now.toISOString(),
  payload,
});

function pushEvents(events: GameEvent[], next: GameEvent[]): GameEvent[] {
  return [...events, ...next].slice(-100);
}

/** Soul Tether result: success revives at 3 HP and starts the 7-day cooldown. */
export function tryResurrect(get: GetState, set: SetState, success: boolean, now: Date): void {
  const { game, events } = get();
  if (!canResurrectEngine(game.lastResurrectionAt, now)) {
    return;
  }
  set({
    game: applyResurrectionEngine(game, success, now),
    events: success ? pushEvents(events, [event('RESURRECTED', now)]) : events,
  });
}

/** Window change: max 1 per 7 days; HP carries over, streak resets, new hero. */
export function tryChangeWindow(
  get: GetState,
  set: SetState,
  window: SleepWindow,
  now: Date,
): boolean {
  const s = get();
  if (isWithinMs(s.meta.windowChangedAt, now, WEEK_MS)) {
    return false;
  }
  set({
    game: { ...s.game, window, hero: freshHero(window), perfectWeekStreak: 0 },
    meta: { ...s.meta, windowChangedAt: now.toISOString() },
    events: pushEvents(s.events, [event('WINDOW_CHANGED', now)]),
  });
  return true;
}

function nightEvents(prev: GameState, result: NightTurnResult, now: Date): GameEvent[] {
  const events: GameEvent[] = [
    event('NIGHT_EVALUATED', now, { outcome: result.evaluation.outcome }),
  ];
  if (result.game.hp !== prev.hp) {
    events.push(event('HP_CHANGED', now, { hp: result.game.hp }));
  }
  if (result.leveledUp) {
    events.push(event('LEVEL_UP', now, { level: result.game.hero?.level }));
  }
  if (result.phoenixUsed) {
    events.push(event('RESURRECTED', now, { artifact: 'phoenix_feather' }));
  }
  if (result.died) {
    events.push(event('DEATH', now));
  }
  return events;
}

/** Evaluate the pending check-ins, apply the result and stamp weekly charges. */
export function runNightTurn(get: GetState, set: SetState, now: Date): NightEvaluation {
  const s = get();
  const result = applyNightTurn(s.game, {
    bedTime: s.pendingBedTime,
    wakeTime: s.pendingWakeTime,
    secondWindAvailable:
      s.game.artifacts.includes('second_wind') &&
      !isWithinMs(s.meta.secondWindUsedAt, now, WEEK_MS),
    date: todayDate(now),
  });
  const meta = { ...s.meta };
  if (result.secondWindUsed) {
    meta.secondWindUsedAt = now.toISOString();
  }
  set({
    game: result.game,
    meta,
    pendingBedTime: null,
    pendingWakeTime: null,
    lastEvaluation: result.evaluation,
    pendingChest: s.pendingChest || result.leveledUp,
    events: pushEvents(s.events, nightEvents(s.game, result, now)),
  });
  return result.evaluation;
}

/** Roll a granted chest (Lucky Coin guarantees Rare+), then consume both. */
export function openGrantedChest(get: GetState, set: SetState, rng: () => number): ChestLoot | null {
  const s = get();
  if (!s.pendingChest) {
    return null;
  }
  const loot = rollChestLoot(rng, s.game.artifacts.includes('lucky_coin'));
  const artifacts: ArtifactId[] = s.game.artifacts.filter((id) => id !== 'lucky_coin');
  if (loot.artifactId) {
    artifacts.push(loot.artifactId);
  }
  set({
    game: { ...s.game, artifacts },
    pendingChest: false,
    events: pushEvents(s.events, [event('CHEST_AWARDED', new Date(), { rarity: loot.rarity })]),
  });
  return loot;
}
