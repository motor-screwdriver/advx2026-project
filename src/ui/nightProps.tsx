import { Image as ExpoImage } from 'expo-image'
import React, { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'

import { ATMO, type SpriteEntry } from '../../assets/manifest'

/**
 * Standing props of the night world (art: tools/pixellab_nature.py, the
 * PixelLab prop pack). They ride PropStrip conveyors speed-matched to the
 * parallax bands, so the camera stays glued to the hero while windmills,
 * lantern posts, runestones and the old oak stream past him.
 */

export interface PropItem {
  sprite: SpriteEntry
  x: number // fraction of the loop width
  height: number
  sway?: boolean
}

/** px/ms scroll speed of a parallax band — strips reuse the exact clock. */
export function bandSpeed(sprite: SpriteEntry, height: number, duration: number) {
  return (height * sprite.frameWidth) / sprite.frameHeight / duration
}

/** Far skyline silhouettes on the mountain clock, roofs peeking over pines. */
export function farPropItems(H: number): PropItem[] {
  return [
    { sprite: ATMO.prop_windmill, x: 0.18, height: H * 0.14 },
    { sprite: ATMO.prop_castle, x: 0.68, height: H * 0.16 },
  ]
}

/** Ground run: everything the hero keeps passing, planted on the grass.
 * Heights are sized against the ~0.19H hero (reference: lantern shoulder-high,
 * oak roughly twice the knight). */
export function groundPropItems(H: number): PropItem[] {
  return [
    { sprite: ATMO.big_tree_night, x: 0.08, height: H * 0.34, sway: true },
    { sprite: ATMO.prop_fence, x: 0.2, height: H * 0.07 },
    { sprite: ATMO.prop_lantern, x: 0.3, height: H * 0.14 },
    { sprite: ATMO.prop_bush, x: 0.38, height: H * 0.065 },
    { sprite: ATMO.prop_runestone, x: 0.5, height: H * 0.12 },
    { sprite: ATMO.prop_mushrooms, x: 0.59, height: H * 0.055 },
    { sprite: ATMO.prop_stump_owl, x: 0.68, height: H * 0.1 },
    { sprite: ATMO.prop_campfire, x: 0.78, height: H * 0.075 },
    { sprite: ATMO.prop_crystal, x: 0.9, height: H * 0.1 },
  ]
}

/** One prop inside a strip; trees get a slow wind sway about their roots. */
function PropSprite({
  sprite,
  left,
  height,
  sway,
}: {
  sprite: SpriteEntry
  left: number
  height: number
  sway?: boolean
}) {
  const width = (height * sprite.frameWidth) / sprite.frameHeight
  const t = useSharedValue(0)
  useEffect(() => {
    if (sway) t.value = withRepeat(withTiming(1, { duration: 4600 }), -1, true)
  }, [t, sway])
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: sway ? `${(t.value - 0.5) * 2.4}deg` : '0deg' }],
  }))
  return (
    <Animated.View
      style={[
        { position: 'absolute', left, bottom: 0, width, height, transformOrigin: '50% 100%' },
        style,
      ]}
    >
      <ExpoImage source={sprite.source} style={{ width, height }} contentFit="contain" />
    </Animated.View>
  )
}

/**
 * A strip of standing props scrolling left and wrapping over loopW. Speed is
 * passed as px/ms and matched to the parallax band the strip rides on, so
 * props read as planted in that band while the hero runs past them.
 */
export function PropStrip({
  items,
  loopW,
  height,
  top,
  speed,
}: {
  items: PropItem[]
  loopW: number
  height: number
  top: number
  speed: number
}) {
  const x = useSharedValue(0)
  useEffect(() => {
    x.value = withRepeat(
      withTiming(-loopW, { duration: loopW / speed, easing: Easing.linear }),
      -1,
      false,
    )
  }, [x, loopW, speed])
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }))
  return (
    <Animated.View style={[styles.strip, { top, height, width: loopW * 2 }, style]}>
      {[0, 1].map((copy) =>
        items.map((p, i) => {
          const w = (p.height * p.sprite.frameWidth) / p.sprite.frameHeight
          return (
            <PropSprite
              key={`${copy}-${i}`}
              sprite={p.sprite}
              left={copy * loopW + p.x * loopW - w / 2}
              height={p.height}
              sway={p.sway}
            />
          )
        }),
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  strip: { position: 'absolute', left: 0 },
})
