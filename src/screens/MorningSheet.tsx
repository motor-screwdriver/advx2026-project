import React from 'react'
import { ImageBackground, Pressable, StyleSheet, Text } from 'react-native'

import type { NightOutcome } from '../contracts/types'
import { strings } from '../ui/strings'
import { theme } from '../ui/theme'
import { MorningGlow, type GlowSpec } from './MorningGlow'

/**
 * Sheets sliced from assets/night_screens by tools/night_slice.py.
 * Only frame 1 is used: the *_f2 mockups are full re-renders with shifted
 * panel/title geometry, so flipping between them pulsed the whole screen.
 */
const SHEETS: Record<NightOutcome, number> = {
  PERFECT: require('../../assets/design/gen/night/perfect_1.png'),
  GOOD: require('../../assets/design/gen/night/good_1.png'),
  BAD: require('../../assets/design/gen/night/bad_1.png'),
  TERRIBLE: require('../../assets/design/gen/night/terrible_1.png'),
  MISSED: require('../../assets/design/gen/night/missed_1.png'),
}

/**
 * Geometry measured in the 2160x3840 mockup sheets (tools/night_slice.py).
 * Rewards and titles are baked into the art; we overlay only the streak
 * value inside the empty leaf plaque and a CONTINUE hotspot. MISSED has no
 * plaque, so it gets no streak overlay.
 */
const SRC = {
  w: 2160,
  h: 3840,
  continueBtn: { x: 304, y: 3236, w: 1550, h: 410 },
  fontPx: 64,
} as const

const PLAQUES: Partial<Record<NightOutcome, { x: number; y: number; w: number; h: number }>> = {
  PERFECT: { x: 544, y: 2876, w: 1066, h: 310 },
  GOOD: { x: 536, y: 2894, w: 1068, h: 320 },
  BAD: { x: 530, y: 2877, w: 1080, h: 330 },
  TERRIBLE: { x: 556, y: 2866, w: 1040, h: 310 },
}

/** Glow anchors measured on the frame-1 art: sun / lightning / fog centers. */
const GLOWS: Record<NightOutcome, GlowSpec> = {
  PERFECT: { x: 1056, y: 760, r: 620, color: '#ffd991', peak: 0.35, mode: 'breathe' },
  GOOD: { x: 1072, y: 1056, r: 540, color: '#ffb36b', peak: 0.3, mode: 'breathe' },
  BAD: { x: 1080, y: 560, r: 700, color: '#b9c8da', peak: 0.16, mode: 'breathe' },
  TERRIBLE: { x: 864, y: 728, r: 760, color: '#cfd9ff', peak: 0.55, mode: 'flicker' },
  MISSED: { x: 1160, y: 2050, r: 620, color: '#eef3f6', peak: 0.2, mode: 'breathe' },
}

interface SheetProps {
  width: number
  outcome: NightOutcome
  streak: number
  onContinue: () => void
}

/**
 * Full-bleed morning result: the mockup sheet itself (title, scene, baked
 * rewards, CONTINUE plate) with a breathing glow over the sun/lightning,
 * the streak value overlaid in the empty plaque and a CONTINUE hotspot.
 */
export function MorningSheet({ width, outcome, streak, onContinue }: SheetProps) {
  const k = width / SRC.w
  const sheet = SHEETS[outcome]
  const plaque = PLAQUES[outcome]
  const btn = SRC.continueBtn
  return (
    <ImageBackground source={sheet} style={{ width, height: SRC.h * k }}>
      <MorningGlow spec={GLOWS[outcome]} k={k} />
      {plaque && (
        <Text
          style={[
            styles.streak,
            {
              left: plaque.x * k,
              top: plaque.y * k,
              width: plaque.w * k,
              height: plaque.h * k,
              fontSize: SRC.fontPx * k,
              lineHeight: plaque.h * k,
            },
          ]}
          numberOfLines={1}
        >
          {`${strings.stat_streak} ${streak}`}
        </Text>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={strings.morning_continue}
        onPress={onContinue}
        style={({ pressed }) => [
          {
            position: 'absolute',
            left: btn.x * k,
            top: btn.y * k,
            width: btn.w * k,
            height: btn.h * k,
          },
          pressed && styles.pressed,
        ]}
      />
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  streak: {
    position: 'absolute',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    fontFamily: theme.fontFamily,
    color: '#e8c77f',
    letterSpacing: 2,
  },
  pressed: {
    backgroundColor: '#00000030',
  },
})
