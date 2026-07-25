import { ARTIFACTS, canEquipInSlot } from '../artifacts'
import { ARTIFACT_POOL, ARTIFACT_WEIGHTS } from '../chest'
import { applyNightTurn } from '../turn'
import { makeGame, makeNight, TURN } from './fixtures'

/** A prior night so the grace-night exemption (first night) doesn't apply. */
const PRIOR_NIGHT = makeNight({ date: '2026-07-20' })

describe('canEquipInSlot — items only go in their designated slot', () => {
  it('iron_armor goes in armor slot only', () => {
    expect(canEquipInSlot('iron_armor', 'armor')).toBe(true)
    expect(canEquipInSlot('iron_armor', 'utilities')).toBe(false)
  })

  it('utility equipment goes in utilities slot only', () => {
    expect(canEquipInSlot('warm_blanket', 'utilities')).toBe(true)
    expect(canEquipInSlot('night_watch', 'utilities')).toBe(true)
    expect(canEquipInSlot('second_wind', 'utilities')).toBe(true)
    expect(canEquipInSlot('coffee_amulet', 'utilities')).toBe(true)
    expect(canEquipInSlot('alarm_bell', 'utilities')).toBe(true)
    expect(canEquipInSlot('warm_blanket', 'armor')).toBe(false)
    expect(canEquipInSlot('night_watch', 'armor')).toBe(false)
  })

  it('non-slotted items cannot equip anywhere', () => {
    expect(canEquipInSlot('hourglass', 'armor')).toBe(false)
    expect(canEquipInSlot('hourglass', 'utilities')).toBe(false)
    expect(canEquipInSlot('phoenix_feather', 'utilities')).toBe(false)
  })
})

describe('second_wind requires equip in utilities to activate', () => {
  it('works when equipped in utilities', () => {
    const state = makeGame({
      artifacts: ['second_wind'],
      equipped: { armor: null, utilities: 'second_wind', charm: null },
      nights: [PRIOR_NIGHT],
    })
    const result = applyNightTurn(state, {
      ...TURN,
      secondWindAvailable: true,
      bedTime: 870,
      wakeTime: 1050,
    })
    expect(result.evaluation.outcome).toBe('TERRIBLE')
    expect(result.secondWindUsed).toBe(true)
    expect(result.evaluation.hpDelta).toBe(-1)
  })

  it('does NOT work when only in inventory (not equipped)', () => {
    const state = makeGame({
      artifacts: ['second_wind'],
      equipped: { armor: null, utilities: null, charm: null },
      nights: [PRIOR_NIGHT],
    })
    const result = applyNightTurn(state, {
      ...TURN,
      secondWindAvailable: false,
      bedTime: 870,
      wakeTime: 1050,
    })
    expect(result.evaluation.outcome).toBe('TERRIBLE')
    expect(result.secondWindUsed).toBe(false)
    expect(result.evaluation.hpDelta).toBe(-2)
  })
})

describe('star_map is completely removed', () => {
  it('is not a valid ArtifactId in the pool', () => {
    expect(ARTIFACT_POOL).not.toContain('star_map')
  })

  it('is not in the weight table', () => {
    const ids = ARTIFACT_WEIGHTS.map(([id]: [string, number]) => id)
    expect(ids).not.toContain('star_map')
  })

  it('is not in the ARTIFACTS registry', () => {
    expect(Object.keys(ARTIFACTS)).not.toContain('star_map')
  })
})
