import React from 'react'
import {
  Animated,
  ImageBackground,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
} from 'react-native'

import { ROUND_COUNT, type GoldenZone } from './soulTetherLogic'
import { strings } from './strings'
import { theme } from './theme'

/** Sheet sliced from assets/soul_tether by tools/tether_slice.py. */
const SHEET = require('../../assets/design/gen/tether/sheet.png')
const STAR = require('../../assets/design/gen/tether/star.png')

/** Copy from the soul tether mockup that has no strings.ts key yet (local only). */
const copy = { of: 'OF', hint: 'TAP IN THE GOLD ZONE' } as const

/**
 * Geometry measured in the 1125x1999 mockup. Frame, crest, title, wraith
 * scene, bar bezel, parchment and the gold plate are baked into the art;
 * the slicer wipes everything dynamic and we redraw it here.
 */
const SRC = {
  w: 1125,
  h: 1999,
  roundText: { x: 300, y: 315, w: 525, h: 64 },
  pips: { xs: [427, 562, 694], y: 441, r: 36 },
  // Cursor travel span; the zone stands on the baked baseline (y 1356-1364)
  // and the ticks hang across it, exactly like the baked zone in the mockup.
  track: { x: 91, y: 1266, w: 943, h: 98 },
  baselineY: 1360,
  tickTop: 1347,
  tickH: 26,
  tickFrom: 142,
  tickTo: 982,
  tickCount: 12,
  starPx: 96,
  hintText: { x: 215, y: 1503, w: 695, h: 100 },
  label: { x: 330, y: 1697, w: 465, h: 175 },
} as const

export interface TetherSheetProps {
  width: number
  round: number
  results: boolean[]
  zone: GoldenZone | null
  cursor: Animated.Value | null
  feedback: string | null
  feedbackDanger?: boolean
  label: string
}

function pipStyle(index: number, results: boolean[]) {
  if (index < results.length) {
    return results[index] ? styles.pipHit : styles.pipMiss
  }
  return index === results.length ? styles.pipCurrent : null
}

/** The oscillating sparkle, riding the tick line inside the bar. */
function CursorStar({ cursor, k }: { cursor: Animated.Value; k: number }) {
  const t = SRC.track
  const size = SRC.starPx * k
  const left = cursor.interpolate({
    inputRange: [0, 1],
    outputRange: [t.x * k - size / 2, (t.x + t.w) * k - size / 2],
  })
  return (
    <Animated.Image
      source={STAR}
      style={{
        position: 'absolute',
        left,
        top: SRC.baselineY * k - size / 2,
        width: size,
        height: size,
      }}
    />
  )
}

/** The three round pips under the ROUND text. */
function Pips({ results, k }: { results: boolean[]; k: number }) {
  return (
    <>
      {SRC.pips.xs.map((x, index) => (
        <View
          key={index}
          style={[
            styles.pip,
            {
              left: (x - SRC.pips.r) * k,
              top: (SRC.pips.y - SRC.pips.r) * k,
              width: SRC.pips.r * 2 * k,
              height: SRC.pips.r * 2 * k,
              borderRadius: SRC.pips.r * k,
              borderWidth: 5 * k,
            },
            pipStyle(index, results),
          ]}
        />
      ))}
    </>
  )
}

/** Bar interior: golden zone, tick marks and the sparkle cursor. */
function Track(props: { zone: GoldenZone | null; cursor: Animated.Value | null; k: number }) {
  const { zone, cursor, k } = props
  const t = SRC.track
  const tickStep = (SRC.tickTo - SRC.tickFrom) / (SRC.tickCount - 1)
  return (
    <>
      {zone && (
        <View
          style={[
            styles.zone,
            {
              left: (t.x + (zone.startPct / 100) * t.w) * k,
              top: t.y * k,
              width: (zone.widthPct / 100) * t.w * k,
              height: t.h * k,
              borderLeftWidth: 5 * k,
              borderRightWidth: 5 * k,
            },
          ]}
        />
      )}
      {Array.from({ length: SRC.tickCount }, (_, index) => (
        <View
          key={index}
          style={[
            styles.tick,
            {
              left: (SRC.tickFrom + index * tickStep - 2) * k,
              top: SRC.tickTop * k,
              width: 4 * k,
              height: SRC.tickH * k,
            },
          ]}
        />
      ))}
      {cursor && <CursorStar cursor={cursor} k={k} />}
    </>
  )
}

/**
 * Single line centered in a mockup-space box. The text never gets an explicit
 * height or lineHeight: combining those with adjustsFontSizeToFit makes RN
 * collapse the font to its minimum scale (the "invisible text" bug).
 */
function SheetText(props: {
  rect: { x: number; y: number; w: number; h: number }
  size: number
  k: number
  textStyle: StyleProp<TextStyle>
  children: string
}) {
  const { rect, size, k, textStyle, children } = props
  const frame = {
    position: 'absolute' as const,
    left: rect.x * k,
    top: rect.y * k,
    width: rect.w * k,
    height: rect.h * k,
    justifyContent: 'center' as const,
  }
  return (
    <View style={frame}>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.4}
        style={[textStyle, { fontSize: size * k }]}
      >
        {children}
      </Text>
    </View>
  )
}

/** Full-bleed Soul Tether sheet with every runtime element overlaid. */
export function SoulTetherSheet(props: TetherSheetProps) {
  const { width, round, results, zone, cursor, feedback, feedbackDanger, label } = props
  const k = width / SRC.w
  return (
    <ImageBackground source={SHEET} style={{ width, height: SRC.h * k }}>
      <SheetText rect={SRC.roundText} size={56} k={k} textStyle={styles.roundText}>
        {`${strings.soul_round.toUpperCase()} ${round + 1} ${copy.of} ${ROUND_COUNT}`}
      </SheetText>
      <Pips results={results} k={k} />
      <Track zone={zone} cursor={cursor} k={k} />
      <SheetText
        rect={SRC.hintText}
        size={70}
        k={k}
        textStyle={[styles.hintText, feedbackDanger && styles.hintDanger]}
      >
        {feedback ?? copy.hint}
      </SheetText>
      <SheetText rect={SRC.label} size={165} k={k} textStyle={styles.label}>
        {label}
      </SheetText>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  roundText: {
    textAlign: 'center',
    fontFamily: theme.fontFamily,
    color: '#e9d7a8',
    letterSpacing: 2,
  },
  pip: {
    position: 'absolute',
    backgroundColor: '#241812',
    borderColor: '#3a2a1c',
  },
  pipCurrent: { backgroundColor: '#f2c14e', borderColor: '#ffe9ad' },
  pipHit: { backgroundColor: '#c98f2c', borderColor: '#f2c14e' },
  pipMiss: { backgroundColor: '#8c3020', borderColor: '#c0503a' },
  zone: {
    position: 'absolute',
    backgroundColor: '#e0a838',
    borderColor: '#ffefc2',
  },
  tick: { position: 'absolute', backgroundColor: '#8a6a3a', opacity: 0.75 },
  hintText: {
    textAlign: 'center',
    fontFamily: theme.fontFamily,
    color: '#241a10',
    letterSpacing: 1,
  },
  hintDanger: { color: '#8c2f1f' },
  label: {
    textAlign: 'center',
    fontFamily: theme.fontFamily,
    color: '#2b1c0e',
    letterSpacing: 3,
  },
})
