import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import type { ChestLoot, ChestRarity } from '../contracts/types';
import { makePop, makeShake } from '../ui/animations';
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
  const router = useRouter();
  const { openChest } = useGame();
  const [loot, setLoot] = useState<ChestLoot | null>(null);
  const [triedEmpty, setTriedEmpty] = useState(false);
  const shakeX = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;

  // The whole stage is the tap target — no tiny button to hunt for.
  const open = () => {
    makeShake(shakeX, 8).start(() => {
      const result = openChest();
      setLoot(result);
      setTriedEmpty(result === null);
      if (result) {
        makePop(pop).start();
      }
    });
  };

  return (
    <Screen title={strings.chest_title}>
      {!loot ? (
        <ClosedStage shakeX={shakeX} triedEmpty={triedEmpty} onOpen={open} />
      ) : (
        <RevealStage loot={loot} pop={pop} onTake={() => router.back()} />
      )}
    </Screen>
  );
}

interface ClosedProps {
  shakeX: Animated.Value;
  triedEmpty: boolean;
  onOpen: () => void;
}

function ClosedStage({ shakeX, triedEmpty, onOpen }: ClosedProps) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.35, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Pressable style={styles.stage} onPress={onOpen}>
      <Animated.View style={{ transform: [{ translateX: shakeX }] }}>
        <ChestGlyph />
      </Animated.View>
      <Animated.Text style={[styles.hint, { opacity: pulse }]}>
        {triedEmpty ? strings.chest_none : strings.chest_tap}
      </Animated.Text>
    </Pressable>
  );
}

/** Chunky chest drawn from views: lid, body, gold clasp and bands. */
function ChestGlyph() {
  return (
    <View style={styles.chest}>
      <View style={styles.chestLid}>
        <View style={styles.chestBand} />
      </View>
      <View style={styles.chestBody}>
        <View style={styles.chestBand} />
        <View style={styles.chestClasp} />
      </View>
    </View>
  );
}

interface RevealProps {
  loot: ChestLoot;
  pop: Animated.Value;
  onTake: () => void;
}

function RevealStage({ loot, pop, onTake }: RevealProps) {
  const rarityColor = RARITY_COLORS[loot.rarity];
  const lootName = loot.artifactId
    ? loot.artifactId.split('_').join(' ')
    : (loot.cosmeticId?.replace('cosmetic_', '').split('_').join(' ') ?? '');
  const artifactDesc = loot.artifactId
    ? strings[`artifact_${loot.artifactId}` as keyof typeof strings]
    : null;
  return (
    <View style={styles.stage}>
      <Animated.View style={{ transform: [{ scale: pop }] }}>
        <PixelPanel style={[styles.lootCard, { borderColor: rarityColor }]} contentStyle={styles.lootContent}>
          <View style={[styles.rarityTag, { backgroundColor: rarityColor }]}>
            <Text style={styles.rarityText}>{strings[RARITY_KEYS[loot.rarity]]}</Text>
          </View>
          <Text style={styles.lootName}>{lootName}</Text>
          {artifactDesc && <Text style={styles.desc}>{artifactDesc}</Text>}
          <Text style={styles.dim}>{loot.artifactId ? strings.chest_in_bag : strings.chest_earned}</Text>
        </PixelPanel>
      </Animated.View>
      <PixelButton label={strings.chest_take} onPress={onTake} />
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(6),
  },
  hint: {
    ...theme.type.body,
    color: theme.colors.textDim,
    textAlign: 'center',
  },
  chest: { alignItems: 'center' },
  chestLid: {
    width: 140,
    height: 40,
    backgroundColor: theme.colors.panel,
    borderWidth: theme.borderWidth * 2,
    borderColor: theme.colors.outline,
    borderTopColor: theme.colors.bevelLight,
    borderRadius: theme.borderRadius,
    justifyContent: 'center',
  },
  chestBody: {
    width: 140,
    height: 72,
    marginTop: -theme.borderWidth,
    backgroundColor: theme.colors.inset,
    borderWidth: theme.borderWidth * 2,
    borderColor: theme.colors.outline,
    borderRadius: theme.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chestBand: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    alignSelf: 'center',
    width: 16,
    backgroundColor: theme.colors.bevelLight,
  },
  chestClasp: {
    width: 24,
    height: 24,
    backgroundColor: theme.colors.gold,
    borderWidth: theme.borderWidth,
    borderColor: theme.colors.outline,
  },
  lootCard: {
    borderWidth: theme.borderWidth * 2,
  },
  lootContent: {
    alignItems: 'center',
    gap: theme.spacing(3),
    paddingTop: theme.spacing(6),
  },
  rarityTag: {
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(1),
    borderWidth: theme.borderWidth,
    borderColor: theme.colors.outline,
    borderRadius: theme.borderRadius,
    marginTop: -theme.spacing(6),
    backgroundColor: theme.colors.panel,
  },
  rarityText: {
    ...theme.type.label,
    color: theme.colors.bg,
    textTransform: 'uppercase',
  },
  lootName: {
    ...theme.type.title,
    color: theme.colors.text,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  desc: {
    ...theme.type.body,
    color: theme.colors.text,
    textAlign: 'center',
  },
  dim: {
    ...theme.type.label,
    color: theme.colors.textDim,
    textAlign: 'center',
  },
});
