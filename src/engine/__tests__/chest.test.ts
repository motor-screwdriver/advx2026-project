import { rollChestLoot } from '../chest';

describe('rollChestLoot rarity bands (Common 70 / Rare 25 / Epic 5)', () => {
  it('rolls Common below 0.70 with a cosmetic', () => {
    const loot = rollChestLoot(() => 0.5);
    expect(loot).toMatchObject({ rarity: 'common', artifactId: null });
    expect(loot.cosmeticId).toMatch(/^cosmetic_/);
  });

  it('rolls Rare between 0.70 and 0.95 with an artifact from the pool', () => {
    const loot = rollChestLoot(() => 0.8);
    expect(loot.rarity).toBe('rare');
    expect(loot.artifactId).not.toBeNull();
    expect(loot.cosmeticId).toBeNull();
  });

  it('rolls Epic at 0.95+ with the golden cosmetic', () => {
    expect(rollChestLoot(() => 0.99)).toEqual({
      rarity: 'epic',
      artifactId: null,
      cosmeticId: 'cosmetic_gold',
    });
  });
});

describe('rollChestLoot with Lucky Coin', () => {
  it('guarantees Rare or better, never Common', () => {
    expect(rollChestLoot(() => 0.1, true).rarity).toBe('rare');
    expect(rollChestLoot(() => 0.99, true).rarity).toBe('epic');
    expect(rollChestLoot(() => 0.5, true).rarity).not.toBe('common');
  });
});
