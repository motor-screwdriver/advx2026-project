import React from 'react'
import { Animated, Image, StyleSheet, useWindowDimensions } from 'react-native'

import { ATMO, type SpriteEntry } from '../../assets/manifest'
import { DayPhase } from './timeOfDay'
import { useDrift } from './usePixelMotion'

/**
 * Pixel-art cloud sprites that drift across the sky in stepped whole-pixel
 * jumps. Each cloud slot uses a generated sprite pre-tinted per day phase;
 * slots keep their own height and speed so the parallax feels layered rather
 * than uniform.
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
  stepPx: number
  fps: number
}

const CLOUDS: readonly CloudDef[] = [
  { sprites: CLOUD_A, width: 190, top: 0.14, stepPx: 1, fps: 6 },
  { sprites: CLOUD_B, width: 110, top: 0.26, stepPx: 1, fps: 4 },
  { sprites: CLOUD_A, width: 150, top: 0.08, stepPx: 2, fps: 5 },
  { sprites: CLOUD_B, width: 90, top: 0.36, stepPx: 1, fps: 3 },
]

function Cloud({ def, phase }: { def: CloudDef; phase: DayPhase }) {
  const { width, height } = useWindowDimensions()
  const sprite = def.sprites[phase]
  const cloudH = (def.width * sprite.frameHeight) / sprite.frameWidth
  const x = useDrift(-def.width, width + 20, def.stepPx, def.fps)
  return (
    <Animated.View
      style={[styles.cloud, { top: height * def.top, transform: [{ translateX: x }] }]}
    >
      <Image
        source={sprite.source}
        resizeMode="stretch"
        style={{ width: def.width, height: cloudH }}
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
