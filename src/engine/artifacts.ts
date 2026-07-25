/**
 * Artifact registry (spec §4.3).
 *
 * Taxonomy:
 * ARMOR (slot=armor): iron_armor
 * UTILITIES equippable (slot=utilities): warm_blanket, night_watch, second_wind, coffee_amulet, alarm_bell
 * UTILITIES consumable (slot=null, section=utilities): hourglass, lucky_coin, phoenix_feather
 * CHARM: cosmetics — tracked separately via CosmeticId, not in this registry.
 */
import type { ArtifactId, GameState, NightRecord } from '../contracts/types'
import { MAX_HP, PERFECT_WEEK_NIGHTS } from './levels'
import { clamp } from './night'

export type ArtifactKind = 'consumable' | 'equipment'

/** Which equip slot this artifact can be placed in (null = not equippable). */
export type ArtifactSlot = 'armor' | 'utilities' | null

/** Which bag section an artifact appears in. */
export type ArtifactSection = 'armor' | 'utilities'

export interface ArtifactDef {
  id: ArtifactId
  name: string
  kind: ArtifactKind
  slot: ArtifactSlot
  section: ArtifactSection
  implemented: boolean
}

export const ARTIFACTS: Record<ArtifactId, ArtifactDef> = {
  iron_armor: {
    id: 'iron_armor',
    name: 'Iron Armor',
    kind: 'equipment',
    slot: 'armor',
    section: 'armor',
    implemented: true,
  },
  phoenix_feather: {
    id: 'phoenix_feather',
    name: 'Phoenix Feather',
    kind: 'consumable',
    slot: null,
    section: 'utilities',
    implemented: true,
  },
  hourglass: {
    id: 'hourglass',
    name: 'Hourglass',
    kind: 'consumable',
    slot: null,
    section: 'utilities',
    implemented: true,
  },
  lucky_coin: {
    id: 'lucky_coin',
    name: 'Lucky Coin',
    kind: 'consumable',
    slot: null,
    section: 'utilities',
    implemented: true,
  },
  second_wind: {
    id: 'second_wind',
    name: 'Second Wind',
    kind: 'equipment',
    slot: 'utilities',
    section: 'utilities',
    implemented: true,
  },
  coffee_amulet: {
    id: 'coffee_amulet',
    name: 'Coffee Amulet',
    kind: 'equipment',
    slot: 'utilities',
    section: 'utilities',
    implemented: true,
  },
  alarm_bell: {
    id: 'alarm_bell',
    name: 'Alarm Bell',
    kind: 'equipment',
    slot: 'utilities',
    section: 'utilities',
    implemented: true,
  },
  warm_blanket: {
    id: 'warm_blanket',
    name: 'Warm Blanket',
    kind: 'equipment',
    slot: 'utilities',
    section: 'utilities',
    implemented: true,
  },
  night_watch: {
    id: 'night_watch',
    name: 'Night Watch',
    kind: 'equipment',
    slot: 'utilities',
    section: 'utilities',
    implemented: true,
  },
}

/** Whether an artifact can be placed in the given slot. */
export function canEquipInSlot(id: ArtifactId, slot: 'armor' | 'utilities'): boolean {
  return ARTIFACTS[id]?.slot === slot
}

/** Remove a single instance of an artifact (consumables can stack). */
export function consumeArtifact(artifacts: ArtifactId[], id: ArtifactId): ArtifactId[] {
  const index = artifacts.indexOf(id)
  return index < 0 ? artifacts : [...artifacts.slice(0, index), ...artifacts.slice(index + 1)]
}

/**
 * Hourglass: turn one past night (≤ 24 h old) into GOOD. The HP lost that
 * night is refunded (capped), the streak is rebuilt from the tail of the
 * history, and the Hourglass is consumed. Returns null when not applicable.
 */
export function applyHourglass(
  state: GameState,
  date: string,
  now: Date = new Date(),
): GameState | null {
  if (!state.artifacts.includes('hourglass')) {
    return null
  }
  const index = state.nights.findIndex((night) => night.date === date)
  const night = state.nights[index]
  if (!night || night.outcome === 'GOOD' || night.outcome === 'PERFECT' || !isRecent(date, now)) {
    return null
  }
  const upgraded: NightRecord = {
    ...night,
    outcome: 'GOOD',
    score: Math.max(night.score, 60),
    hpDelta: 0,
    pixel: 'GRAY',
  }
  const nights = [...state.nights]
  nights[index] = upgraded
  return {
    ...state,
    hp: clamp(state.hp - night.hpDelta, 0, MAX_HP),
    nights,
    perfectWeekStreak: tailStreak(nights),
    artifacts: consumeArtifact(state.artifacts, 'hourglass'),
  }
}

function isRecent(date: string, now: Date): boolean {
  const earliest = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  return date >= earliest
}

/** Consecutive nights without HP loss at the tail, capped below a level-up:
 *  retroactive level-ups are not re-granted. */
function tailStreak(nights: NightRecord[]): number {
  let streak = 0
  for (let i = nights.length - 1; i >= 0; i -= 1) {
    if (nights[i].hpDelta < 0 || nights[i].outcome === 'MISSED') {
      break
    }
    streak += 1
  }
  return Math.min(streak, PERFECT_WEEK_NIGHTS - 1)
}
