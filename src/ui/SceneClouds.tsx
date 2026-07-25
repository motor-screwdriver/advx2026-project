import { Image as ExpoImage } from 'expo-image'
import React, { useEffect } from 'react'
import { StyleSheet, useWindowDimensions } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'

import { ATMO, type SpriteEntry } from '../../assets/manifest'
import { DayPhase } from './timeOfDay'

/**
 * Pixel-art cloud sprites that drift across the sky. Motion runs on the
 * Reanimated UI thread so taps/navigation on the JS thread can't stall them.
 */
const CLOUD_A: Record<DayPhase, SpriteEntry> = {
  morning: ATMO.cloud_a_morning,
  day: ATMO.cloud_a_day,
  evening: ATMO.cloud_a_evening,
  night: ATMO.cloud_a_night,
}

const CLOUD_B: Record<DayPhase, SpriteEntry> = {
  morning: ATMO.cloud_b_morning,
  day: ATMO.cloud_b_day,
  evening: ATMO.cloud_b_evening,
  night: ATMO.cloud_b_night,
}

interface CloudDef {
  sprites: Record<DayPhase, SpriteEntry>
  /** Rendered width in px; height scales to keep the frame aspect. */
  width: number
  top: number
  /** Whole-pixel step size; duration is derived from span / (stepPx * fps). */
  stepPx: number
  fps: number
}

const CLOUDS: readonly CloudDef[] = [
  { sprites: CLOUD_A, width: 190, top: 0.14, stepPx: 1, fps: 18 },
  { sprites: CLOUD_B, width: 110, top: 0.26, stepPx: 1, fps: 14 },
  { sprites: CLOUD_A, width: 150, top: 0.08, stepPx: 2, fps: 16 },
  { sprites: CLOUD_B, width: 90, top: 0.36, stepPx: 1, fps: 12 },
]

function Cloud({ def, phase }: { def: CloudDef; phase: DayPhase }) {
  const { width, height } = useWindowDimensions()
  const sprite = def.sprites[phase]
  const cloudH = (def.width * sprite.frameHeight) / sprite.frameWidth
  const from = -def.width
  const to = width + 20
  const x = useSharedValue(from)

  useEffect(() => {
    const span = to - from
    const duration = (span / def.stepPx) * (1000 / def.fps)
    x.value = from
    x.value = withRepeat(withTiming(to, { duration, easing: Easing.linear }), -1, false)
  }, [x, from, to, def.stepPx, def.fps])

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }))

  return (
    <Animated.View style={[styles.cloud, { top: height * def.top }, style]}>
      <ExpoImage
        source={sprite.source}
        contentFit="fill"
        style={{ width: def.width, height: cloudH }}
        cachePolicy="memory-disk"
        transition={0}
      />
    </Animated.View>
  )
}

export function SceneClouds({ phase }: { phase: DayPhase }) {
  return (
    <>
      {CLOUDS.map((def, i) => (
        <Cloud key={i} def={def} phase={phase} />
      ))}
    </>
  )
}

const styles = StyleSheet.create({
  cloud: { position: 'absolute', left: 0 },
})
