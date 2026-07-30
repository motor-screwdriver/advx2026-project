import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, StyleSheet, View } from 'react-native'

import { useMiFitnessStore } from '../state/mifitStore'
import { useScreenTransition } from '../ui/screenTransition'
import { StartScreen } from '../ui/StartScreen'
import { useGame } from '../ui/useGame'
import { JourneyStage } from './JourneyStage'

// Book <-> night-journey crossfade: long enough to read as a deliberate scene
// change, short enough that tapping SLEEP still feels immediate.
const STAGE_FADE_MS = 550

/** 0 -> 1 as the hero falls asleep, animated on the JS-independent native
 * driver so both layers below stay perfectly in lockstep. */
function useAsleepProgress(asleep: boolean) {
  const progress = useRef(new Animated.Value(asleep ? 1 : 0)).current
  useEffect(() => {
    Animated.timing(progress, {
      toValue: asleep ? 1 : 0,
      duration: STAGE_FADE_MS,
      useNativeDriver: true,
    }).start()
  }, [asleep, progress])
  return progress
}

/** Keep the journey off the tree while awake so menu navigation isn't
 * fighting the carousel loop under an invisible layer. Stay mounted
 * through the wake crossfade, then drop. */
function useJourneyMounted(asleep: boolean) {
  const [mounted, setMounted] = useState(asleep)
  useEffect(() => {
    if (asleep) {
      setMounted(true)
      return
    }
    const id = setTimeout(() => setMounted(false), STAGE_FADE_MS)
    return () => clearTimeout(id)
  }, [asleep])
  return asleep || mounted
}

/** Awake: the start screen, the storybook waiting on the candle-lit table.
 * Asleep: the night journey — HUD, scrolling forest carousel, wake dock.
 * Crossfade in place — no separate screen. */
export function HeroStage({
  asleep,
  state,
  onSleep,
  onWake,
}: {
  asleep: boolean
  state: ReturnType<typeof useGame>['state']
  onSleep: () => void
  onWake: () => void
}) {
  const go = useScreenTransition()
  const connected = useMiFitnessStore((state) => state.connected)
  const hero = state.hero!
  const journeyFade = useAsleepProgress(asleep)
  const journeyMounted = useJourneyMounted(asleep)
  const bookFade = useMemo(
    () => journeyFade.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
    [journeyFade],
  )

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: bookFade }]}
        pointerEvents={asleep ? 'none' : 'auto'}
      >
        <StartScreen
          hp={state.hp}
          level={hero.level}
          onSleep={onSleep}
          onBag={() => go('/inventory', { effect: 'wipe' })}
          onMosaic={() => go('/mosaic', { effect: 'wipe' })}
          onSettings={() => go('/settings', { effect: 'wipe' })}
          onSleepPlan={connected ? () => go('/sleep-plan', { effect: 'wipe' }) : undefined}
        />
      </Animated.View>
      {journeyMounted && (
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: journeyFade }]}
          pointerEvents={asleep ? 'auto' : 'none'}
        >
          <JourneyStage hp={state.hp} xp={hero.xp} level={hero.level} onWake={onWake} />
        </Animated.View>
      )}
    </View>
  )
}
