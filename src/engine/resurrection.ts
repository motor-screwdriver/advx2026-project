/**
 * Death & resurrection (spec §3). Soul Tether success → 3 HP and the
 * 7-day cooldown restarts; failure → permanent death (hero = null).
 * Phoenix Feather bypasses both and is handled in turn.ts.
 */
import type { GameState } from '../contracts/types';
import { WEEK_MS } from './time';

export const RESURRECT_HP = 3;

/** Available only when more than 7 days passed since the last resurrection. */
export function canResurrect(lastResurrectionAt: string | null, now: Date = new Date()): boolean {
  if (!lastResurrectionAt) {
    return true;
  }
  return now.getTime() - new Date(lastResurrectionAt).getTime() > WEEK_MS;
}

export function applyResurrection(
  state: GameState,
  success: boolean,
  now: Date = new Date(),
): GameState {
  if (success) {
    return { ...state, hp: RESURRECT_HP, lastResurrectionAt: now.toISOString() };
  }
  return { ...state, hero: null };
}
