import React from 'react'
import { Animated, Image, StyleSheet, Text, View } from 'react-native'

import { ICONS, type SpriteEntry } from '../../assets/manifest'
import { PixelSprite } from './PixelSprite'
import { ROUND_COUNT, type GoldenZone } from './soulTetherLogic'
import { strings } from './strings'
import { CornerRivets, Parchment, tavernColors } from './tavern'
import { theme } from './theme'

/** Copy from the soul tether mockup that has no strings.ts key yet (local only). */
const copy = {
  hint: 'TAP IN THE GOLD ZONE',
  tap: 'TAP',
} as const

/**
 * Standalone scene illustration generated via PixelLab (see
 * docs/8bit Sleep — гайд генерация ассетов Kimi + PixelLab.md): a ghostly
 * wraith knight in a hooded cloak holding a glowing golden thread that curves
 * down to a tiny skull on the ground. One opaque image shown at its real
 * aspect ratio — no mockup crop-slices. Referenced locally per screen
 * convention (not in the manifest).
 */
const SCENE: SpriteEntry = {
  source: require('../../assets/design/gen/tether_scene.png'),
  width: 200,
  height: 200,
  frames: 1,
  frameWidth: 200,
  frameHeight: 200,
}

/** The wraith-and-tether illustration in a dark wood-edged panel. */
export function TetherScene() {
  return (
    <View style={styles.sceneEdge}>
      <View style={[styles.sceneWell, { aspectRatio: SCENE.width / SCENE.height }]}>
        <Image source={SCENE.source} style={styles.scene} resizeMode="cover" />
      </View>
    </View>
  )
}

/** Round dots: gold for a hit, red for a miss, bright rim on the live round. */
export function RoundPips({ results }: { results: boolean[] }) {
  return (
    <View style={styles.pips}>
      {Array.from({ length: ROUND_COUNT }, (_, index) => (
        <View
          key={index}
          style={[
            styles.pip,
            index < results.length && (results[index] ? styles.pipHit : styles.pipMiss),
            index === results.length && styles.pipCurrent,
          ]}
        />
      ))}
    </View>
  )
}

/** Timing bar: dark track, golden zone, needle cursor, tick marks. */
export function TetherBar({ cursor, zone }: { cursor: Animated.Value; zone: GoldenZone }) {
  return (
    <View style={styles.barEdge}>
      <View style={styles.barTrack}>
        <View style={[styles.zone, { left: `${zone.startPct}%`, width: `${zone.widthPct}%` }]} />
        <View style={styles.ticks}>
          {Array.from({ length: 17 }, (_, index) => (
            <View key={index} style={styles.tick} />
          ))}
        </View>
        <Animated.View
          style={[
            styles.needle,
            { left: cursor.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
          ]}
        >
          <PixelSprite sprite={ICONS.tether_cursor} size={16} />
        </Animated.View>
      </View>
    </View>
  )
}

/** Parchment strip: the instruction, swapped for hit/miss feedback on tap. */
export function HintStrip({ feedback }: { feedback: string | null }) {
  return (
    <Parchment>
      <View style={styles.hintRow}>
        <View style={styles.diamond} />
        <Text style={[styles.hintText, feedback === strings.soul_miss && styles.hintMiss]}>
          {feedback ?? copy.hint}
        </Text>
        <View style={styles.diamond} />
      </View>
    </Parchment>
  )
}

/**
 * The big gold TAP button from the mockup. Purely visual: the whole game
 * area is the Pressable, so a nested button would steal the touch-down.
 */
export function TapButtonVisual() {
  return (
    <View style={styles.tapEdge}>
      <View style={styles.tapBody}>
        <Text style={styles.tapLabel}>{copy.tap}</Text>
      </View>
      <CornerRivets size={4} inset={5} />
    </View>
  )
}

const styles = StyleSheet.create({
  sceneEdge: {
    backgroundColor: tavernColors.edge,
    padding: 4,
    borderWidth: 1,
    borderColor: tavernColors.dark,
  },
  sceneWell: { width: '100%', overflow: 'hidden', backgroundColor: '#0b0705' },
  scene: { width: '100%', height: '100%' },
  pips: { flexDirection: 'row', justifyContent: 'center', gap: theme.spacing(4) },
  pip: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.inset,
    borderWidth: 3,
    borderColor: theme.colors.outline,
  },
  pipHit: { backgroundColor: tavernColors.gold, borderColor: tavernColors.goldLight },
  pipMiss: { backgroundColor: tavernColors.danger },
  pipCurrent: { borderColor: tavernColors.goldLight },
  barEdge: {
    backgroundColor: tavernColors.edge,
    padding: 4,
    borderWidth: 1,
    borderColor: tavernColors.dark,
  },
  barTrack: {
    height: 40,
    backgroundColor: '#180e07',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  zone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: tavernColors.gold,
    opacity: 0.9,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: tavernColors.goldLight,
  },
  ticks: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 4,
    paddingBottom: 2,
  },
  tick: { width: 2, height: 6, backgroundColor: theme.colors.textDim, opacity: 0.6 },
  needle: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    width: 16,
    marginLeft: -8,
    justifyContent: 'center',
  },
  diamond: {
    width: 6,
    height: 6,
    backgroundColor: tavernColors.parchmentEdge,
    transform: [{ rotate: '45deg' }],
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(3),
  },
  hintText: {
    ...theme.type.body,
    color: tavernColors.inkOnParchment,
    textAlign: 'center',
    letterSpacing: 1,
  },
  hintMiss: { color: tavernColors.danger },
  tapEdge: { borderWidth: 2, backgroundColor: tavernColors.edge, position: 'relative' },
  tapBody: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing(3),
    backgroundColor: tavernColors.gold,
    borderTopWidth: 3,
    borderTopColor: tavernColors.goldLight,
    borderBottomWidth: 3,
    borderBottomColor: tavernColors.goldEdge,
  },
  tapLabel: {
    fontFamily: theme.fontFamily,
    fontSize: 16,
    letterSpacing: 2,
    color: tavernColors.inkOnParchment,
  },
})
