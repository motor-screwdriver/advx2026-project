import React from 'react'
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native'

import { DESIGN, ICONS, type SpriteEntry } from '../../assets/manifest'
import type { ChestLoot, ChestRarity } from '../contracts/types'
import { ARTIFACT_META, COSMETIC_META, type CosmeticMeta } from '../ui/artifactsMeta'
import { PixelSprite } from '../ui/PixelSprite'
import { strings } from '../ui/strings'
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

function lootName(loot: ChestLoot): string {
  if (loot.artifactId) {
    return ARTIFACT_META[loot.artifactId]?.name ?? loot.artifactId.split('_').join(' ')
  }
  const meta = loot.cosmeticId
    ? (COSMETIC_META as Record<string, CosmeticMeta | undefined>)[loot.cosmeticId]
    : undefined
  return loot.cosmeticId ? (meta?.name ?? loot.cosmeticId.replace('cosmetic_', '')) : ''
}

function lootType(loot: ChestLoot): string {
  if (loot.artifactId) {
    const section = ARTIFACT_META[loot.artifactId]?.section === 'armor' ? 'Armor' : 'Utilities'
    return `Artifact – ${section}`
  }
  return 'Cosmetic – Charm'
}

interface RevealProps {
  loot: ChestLoot
  pop: Animated.Value
  onTake: () => void
}

/**
 * Reveal stage 1:1 with mockup 25: YOUR WEEKLY LOOT! title, loot card
 * (rarity ribbon, item icon, name, type, flavor) over the open glowing
 * chest with sparkles, CLAIM button.
 */
export function RevealStage({ loot, pop, onTake }: RevealProps) {
  const { width } = useWindowDimensions()
  const contentW = Math.min(width, 480)
  const icon = lootIcon(loot)
  const flavor = loot.artifactId
    ? strings[`artifact_${loot.artifactId}` as keyof typeof strings]
    : strings.chest_earned

  return (
    <View style={styles.stage}>
      <PixelSprite sprite={DESIGN.chest_title_weekly_loot} size={contentW * 0.85} />
      <Animated.View style={{ transform: [{ scale: pop }] }}>
        <LootCard loot={loot} icon={icon} flavor={flavor} width={contentW * 0.72} />
      </Animated.View>
      <OpenChest width={contentW * 0.6} />
      <Pressable onPress={onTake} style={({ pressed }) => pressed && styles.pressed}>
        <PixelSprite sprite={DESIGN.chest_button_claim} size={contentW * 0.62} />
      </Pressable>
    </View>
  )
}

function LootCard({
  loot,
  icon,
  flavor,
  width,
}: {
  loot: ChestLoot
  icon: SpriteEntry | null
  flavor: string
  width: number
}) {
  const cardH = (width * 626) / 522
  return (
    <View style={{ width, height: cardH }}>
      <View style={styles.cardBg}>
        <PixelSprite sprite={DESIGN.chest_card_frame} size={width} />
      </View>
      <RarityRibbon rarity={loot.rarity} width={width * 0.55} />
      <View style={[styles.cardContent, { paddingTop: cardH * 0.17 }]}>
        {icon && <PixelSprite sprite={icon} size={width * 0.42} animated={false} />}
        <Text style={styles.lootName}>{lootName(loot)}</Text>
        <Text style={styles.lootType}>{lootType(loot)}</Text>
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <View style={styles.dividerGem} />
          <View style={styles.dividerLine} />
        </View>
        <Text style={styles.flavor}>{flavor}</Text>
      </View>
    </View>
  )
}

/** Rare uses the blue ribbon sprite; common/epic get a tinted RN stand-in. */
function RarityRibbon({ rarity, width }: { rarity: ChestRarity; width: number }) {
  const ribbonH = (width * 146) / 382
  if (rarity === 'rare') {
    return (
      <View style={[styles.ribbon, { top: -ribbonH * 0.45 }]}>
        <PixelSprite sprite={DESIGN.chest_ribbon_rare} size={width} />
      </View>
    )
  }
  return (
    <View
      style={[
        styles.ribbon,
        styles.ribbonFallback,
        { top: -ribbonH * 0.45, height: ribbonH, width, backgroundColor: RARITY_COLORS[rarity] },
      ]}
    >
      <Text style={styles.ribbonText}>{strings[RARITY_KEYS[rarity]]}</Text>
    </View>
  )
}

function OpenChest({ width }: { width: number }) {
  const chestH = (width * 486) / 612
  return (
    <View style={{ width, height: chestH }}>
      <PixelSprite sprite={DESIGN.chest_chest_open_glow} size={width} />
      <View style={[styles.sparkle, { left: '6%', top: '12%' }]}>
        <PixelSprite sprite={DESIGN.chest_sparkle_1} size={width * 0.09} />
      </View>
      <View style={[styles.sparkle, { right: '4%', top: '30%' }]}>
        <PixelSprite sprite={DESIGN.chest_sparkle_1} size={width * 0.07} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: theme.spacing(3),
  },
  cardBg: {
    ...StyleSheet.absoluteFillObject,
  },
  ribbon: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 1,
    alignItems: 'center',
  },
  ribbonFallback: {
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0a0705',
  },
  ribbonText: {
    ...theme.type.label,
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  cardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: theme.spacing(1.5),
    paddingHorizontal: theme.spacing(3),
  },
  lootName: {
    ...theme.type.title,
    fontSize: 18,
    color: theme.colors.gold,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  lootType: {
    ...theme.type.label,
    color: theme.colors.textDim,
    textAlign: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(2),
    alignSelf: 'stretch',
    marginVertical: theme.spacing(1),
  },
  dividerLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#4a3520',
  },
  dividerGem: {
    width: 6,
    height: 6,
    backgroundColor: theme.colors.gold,
    transform: [{ rotate: '45deg' }],
  },
  flavor: {
    ...theme.type.label,
    color: theme.colors.text,
    textAlign: 'center',
  },
  sparkle: {
    position: 'absolute',
  },
  pressed: { opacity: 0.75 },
})
