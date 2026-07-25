import { Image as ExpoImage } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect, useMemo } from 'react'
import { StyleSheet, View, useWindowDimensions } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'

import { ATMO, type SpriteEntry } from '../../assets/manifest'
import { PropStrip, bandSpeed, farPropItems, groundPropItems } from './nightProps'

/**
 * The living night world behind the sleeping hero. Layered back to front:
 * gradient sky, twinkling stars, the cratered moon bobbing in a soft halo,
 * wispy clouds drifting on their own clocks, three seamless parallax bands
 * (moonlit mountains, pine forest, flower-dotted grass) plus two prop strips
 * riding the same clocks — a far skyline (windmill, castle) and a ground run
 * of props the hero keeps passing (swaying oak, lantern post, runestone,
 * crystals, glowing mushrooms, owl stump, campfire, bush, fence) — then
 * falling leaves and fireflies. The camera stays glued to the hero; the world
 * streams past. All motion runs on the Reanimated UI thread; art is the
 * PixelLab nature pack (tools/pixellab_nature.py).
 */

/** Deterministic PRNG so the star field is stable between renders. */
function mulberry(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** One parallax band: a row of identical tiles scrolling left, wrapping seamlessly. */
function ScrollBand({
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
function Star({
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
function Cloud({
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
function Leaf({
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
function Firefly({
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

/** Warm firefly dots filling the dark forest hollow (fractions of W/H). */
const FIREFLIES = [
  { x: 0.12, y: 0.56, size: 4, delay: 0 },
  { x: 0.3, y: 0.63, size: 3, delay: 900 },
  { x: 0.46, y: 0.58, size: 5, delay: 600 },
  { x: 0.6, y: 0.68, size: 3, delay: 1400 },
  { x: 0.74, y: 0.6, size: 4, delay: 400 },
  { x: 0.86, y: 0.7, size: 3, delay: 1900 },
  { x: 0.22, y: 0.73, size: 4, delay: 1100 },
  { x: 0.68, y: 0.75, size: 5, delay: 2300 },
]

export function NightWorld() {
  const { width: W, height: H } = useWindowDimensions()
  const stars = useMemo(() => {
    const rand = mulberry(8)
    return Array.from({ length: 26 }, () => ({
      left: rand() * W,
      top: rand() * H * 0.4,
      size: 2 + Math.floor(rand() * 3),
      delay: Math.floor(rand() * 3200),
    }))
  }, [W, H])
  const moonSize = Math.min(W * 0.26, 120)

  // Prop strips ride the exact band clocks so every prop stays planted.
  const farSpeed = bandSpeed(ATMO.mountains_night, H * 0.28, 60000)
  const groundSpeed = bandSpeed(ATMO.grass_night, H * 0.1, 10000)
  const farItems = useMemo(() => farPropItems(H), [H])
  const groundItems = useMemo(() => groundPropItems(H), [H])

  const moonBob = useSharedValue(0)
  useEffect(() => {
    moonBob.value = withRepeat(withTiming(1, { duration: 7000 }), -1, true)
  }, [moonBob])
  const moonStyle = useAnimatedStyle(() => ({ transform: [{ translateY: moonBob.value * 8 }] }))

  // Reference layout: moon clear of the HUD; mountains 0.24..0.52; pines
  // 0.44..0.66; meadow at 0.74 with the feet/prop ground line at 0.79H.
  return (
    <View style={styles.root}>
      <LinearGradient colors={['#0d1834', '#0a1226', '#060a14']} style={StyleSheet.absoluteFill} />
      {stars.map((s, i) => (
        <Star key={i} {...s} />
      ))}
      <Animated.View style={[{ position: 'absolute', top: H * 0.13, right: W * 0.07 }, moonStyle]}>
        <ExpoImage
          source={ATMO.moon_full.source}
          style={{ width: moonSize, height: moonSize }}
          contentFit="contain"
          transition={700}
        />
      </Animated.View>
      <Cloud
        sprite={ATMO.cloud_night_a}
        top={H * 0.08}
        height={H * 0.05}
        duration={90000}
        delay={0}
        opacity={0.5}
        screenW={W}
      />
      <Cloud
        sprite={ATMO.cloud_night_b}
        top={H * 0.17}
        height={H * 0.04}
        duration={65000}
        delay={-30000}
        opacity={0.35}
        screenW={W}
      />
      <ScrollBand
        sprite={ATMO.mountains_night}
        height={H * 0.28}
        top={H * 0.24}
        duration={60000}
        screenW={W}
      />
      <PropStrip
        items={farItems}
        loopW={W * 2.5}
        height={H * 0.18}
        top={H * 0.34}
        speed={farSpeed}
      />
      <ScrollBand
        sprite={ATMO.pines_night}
        height={H * 0.22}
        top={H * 0.44}
        duration={32000}
        screenW={W}
      />
      <Leaf sprite={ATMO.leaf_a} left={W * 0.55} size={20} delay={0} duration={11000} screenH={H} />
      <Leaf
        sprite={ATMO.leaf_b}
        left={W * 0.62}
        size={14}
        delay={3500}
        duration={14000}
        screenH={H}
      />
      <Leaf
        sprite={ATMO.leaf_a}
        left={W * 0.48}
        size={16}
        delay={7000}
        duration={12500}
        screenH={H}
      />
      {FIREFLIES.map((f, i) => (
        <Firefly key={i} left={W * f.x} top={H * f.y} size={f.size} delay={f.delay} />
      ))}
      <View style={[styles.soil, { top: H * 0.8 }]} />
      <ScrollBand
        sprite={ATMO.grass_night}
        height={H * 0.1}
        top={H * 0.74}
        duration={10000}
        screenW={W}
      />
      <PropStrip
        items={groundItems}
        loopW={W * 3.5}
        height={H * 0.34}
        top={H * 0.45}
        speed={groundSpeed}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  band: { position: 'absolute', left: 0, flexDirection: 'row' },
  star: { backgroundColor: '#cfe0ff' },
  // exact fill_soil color of grass_night: the band melts into the fill
  soil: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#1e1612' },
  firefly: {
    backgroundColor: '#ffe9a6',
    shadowColor: '#ffe9a6',
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },
})
