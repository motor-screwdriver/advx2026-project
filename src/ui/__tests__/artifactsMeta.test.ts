import type { ArtifactId, CosmeticId } from '../../contracts/types'
import { ARTIFACT_POOL } from '../../engine/chest'
import {
  ARTIFACT_META,
  canEquipInSlot,
  COSMETIC_META,
  getArtifactMeta,
  listArtifactsForSlot,
  listCosmeticsForCharm,
} from '../artifactsMeta'

describe('artifactsMeta facade', () => {
  it('canEquipInSlot: iron_armor -> armor only', () => {
    expect(canEquipInSlot('iron_armor', 'armor')).toBe(true)
    expect(canEquipInSlot('iron_armor', 'utilities')).toBe(false)
  })

  it('canEquipInSlot: utilities equipment -> utilities only', () => {
    expect(canEquipInSlot('warm_blanket', 'utilities')).toBe(true)
    expect(canEquipInSlot('night_watch', 'utilities')).toBe(true)
    expect(canEquipInSlot('second_wind', 'utilities')).toBe(true)
    expect(canEquipInSlot('coffee_amulet', 'utilities')).toBe(true)
    expect(canEquipInSlot('alarm_bell', 'utilities')).toBe(true)
    expect(canEquipInSlot('warm_blanket', 'armor')).toBe(false)
  })

  it('canEquipInSlot: non-slotted items return false everywhere', () => {
    expect(canEquipInSlot('hourglass', 'armor')).toBe(false)
    expect(canEquipInSlot('hourglass', 'utilities')).toBe(false)
    expect(canEquipInSlot('phoenix_feather', 'utilities')).toBe(false)
  })

  it('canEquipInSlot returns false for unknown IDs', () => {
    expect(canEquipInSlot('star_map' as any, 'armor')).toBe(false)
    expect(canEquipInSlot('unknown_thing' as any, 'utilities')).toBe(false)
  })

  it('getArtifactMeta returns metadata for known artifacts', () => {
    const meta = getArtifactMeta('warm_blanket')
    expect(meta).toMatchObject({
      id: 'warm_blanket',
      kind: 'equipment',
      slot: 'utilities',
      section: 'utilities',
    })
  })

  it('getArtifactMeta returns undefined for unknown IDs', () => {
    expect(getArtifactMeta('star_map' as any)).toBeUndefined()
  })

  it('ARTIFACT_META covers all 9 known artifacts', () => {
    expect(Object.keys(ARTIFACT_META)).toHaveLength(9)
  })

  it('each meta has correct shape', () => {
    for (const meta of Object.values(ARTIFACT_META)) {
      expect(meta).toHaveProperty('id')
      expect(meta).toHaveProperty('name')
      expect(meta).toHaveProperty('kind')
      expect(meta).toHaveProperty('slot')
      expect(meta).toHaveProperty('section')
      expect(['consumable', 'equipment']).toContain(meta.kind)
      expect(['armor', 'utilities']).toContain(meta.section)
    }
  })
})

describe('equip/unequip roundtrip via store', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useGameStore } = require('../../state/store')

  beforeEach(() => {
    useGameStore.getState().reset()
  })

  it('equip places equipment in correct slot; unequip clears it', () => {
    useGameStore.setState({
      game: {
        ...useGameStore.getState().game,
        artifacts: ['warm_blanket', 'night_watch', 'iron_armor'],
        onboardingDone: true,
      },
    })
    useGameStore.getState().equip('utilities', 'warm_blanket')
    expect(useGameStore.getState().game.equipped.utilities).toBe('warm_blanket')

    useGameStore.getState().unequip('utilities')
    expect(useGameStore.getState().game.equipped.utilities).toBeNull()
    expect(useGameStore.getState().game.artifacts).toContain('warm_blanket')
  })

  it('iron_armor equips in armor slot', () => {
    useGameStore.setState({
      game: { ...useGameStore.getState().game, artifacts: ['iron_armor'] },
    })
    useGameStore.getState().equip('armor', 'iron_armor')
    expect(useGameStore.getState().game.equipped.armor).toBe('iron_armor')
  })

  it('equip rejects items in wrong slot', () => {
    useGameStore.setState({
      game: { ...useGameStore.getState().game, artifacts: ['iron_armor', 'warm_blanket'] },
    })
    useGameStore.getState().equip('utilities', 'iron_armor')
    expect(useGameStore.getState().game.equipped.utilities).toBeNull()

    useGameStore.getState().equip('armor', 'warm_blanket')
    expect(useGameStore.getState().game.equipped.armor).toBeNull()
  })

  it('re-equip after unequip works without issues', () => {
    useGameStore.setState({
      game: { ...useGameStore.getState().game, artifacts: ['second_wind'] },
    })
    useGameStore.getState().equip('utilities', 'second_wind')
    expect(useGameStore.getState().game.equipped.utilities).toBe('second_wind')

    useGameStore.getState().unequip('utilities')
    expect(useGameStore.getState().game.equipped.utilities).toBeNull()

    useGameStore.getState().equip('utilities', 'second_wind')
    expect(useGameStore.getState().game.equipped.utilities).toBe('second_wind')
  })
})

