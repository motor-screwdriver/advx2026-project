import { useRouter } from 'expo-router'
import React, { useEffect, useMemo, useRef } from 'react'
import { Animated, StyleSheet, View } from 'react-native'

import { useMiFitnessStore } from '../state/mifitStore'
import { useFadeIn } from '../ui/animations'
import { BookView } from '../ui/BookView'
import { HeroSprite } from '../ui/HeroSprite'
import { NightWorld } from '../ui/NightWorld'
import { theme } from '../ui/theme'
import { useGame } from '../ui/useGame'
import { Dock, TopBar } from './HomeNightDock'

// Reference proportions: the knight is ~0.19 of screen height, feet on the
// blade/soil line of the grass band (NightWorld puts it at 0.79H -> bottom 21%).
const HERO_SIZE = 148
const MAX_HP = 7
// Book <-> night-world crossfade: long enough to read as a deliberate scene
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

/** Awake: the inked character-sheet book (nav lives on the page). Asleep:
 * the living night world. Both stay mounted and simply crossfade into one
 * another right here on Home — no separate transition screen, no hard pop. */
export function HeroStage({
  asleep,
  state,
  onSleep,
}: {
  asleep: boolean
  state: ReturnType<typeof useGame>['state']
  onSleep: () => void
}) {
  const router = useRouter()
  const mifitConnected = useMiFitnessStore((s) => s.connected)
  const hero = state.hero!
  const nightFade = useAsleepProgress(asleep)
  const bookFade = useMemo(
    () => nightFade.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
    [nightFade],
  )

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: bookFade }]}
        pointerEvents={asleep ? 'none' : 'auto'}
      >
        <BookView
          heroType={hero.type}
          hp={state.hp}
          level={hero.level}
          streak={state.perfectWeekStreak}
          onSleep={onSleep}
          onBag={() => router.push('/inventory')}
          onMosaic={() => router.push('/mosaic')}
          onSettings={() => router.push('/settings')}
          onSleepPlan={mifitConnected ? () => router.push('/sleep-plan') : undefined}
        />
      </Animated.View>
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: nightFade }]}
        pointerEvents={asleep ? 'auto' : 'none'}
      >
        <NightWorld />
        <View style={styles.walkSlot} pointerEvents="none">
          <HeroSprite
            type={hero.type}
            size={HERO_SIZE}
            walking
            fps={6}
            gold={state.perfectWeekStreak >= MAX_HP}
          />
        </View>
      </Animated.View>
    </View>
  )
}

/** Night HUD (hearts/streak/level up top, WAKE UP dock at the bottom):
 * fades in and floats up gently on mount so it never just snaps into place. */
export function AsleepHUD({
  hp,
  streak,
  level,
  onWake,
}: {
  hp: number
  streak: number
  level: number
  onWake: () => void
}) {
  const fade = useFadeIn(80, 420)
  const rise = useRef(new Animated.Value(10)).current
  useEffect(() => {
    const animation = Animated.timing(rise, {
      toValue: 0,
      duration: 420,
      delay: 80,
      useNativeDriver: true,
    })
    animation.start()
    return () => animation.stop()
  }, [rise])

  return (
    <Animated.View
      style={[styles.hud, { opacity: fade, transform: [{ translateY: rise }] }]}
      pointerEvents="box-none"
    >
      <TopBar hp={hp} streak={streak} level={level} />
      <View style={styles.stageSpacer} pointerEvents="none" />
      <Dock onWake={onWake} />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  hud: { flex: 1, gap: theme.screenPad },
  stageSpacer: { flex: 1 },
  walkSlot: { position: 'absolute', left: 0, right: 0, bottom: '21%', alignItems: 'center' },
})
