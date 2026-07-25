/**
 * Bag screen data layer: category filtering, item models and press behavior.
 * All rows come straight from game state — nothing is mocked.
 */
import { Alert } from 'react-native'

import { ICONS } from '../../assets/manifest'
import type { ArtifactId, CosmeticId } from '../contracts/types'
import { ARTIFACT_META, COSMETIC_META } from '../ui/artifactsMeta'
import { strings } from '../ui/strings'

export type Section = 'armor' | 'utilities' | 'charm'

export interface BagItem {
  id: string
  name: string
  count: number
  equipped: boolean
  onPress: () => void
}

export interface BagActions {
  equip: (slot: 'armor' | 'utilities', artifact: ArtifactId) => void
  unequip: (slot: 'armor' | 'utilities' | 'charm') => void
  equipCosmetic: (cosmetic: CosmeticId) => void
  useHourglass: (date: string) => boolean
}

export const SECTIONS: { key: Section; label: string }[] = [
  { key: 'armor', label: strings.inventory_armor },
  { key: 'utilities', label: strings.inventory_utilities },
  { key: 'charm', label: strings.inventory_charm },
]

export function sectionTitle(section: Section | null): string {
  if (section === null) return strings.inventory_consumables.toUpperCase()
  return SECTIONS.find((s) => s.key === section)!.label.toUpperCase()
}

export function slotIcon(id: string) {
  const artKey = `art_${id}` as keyof typeof ICONS
  if (ICONS[artKey]) return ICONS[artKey]
  const cosKey = `cos_${id.replace('cosmetic_', '')}` as keyof typeof ICONS
  return ICONS[cosKey] ?? null
}

export function displayName(id: string): string {
  const meta = ARTIFACT_META[id as ArtifactId] ?? COSMETIC_META[id as CosmeticId]
  if (meta) return meta.name
  return id
    .split('_')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
}

const CHARM_EMOJI: Record<string, string> = {
  cosmetic_ember: '🔥',
  cosmetic_hat: '🎩',
  cosmetic_aura: '✨',
  cosmetic_pet: '🐾',
  cosmetic_frame: '🖼️',
  cosmetic_gold: '👑',
}
export function charmEmoji(id: string): string {
  return CHARM_EMOJI[id] ?? '💎'
}

function pressConsumable(id: ArtifactId, tryHourglass: (date: string) => boolean): void {
  if (id === 'hourglass') {
    const ok = tryHourglass(new Date().toISOString().slice(0, 10))
    Alert.alert(ok ? strings.util_alert_hourglass_ok : strings.util_alert_hourglass_fail)
    return
  }
  if (id === 'lucky_coin') {
    Alert.alert(strings.util_alert_lucky_coin)
    return
  }
  if (id === 'phoenix_feather') {
    Alert.alert(strings.util_alert_phoenix)
  }
}

interface EquippedState {
  armor: ArtifactId | null
  utilities: ArtifactId | null
  charm: CosmeticId | null
}

function belongsToSection(section: Section, metaSlot: 'armor' | 'utilities'): boolean {
  return section === metaSlot
}

/** Real inventory rows for the selected category, straight from game state. */
export function buildBagItems(
  section: Section | null,
  artifacts: ArtifactId[],
  cosmetics: CosmeticId[],
  equipped: EquippedState,
  actions: BagActions,
): BagItem[] {
  const items: BagItem[] = []
  const counts = new Map<ArtifactId, number>()
  for (const a of artifacts) counts.set(a, (counts.get(a) ?? 0) + 1)
  for (const [id, count] of counts) {
    const meta = ARTIFACT_META[id]
    if (!meta) continue
    const slot = meta.slot
    const isEquipped = slot !== null && equipped[slot] === id
    if (section !== null && (section === 'charm' || !belongsToSection(section, meta.section))) {
      continue
    }
    items.push({
      id,
      name: meta.name,
      count,
      equipped: isEquipped,
      onPress: () => {
        if (slot === null) {
          pressConsumable(id, actions.useHourglass)
        } else if (isEquipped) {
          actions.unequip(slot)
        } else {
          actions.equip(slot, id)
        }
      },
    })
  }
  if (section === null || section === 'charm') {
    for (const c of cosmetics) {
      const isEquipped = equipped.charm === c
      items.push({
        id: c,
        name: COSMETIC_META[c]?.name ?? displayName(c),
        count: 1,
        equipped: isEquipped,
        onPress: () => (isEquipped ? actions.unequip('charm') : actions.equipCosmetic(c)),
      })
    }
  }
  return items
}
