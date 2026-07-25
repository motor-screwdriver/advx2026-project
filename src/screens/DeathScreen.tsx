import { useRouter } from 'expo-router'
import React, { useEffect } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { playSfx } from '../systems/audio'
import { HeartRow } from '../ui/HeartRow'
import { useScreenTransition } from '../ui/screenTransition'
import { strings } from '../ui/strings'
import {
  GoldButton,
  TavernBar,
  tavernColors,
  TavernFrame,
  WoodButton,
  WoodPanel,
} from '../ui/tavern'
import { theme } from '../ui/theme'
import { useGame } from '../ui/useGame'

/** Copy from the death mockup that has no strings.ts key yet (local only). */
const copy = {
  tagline: 'SLEEP TAMAGOTCHI',
  expLabel: 'EXP',
  xpLabel: 'XP',
} as const

/** Left badge: hero level + Perfect Week progress towards the next level. */
function LevelBadge({ level, streak }: { level: number; streak: number }) {
  return (
    <WoodPanel rivets={false} contentStyle={styles.badgeWell}>
      <Text style={styles.badgeTitle}>
        {strings.home_level}. {level}
      </Text>
      <View style={styles.expRow}>
        <Text style={styles.badgeLabel}>{copy.expLabel}</Text>
        <View style={styles.expBar}>
          <TavernBar value={streak} max={7} color={theme.colors.gold} height={4} />
        </View>
      </View>
    </WoodPanel>
  )
}

/** Middle badge: moon icon + game tagline. */
function TaglineBadge() {
  return (
    <WoodPanel rivets={false} style={styles.badgeMiddle} contentStyle={styles.badgeWellRow}>
      <Text style={[styles.badgeTitle, styles.tagline]}>{copy.tagline}</Text>
    </WoodPanel>
  )
}

/** Top bar: the three small wood badges from the mockup. */
function TopBar({ level, streak, xp }: { level: number; streak: number; xp: number }) {
  return (
    <View style={styles.topBar}>
      <LevelBadge level={level} streak={streak} />
      <TaglineBadge />
      <XpBadge xp={xp} />
    </View>
  )
}

/** Right badge: lifetime XP (the mockup's currency slot; no coins exist yet). */
function XpBadge({ xp }: { xp: number }) {
  return (
    <WoodPanel rivets={false} contentStyle={styles.badgeWellRow}>
      <View style={styles.xpText}>
        <Text style={styles.badgeLabel}>{copy.xpLabel}</Text>
        <Text style={styles.badgeValue}>{xp}</Text>
      </View>
    </WoodPanel>
  )
}

/** Empty state: no hero to mourn, just a way back. */
function NoHeroScreen({ onBack }: { onBack: () => void }) {
  return (
    <SafeAreaView style={styles.safe}>
      <TavernFrame>
        <View style={styles.fallback}>
          <Text style={styles.hint}>{strings.death_title}</Text>
          <WoodButton label={strings.common_back} onPress={onBack} />
        </View>
      </TavernFrame>
    </SafeAreaView>
  )
}

export function DeathScreen() {
  const router = useRouter()
  const go = useScreenTransition()
  const { state, canResurrect, startNewHero, usePhoenix: activatePhoenix } = useGame()
  const hero = state.hero
  const hasFeather = state.artifacts.indexOf('phoenix_feather') >= 0

  useEffect(() => {
    playSfx('sfx_death')
  }, [])

  if (!hero) {
    return <NoHeroScreen onBack={() => router.dismissTo('/')} />
  }

  const newHero = () => {
    startNewHero()
    router.dismissTo('/hero-ceremony')
  }

  const riseFromAshes = () => {
    activatePhoenix()
    router.dismissTo('/')
  }

  return (
    <SafeAreaView style={styles.safe}>
      <TavernFrame>
        <ScrollView contentContainerStyle={styles.stack} showsVerticalScrollIndicator={false}>
          <TopBar level={hero.level} streak={state.perfectWeekStreak} xp={hero.xp} />
          <View style={styles.scene}>
            <Text style={styles.sceneText}>{strings.death_title.toUpperCase()}</Text>
          </View>
          <WoodPanel contentStyle={styles.hpWell}>
            <Text style={styles.watch}>{strings.death_watch_ends}</Text>
            <HeartRow hp={0} />
          </WoodPanel>
          {hasFeather ? (
            <PhoenixOffer onRise={riseFromAshes} />
          ) : (
            <DeathActions
              canRes={canResurrect()}
              onResurrect={() => go('/resurrection', { effect: 'wipe' })}
              onNewHero={newHero}
            />
          )}
        </ScrollView>
      </TavernFrame>
    </SafeAreaView>
  )
}

function PhoenixOffer({ onRise }: { onRise: () => void }) {
  return (
    <View style={styles.actions}>
      <GoldButton label={strings.phoenix_offer} onPress={onRise} />
      <Text style={styles.hint}>{strings.phoenix_rise}</Text>
    </View>
  )
}

interface DeathActionsProps {
  canRes: boolean
  onResurrect: () => void
  onNewHero: () => void
}

function DeathActions({ canRes, onResurrect, onNewHero }: DeathActionsProps) {
  return canRes ? (
    <View style={styles.actions}>
      <GoldButton label={strings.death_soul_tether} onPress={onResurrect} />
      <Text style={styles.hint}>{strings.death_hint}</Text>
      <Text style={styles.hint}>{strings.phoenix_gone}</Text>
    </View>
  ) : (
    <View style={styles.actions}>
      <Text style={styles.hint}>{strings.death_no_charge}</Text>
      <Text style={styles.hint}>{strings.phoenix_gone}</Text>
      <Text style={styles.gone}>{strings.death_gone}</Text>
      <WoodButton label={strings.death_let_go} onPress={onNewHero} />
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#150d08' },
  stack: { gap: theme.spacing(4) },
  topBar: { flexDirection: 'row', gap: theme.spacing(2), alignItems: 'stretch' },
  badgeWell: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(1),
    paddingVertical: theme.spacing(2),
  },
  badgeWellRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(2),
    paddingVertical: theme.spacing(2),
  },
  badgeMiddle: { flex: 1 },
  badgeTitle: {
    ...theme.type.body,
    color: tavernColors.goldLight,
    textAlign: 'center',
  },
  tagline: { flexShrink: 1, maxWidth: 110 },
  badgeLabel: { ...theme.type.label, color: theme.colors.textDim },
  badgeValue: { ...theme.type.body, color: tavernColors.goldLight },
  expRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(1) },
  expBar: { width: 56 },
  xpText: { alignItems: 'center' },
  scene: {
    width: '100%',
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#20130b',
    borderWidth: 2,
    borderColor: tavernColors.edge,
  },
  sceneText: {
    ...theme.type.body,
    color: theme.colors.textDim,
    letterSpacing: 2,
    textAlign: 'center',
  },
  hpWell: { alignItems: 'center', gap: theme.spacing(3) },
  watch: {
    ...theme.type.body,
    color: theme.colors.text,
    textAlign: 'center',
    letterSpacing: 1,
  },
  actions: { gap: theme.spacing(3) },
  hint: {
    ...theme.type.label,
    color: theme.colors.textDim,
    textAlign: 'center',
  },
  gone: {
    ...theme.type.body,
    color: theme.colors.heartFull,
    textAlign: 'center',
  },
  fallback: { flex: 1, justifyContent: 'center', gap: theme.spacing(4) },
})
