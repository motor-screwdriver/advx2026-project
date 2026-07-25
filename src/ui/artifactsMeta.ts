/**
 * UI-safe artifact & cosmetic metadata. Screens import this instead of src/engine/artifacts.
 * The data is a plain copy — no engine dependencies leak into UI layer.
 */
import type { ArtifactId, CosmeticId } from '../contracts/types'

export type ArtifactKind = 'consumable' | 'equipment'
export type ArtifactSlot = 'armor' | 'utilities' | null
export type ArtifactSection = 'armor' | 'utilities'

export interface ArtifactMeta {
  id: ArtifactId
  name: string
  kind: ArtifactKind
  slot: ArtifactSlot
  section: ArtifactSection
}

/** Static metadata for every known artifact. */
export const ARTIFACT_META: Record<ArtifactId, ArtifactMeta> = {
  iron_armor: {
    id: 'iron_armor',
    name: 'Iron Armor',
    kind: 'equipment',
    slot: 'armor',
    section: 'armor',
  },
  phoenix_feather: {
    id: 'phoenix_feather',
    name: 'Phoenix Feather',
    kind: 'consumable',
    slot: null,
    section: 'utilities',
  },
  hourglass: {
    id: 'hourglass',
    name: 'Hourglass',
    kind: 'consumable',
    slot: null,
    section: 'utilities',
  },
  lucky_coin: {
    id: 'lucky_coin',
    name: 'Lucky Coin',
    kind: 'consumable',
    slot: null,
    section: 'utilities',
  },
  second_wind: {
    id: 'second_wind',
    name: 'Second Wind',
    kind: 'equipment',
    slot: 'utilities',
    section: 'utilities',
  },
  coffee_amulet: {
    id: 'coffee_amulet',
    name: 'Coffee Amulet',
    kind: 'equipment',
    slot: 'utilities',
    section: 'utilities',
  },
  alarm_bell: {
    id: 'alarm_bell',
    name: 'Alarm Bell',
    kind: 'equipment',
    slot: 'utilities',
    section: 'utilities',
  },
  warm_blanket: {
    id: 'warm_blanket',
    name: 'Warm Blanket',
    kind: 'equipment',
    slot: 'utilities',
    section: 'utilities',
  },
  night_watch: {
    id: 'night_watch',
    name: 'Night Watch',
    kind: 'equipment',
    slot: 'utilities',
    section: 'utilities',
  },
}

export interface CosmeticMeta {
  id: CosmeticId
  name: string
}

export const COSMETIC_META: Record<CosmeticId, CosmeticMeta> = {
  cosmetic_ember: { id: 'cosmetic_ember', name: 'Ember Glow' },
  cosmetic_hat: { id: 'cosmetic_hat', name: 'Adventurer Hat' },
  cosmetic_aura: { id: 'cosmetic_aura', name: 'Mystic Aura' },
  cosmetic_pet: { id: 'cosmetic_pet', name: 'Pixel Pet' },
  cosmetic_frame: { id: 'cosmetic_frame', name: 'Hero Frame' },
  cosmetic_gold: { id: 'cosmetic_gold', name: 'Golden Skin' },
}

/** Whether an artifact can be placed in the given equip slot. */
export function canEquipInSlot(id: ArtifactId, slot: 'armor' | 'utilities'): boolean {
  return ARTIFACT_META[id]?.slot === slot
}

/** Whether an artifact belongs to the given section (for picker lists). */
export function isInSection(id: ArtifactId, section: ArtifactSection): boolean {
  return ARTIFACT_META[id]?.section === section
}

/** Get metadata for an artifact, or undefined for unknown IDs. */
export function getArtifactMeta(id: ArtifactId): ArtifactMeta | undefined {
  return ARTIFACT_META[id]
}

export interface CountedItem {
  id: ArtifactId
  count: number
}

/**
 * All owned artifacts that belong to a given slot's full list.
 * Armor: equippable (slot=armor) + tools (section=armor, slot!=armor)
 * Utilities: equippable (slot=utilities) + tools (section=utilities, slot=null)
 */
export function listArtifactsForSlot(
  artifacts: ArtifactId[],
  slot: 'armor' | 'utilities',
  currentEquipped: ArtifactId | null,
): { equippable: CountedItem[]; tools: CountedItem[] } {
  const eqCounts = new Map<ArtifactId, number>()
  const toolCounts = new Map<ArtifactId, number>()
  for (const a of artifacts) {
    const meta = ARTIFACT_META[a]
    if (!meta) {
      toolCounts.set(a, (toolCounts.get(a) ?? 0) + 1)
      continue
    }
    if (meta.slot === slot) {
      if (a !== currentEquipped) eqCounts.set(a, (eqCounts.get(a) ?? 0) + 1)
    } else if (meta.section === slot && meta.slot !== slot) {
      toolCounts.set(a, (toolCounts.get(a) ?? 0) + 1)
    }
  }
  const toList = (m: Map<ArtifactId, number>) =>
    [...m.entries()].map(([id, count]) => ({ id, count }))
  return { equippable: toList(eqCounts), tools: toList(toolCounts) }
}

/** List cosmetics for the charm picker. */
export function listCosmeticsForCharm(
  cosmetics: CosmeticId[],
  currentEquipped: CosmeticId | null,
): CosmeticId[] {
  return cosmetics.filter((c) => c !== currentEquipped)
}
