import React from 'react'
import { ImageBackground, Pressable, StyleSheet, View } from 'react-native'

import { strings } from '../ui/strings'
import { MorningGlow, type GlowSpec } from './MorningGlow'

/** Sheet sliced from assets/death_screen by tools/death_slice.py. */
const SHEET = require('../../assets/design/gen/death/sheet.png')

/**
 * Geometry measured in the 2160x3840 mockup. Title, graveyard, the
 * "0 HP - THE WATCH ENDS" panel with empty hearts and both button plates
 * are baked into the art; we overlay only the two hotspots.
 */
const SRC = {
  w: 2160,
  h: 3840,
  soulTether: { x: 190, y: 2990, w: 1780, h: 360 },
  letGo: { x: 430, y: 3435, w: 1300, h: 230 },
} as const

/** Breathing glow anchored on the moon, same sprite as the morning sheets. */
const MOON_GLOW: GlowSpec = {
  x: 392,
  y: 972,
  r: 480,
  color: '#cdd8ec',
  peak: 0.22,
  mode: 'breathe',
}

interface SheetProps {
  width: number
  /** Label reflects the actual action: soul tether or phoenix feather. */
  tetherLabel: string
  /** When false the gold plate is dimmed and inert (no charge, no feather). */
  tetherEnabled: boolean
  onTether: () => void
  onLetGo: () => void
}

/**
 * Full-bleed death screen: the mockup sheet itself with a breathing moon
 * glow and two button hotspots over the baked SOUL TETHER / LET GO plates.
 */
export function DeathSheet({ width, tetherLabel, tetherEnabled, onTether, onLetGo }: SheetProps) {
  const k = width / SRC.w
  const tether = SRC.soulTether
  const letGo = SRC.letGo
  return (
    <ImageBackground source={SHEET} style={{ width, height: SRC.h * k }}>
      <MorningGlow spec={MOON_GLOW} k={k} />
      {tetherEnabled ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tetherLabel}
          onPress={onTether}
          style={({ pressed }) => [rect(tether, k), pressed && styles.pressed]}
        />
      ) : (
        <View style={[rect(tether, k), styles.disabled]} />
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={strings.death_let_go}
        onPress={onLetGo}
        style={({ pressed }) => [rect(letGo, k), pressed && styles.pressed]}
      />
    </ImageBackground>
  )
}

function rect(r: { x: number; y: number; w: number; h: number }, k: number) {
  return {
    position: 'absolute' as const,
    left: r.x * k,
    top: r.y * k,
    width: r.w * k,
    height: r.h * k,
  }
}

const styles = StyleSheet.create({
  pressed: { backgroundColor: '#00000030' },
  disabled: { backgroundColor: '#000000a0', borderRadius: 6 },
})
