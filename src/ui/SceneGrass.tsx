import React from 'react'
import { Animated, Image, StyleSheet, useWindowDimensions, View } from 'react-native'
import { ATMO, SpriteEntry } from '../../assets/manifest'
import { DayPhase } from './timeOfDay'
import { useScroll } from './usePixelMotion'

export const GRASS_HEIGHT = 210
/** One seamless ground tile; a row of identical tiles scrolls in TILE steps. */
const TILE = 384
const SCROLL_STEP = 4
const SCROLL_FPS = 12

/** Pre-tinted ground tile per day phase (grass + soil, transparent sky on top). */
const GRASS_TILES: Record<DayPhase, SpriteEntry> = {
  morning: ATMO.grass_morning,
  day: ATMO.grass_day,
  evening: ATMO.grass_evening,
  night: ATMO.grass_night,
}

/**
 * Pixel-art ground band rendered from a generated tile image (grass on top,
 * dirt filled to the bottom edge, transparent sky region). Built from
 * identical TILE-wide tiles so it can scroll seamlessly: while `traveling`
 * the whole row slides left in whole-pixel steps and wraps every TILE, making
 * the ground rush by beneath the (centred) walking hero.
 */
export function SceneGrass({ phase, traveling }: { phase: DayPhase; traveling: boolean }) {
  const { width } = useWindowDimensions()
  const offset = useScroll(traveling, TILE, SCROLL_STEP, SCROLL_FPS)
  const tiles = Math.ceil(width / TILE) + 2
  const tile = GRASS_TILES[phase]
  return (
    <View style={[styles.band, { height: GRASS_HEIGHT }]} pointerEvents="none">
      <Animated.View
        style={[styles.scroller, { transform: [{ translateX: Animated.multiply(offset, -1) }] }]}
      >
        {Array.from({ length: tiles }, (_, i) => (
          <View key={i} style={styles.tileSlot}>
            <Image
              source={tile.source}
              style={{ width: TILE, height: GRASS_HEIGHT }}
              resizeMode="stretch"
            />
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
})
