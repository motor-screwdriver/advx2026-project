import React from 'react'
import { Animated, Image, StyleSheet, useWindowDimensions, View } from 'react-native'
import { ATMO, SpriteEntry } from '../../assets/manifest'
import { DayPhase } from './timeOfDay'
import { useCycle } from './usePixelMotion'

/**
 * Sun / moon orb rendered from a generated pixel-art sprite (ATMO manifest).
 * The sun sprite bakes its rays into the image and pulses in discrete frames;
 * the crescent moon rises quietly without a pulse.
 */
const BOX = 150
const C = BOX / 2

/** Discrete pulse so the sun breathes in pixel steps, not a smooth ease. */
const PULSE = [1, 1.08, 1.14, 1.08, 1, 0.94] as const

const ORBS: Record<DayPhase, SpriteEntry> = {
  morning: ATMO.sun_morning,
  day: ATMO.sun_day,
  evening: ATMO.sun_evening,
  night: ATMO.moon_night,
}

/** The moon sprite is drawn slightly smaller than the rayed sun. */
const ORB_SIZE: Record<DayPhase, number> = {
  morning: BOX,
  day: BOX,
  evening: BOX,
  night: 110,
}

const ORB_TOP: Record<DayPhase, number> = {
  morning: 0.2,
  day: 0.08,
  evening: 0.16,
  night: 0.1,
}
const ORB_LEFT: Record<DayPhase, number> = {
  morning: 0.12,
  day: 0.68,
  evening: 0.7,
  night: 0.66,
}

export function SceneSun({ phase }: { phase: DayPhase }) {
  const { width } = useWindowDimensions()
  const scale = useCycle(PULSE, 4)
  const size = ORB_SIZE[phase]
  const image = (
    <Image source={ORBS[phase].source} style={{ width: size, height: size }} resizeMode="contain" />
  )
  return (
    <View
      style={[styles.box, { top: `${ORB_TOP[phase] * 100}%`, left: width * ORB_LEFT[phase] - C }]}
      pointerEvents="none"
    >
      {phase === 'night' ? (
        image
      ) : (
        <Animated.View style={{ transform: [{ scale }] }}>{image}</Animated.View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  box: {
    position: 'absolute',
    width: BOX,
    height: BOX,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
