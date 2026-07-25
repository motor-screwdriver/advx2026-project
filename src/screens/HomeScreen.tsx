import { useFocusEffect, useRouter } from 'expo-router'
import React, { useCallback, useEffect, useRef } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { playMusic } from '../systems/audio'
import { BookView } from '../ui/BookView'
import { DayNightBackground } from '../ui/DayNightBackground'
import { HeroSprite } from '../ui/HeroSprite'
import { NightWorld } from '../ui/NightWorld'
import { strings } from '../ui/strings'
import { GoldButton, WoodPanel } from '../ui/tavern'
import { theme } from '../ui/theme'
import { getDayPhase, type DayPhase } from '../ui/timeOfDay'
import { useGame } from '../ui/useGame'
import { DevTools } from './DevTools'
import { Dock, TopBar } from './HomeNightDock'

const MAX_HP = 7
// Reference proportions: the knight is ~0.19 of screen height, feet on the
// blade/soil line of the grass band (NightWorld puts it at 0.79H -> bottom 21%).
const HERO_SIZE = 148

export function HomeScreen() {
  const { state } = useGame()
  return state.hero ? <HeroHome /> : <NoHeroHome />
}

function NoHeroHome() {
  const router = useRouter()
  return (
    <HomeScene phase={getDayPhase()}>
      <View style={styles.emptyBox}>
        <WoodPanel contentStyle={styles.emptyWell}>
          <Text style={styles.empty}>{strings.home_no_hero}</Text>
          <GoldButton
            label={strings.onboarding_begin}
            onPress={() => router.replace('/onboarding')}
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

function HeroHome() {
  const router = useRouter()
  const { state, pendingBedTime, sleepNow, wakeNow } = useGame()
  const hero = state.hero!
  const asleep = pendingBedTime !== null

  usePhaseMusic(asleep)

  // The wake/sleep pushes keep Home mounted below the stack, and its buttons
  // stay live during the transition — re-entrant taps caused phantom wakes and
  // self-sleeps. Locked until the screen refocuses (returning from the
  // transition / dismissTo('/') resurfaces this same instance).
  const tapLock = useRef(false)
  useFocusEffect(
    useCallback(() => {
      tapLock.current = false
    }, []),
  )

  // Tapping SLEEP tucks the hero in and carries the player over to the sleep
  // transition; WAKE UP evaluates the night and rolls on to morning.
  const onSleep = () => {
    if (tapLock.current) {
      return
    }
    tapLock.current = true
    sleepNow()
    router.push('/sleep-transition')
  }
  const onWake = () => {
    if (tapLock.current) {
      return
    }
    tapLock.current = true
    const evaluation = wakeNow()
    const hpAfter = Math.min(Math.max(state.hp + evaluation.hpDelta, 0), MAX_HP)
    router.push(hpAfter === 0 ? '/death' : '/morning-scene')
  }

  return (
    <View style={styles.root}>
      <HeroStage asleep={asleep} state={state} onSleep={onSleep} />
      <SafeAreaView style={styles.safe} pointerEvents="box-none">
        {asleep ? (
          <TopBar hp={state.hp} streak={state.perfectWeekStreak} level={hero.level} />
        ) : null}
        <View style={styles.stageSpacer} pointerEvents="none" />
        {asleep ? <Dock onWake={onWake} /> : null}
        <DevTools />
      </SafeAreaView>
    </View>
  )
}

/** Awake: the inked character-sheet book (nav lives on the page). Asleep: the living night world. */
function HeroStage({
  asleep,
  state,
  onSleep,
}: {
  asleep: boolean
  state: ReturnType<typeof useGame>['state']
  onSleep: () => void
}) {
  const router = useRouter()
  const hero = state.hero!
  if (!asleep) {
    return (
      <BookView
        heroType={hero.type}
        hp={state.hp}
        level={hero.level}
        streak={state.perfectWeekStreak}
        onSleep={onSleep}
        onBag={() => router.push('/inventory')}
        onMosaic={() => router.push('/mosaic')}
        onSettings={() => router.push('/settings')}
      />
    )
  }
  return (
    <View style={StyleSheet.absoluteFill}>
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
  walkSlot: { position: 'absolute', left: 0, right: 0, bottom: '21%', alignItems: 'center' },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyWell: { alignItems: 'center', gap: theme.spacing(5) },
  empty: {
    ...theme.type.body,
    color: theme.colors.text,
    textAlign: 'center',
  },
})
