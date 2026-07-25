import { Image as ExpoImage } from 'expo-image'
import React, { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'

import { type SpriteEntry } from '../../assets/manifest'

/**
 * Animated sprite primitives of the night world (NightWorld.tsx composes
 * them). All motion runs on the Reanimated UI thread.
 */

/** Deterministic PRNG so the star field is stable between renders. */
export function mulberry(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** One parallax band: a row of identical tiles scrolling left, wrapping seamlessly. */
export function ScrollBand({
  sprite,
  height,
  top,
  duration,
  screenW,
}: {
  sprite: SpriteEntry
  height: number
  top: number
  duration: number
  screenW: number
}) {
  const tileW = (height * sprite.frameWidth) / sprite.frameHeight
  const count = Math.ceil((screenW * 2) / tileW) + 1
  const x = useSharedValue(0)
  useEffect(() => {
    x.value = withRepeat(withTiming(-tileW, { duration, easing: Easing.linear }), -1, false)
  }, [x, tileW, duration])
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }))
  return (
    <Animated.View style={[styles.band, { top, height }, style]}>
      {Array.from({ length: count }).map((_, i) => (
        <ExpoImage
          key={i}
          source={sprite.source}
          style={{ width: tileW, height }}
          contentFit="fill"
          transition={500}
        />
      ))}
    </Animated.View>
  )
}

/** A twinkling star: opacity breathes on its own slow clock. */
export function Star({
  left,
  top,
  size,
  delay,
}: {
  left: number
  top: number
  size: number
  delay: number
}) {
  const t = useSharedValue(0)
  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 1800 + (delay % 1400) }), -1, true),
    )
  }, [t, delay])
  const style = useAnimatedStyle(() => ({ opacity: 0.25 + t.value * 0.75 }))
  return (
    <Animated.View
      style={[{ position: 'absolute', left, top, width: size, height: size }, styles.star, style]}
    />
  )
}

/** A cloud drifting right-to-left on its own clock, wrapping off-screen. */
export function Cloud({
  sprite,
  top,
  height,
  duration,
  delay,
  opacity,
  screenW,
}: {
  sprite: SpriteEntry
  top: number
  height: number
  duration: number
  delay: number
  opacity: number
  screenW: number
}) {
  const width = (height * sprite.frameWidth) / sprite.frameHeight
  const t = useSharedValue(0)
  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false),
    )
  }, [t, duration, delay])
  const style = useAnimatedStyle(() => ({
    opacity,
    transform: [{ translateX: screenW + width - t.value * (screenW + width * 2) }],
  }))
  return (
    <Animated.View style={[{ position: 'absolute', top, width, height }, style]}>
      <ExpoImage source={sprite.source} style={{ width, height }} contentFit="fill" />
    </Animated.View>
  )
}

/** A falling leaf: drops off-screen and respawns, swaying and spinning. */
export function Leaf({
  sprite,
  left,
  size,
  delay,
  duration,
  screenH,
}: {
  sprite: SpriteEntry
  left: number
  size: number
  delay: number
  duration: number
  screenH: number
}) {
  const t = useSharedValue(0)
  const sway = useSharedValue(0)
  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false),
    )
    sway.value = withDelay(delay, withRepeat(withTiming(1, { duration: 1600 }), -1, true))
  }, [t, sway, delay, duration])
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: -60 + t.value * (screenH + 120) },
      { translateX: (sway.value - 0.5) * 36 },
      { rotate: `${t.value * 540}deg` },
    ],
  }))
  return (
    <Animated.View
      style={[{ position: 'absolute', left, top: 0, width: size, height: size }, style]}
    >
      <ExpoImage
        source={sprite.source}
        style={{ width: size, height: size }}
        contentFit="contain"
      />
    </Animated.View>
  )
}

/** A single firefly: slow diagonal drift plus a gentle glow pulse. */
export function Firefly({
  left,
  top,
  size,
  delay,
}: {
  left: number
  top: number
  size: number
  delay: number
}) {
  const t = useSharedValue(0)
  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(
        withSequence(withTiming(1, { duration: 2600 }), withTiming(0, { duration: 2600 })),
        -1,
        false,
      ),
    )
  }, [t, delay])
  const style = useAnimatedStyle(() => ({
    opacity: 0.25 + t.value * 0.6,
    transform: [{ translateX: t.value * 14 }, { translateY: -t.value * 10 }],
  }))
  return (
    <Animated.View
      style={[
        { position: 'absolute', left, top, width: size, height: size, borderRadius: size / 2 },
        styles.firefly,
        style,
      ]}
    />
  )
}

const styles = StyleSheet.create({
  band: { position: 'absolute', left: 0, flexDirection: 'row' },
  star: { backgroundColor: '#cfe0ff' },
  firefly: {
    backgroundColor: '#ffe9a6',
    shadowColor: '#ffe9a6',
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },
})
