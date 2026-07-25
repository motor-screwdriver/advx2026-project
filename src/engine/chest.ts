/**
 * Chest loot table (spec §4.2). Deterministic via injectable RNG.
 * Common 70% cosmetic · Rare 25% artifact · Epic 5% golden skin.
 * Lucky Coin guarantees Rare+ on the next chest.
 *
 * Weighted artifact drop table (inside Rare):
 * | Artifact        | Weight | Rationale                        |
 * |-----------------|--------|----------------------------------|
 * | warm_blanket    |   22   | Narrow oversleep-only effect     |
 * | coffee_amulet   |   17   | Timed bed tolerance convenience  |
 * | alarm_bell      |   17   | Timed wake tolerance convenience |
 * | night_watch     |   14   | Saves one missed night / week    |
 * | hourglass       |   14   | Retro-fix one bad night          |
 * | second_wind     |    8   | Softens TERRIBLE once / week     |
 * | lucky_coin      |    5   | Meta-loot (guarantees next Rare) |
 * | iron_armor      |    2   | Strong full-HP-loss absorb       |
 * | phoenix_feather |    1   | Strongest: full auto-revive      |
 */
import type { ArtifactId, ChestLoot } from '../contracts/types'

export const ARTIFACT_POOL: ArtifactId[] = [
  'iron_armor',
  'phoenix_feather',
  'hourglass',
  'coffee_amulet',
  'alarm_bell',
  'warm_blanket',
  'night_watch',
  'lucky_coin',
  'second_wind',
]

/** Weighted drop table: [artifactId, weight]. Higher = more common. */
export const ARTIFACT_WEIGHTS: [ArtifactId, number][] = [
  ['warm_blanket', 22],
  ['coffee_amulet', 17],
  ['alarm_bell', 17],
  ['night_watch', 14],
  ['hourglass', 14],
  ['second_wind', 8],
  ['lucky_coin', 5],
  ['iron_armor', 2],
  ['phoenix_feather', 1],
]

const WEIGHT_TOTAL = ARTIFACT_WEIGHTS.reduce((s, [, w]) => s + w, 0)

const COMMON_COSMETICS = [
  'cosmetic_ember',
  'cosmetic_hat',
  'cosmetic_aura',
  'cosmetic_pet',
  'cosmetic_frame',
]
const EPIC_COSMETICS = ['cosmetic_gold']

const BASE_COMMON = 0.7
const BASE_RARE = 0.25
const BASE_EPIC = 0.05

/** rng() must return [0, 1); called 1–2 times per chest (rarity, then item). */
export function rollChestLoot(rng: () => number, guaranteedRarePlus = false): ChestLoot {
  if (guaranteedRarePlus) {
    return rng() < BASE_RARE / (BASE_RARE + BASE_EPIC) ? rareLoot(rng) : epicLoot(rng)
  }
  const roll = rng()
  if (roll < BASE_COMMON) {
    return commonLoot(rng)
  }
  return roll < BASE_COMMON + BASE_RARE ? rareLoot(rng) : epicLoot(rng)
}

function commonLoot(rng: () => number): ChestLoot {
  return { rarity: 'common', artifactId: null, cosmeticId: pick(rng, COMMON_COSMETICS) }
}

function rareLoot(rng: () => number): ChestLoot {
  return { rarity: 'rare', artifactId: weightedPick(rng), cosmeticId: null }
}

function epicLoot(rng: () => number): ChestLoot {
  return { rarity: 'epic', artifactId: null, cosmeticId: pick(rng, EPIC_COSMETICS) }
}

function pick<T>(rng: () => number, pool: T[]): T {
  return pool[Math.min(Math.floor(rng() * pool.length), pool.length - 1)]
}

/** Weighted random selection from ARTIFACT_WEIGHTS. */
function weightedPick(rng: () => number): ArtifactId {
  let roll = rng() * WEIGHT_TOTAL
  for (const [id, weight] of ARTIFACT_WEIGHTS) {
    roll -= weight
    if (roll <= 0) return id
  }
  return ARTIFACT_WEIGHTS[ARTIFACT_WEIGHTS.length - 1][0]
}
