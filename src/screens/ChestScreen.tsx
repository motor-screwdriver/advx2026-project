import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { ICONS, SPRITES, type SpriteEntry } from '../../assets/manifest';
import type { ChestLoot, ChestRarity } from '../contracts/types';
import { playSfx } from '../systems/audio';
import { makePop, makeShake } from '../ui/animations';
import { PixelButton } from '../ui/PixelButton';
import { PixelPanel } from '../ui/PixelPanel';
import { PixelSprite } from '../ui/PixelSprite';
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
    playSfx('sfx_chest');
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
        <ChestGlyph frame={0} />
      </Animated.View>
      <Animated.Text style={[styles.hint, { opacity: pulse }]}>
        {triedEmpty ? strings.chest_none : strings.chest_tap}
      </Animated.Text>
    </Pressable>
  );
}

/** Real 3-frame chest sprite: 0 closed, 1 opening, 2 open. */
function ChestGlyph({ frame = 0 }: { frame?: number }) {
  return <PixelSprite sprite={SPRITES.chest} size={140} frame={frame} animated={false} />;
}

function lootIcon(loot: ChestLoot): SpriteEntry | null {
  const table = ICONS as Record<string, SpriteEntry | undefined>;
  if (loot.artifactId) {
    return table[`art_${loot.artifactId}`] ?? null;
  }
  if (loot.cosmeticId) {
    return table[`cos_${loot.cosmeticId.replace('cosmetic_', '')}`] ?? null;
  }
  return null;
}

interface RevealProps {
  loot: ChestLoot;
  pop: Animated.Value;
  onTake: () => void;
}

function RevealStage({ loot, pop, onTake }: RevealProps) {
  const rarityColor = RARITY_COLORS[loot.rarity];
  const icon = lootIcon(loot);
  const lootName = loot.artifactId
    ? loot.artifactId.split('_').join(' ')
    : (loot.cosmeticId?.replace('cosmetic_', '').split('_').join(' ') ?? '');
  const artifactDesc = loot.artifactId
    ? strings[`artifact_${loot.artifactId}` as keyof typeof strings]
    : null;
  return (
    <View style={styles.stage}>
      <Animated.View style={{ transform: [{ scale: pop }] }}>
        <PixelPanel
          style={[styles.lootCard, { borderColor: rarityColor }]}
          contentStyle={styles.lootContent}
        >
          <View style={[styles.rarityTag, { backgroundColor: rarityColor }]}>
            <Text style={styles.rarityText}>{strings[RARITY_KEYS[loot.rarity]]}</Text>
          </View>
          {icon && <PixelSprite sprite={icon} size={48} animated={false} />}
          <Text style={styles.lootName}>{lootName}</Text>
          {artifactDesc && <Text style={styles.desc}>{artifactDesc}</Text>}
          <Text style={styles.dim}>
            {loot.artifactId ? strings.chest_in_bag : strings.chest_earned}
          </Text>
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
