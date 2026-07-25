import { ARTIFACT_WEIGHTS, rollChestLoot } from '../chest'

describe('weighted artifact drop table', () => {
  it('has weights for all 9 artifacts', () => {
    expect(ARTIFACT_WEIGHTS).toHaveLength(9)
  })

  it('iron_armor and phoenix_feather have the lowest weights', () => {
    const ironWeight = ARTIFACT_WEIGHTS.find(([id]) => id === 'iron_armor')![1]
    const phoenixWeight = ARTIFACT_WEIGHTS.find(([id]) => id === 'phoenix_feather')![1]
    const otherWeights = ARTIFACT_WEIGHTS.filter(
      ([id]) => id !== 'iron_armor' && id !== 'phoenix_feather',
    ).map(([, w]) => w)
    const minOther = Math.min(...otherWeights)
    expect(ironWeight).toBeLessThan(minOther)
    expect(phoenixWeight).toBeLessThan(minOther)
  })

  it('warm_blanket has the highest weight', () => {
    const blanketWeight = ARTIFACT_WEIGHTS.find(([id]) => id === 'warm_blanket')![1]
    const maxOther = Math.max(
      ...ARTIFACT_WEIGHTS.filter(([id]) => id !== 'warm_blanket').map(([, w]) => w),
    )
    expect(blanketWeight).toBeGreaterThanOrEqual(maxOther)
  })

  it('rolling a Rare chest with deterministic rng picks weighted artifact', () => {
    // rng returns 0.8 (Rare band), then 0.0 for artifact pick → first in weight table
    let call = 0
    const rng = () => [0.8, 0.0][call++]
    const loot = rollChestLoot(rng)
    expect(loot.rarity).toBe('rare')
    expect(loot.artifactId).toBe('warm_blanket') // first in table, highest weight
  })

  it('rng near 1.0 picks phoenix_feather (last and rarest)', () => {
    let call = 0
    const rng = () => [0.8, 0.999][call++]
    const loot = rollChestLoot(rng)
    expect(loot.rarity).toBe('rare')
    expect(loot.artifactId).toBe('phoenix_feather')
  })

  it('Lucky Coin still guarantees Rare+ with weighted picks', () => {
    let call = 0
    const rng = () => [0.1, 0.5][call++] // first for rarity, second for artifact
    const loot = rollChestLoot(rng, true)
    expect(loot.rarity).toBe('rare')
    expect(loot.artifactId).not.toBeNull()
  })
})
