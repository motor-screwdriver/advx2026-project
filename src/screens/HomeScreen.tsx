import { useFocusEffect, useRouter } from 'expo-router'
import React, { useCallback, useEffect, useRef } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { playMusic } from '../systems/audio'
import { DayNightBackground } from '../ui/DayNightBackground'
import { GearButton } from '../ui/GearButton'
import { HeartRow } from '../ui/HeartRow'
import { HeroSprite } from '../ui/HeroSprite'
import { strings } from '../ui/strings'
import { GoldButton, TavernBar, WoodButton, WoodPanel, tavernColors } from '../ui/tavern'
import { theme } from '../ui/theme'
import { getDayPhase, type DayPhase } from '../ui/timeOfDay'
import { useGame } from '../ui/useGame'
import { useHeroWalk } from '../ui/useHeroWalk'
import { DevTools } from './DevTools'

const MAX_HP = 7
const HERO_SIZE = 184

// Local copy (design-mockup label; not in strings.ts).
const XP_LABEL = 'XP'

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
  const walk = useHeroWalk(asleep)

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
    <HomeScene phase={getDayPhase()} traveling={asleep}>
      <TopBar hp={state.hp} streak={state.perfectWeekStreak} level={hero.level} />
      <View style={styles.heroWrap}>
        <HeroSprite
          type={hero.type}
          size={HERO_SIZE}
          walking={walk.walking}
          fps={walk.walking ? 6 : 2}
          gold={state.perfectWeekStreak >= MAX_HP}
        />
      </View>
      <Dock asleep={asleep} onToggleSleep={asleep ? onWake : onSleep} />
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

/** Riveted wood panel: hearts row on top, LV badge + XP bar below. */
function TopBar({ hp, streak, level }: { hp: number; streak: number; level: number }) {
  return (
    <WoodPanel contentStyle={styles.topPanelWell}>
      <HeartRow hp={hp} size={26} />
      <View style={styles.xpRow}>
        <View style={styles.lvBadge}>
          <View style={styles.lvBadgeInner}>
            <Text style={styles.lvText}>
              {strings.home_level} {level}
            </Text>
          </View>
        </View>
        <Text style={styles.xpLabel}>{XP_LABEL}</Text>
        <View style={styles.xpBarWrap}>
          <TavernBar value={streak} max={MAX_HP} />
        </View>
      </View>
    </WoodPanel>
  )
}

/** Tavern dock: big gold SLEEP/WAKE UP, wood BAG + MOSAIC, round gear. */
function Dock({ asleep, onToggleSleep }: { asleep: boolean; onToggleSleep: () => void }) {
  const router = useRouter()
  return (
    <WoodPanel contentStyle={styles.dockWell}>
      <GoldButton
        style={styles.sleepBtn}
        label={asleep ? strings.home_wakeup : strings.home_sleep}
        onPress={onToggleSleep}
      />
      <View style={styles.dockSide}>
        <WoodButton
          compact
          label={strings.home_nav_bag}
          onPress={() => router.push('/inventory')}
        />
        <WoodButton
          compact
          label={strings.home_nav_mosaic}
          onPress={() => router.push('/mosaic')}
        />
      </View>
      <GearButton onPress={() => router.push('/settings')} />
    </WoodPanel>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  safe: {
    flex: 1,
    paddingHorizontal: theme.spacing(3),
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    gap: theme.spacing(3),
  },
  topPanelWell: { gap: theme.spacing(3) },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(2.5),
  },
  lvBadge: {
    backgroundColor: tavernColors.goldEdge,
    borderWidth: 2,
    borderColor: tavernColors.edge,
    padding: 2,
  },
  lvBadgeInner: {
    backgroundColor: '#20130b',
    borderTopWidth: 2,
    borderTopColor: tavernColors.goldLight,
    borderBottomWidth: 2,
    borderBottomColor: tavernColors.gold,
    paddingHorizontal: theme.spacing(2.5),
    paddingVertical: theme.spacing(1.5),
  },
  lvText: {
    fontFamily: theme.fontFamily,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 1,
    color: tavernColors.goldLight,
  },
  xpLabel: {
    ...theme.type.body,
    color: theme.colors.text,
  },
  xpBarWrap: { flex: 1 },
  heroWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: theme.spacing(6),
  },
  dockWell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(2.5),
  },
  sleepBtn: { flex: 1 },
  dockSide: { width: 96, gap: theme.spacing(2) },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyWell: { alignItems: 'center', gap: theme.spacing(5) },
  empty: {
    ...theme.type.body,
    color: theme.colors.text,
    textAlign: 'center',
  },
})
