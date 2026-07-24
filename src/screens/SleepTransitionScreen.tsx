import { useRouter } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import type { SpriteEntry } from '../../assets/manifest'
import type { HeroType } from '../contracts/types'
import { HeroSprite } from '../ui/HeroSprite'
import { strings } from '../ui/strings'
import { Parchment, TavernFrame, WoodPanel, tavernColors } from '../ui/tavern'
import { theme } from '../ui/theme'
import { useGame } from '../ui/useGame'

const AUTO_ADVANCE_MS = 2200

/**
 * Standalone scene illustration generated via PixelLab (see
 * docs/8bit Sleep — гайд генерация ассетов Kimi + PixelLab.md): an open
 * glowing golden book on a tavern desk with a rising light beam, sparkles,
 * candles and a shelf sign. One opaque image shown at its real aspect ratio —
 * no mockup crop-slices. Referenced locally per screen convention (not in the
 * manifest).
 */
const SCENE: SpriteEntry = {
  source: require('../../assets/design/gen/booktransition_scene.png'),
  width: 256,
  height: 352,
  frames: 1,
  frameWidth: 256,
  frameHeight: 352,
}

/** The tavern-desk scene with the live hero levitating in the light beam. */
function BookScene({
  heroType,
  gold,
  lift,
}: {
  heroType: HeroType | null
  gold: boolean
  lift: Animated.AnimatedInterpolation<string | number>
}) {
  const [bandWidth, setBandWidth] = useState(0)
  // The hero is always a live sprite (knight included), so non-knight heroes
  // and the gold skin work with no extra art; no hero -> beam stays empty.
  const heroSize = bandWidth > 0 ? bandWidth * 0.22 : 64
  return (
    <View style={styles.band} onLayout={(e) => setBandWidth(e.nativeEvent.layout.width)}>
      <Image source={SCENE.source} style={styles.scene} />
      {heroType ? (
        <Animated.View style={[styles.hero, { transform: [{ translateY: lift }] }]}>
          <HeroSprite gold={gold} size={heroSize} type={heroType} />
        </Animated.View>
      ) : null}
    </View>
  )
}

/**
 * Interstitial: the open book glows and carries the player over to their hero.
 * Home already flipped to the asleep state (sleepNow ran), so dismissing back
 * to '/' reveals the night hero scene. Auto-advances, or tap to skip.
 */
export function SleepTransitionScreen() {
  const router = useRouter()
  const { state } = useGame()

  const fade = useRef(new Animated.Value(0)).current
  const float = useRef(new Animated.Value(0)).current

  const leave = () => router.dismissTo('/')

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }).start()
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    ).start()
    const id = setTimeout(leave, AUTO_ADVANCE_MS)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const heroLift = float.interpolate({ inputRange: [0, 1], outputRange: [0, -10] })

  return (
    <Pressable style={styles.root} onPress={leave}>
      <TavernFrame>
        <SafeAreaView style={styles.safe}>
          <Animated.View style={[styles.column, { opacity: fade }]}>
            <BookScene
              gold={state.perfectWeekStreak >= 7}
              heroType={state.hero ? state.hero.type : null}
              lift={heroLift}
            />
            <View style={styles.bottom}>
              <WoodPanel>
                <Parchment>
                  <Text style={styles.caption}>{strings.transition_carry}</Text>
                </Parchment>
              </WoodPanel>
              <Text style={styles.hint}>{strings.transition_tap}</Text>
            </View>
          </Animated.View>
        </SafeAreaView>
      </TavernFrame>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  safe: { flex: 1 },
  column: { flex: 1, gap: theme.spacing(2) },
  band: {
    width: '100%',
    aspectRatio: SCENE.width / SCENE.height,
  },
  scene: { width: '100%', height: '100%' },
  hero: {
    position: 'absolute',
    // Centered on the light beam, hovering just above the open book.
    left: '38%',
    top: '18%',
    width: '24%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: {
    flex: 1,
    justifyContent: 'center',
    gap: theme.spacing(3),
  },
  caption: {
    fontFamily: theme.fontFamily,
    fontSize: 12,
    lineHeight: 22,
    letterSpacing: 1,
    color: tavernColors.inkOnParchment,
    textAlign: 'center',
  },
  hint: { ...theme.type.label, color: theme.colors.textDim, textAlign: 'center' },
})