describe('meta sync with chest pool', () => {
  it('every ARTIFACT_POOL id has an entry in ARTIFACT_META', () => {
    for (const id of ARTIFACT_POOL) {
      expect(ARTIFACT_META[id]).toBeDefined()
    }
  })

  it('every ARTIFACT_META id is a valid ArtifactId in the pool', () => {
    for (const id of Object.keys(ARTIFACT_META) as ArtifactId[]) {
      expect(ARTIFACT_POOL).toContain(id)
    }
  })
})

describe('listArtifactsForSlot invariant', () => {
  const ALL_IDS: ArtifactId[] = Object.keys(ARTIFACT_META) as ArtifactId[]

  it('every owned artifact appears in exactly one slot list (armor + utilities)', () => {
    const seen = new Set<ArtifactId>()
    for (const slot of ['armor', 'utilities'] as const) {
      const { equippable, tools } = listArtifactsForSlot(ALL_IDS, slot, null)
      for (const item of [...equippable, ...tools]) {
        expect(seen.has(item.id)).toBe(false)
        seen.add(item.id)
      }
    }
    expect(seen.size).toBe(ALL_IDS.length)
  })

  it('equipped item excluded from equippable but still visible as current', () => {
    const arts: ArtifactId[] = ['warm_blanket', 'hourglass']
    const { equippable, tools } = listArtifactsForSlot(arts, 'utilities', 'warm_blanket')
    const eqIds = equippable.map((i) => i.id)
    const toolIds = tools.map((i) => i.id)
    expect(eqIds).not.toContain('warm_blanket')
    expect(toolIds).toContain('hourglass')
  })

  it('iron_armor shows in armor equippable', () => {
    const { equippable } = listArtifactsForSlot(['iron_armor'], 'armor', null)
    expect(equippable).toHaveLength(1)
    expect(equippable[0].id).toBe('iron_armor')
  })

  it('unknown artifact falls into tools (does not vanish)', () => {
    const arts = ['unknown_thing' as ArtifactId]
    const { tools } = listArtifactsForSlot(arts, 'utilities', null)
    expect(tools).toHaveLength(1)
    expect(tools[0].id).toBe('unknown_thing')
  })
})

describe('listCosmeticsForCharm', () => {
  it('returns owned cosmetics excluding current equipped', () => {
    const owned: CosmeticId[] = ['cosmetic_ember', 'cosmetic_hat', 'cosmetic_gold']
    const result = listCosmeticsForCharm(owned, 'cosmetic_hat')
    expect(result).toEqual(['cosmetic_ember', 'cosmetic_gold'])
  })

  it('returns all cosmetics when none equipped', () => {
    const owned: CosmeticId[] = ['cosmetic_ember', 'cosmetic_aura']
    const result = listCosmeticsForCharm(owned, null)
    expect(result).toEqual(['cosmetic_ember', 'cosmetic_aura'])
  })

  it('returns empty when no cosmetics owned', () => {
    expect(listCosmeticsForCharm([], null)).toEqual([])
  })

  it('COSMETIC_META covers all 6 known cosmetics', () => {
    expect(Object.keys(COSMETIC_META)).toHaveLength(6)
  })
})
