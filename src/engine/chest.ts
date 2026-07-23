/**
 * Chest loot table (spec §4.2). Deterministic via injectable RNG.
 * Common 70% cosmetic · Rare 25% artifact · Epic 5% golden skin.
 * Lucky Coin guarantees Rare+ on the next chest.
 */
import type { ArtifactId, ChestLoot } from '../contracts/types';

export const ARTIFACT_POOL: ArtifactId[] = [
  'iron_armor',
  'phoenix_feather',
  'hourglass',
  'coffee_amulet',
  'alarm_bell',
  'warm_blanket',
  'night_watch',
  'lucky_coin',
  'star_map',
  'second_wind',
];

const COMMON_COSMETICS = [
  'cosmetic_ember',
  'cosmetic_hat',
  'cosmetic_aura',
  'cosmetic_pet',
  'cosmetic_frame',
];
const EPIC_COSMETICS = ['cosmetic_gold'];

const BASE_COMMON = 0.7;
const BASE_RARE = 0.25;
const BASE_EPIC = 0.05;

/** rng() must return [0, 1); called 1–2 times per chest (rarity, then item). */
export function rollChestLoot(rng: () => number, guaranteedRarePlus = false): ChestLoot {
  if (guaranteedRarePlus) {
    return rng() < BASE_RARE / (BASE_RARE + BASE_EPIC) ? rareLoot(rng) : epicLoot(rng);
  }
  const roll = rng();
  if (roll < BASE_COMMON) {
    return commonLoot(rng);
  }
  return roll < BASE_COMMON + BASE_RARE ? rareLoot(rng) : epicLoot(rng);
}

function commonLoot(rng: () => number): ChestLoot {
  return { rarity: 'common', artifactId: null, cosmeticId: pick(rng, COMMON_COSMETICS) };
}

function rareLoot(rng: () => number): ChestLoot {
  return { rarity: 'rare', artifactId: pick(rng, ARTIFACT_POOL), cosmeticId: null };
}

function epicLoot(rng: () => number): ChestLoot {
  return { rarity: 'epic', artifactId: null, cosmeticId: pick(rng, EPIC_COSMETICS) };
}

function pick<T>(rng: () => number, pool: T[]): T {
  return pool[Math.min(Math.floor(rng() * pool.length), pool.length - 1)];
}
