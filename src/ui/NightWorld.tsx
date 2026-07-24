import { Image as ExpoImage } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect } from 'react'
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

/**
 * Endless colored night world for the book->world transition (Tier 2). Three
 * PixelLab parallax bands (distant mountains+castle, pine midground, grass
 * foreground) scroll leftwards at different speeds so the hero — always drawn
 * centred by the caller — reads as walking east forever. A crescent moon and a
 * few drifting fireflies finish the "living page" feel. All motion is on the
 * Reanimated UI thread; images come through expo-image for a soft fade-in.
 */

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

export function NightWorld() {
  const { width: W, height: H } = useWindowDimensions()
  const moon = ATMO.moon_night
  const moonSize = Math.min(W * 0.22, 96)
  return (
    <View style={styles.root}>
      <LinearGradient colors={['#1a2748', '#101a30', '#0a0d16']} style={StyleSheet.absoluteFill} />
      <ExpoImage
        source={moon.source}
        style={{
          position: 'absolute',
          top: H * 0.08,
          right: W * 0.12,
          width: moonSize,
          height: moonSize,
        }}
        contentFit="contain"
        transition={700}
      />
      <ScrollBand
        sprite={ATMO.world_night_far}
        height={H * 0.44}
        top={0}
        duration={46000}
        screenW={W}
      />
      <Firefly left={W * 0.2} top={H * 0.5} size={4} delay={0} />
      <Firefly left={W * 0.72} top={H * 0.46} size={3} delay={900} />
      <Firefly left={W * 0.5} top={H * 0.58} size={4} delay={1800} />
      <ScrollBand
        sprite={ATMO.world_night_mid}
        height={H * 0.32}
        top={H * 0.52}
        duration={24000}
        screenW={W}
      />
      <Firefly left={W * 0.34} top={H * 0.7} size={5} delay={600} />
      <Firefly left={W * 0.84} top={H * 0.74} size={4} delay={1400} />
      <ScrollBand
        sprite={ATMO.grass_night}
        height={H * 0.24}
        top={H * 0.8}
        duration={12000}
        screenW={W}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  band: { position: 'absolute', left: 0, flexDirection: 'row' },
  firefly: {
    backgroundColor: '#ffe9a6',
    shadowColor: '#ffe9a6',
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },
})
