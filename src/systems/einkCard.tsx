/**
 * Hero card renderer for the Dot Quote/0 e-ink device (P1, FLAGS.eink).
 * A 296×152 pure-B&W card composed from live state — 1-bit hero sprite,
 * type + level, 7 hearts, streak, "next lvl n/7". Rendered off-screen by
 * EinkCardHost and captured to PNG base64 via react-native-view-shot.
 * The device is pushed with ditherType NONE: we control every pixel here,
 * so no fine lines under 2 px and only solid #000 / #fff.
 */
import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { captureRef } from 'react-native-view-shot'

import { SPRITES_1BIT, type SpriteEntry } from '../../assets/manifest'
import type { GameState, HeroType } from '../contracts/types'
import { useGameStore } from '../state/store'
import { theme } from '../ui/theme'

export const CARD_WIDTH = 296
export const CARD_HEIGHT = 152
const ICON_SIZE = 40
const SPRITE_SIZE = 92
const HEART_SIZE = 16
const MAX_HP = 7
const INK = '#000000'
const PAPER = '#ffffff'

const HERO_1BIT: Record<HeroType, SpriteEntry> = {
  monk: SPRITES_1BIT.hero_monk,
  ranger: SPRITES_1BIT.hero_ranger,
  druid: SPRITES_1BIT.hero_druid,
  rogue: SPRITES_1BIT.hero_rogue,
  knight: SPRITES_1BIT.hero_knight,
  paladin: SPRITES_1BIT.hero_paladin,
  ninja: SPRITES_1BIT.hero_ninja,
  mage: SPRITES_1BIT.hero_mage,
  warlock: SPRITES_1BIT.hero_warlock,
}

interface CaptureTargets {
  card: View | null
  icon: View | null
}

const targets: CaptureTargets = { card: null, icon: null }

/** 296×152 hero card → base64 PNG (null when nothing mounted / capture failed). */
export async function captureCardBase64(): Promise<string | null> {
  return capture(targets.card, CARD_WIDTH, CARD_HEIGHT)
}

/** 40×40 hero icon → base64 PNG for the Text API `icon` field. */
export async function captureIconBase64(): Promise<string | null> {
  return capture(targets.icon, ICON_SIZE, ICON_SIZE)
}

async function capture(target: View | null, width: number, height: number): Promise<string | null> {
  if (!target) {
    return null
  }
  try {
    return await captureRef(target, { format: 'png', result: 'base64', width, height })
  } catch (error) {
    console.log('[eink] card capture failed (silent):', error)
    return null
  }
}

/**
 * Off-screen render host. Mounted once by SystemsLayer while FLAGS.eink is
 * on; subscribes to the store so the card always reflects the latest state
 * before the debounced push fires.
 */
export function EinkCardHost() {
  const game = useGameStore((s) => s.game)
  return (
    <View style={styles.host} pointerEvents="none">
      {game.hero && (
        <View
          ref={(view) => {
            targets.card = view
          }}
          collapsable={false}
        >
          <HeroCard state={game} />
        </View>
      )}
      <View
        ref={(view) => {
          targets.icon = view
        }}
        collapsable={false}
      >
        <Image source={SPRITES_1BIT.hero_icon_40.source} style={styles.icon} />
      </View>
    </View>
  )
}

function HeroCard({ state }: { state: GameState }) {
  const hero = state.hero!
  return (
    <View style={styles.card}>
      <View style={styles.frame}>
        <View style={styles.spriteBox}>
          <HeroSprite1Bit type={hero.type} />
        </View>
        <View style={styles.meta}>
          <View style={styles.headerRow}>
            <Text style={styles.name}>{hero.type.toUpperCase()}</Text>
            <Text style={styles.badge}>LV {hero.level}</Text>
          </View>
          <View style={styles.divider} />
          <HeartRow hp={state.hp} />
          <Text style={styles.line}>STREAK {state.perfectWeekStreak}</Text>
          <NextLevelBar streak={state.perfectWeekStreak} />
        </View>
      </View>
    </View>
  )
}

/** Segmented 7-cell "next level" bar — same data as before, drawn as blocks. */
function NextLevelBar({ streak }: { streak: number }) {
  const filled = Math.min(streak, MAX_HP)
  return (
    <View style={styles.progressRow}>
      <Text style={styles.progressLabel}>NEXT</Text>
      <View style={styles.progressTrack}>
        {Array.from({ length: MAX_HP }, (_, i) => (
          <View key={i} style={i < filled ? styles.cellFull : styles.cellEmpty} />
        ))}
      </View>
    </View>
  )
}

/** First frame of the 2-frame 1-bit strip, nearest-neighbor scaled. */
function HeroSprite1Bit({ type }: { type: HeroType }) {
  const entry = HERO_1BIT[type]
  const scale = SPRITE_SIZE / entry.frameHeight
  return (
    <View style={styles.spriteClip}>
      <Image
        source={entry.source}
        style={{ width: entry.width * scale, height: entry.height * scale }}
      />
    </View>
  )
}

function HeartRow({ hp }: { hp: number }) {
  return (
    <View style={styles.hearts}>
      {Array.from({ length: MAX_HP }, (_, i) => (
        <Image
          key={i}
          source={
            i < hp
              ? SPRITES_1BIT['1bit_heart_full'].source
              : SPRITES_1BIT['1bit_heart_empty'].source
          }
          style={styles.heart}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: -10000, top: 0 },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: PAPER,
    padding: 5,
  },
  frame: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: INK,
    paddingHorizontal: 8,
    gap: 10,
  },
  spriteBox: {
    width: 104,
    height: 104,
    borderWidth: 2,
    borderColor: INK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spriteClip: { width: SPRITE_SIZE, height: SPRITE_SIZE, overflow: 'hidden' },
  meta: { flex: 1, gap: 6 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontFamily: theme.fontFamily, fontSize: 13, lineHeight: 16, color: INK },
  badge: {
    fontFamily: theme.fontFamily,
    fontSize: 9,
    lineHeight: 12,
    color: PAPER,
    backgroundColor: INK,
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  divider: { height: 2, backgroundColor: INK },
  hearts: { flexDirection: 'row', gap: 2 },
  heart: { width: HEART_SIZE, height: HEART_SIZE },
  line: { fontFamily: theme.fontFamily, fontSize: 10, lineHeight: 14, color: INK },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  progressLabel: { fontFamily: theme.fontFamily, fontSize: 8, lineHeight: 12, color: INK },
  progressTrack: {
    flex: 1,
    flexDirection: 'row',
    gap: 2,
    borderWidth: 2,
    borderColor: INK,
    padding: 2,
  },
  cellFull: { flex: 1, height: 8, backgroundColor: INK },
  cellEmpty: { flex: 1, height: 8, backgroundColor: PAPER },
  icon: { width: ICON_SIZE, height: ICON_SIZE },
})
