import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, Pressable, StyleSheet, Text } from 'react-native'

import { HintStrip, RoundPips, TapButtonVisual, TetherBar, TetherScene } from './SoulTetherParts'
import {
  ROUNDS_TO_WIN,
  ROUND_COUNT,
  isHit,
  roundZoneWidth,
  type GoldenZone,
} from './soulTetherLogic'
import { strings } from './strings'
import { WoodPanel, tavernColors } from './tavern'
import { theme } from './theme'

/** Copy from the soul tether mockup that has no strings.ts key yet (local only). */
const copy = { of: 'OF' } as const

/**
 * Cursor speed per round (ms per half-sweep). Round 1 is forgiving so the
 * player learns the timing; later rounds stay tense. Speed is the difficulty
 * knob together with the shrinking zone — too fast feels broken, not hard,
 * because touch latency alone eats ~20% of the bar.
 */
const ROUND_MS = [1400, 1200, 1000] as const

interface Props {
  onResult: (success: boolean) => void
}

function makeZone(round: number): GoldenZone {
  const widthPct = roundZoneWidth(round)
  return { startPct: Math.random() * (100 - widthPct), widthPct }
}

/** Soul Tether: oscillating cursor, tap ANYWHERE inside the golden zone. */
export function SoulTether({ onResult }: Props) {
  const [round, setRound] = useState(0)
  const [results, setResults] = useState<boolean[]>([])
  const [zone, setZone] = useState<GoldenZone>(() => makeZone(0))
  const [feedback, setFeedback] = useState<string | null>(null)
  const tether = useTetherCursor()

  const tap = () => {
    if (!tether.armed.current) {
      return
    }
    tether.armed.current = false
    tether.oscillation.current?.stop()
    const hit = isHit(tether.cursorPct.current * 100, zone)
    const nextResults = [...results, hit]
    setResults(nextResults)
    setFeedback(hit ? strings.soul_hit : strings.soul_miss)
    if (round >= ROUND_COUNT - 1) {
      const hits = nextResults.filter(Boolean).length
      onResult(hits >= ROUNDS_TO_WIN)
      return
    }
    const nextRound = round + 1
    setRound(nextRound)
    setZone(makeZone(nextRound))
    setTimeout(() => tether.startOscillation(ROUND_MS[nextRound]), 400)
  }

  return (
    // onPressIn: the hit must register at touch-down, not finger-lift,
    // otherwise the cursor visibly leaves the zone before the tap lands.
    <Pressable style={styles.game} onPressIn={tap}>
      <WoodPanel rivets={false} style={styles.roundPill} contentStyle={styles.roundPillWell}>
        <Text style={styles.roundText}>
          {strings.soul_round.toUpperCase()} {round + 1} {copy.of} {ROUND_COUNT}
        </Text>
      </WoodPanel>
      <RoundPips results={results} />
      <TetherScene />
      <TetherBar cursor={tether.cursor} zone={zone} />
      <HintStrip feedback={feedback} />
      <TapButtonVisual />
      <Text style={styles.goal}>{strings.soul_goal}</Text>
    </Pressable>
  )
}

/** Cursor oscillation machinery, kept apart to stay under the line budget. */
function useTetherCursor() {
  const cursor = useRef(new Animated.Value(0)).current
  const cursorPct = useRef(0)
  const oscillation = useRef<Animated.CompositeAnimation | null>(null)
  const armed = useRef(true) // ignore taps while the cursor is paused

  useEffect(() => {
    const id = cursor.addListener(({ value }) => {
      cursorPct.current = value
    })
    return () => cursor.removeListener(id)
  }, [cursor])

  // JS driver (not native): we must read the cursor position on tap.
  const startOscillation = useCallback(
    (halfSweepMs: number) => {
      cursor.setValue(0)
      armed.current = true
      const timing = (toValue: number) =>
        Animated.timing(cursor, { toValue, duration: halfSweepMs, useNativeDriver: false })
      oscillation.current = Animated.loop(Animated.sequence([timing(1), timing(0)]))
      oscillation.current.start()
    },
    [cursor],
  )

  useEffect(() => {
    startOscillation(ROUND_MS[0])
    return () => oscillation.current?.stop()
  }, [startOscillation])

  return { cursor, cursorPct, oscillation, armed, startOscillation }
}

const styles = StyleSheet.create({
  game: { gap: theme.spacing(3) },
  roundPill: { alignSelf: 'center' },
  roundPillWell: { paddingVertical: theme.spacing(2), paddingHorizontal: theme.spacing(4) },
  roundText: {
    ...theme.type.label,
    color: tavernColors.goldLight,
    letterSpacing: 2,
    textAlign: 'center',
  },
  goal: { ...theme.type.label, color: theme.colors.textDim, textAlign: 'center' },
})
