import { applyDeathPenalty, applyResurrection, RESURRECT_HP } from '../resurrection'
import { makeGame } from './fixtures'

const NOW = new Date('2026-07-22T08:00:00Z')

describe('applyDeathPenalty (loot loss on permanent death)', () => {
  it('removes ~50% of artifacts (min 1)', () => {
    const state = makeGame({
      artifacts: ['iron_armor', 'hourglass', 'lucky_coin', 'warm_blanket'],
    })
    // Deterministic rng: Fisher-Yates with constant 0.5
    const result = applyDeathPenalty(state, () => 0.5)
    // 4 items, removeCount = round(4*0.5) = 2 → 2 remain
    expect(result.artifacts).toHaveLength(2)
  })

  it('removes at least 1 item from a non-empty inventory', () => {
    const state = makeGame({ artifacts: ['hourglass'] })
    const result = applyDeathPenalty(state, () => 0.3)
    expect(result.artifacts).toHaveLength(0)
  })

  it('leaves empty inventory untouched', () => {
    const state = makeGame({ artifacts: [] })
    const result = applyDeathPenalty(state, () => 0.5)
    expect(result.artifacts).toHaveLength(0)
  })

  it('clears equipped slot if its artifact was lost', () => {
    const state = makeGame({
      artifacts: ['warm_blanket', 'iron_armor'],
      equipped: { armor: null, utilities: 'warm_blanket', charm: null },
    })
    // With rng=0.1, after Fisher-Yates, 1 of 2 items removed (round(2*0.5)=1)
    const result = applyDeathPenalty(state, () => 0.1)
    // Whatever survived, equipped.utilities must match
    if (result.artifacts.indexOf('warm_blanket') < 0) {
      expect(result.equipped.utilities).toBeNull()
    } else {
      expect(result.equipped.utilities).toBe('warm_blanket')
    }
  })

  it('resets perfectWeekStreak to 0', () => {
    const state = makeGame({ perfectWeekStreak: 5, artifacts: ['hourglass'] })
    const result = applyDeathPenalty(state, () => 0.5)
    expect(result.perfectWeekStreak).toBe(0)
  })

  it('uses deterministic RNG (same seed = same result)', () => {
    const state = makeGame({
      artifacts: [
        'iron_armor',
        'hourglass',
        'lucky_coin',
        'warm_blanket',
        'night_watch',
        'second_wind',
      ],
    })
    const resultA = applyDeathPenalty(state, () => 0.4)
    const resultB = applyDeathPenalty(state, () => 0.4)
    expect(resultA.artifacts).toEqual(resultB.artifacts)
  })
})

describe('applyResurrection (unchanged behavior)', () => {
  it('success revives with 3 HP and stamps the cooldown', () => {
    const next = applyResurrection(makeGame({ hp: 0 }), true, NOW)
    expect(next.hp).toBe(RESURRECT_HP)
    expect(next.lastResurrectionAt).toBe(NOW.toISOString())
  })

  it('failure is a permanent death — hero is gone', () => {
    const next = applyResurrection(makeGame({ hp: 0 }), false, NOW)
    expect(next.hero).toBeNull()
    expect(next.lastResurrectionAt).toBeNull()
  })
})
