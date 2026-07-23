import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { playMusic } from '../systems/audio'
import { DayNightBackground } from '../ui/DayNightBackground'
import { FloatingButton } from '../ui/FloatingButton'
import { HeartRow } from '../ui/HeartRow'
import { HeroSprite } from '../ui/HeroSprite'
import { PixelBar } from '../ui/PixelBar'
import { PixelButton } from '../ui/PixelButton'
import { strings } from '../ui/strings'
import { theme } from '../ui/theme'
import { getDayPhase, type DayPhase } from '../ui/timeOfDay'
import { useGame } from '../ui/useGame'
import { useHeroWalk } from '../ui/useHeroWalk'
import { DebugMenu } from './DebugMenu'

const MAX_HP = 7
const HERO_SIZE = 184

export function HomeScreen() {
  const { state } = useGame()
  return state.hero ? <HeroHome /> : <NoHeroHome />
}

function NoHeroHome() {
  const router = useRouter()
  return (
    <HomeScene phase={getDayPhase()}>
      <View style={styles.emptyBox}>
        <Text style={styles.empty}>{strings.home_no_hero}</Text>
        <FloatingButton
          variant="primary"
          label={strings.onboarding_begin}
          onPress={() => router.replace('/onboarding')}
        />
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

  const walk = useHeroWalk(asleep)

  const onContextTap = () => {
    if (!asleep) {
      sleepNow()
      return
    }
    const evaluation = wakeNow()
    const hpAfter = Math.min(Math.max(state.hp + evaluation.hpDelta, 0), MAX_HP)
    router.push(hpAfter === 0 ? '/death' : '/morning-scene')
  }

  return (
    <HomeScene phase={getDayPhase()} traveling={asleep}>
      <TopBar hp={state.hp} streak={state.perfectWeekStreak} level={hero.level} />
      <View style={styles.heroWrap}>
        <View style={styles.heroInner}>
          <HeroSprite
            type={hero.type}
            size={HERO_SIZE}
            walking={walk.walking}
            fps={walk.walking ? 6 : 2}
            gold={state.perfectWeekStreak >= MAX_HP}
          />
        </View>
      </View>
      <View style={styles.dock}>
        <FloatingButton
          variant="primary"
          scale={2}
          delay={0}
          label={asleep ? strings.home_wakeup : strings.home_sleep}
          onPress={onContextTap}
        />
        <FloatingButton
          scale={2}
          delay={220}
          label={strings.home_nav_bag}
          onPress={() => router.push('/inventory')}
        />
        <FloatingButton
          variant="round"
          scale={2}
          delay={440}
          label="⚙"
          onPress={() => router.push('/settings')}
        />
      </View>
      <DevTools />
    </HomeScene>
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

function TopBar({ hp, streak, level }: { hp: number; streak: number; level: number }) {
  return (
    <View style={styles.topRow}>
      <HeartRow hp={hp} />
      <View style={styles.streakBox}>
        <PixelBar value={streak} max={MAX_HP} />
        <Text style={styles.level}>
          {strings.home_level} {level}
        </Text>
      </View>
    </View>
  )
}

/** Dev-only launcher for the other screens; removed before release. */
function DevTools() {
  const [open, setOpen] = useState(false)
  if (!__DEV__) {
    return null
  }
  return (
    <>
      <Pressable style={styles.devTab} onPress={() => setOpen(true)}>
        <Text style={styles.devText}>DEV</Text>
      </Pressable>
      {open && (
        <View style={styles.devOverlay}>
          <ScrollView contentContainerStyle={styles.devScroll}>
            <DebugMenu />
            <PixelButton label={strings.common_back} onPress={() => setOpen(false)} />
          </ScrollView>
        </View>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  safe: { flex: 1 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: theme.spacing(4),
    paddingTop: theme.spacing(2),
  },
  streakBox: { alignItems: 'flex-end', gap: theme.spacing(1) },
  level: {
    ...theme.type.label,
    color: theme.colors.text,
  },
  heroWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 176,
  },
  heroInner: { alignItems: 'center', gap: theme.spacing(2) },
  dock: {
    position: 'absolute',
    left: theme.spacing(4),
    right: theme.spacing(4),
    bottom: theme.spacing(11),
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing(5) },
  empty: {
    ...theme.type.body,
    color: theme.colors.text,
    textAlign: 'center',
  },
  devTab: {
    position: 'absolute',
    top: theme.spacing(20),
    right: theme.spacing(2),
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(1),
    backgroundColor: theme.colors.inset,
    borderWidth: theme.borderWidth,
    borderColor: theme.colors.outline,
    borderRadius: theme.borderRadius,
    opacity: 0.7,
  },
  devText: { ...theme.type.label, color: theme.colors.textDim },
  devOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 13, 8, 0.94)',
  },
  devScroll: {
    padding: theme.spacing(4),
    paddingTop: theme.spacing(10),
    gap: theme.spacing(4),
  },
})
