import React, { useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import type { ChestLoot, ChestRarity } from '../contracts/types';
import { makeShake, useFadeIn } from '../ui/animations';
import { PixelButton } from '../ui/PixelButton';
import { PixelPanel } from '../ui/PixelPanel';
import { Screen } from '../ui/Screen';
import { strings } from '../ui/strings';
import { theme } from '../ui/theme';
import { useGame } from '../ui/useGame';

const RARITY_COLORS: Record<ChestRarity, string> = {
  common: theme.colors.pixelGray,
  rare: theme.colors.rareBlue,
  epic: theme.colors.epicViolet,
};

const RARITY_KEYS: Record<ChestRarity, keyof typeof strings> = {
  common: 'rarity_common',
  rare: 'rarity_rare',
  epic: 'rarity_epic',
};

export function ChestScreen() {
  const { openChest, equip } = useGame();
  const [loot, setLoot] = useState<ChestLoot | null>(null);
  const shakeX = useRef(new Animated.Value(0)).current;
  const fade = useFadeIn(0, 400);

  const open = () => {
    makeShake(shakeX, 8).start(() => setLoot(openChest()));
  };

  const lootName = loot?.artifactId
    ? loot.artifactId.split('_').join(' ')
    : (loot?.cosmeticId ?? '');

  return (
    <Screen title={strings.chest_title}>
      {!loot ? (
        <Animated.View style={{ transform: [{ translateX: shakeX }] }}>
          <PixelPanel style={styles.chestPanel}>
            <View style={styles.chestBody}>
              <View style={styles.chestClasp} />
            </View>
            <Text style={styles.dim}>{strings.chest_tap}</Text>
          </PixelPanel>
        </Animated.View>
      ) : (
        <Animated.View style={{ opacity: fade }}>
          <PixelPanel style={[styles.lootCard, { backgroundColor: RARITY_COLORS[loot.rarity] }]}>
            <Text style={[styles.rarity, { color: RARITY_COLORS[loot.rarity] }]}>
              {strings[RARITY_KEYS[loot.rarity]]}
            </Text>
            <Text style={styles.lootName}>{lootName}</Text>
          </PixelPanel>
        </Animated.View>
      )}
      {!loot ? (
        <PixelButton label={strings.chest_tap} onPress={open} />
      ) : (
        <View style={styles.actions}>
          {loot.artifactId && (
            <PixelButton label={strings.chest_equip} onPress={() => equip('armor', loot.artifactId!)} />
          )}
          <PixelButton label={strings.chest_close} onPress={() => setLoot(null)} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chestPanel: { alignItems: 'center' },
  chestBody: {
    width: 96,
    height: 72,
    backgroundColor: theme.colors.inset,
    borderWidth: theme.borderWidth * 2,
    borderColor: theme.colors.outline,
    borderRadius: theme.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chestClasp: {
    width: 16,
    height: 16,
    backgroundColor: theme.colors.gold,
    borderWidth: theme.borderWidth,
    borderColor: theme.colors.outline,
  },
  dim: {
    ...theme.type.label,
    color: theme.colors.textDim,
  },
  lootCard: {
    borderWidth: theme.borderWidth * 2,
    alignItems: 'center',
  },
  rarity: {
    ...theme.type.label,
    textTransform: 'uppercase',
  },
  lootName: {
    ...theme.type.title,
    color: theme.colors.text,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  actions: { gap: theme.spacing(3) },
});
