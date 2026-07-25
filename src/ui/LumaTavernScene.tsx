import React, { useEffect, useState } from 'react'
import { Image, StyleSheet, View } from 'react-native'

import { LUMA } from '../../assets/manifest'
import type { StageSize } from './lumaTavernLayout'
import { useReducedMotion } from './useReducedMotion'

export type TavernVariant = 'welcome' | 'question' | 'result' | 'morning'

interface FrameSet {
  env: readonly number[]
  blink: number
  talk: readonly number[]
}

/** Frame indices into SOURCES: ambient ping-pong cycle, blink, talking mouths. */
const FRAMES: Record<TavernVariant, FrameSet> = {
  welcome: {
    env: [0, 1, 2, 3],
    blink: 4,
    talk: [0, 5, 6, 5],
  },
  question: {
    env: [0, 1, 2, 3],
    blink: 4,
    talk: [0, 5, 6, 5],
  },
  result: {
    env: [0, 1, 2],
    blink: 3,
    talk: [0],
  },
  morning: {
    env: [0, 1, 2],
    blink: 3,
    talk: [0, 4, 5, 4],
  },
}

const SOURCES: Record<TavernVariant, readonly number[]> = {
  welcome: [
    LUMA.s1_base_start.source,
    LUMA.s1_env2_start.source,
    LUMA.s1_env3_start.source,
    LUMA.s1_env4_start.source,
    LUMA.s1_blink_start.source,
    LUMA.s1_talk_half_start.source,
    LUMA.s1_talk_open_start.source,
  ],
  question: [
    LUMA.s1_base.source,
    LUMA.s1_env2.source,
    LUMA.s1_env3.source,
    LUMA.s1_env4.source,
    LUMA.s1_blink.source,
    LUMA.s1_talk_half.source,
    LUMA.s1_talk_open.source,
  ],
  result: [LUMA.s2_base.source, LUMA.s2_env2.source, LUMA.s2_env3.source, LUMA.s2_blink.source],
  morning: [
    LUMA.morning_base.source,
    LUMA.morning_env2.source,
    LUMA.morning_env3.source,
    LUMA.morning_blink.source,
    LUMA.morning_talk_half.source,
    LUMA.morning_talk_open.source,
  ],
}

/** Candle/fireplace flicker: ping-pong through the environment frames. */
function useEnvCycle(enabled: boolean, count: number): number {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    setIdx(0)
    if (!enabled || count < 2) {
      return
    }
    const path: number[] = []
    for (let i = 0; i < count; i += 1) {
      path.push(i)
    }
    for (let i = count - 2; i >= 1; i -= 1) {
      path.push(i)
    }
    let step = 0
    const timer = setInterval(() => {
      step = (step + 1) % path.length
      setIdx(path[step])
    }, 700)
    return () => clearInterval(timer)
  }, [enabled, count])
  return idx
}

/** Random blink every ~3-6s, held for one 220ms tick. */
function useBlink(enabled: boolean): boolean {
  const [blink, setBlink] = useState(false)
  useEffect(() => {
    if (!enabled) {
      setBlink(false)
      return
    }
    let next = 12 + Math.floor(Math.random() * 12)
    let count = 0
    const timer = setInterval(() => {
      count += 1
      if (count >= next) {
        setBlink(true)
        count = 0
        next = 12 + Math.floor(Math.random() * 14)
      } else {
        setBlink(false)
      }
    }, 220)
    return () => clearInterval(timer)
  }, [enabled])
  return blink
}

/** Mouth cycle while Luma speaks: closed -> half -> open -> half. */
function useTalkCycle(enabled: boolean): number {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    setIdx(0)
    if (!enabled) {
      return
    }
    const timer = setInterval(() => setIdx((i) => (i + 1) % 4), 150)
    return () => clearInterval(timer)
  }, [enabled])
  return idx
}

/**
 * Full-screen tavern scene with Luma. The hand-drawn frames are swapped whole
 * (they are opaque full-screen paintings): ambient environment loop, random
 * blinks, and a mouth cycle while `speaking`. Reduced motion freezes on base.
 */
export function LumaTavernScene({
  variant,
  speaking,
  stage,
}: {
  variant: TavernVariant
  speaking: boolean
  stage: StageSize
}) {
  const reduced = useReducedMotion()
  const frames = FRAMES[variant]
  const talking = speaking && !reduced && frames.talk.length > 1
  const envIdx = useEnvCycle(!reduced && !talking, frames.env.length)
  const blink = useBlink(!reduced && !talking)
  const talkIdx = useTalkCycle(talking)

  let active = frames.env[envIdx]
  if (blink) {
    active = frames.blink
  }
  if (talking) {
    active = frames.talk[talkIdx % frames.talk.length]
  }

  return (
    <View
      style={{ width: stage.width, height: stage.height }}
      accessible
      accessibilityLabel="Luma at the Hearthlight Tavern"
    >
      {SOURCES[variant].map((source, i) => (
        <Image
          key={source}
          source={source}
          resizeMode="stretch"
          fadeDuration={0}
          importantForAccessibility="no-hide-descendants"
          style={[
            styles.frame,
            { width: stage.width, height: stage.height, opacity: 0 },
            i === active && styles.frameActive,
          ]}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  frame: { position: 'absolute', top: 0, left: 0 },
  frameActive: { opacity: 1 },
})
