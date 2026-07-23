/**
 * Full night turn: scoring + modifiers + streak/level + consumables.
 * Pure orchestration over night.ts / levels.ts — the store stays thin.
 */
import type { GameState, NightEvaluation, NightRecord } from '../contracts/types';
import { consumeArtifact } from './artifacts';
import { applyNightOutcome, updateStreak } from './levels';
import { evaluateNight, missedEvaluation } from './night';
import { RESURRECT_HP } from './resurrection';

export interface NightTurnOptions {
  bedTime: number | null;
  wakeTime: number | null;
  secondWindAvailable: boolean; // Second Wind artifact weekly charge ready
  date: string; // YYYY-MM-DD stamp for the NightRecord
}

export interface NightTurnResult {
  game: GameState;
  evaluation: NightEvaluation; // hpDelta is the final applied delta
  leveledUp: boolean;
  died: boolean; // false when the Phoenix Feather saved the hero
  ironArmorConsumed: boolean;
  secondWindUsed: boolean;
  phoenixUsed: boolean;
}

export function applyNightTurn(state: GameState, options: NightTurnOptions): NightTurnResult {
  const window = state.window;
  const raw = window
    ? evaluateNight(window, options.bedTime, options.wakeTime)
    : missedEvaluation(options.bedTime, options.wakeTime);
  const applied = applyNightOutcome(raw, {
    artifacts: state.artifacts,
    hp: state.hp,
    graceNight: state.nights.length === 0,
    secondWindAvailable: options.secondWindAvailable,
  });
  const streak = updateStreak(state.perfectWeekStreak, applied.hpDelta, raw.outcome);
  let artifacts = applied.ironArmorConsumed
    ? consumeArtifact(state.artifacts, 'iron_armor')
    : state.artifacts;
  const phoenixUsed = applied.died && artifacts.includes('phoenix_feather');
  if (phoenixUsed) {
    artifacts = consumeArtifact(artifacts, 'phoenix_feather');
  }
  const equipped = unequipConsumed(state, applied.ironArmorConsumed, phoenixUsed);
  const record: NightRecord = {
    date: options.date,
    bedTime: options.bedTime,
    wakeTime: options.wakeTime,
    score: raw.score,
    outcome: raw.outcome,
    hpDelta: applied.hpDelta,
    pixel: raw.pixel,
  };
  const game: GameState = {
    ...state,
    hp: phoenixUsed ? RESURRECT_HP : applied.hp,
    hero: state.hero
      ? {
          ...state.hero,
          level: state.hero.level + (streak.leveledUp ? 1 : 0),
          xp: state.hero.xp + applied.xp,
        }
      : null,
    perfectWeekStreak: streak.streak,
    nights: [...state.nights, record],
    artifacts,
    equipped,
  };
  return {
    game,
    evaluation: { ...raw, hpDelta: applied.hpDelta },
    leveledUp: streak.leveledUp,
    died: applied.died && !phoenixUsed,
    ironArmorConsumed: applied.ironArmorConsumed,
    secondWindUsed: applied.secondWindUsed,
    phoenixUsed,
  };
}

function unequipConsumed(
  state: GameState,
  ironArmorConsumed: boolean,
  phoenixUsed: boolean,
): GameState['equipped'] {
  const equipped = { ...state.equipped };
  if (ironArmorConsumed && equipped.armor === 'iron_armor') {
    equipped.armor = null;
  }
  if (phoenixUsed) {
    if (equipped.armor === 'phoenix_feather') {
      equipped.armor = null;
    }
    if (equipped.charm === 'phoenix_feather') {
      equipped.charm = null;
    }
  }
  return equipped;
}
