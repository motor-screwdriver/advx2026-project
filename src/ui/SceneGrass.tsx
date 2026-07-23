import React from 'react'
import { Animated, StyleSheet, useWindowDimensions, View } from 'react-native'
import { PixelArt } from './PixelArt'
import { FLOWER, TUFT } from './sceneBitmaps'
import { PhaseVisual } from './timeOfDay'
import { useCycle, useScroll } from './usePixelMotion'

export const GRASS_HEIGHT = 210
const COL = 8
const JAG = 26
const SOIL = 34
/** One seamless ground tile; a row of identical tiles scrolls in TILE steps. */
const TILE = 192
/** Irregular blade heights (px) — repeated for a curvy, non-straight top. */
const JAG_PATTERN = [8, 16, 11, 22, 14, 19, 9, 24, 13, 20, 10, 17] as const
const SWAY = [0, 1, 2, 1, 0, -1, -2, -1] as const
const BLADE_H = [10, 18, 13, 20, 11, 16] as const
const SCROLL_STEP = 4
const SCROLL_FPS = 12
/** Fixed decoration slots inside one tile (x in px, kept within 0..TILE). */
const BLADES = [
  { x: 14, fps: 3, seed: 0 },
  { x: 60, fps: 4, seed: 2 },
  { x: 110, fps: 5, seed: 4 },
  { x: 158, fps: 3, seed: 1 },
] as const
const TUFTS = [26, 128] as const
const FLOWERS = [46, 150] as const
const SPECK_COUNT = Math.floor(TILE / 18)

function Skyline({ main, tip }: { main: string; tip: string }) {
  const cols = TILE / COL
  return (
    <View style={styles.skyline}>
      {Array.from({ length: cols }, (_, i) => (
        <View
          key={i}
          style={{ width: COL, height: JAG_PATTERN[i % JAG_PATTERN.length], backgroundColor: main }}
        >
          <View style={{ height: 3, backgroundColor: tip }} />
        </View>
      ))}
    </View>
  )
}

function Specks({ dark, bright }: { dark: string; bright: string }) {
  return (
    <>
      {Array.from({ length: SPECK_COUNT }, (_, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            top: JAG + 6 + (i % 5) * 14,
            left: (i * 37) % TILE,
            width: 4,
            height: 4,
            backgroundColor: i % 2 === 0 ? bright : dark,
          }}
        />
      ))}
    </>
  )
}

function SwayTuft({ left, bright, dark }: { left: number; bright: string; dark: string }) {
  const dx = useCycle(SWAY, 3)
  return (
    <Animated.View style={[styles.tuft, { left, transform: [{ translateX: dx }] }]}>
      <PixelArt rows={TUFT} cell={3} map={{ B: bright, D: dark }} />
    </Animated.View>
  )
}

/** A clump of thin blades that shear back and forth like grass in the wind. */
function BladeGroup(props: {
  left: number
  fps: number
  seed: number
  bright: string
  main: string
}) {
  const sway = useCycle(SWAY, props.fps)
  const skewX = sway.interpolate({ inputRange: [-2, 2], outputRange: ['-6deg', '6deg'] })
  return (
    <Animated.View style={[styles.blades, { left: props.left, transform: [{ skewX }] }]}>
      {[0, 1, 2, 3, 4].map((k) => (
        <View
          key={k}
          style={{
            width: 3,
            height: BLADE_H[(props.seed + k) % BLADE_H.length],
            marginRight: 2,
            backgroundColor: k % 2 === 0 ? props.bright : props.main,
          }}
        />
      ))}
    </Animated.View>
  )
}

/** A single repeating ground tile (TILE px wide) with all its decorations. */
function GrassTile({ visual }: { visual: PhaseVisual }) {
  return (
    <View style={styles.tile}>
      <Skyline main={visual.grass} tip={visual.grassBlade} />
      <Specks dark={visual.grassDark} bright={visual.grassBlade} />
      {FLOWERS.map((x, i) => (
        <View key={`f${i}`} style={{ position: 'absolute', bottom: SOIL + 8, left: x }}>
          <PixelArt
            rows={FLOWER}
            cell={4}
            map={{ p: visual.flower, y: '#ffe9a8', g: visual.grassDark, D: visual.grassBlade }}
          />
        </View>
      ))}
      {TUFTS.map((x, i) => (
        <SwayTuft key={`t${i}`} left={x} bright={visual.grassBlade} dark={visual.grassDark} />
      ))}
      {BLADES.map((b, i) => (
        <BladeGroup
          key={`b${i}`}
          left={b.x}
          fps={b.fps}
          seed={b.seed}
          bright={visual.grassBlade}
          main={visual.grass}
        />
      ))}
    </View>
  )
}

/**
 * Tall pixel-grass band with a curvy skyline, swaying blades, tufts and
 * flowers. Built from identical TILE-wide tiles so it can scroll seamlessly:
 * while `traveling` the whole row slides left in whole-pixel steps and wraps
 * every TILE, making the ground rush by beneath the (centred) walking hero.
 */
export function SceneGrass({ visual, traveling }: { visual: PhaseVisual; traveling: boolean }) {
  const { width } = useWindowDimensions()
  const offset = useScroll(traveling, TILE, SCROLL_STEP, SCROLL_FPS)
  const tiles = Math.ceil(width / TILE) + 2
  return (
    <View style={[styles.band, { height: GRASS_HEIGHT }]} pointerEvents="none">
      <View style={[styles.fill, { top: JAG, backgroundColor: visual.grass }]} />
      <View style={[styles.soil, { height: SOIL, backgroundColor: visual.soil }]} />
      <Animated.View
        style={[styles.scroller, { transform: [{ translateX: Animated.multiply(offset, -1) }] }]}
      >
        {Array.from({ length: tiles }, (_, i) => (
          <View key={i} style={styles.tileSlot}>
            <GrassTile visual={visual} />
          </View>
        ))}
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  band: { position: 'absolute', left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  scroller: { position: 'absolute', left: 0, top: 0, bottom: 0, flexDirection: 'row' },
  tileSlot: { width: TILE },
  tile: { width: TILE, height: GRASS_HEIGHT },
  skyline: {
    position: 'absolute',
    left: 0,
    top: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: JAG,
    width: TILE,
  },
  fill: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  soil: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  tuft: { position: 'absolute', bottom: SOIL + 2 },
  blades: {
    position: 'absolute',
    bottom: GRASS_HEIGHT - JAG,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
})
