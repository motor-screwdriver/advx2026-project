import { useFocusEffect } from 'expo-router'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { playMusic } from '../systems/audio'
import { DayNightBackground } from '../ui/DayNightBackground'
import { useScreenTransition } from '../ui/screenTransition'
import { strings } from '../ui/strings'
import { GoldButton, WoodPanel } from '../ui/tavern'
import { theme } from '../ui/theme'
import { getDayPhase, type DayPhase } from '../ui/timeOfDay'
import { useGame } from '../ui/useGame'
import { DevTools } from './DevTools'
import { AsleepHUD, HeroStage } from './HomeSleepStage'

const MAX_HP = 7

export function HomeScreen() {
  const { state } = useGame()
  return state.hero ? <HeroHome /> : <NoHeroHome />
}

function NoHeroHome() {
  const go = useScreenTransition()
  return (
    <HomeScene phase={getDayPhase()}>
      <View style={styles.emptyBox}>
        <WoodPanel contentStyle={styles.emptyWell}>
          <Text style={styles.empty}>{strings.home_no_hero}</Text>
          <GoldButton
            label={strings.onboarding_begin}
            onPress={() => go('/onboarding', { replace: true })}
          />
        </WoodPanel>
      </View>
    </HomeScene>
  )
}

/** Cozy day theme while awake; hushed night theme once tucked in. */
function usePhaseMusic(asleep: boolean) {
  useEffect(() => {
    playMusic(asleep ? 'music_night' : 'music_day')
  }, [asleep])
}

/** WAKE UP pushes to /death or /morning-scene and keeps Home mounted below
 * the stack; wakeNow() flips the game state synchronously, but Home should
 * only render that new state once it's actually back in focus — otherwise
 * the world/UI underneath swaps the instant the button is tapped and
 * flashes behind the sliding push transition. Re-entrant taps caused
 * phantom wakes/self-sleeps, so the tap lock resets on the same refocus. */
function useHomeFocusGate(tapLock: { current: boolean }) {
  const [focused, setFocused] = useState(true)
  useFocusEffect(
    useCallback(() => {
      tapLock.current = false
      setFocused(true)
      return () => setFocused(false)
    }, [tapLock]),
  )
  return focused
}

function HeroHome() {
  const go = useScreenTransition()
  const { state, pendingBedTime, sleepNow, wakeNow } = useGame()
  const hero = state.hero!
  const tapLock = useRef(false)
  const focused = useHomeFocusGate(tapLock)
  const asleep = pendingBedTime !== null && focused

  usePhaseMusic(asleep)

  // Tapping SLEEP tucks the hero in right here — the book crossfades into
  // the living night world in place (see HeroStage), no separate screen to
  // navigate to or glitch through. WAKE UP evaluates the night and rolls on
  // to morning.
  const onSleep = () => {
    if (pendingBedTime !== null) {
      return
    }
    sleepNow()
  }
  const onWake = () => {
    if (tapLock.current) {
      return
    }
    tapLock.current = true
    const evaluation = wakeNow()
    const hpAfter = Math.min(Math.max(state.hp + evaluation.hpDelta, 0), MAX_HP)
    go(hpAfter === 0 ? '/death' : '/morning-scene')
  }

  return (
    <View style={styles.root}>
      <HeroStage asleep={asleep} state={state} onSleep={onSleep} />
      <SafeAreaView style={styles.safe} pointerEvents="box-none">
        {asleep ? (
          <AsleepHUD hp={state.hp} xp={hero.xp} level={hero.level} onWake={onWake} />
        ) : (
          <View style={styles.stageSpacer} pointerEvents="none" />
        )}
        <DevTools />
      </SafeAreaView>
    </View>
  )
}

function HomeScene({
  phase,
  traveling = false,
  children,
}: {
  phase: DayPhase
  traveling?: boolean
  children: React.ReactNode
}) {
  return (
    <View style={styles.root}>
      <DayNightBackground phase={phase} traveling={traveling} />
      <SafeAreaView style={styles.safe}>{children}</SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  safe: {
    flex: 1,
    paddingHorizontal: theme.screenPad,
    paddingTop: theme.screenPad,
    paddingBottom: theme.screenPad,
    gap: theme.screenPad,
  },
  stageSpacer: { flex: 1 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyWell: { alignItems: 'center', gap: theme.spacing(5) },
  empty: {
    ...theme.type.body,
    color: theme.colors.text,
    textAlign: 'center',
  },
})
