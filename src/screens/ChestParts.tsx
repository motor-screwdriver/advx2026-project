import React, { useEffect, useRef } from 'react'
import { Animated, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { ICONS, SPRITES, type SpriteEntry } from '../../assets/manifest'
import type { ChestLoot, ChestRarity } from '../contracts/types'
import { PixelSprite } from '../ui/PixelSprite'
import { strings } from '../ui/strings'
import { GoldButton, ScreenTitle, tavernColors, WoodPanel } from '../ui/tavern'
import { theme } from '../ui/theme'

const RARITY_COLORS: Record<ChestRarity, string> = {
  common: theme.colors.pixelGray,
  rare: theme.colors.rareBlue,
  epic: theme.colors.epicViolet,
}

const RARITY_KEYS: Record<ChestRarity, keyof typeof strings> = {
  common: 'rarity_common',
  rare: 'rarity_rare',
  epic: 'rarity_epic',
}

/** Copy from the chest mockup that has no strings.ts key yet (local only). */
const copy = {
  perfectWeek: 'PERFECT WEEK REWARD',
  takeIt: 'TAKE IT',
} as const

/**
 * PixelLab-generated reveal scene: an open wooden chest with golden light,
 * sparkles and rays bursting out on a tavern floor. One opaque image shown
 * at its real aspect ratio — no mockup crop-slices. Referenced locally per
 * screen convention (not in the manifest).
 */
const SCENE: SpriteEntry = {
  source: require('../../assets/design/gen/chest_open_scene.png'),
  width: 200,
  height: 168,
  frames: 1,
  frameWidth: 200,
  frameHeight: 168,
}

interface ClosedProps {
  shakeX: Animated.Value
  triedEmpty: boolean
  onOpen: () => void
}

export function ClosedStage({ shakeX, triedEmpty, onOpen }: ClosedProps) {
  const pulse = useRef(new Animated.Value(1)).current
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.35, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [pulse])

  return (
    <Pressable style={styles.stage} onPress={onOpen}>
      <ScreenTitle title={copy.perfectWeek} size={16} />
      <WoodPanel contentStyle={styles.pedestalWell}>
        <Animated.View style={{ transform: [{ translateX: shakeX }] }}>
          <ChestGlyph frame={0} />
        </Animated.View>
      </WoodPanel>
      <Animated.Text style={[styles.hint, { opacity: pulse }]}>
        {triedEmpty ? strings.chest_none : strings.chest_tap}
      </Animated.Text>
    </Pressable>
  )
}

/** Real 3-frame chest sprite: 0 closed, 1 opening, 2 open. */
function ChestGlyph({ frame = 0 }: { frame?: number }) {
  return <PixelSprite sprite={SPRITES.chest} size={120} frame={frame} animated={false} />
}

function lootIcon(loot: ChestLoot): SpriteEntry | null {
  const table = ICONS as Record<string, SpriteEntry | undefined>
  if (loot.artifactId) {
    return table[`art_${loot.artifactId}`] ?? null
  }
  if (loot.cosmeticId) {
    return table[`cos_${loot.cosmeticId.replace('cosmetic_', '')}`] ?? null
  }
  return null
}

/** Small pixel sparkle — a rotated square, flanking the rarity label. */
function Sparkle({ color, size = 6 }: { color: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        transform: [{ rotate: '45deg' }],
      }}
    />
  )
}

/** Gold divider line with a center diamond, between the loot name and its description. */
function CardDivider() {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      <Sparkle color={tavernColors.rivet} size={5} />
      <View style={styles.dividerLine} />
    </View>
  )
}

interface RevealProps {
  loot: ChestLoot
  pop: Animated.Value
  onTake: () => void
}

export function RevealStage({ loot, pop, onTake }: RevealProps) {
  const rarityColor = RARITY_COLORS[loot.rarity]
  const icon = lootIcon(loot)
  const lootName = loot.artifactId
    ? loot.artifactId.split('_').join(' ')
    : (loot.cosmeticId?.replace('cosmetic_', '').split('_').join(' ') ?? '')
  const artifactDesc = loot.artifactId
    ? strings[`artifact_${loot.artifactId}` as keyof typeof strings]
    : null
  return (
    <ScrollView contentContainerStyle={styles.revealStack} showsVerticalScrollIndicator={false}>
      <ScreenTitle title={copy.perfectWeek} size={16} />
      <Image source={SCENE.source} style={styles.scene} resizeMode="contain" />
      <Animated.View style={{ transform: [{ scale: pop }] }}>
        <WoodPanel style={styles.lootCard} contentStyle={styles.lootContent}>
          <View style={styles.rarityRow}>
            <Sparkle color={rarityColor} />
            <Text style={[styles.rarityText, { color: rarityColor }]}>
              {strings[RARITY_KEYS[loot.rarity]]}
            </Text>
            <Sparkle color={rarityColor} />
          </View>
          {icon && <PixelSprite sprite={icon} size={80} animated={false} />}
          <Text style={styles.lootName}>{lootName}</Text>
          <CardDivider />
          {artifactDesc && <Text style={styles.desc}>{artifactDesc}</Text>}
          <Text style={styles.dim}>
            {loot.artifactId ? strings.chest_in_bag : strings.chest_earned}
          </Text>
        </WoodPanel>
      </Animated.View>
      <GoldButton label={copy.takeIt} onPress={onTake} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(6),
  },
  pedestalWell: {
    alignItems: 'center',
    paddingVertical: theme.spacing(5),
    paddingHorizontal: theme.spacing(8),
  },
  hint: {
    ...theme.type.body,
    color: theme.colors.textDim,
    textAlign: 'center',
  },
  revealStack: {
    gap: theme.spacing(4),
    paddingBottom: theme.spacing(2),
  },
  scene: {
    width: '100%',
    aspectRatio: SCENE.frameWidth / SCENE.frameHeight,
  },
  lootCard: {
    borderColor: tavernColors.gold,
  },
  lootContent: {
    alignItems: 'center',
    gap: theme.spacing(3),
  },
  rarityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(2),
  },
  rarityText: {
    ...theme.type.body,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  lootName: {
    ...theme.type.title,
    color: tavernColors.goldLight,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(2),
    alignSelf: 'stretch',
  },
  dividerLine: {
    flex: 1,
    height: 2,
    backgroundColor: tavernColors.rivet,
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
})
