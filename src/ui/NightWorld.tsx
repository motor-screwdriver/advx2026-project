import { Image as ExpoImage } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect, useMemo } from 'react'
import { StyleSheet, View, useWindowDimensions } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'

import { ATMO } from '../../assets/manifest'
import { PropStrip, bandSpeed, farPropItems, groundPropItems } from './nightProps'
import { Cloud, Firefly, Leaf, ScrollBand, Star, mulberry } from './nightSprites'

/**
 * The living night world behind the sleeping hero. Layered back to front:
 * gradient sky, twinkling stars, the cratered moon bobbing in a soft halo,
 * wispy clouds drifting on their own clocks, three seamless parallax bands
 * (moonlit mountains, pine forest, flower-dotted grass) plus two prop strips
 * riding the same clocks — a far skyline (windmill, castle) and a ground run
 * of props the hero keeps passing (swaying oak, lantern post, runestone,
 * crystals, glowing mushrooms, owl stump, campfire, bush, fence) — then
 * falling leaves and fireflies. The camera stays glued to the hero; the world
 * streams past. Sprite primitives live in nightSprites.tsx; art is the
 * PixelLab nature pack (tools/pixellab_nature.py).
 */

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

/** Sky layer: stars, the bobbing full moon and two slow clouds. */
function Sky({ W, H }: { W: number; H: number }) {
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
  const moonBob = useSharedValue(0)
  useEffect(() => {
    moonBob.value = withRepeat(withTiming(1, { duration: 7000 }), -1, true)
  }, [moonBob])
  const moonStyle = useAnimatedStyle(() => ({ transform: [{ translateY: moonBob.value * 8 }] }))
  return (
    <>
      {stars.map((s, i) => (
        <Star key={i} {...s} />
      ))}
      <Animated.View style={[{ position: 'absolute', top: H * 0.13, right: W * 0.07 }, moonStyle]}>
        <ExpoImage
          source={ATMO.moon_full.source}
          style={{ width: moonSize, height: moonSize }}
          contentFit="contain"
          cachePolicy="memory-disk"
          transition={0}
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
        delay={8000}
        opacity={0.35}
        screenW={W}
      />
    </>
  )
}

/** Mid layer: mountain and pine bands with the far skyline props between. */
function Forest({ W, H }: { W: number; H: number }) {
  const farSpeed = bandSpeed(ATMO.mountains_night, H * 0.28, 60000)
  const farItems = useMemo(() => farPropItems(H), [H])
  return (
    <>
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
    </>
  )
}

/** Ground layer: soil fill, grass band and the ground prop run. */
function Meadow({ W, H }: { W: number; H: number }) {
  const groundSpeed = bandSpeed(ATMO.grass_night, H * 0.1, 10000)
  const groundItems = useMemo(() => groundPropItems(H), [H])
  return (
    <>
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
    </>
  )
}

// Reference layout: moon clear of the HUD; mountains 0.24..0.52; pines
// 0.44..0.66; meadow at 0.74 with the feet/prop ground line at 0.79H.
export function NightWorld() {
  const { width: W, height: H } = useWindowDimensions()
  return (
    <View style={styles.root}>
      <LinearGradient colors={['#0d1834', '#0a1226', '#060a14']} style={StyleSheet.absoluteFill} />
      <Sky W={W} H={H} />
      <Forest W={W} H={H} />
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
      <Meadow W={W} H={H} />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  // exact fill_soil color of grass_night: the band melts into the fill
  soil: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#1e1612' },
})
