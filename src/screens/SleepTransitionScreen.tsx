import MaskedView from '@react-native-masked-view/masked-view'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React, { useEffect } from 'react'
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'

import type { HeroType } from '../contracts/types'
import { BookView } from '../ui/BookView'
import { HeroSprite } from '../ui/HeroSprite'
import { NightWorld } from '../ui/NightWorld'
import { strings } from '../ui/strings'
import { Parchment, WoodPanel, tavernColors } from '../ui/tavern'
import { theme } from '../ui/theme'
import { useGame } from '../ui/useGame'

const AUTO_ADVANCE_MS = 3200
const REVEAL_MS = 1900
const REVEAL_DELAY_MS = 600

interface HeroSlot {
  heroType: HeroType | null
  heroSize: number
  bottom: number
}

interface Stats {
  hp: number
  level: number
  streak: number
}

/** Bottom layer: the living colored world with the walking hero on the ground slot. */
function WorldScene({ heroType, heroSize, bottom, gold }: HeroSlot & { gold: boolean }) {
  return (
    <>
      <NightWorld />
      {heroType ? (
        <View style={[styles.heroSlot, { bottom }]} pointerEvents="none">
          <HeroSprite type={heroType} gold={gold} size={heroSize} walking fps={8} />
        </View>
      ) : null}
    </>
  )
}

/** Top layer: the inked character-sheet page, wiped away from the ground up. */
function BookReveal({
  reveal,
  height,
  book,
}: {
  reveal: SharedValue<number>
  height: number
  book: Stats & { heroType: HeroType | null }
}) {
  const maskBlock = useAnimatedStyle(() => ({ height: (1 - reveal.value) * height }))
  return (
    <MaskedView
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      maskElement={
        <View style={styles.maskRoot}>
          <Animated.View style={maskBlock}>
            <View style={styles.maskSolid} />
            <LinearGradient colors={['#ffffff', 'transparent']} style={styles.maskFeather} />
          </Animated.View>
        </View>
      }
    >
      <BookView heroType={book.heroType} hp={book.hp} level={book.level} streak={book.streak} />
    </MaskedView>
  )
}

/** Caption + skip hint, fading in as the world comes to life. */
function Caption({ reveal }: { reveal: SharedValue<number> }) {
  const textFade = useAnimatedStyle(() => ({ opacity: reveal.value }))
  return (
    <SafeAreaView style={styles.overlay} pointerEvents="box-none">
      <Animated.View style={[styles.captionWrap, textFade]}>
        <WoodPanel>
          <Parchment>
            <Text style={styles.caption}>{strings.transition_carry}</Text>
          </Parchment>
        </WoodPanel>
      </Animated.View>
      <Text style={styles.hint}>{strings.transition_tap}</Text>
    </SafeAreaView>
  )
}

/**
 * Book -> world transition (Tier 2). We open on the awake character-sheet page
 * (the same book scene as Home) and a single Reanimated wipe eats the page from
 * the bottom up — a MaskedView turns the animated height into a soft alpha
 * reveal — uncovering the hero, now colored and walking, in the living
 * NightWorld beneath. One clean motion, no extra flourishes.
 *
 * Home already flipped to the asleep state (sleepNow ran), so dismissing back
 * to '/' lands on the night walking scene. Auto-advances, or tap to skip.
 */
export function SleepTransitionScreen() {
  const router = useRouter()
  const { state } = useGame()
  const { height: H, width: W } = useWindowDimensions()

  const heroType = state.hero ? state.hero.type : null
  const gold = state.perfectWeekStreak >= 7
  const heroSize = Math.min(W * 0.52, 230)
  const bottom = H * 0.16
  const book = {
    heroType,
    hp: state.hp,
    level: state.hero ? state.hero.level : 1,
    streak: state.perfectWeekStreak,
  }

  const reveal = useSharedValue(0)
  const leave = () => router.dismissTo('/')

  useEffect(() => {
    reveal.value = withDelay(
      REVEAL_DELAY_MS,
      withTiming(1, { duration: REVEAL_MS, easing: Easing.inOut(Easing.ease) }),
    )
    const id = setTimeout(leave, AUTO_ADVANCE_MS)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Pressable style={styles.root} onPress={leave}>
      <WorldScene heroType={heroType} gold={gold} heroSize={heroSize} bottom={bottom} />
      <BookReveal reveal={reveal} height={H} book={book} />
      <Caption reveal={reveal} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  heroSlot: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  maskRoot: { ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent' },
  maskSolid: { flex: 1, backgroundColor: '#ffffff' },
  maskFeather: { height: 60 },
  overlay: { flex: 1, justifyContent: 'space-between', paddingVertical: theme.spacing(4) },
  captionWrap: { paddingHorizontal: theme.spacing(2) },
  caption: {
    fontFamily: theme.fontFamily,
    fontSize: 12,
    lineHeight: 22,
    letterSpacing: 1,
    color: tavernColors.inkOnParchment,
    textAlign: 'center',
  },
  hint: { ...theme.type.label, color: theme.colors.text, textAlign: 'center' },
})
