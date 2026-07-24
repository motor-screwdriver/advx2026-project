import { useRouter } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native'

import type { HeroType } from '../contracts/types'
import { makePop, makeShake, useFadeIn } from '../ui/animations'
import { HeartRow } from '../ui/HeartRow'
import { HeroSprite } from '../ui/HeroSprite'
import { PixelButton } from '../ui/PixelButton'
import { Screen } from '../ui/Screen'
import { strings } from '../ui/strings'
import { TavernFrame, WoodPanel, tavernColors } from '../ui/tavern'
import { theme } from '../ui/theme'
import { useGame } from '../ui/useGame'

/** Copy baked into the CONTINUE button art; used for accessibility only. */
const CONTINUE_LABEL = 'CONTINUE'

/** Tavern illustration band: a summoning circle with the summoned hero on it. */
function IllustrationBand({
  heroType,
  scale,
  shakeX,
}: {
  heroType: HeroType
  scale: Animated.Value
  shakeX: Animated.Value
}) {
  const [bandWidth, setBandWidth] = useState(0)
  const heroSize = bandWidth > 0 ? bandWidth * 0.44 : 140

  return (
    <Animated.View
      style={[styles.band, { transform: [{ translateX: shakeX }] }]}
      onLayout={(e) => setBandWidth(e.nativeEvent.layout.width)}
    >
      <View style={styles.circle} />
      <Animated.View style={[styles.heroWrap, { transform: [{ scale }] }]}>
        <HeroSprite type={heroType} size={heroSize} />
      </Animated.View>
    </Animated.View>
  )
}

/** Bottom wood panel: hero name, divider, passive, hearts, CONTINUE. */
function HeroInfoPanel({
  heroName,
  lootPct,
  hp,
  fade,
  onContinue,
}: {
  heroName: string
  lootPct: number
  hp: number
  fade: Animated.Value
  onContinue: () => void
}) {
  return (
    <Animated.View style={[styles.panelWrap, { opacity: fade }]}>
      <WoodPanel style={styles.panel} contentStyle={styles.panelContent}>
        <Text style={styles.heroName}>{heroName.toUpperCase()}</Text>
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <View style={styles.dividerDiamond} />
          <View style={styles.dividerLine} />
        </View>
        <Text style={styles.passive}>
          {strings.ceremony_rare_loot} +{lootPct}%
        </Text>
        <HeartRow hp={hp} />
        <Pressable
          onPress={onContinue}
          accessibilityRole="button"
          accessibilityLabel={CONTINUE_LABEL}
          style={({ pressed }) => [styles.continueBtn, pressed && styles.continueBtnPressed]}
        >
          <View style={styles.continueBody}>
            <Text style={styles.continueText}>{CONTINUE_LABEL}</Text>
          </View>
        </Pressable>
      </WoodPanel>
    </Animated.View>
  )
}

/** Dramatic summon: hero pops onto the circle, screen shakes, panel fades in. */
export function HeroCeremonyScreen() {
  const router = useRouter()
  const { state } = useGame()
  const scale = useRef(new Animated.Value(0)).current
  const shakeX = useRef(new Animated.Value(0)).current
  const fade = useFadeIn(600)

  useEffect(() => {
    makePop(scale).start(() => makeShake(shakeX).start())
  }, [scale, shakeX])

  const hero = state.hero
  if (!hero) {
    return (
      <Screen title={strings.ceremony_summoning}>
        <View style={styles.filler} />
        <PixelButton label={strings.common_back} onPress={() => router.replace('/oracle')} />
      </Screen>
    )
  }

  const heroName = strings[`hero_${hero.type}` as keyof typeof strings] as string

  return (
    <TavernFrame>
      <View style={styles.column}>
        <Text style={styles.label} accessibilityLabel={strings.banner_hero_awakens}>
          {strings.banner_hero_awakens.toUpperCase()}
        </Text>
        <IllustrationBand heroType={hero.type} scale={scale} shakeX={shakeX} />
        <HeroInfoPanel
          heroName={heroName}
          lootPct={hero.level * 5}
          hp={state.hp}
          fade={fade}
          onContinue={() => router.dismissTo('/')}
        />
      </View>
    </TavernFrame>
  )
}

const styles = StyleSheet.create({
  filler: { flex: 1 },
  column: { flex: 1, gap: theme.spacing(2) },
  label: {
    ...theme.type.title,
    color: tavernColors.gold,
    letterSpacing: 2,
    textAlign: 'center',
  },
  band: {
    width: '100%',
    aspectRatio: 1.2,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  circle: {
    position: 'absolute',
    bottom: '8%',
    width: '62%',
    aspectRatio: 2.6,
    borderRadius: 999,
    backgroundColor: tavernColors.goldEdge,
    borderWidth: 2,
    borderColor: tavernColors.gold,
    opacity: 0.5,
  },
  heroWrap: { alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '10%' },
  panelWrap: { flex: 1 },
  panel: { flex: 1 },
  panelContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    gap: theme.spacing(2),
  },
  heroName: {
    fontFamily: theme.fontFamily,
    fontSize: 24,
    lineHeight: 34,
    letterSpacing: 2,
    color: tavernColors.gold,
    textAlign: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: theme.spacing(2),
    paddingHorizontal: theme.spacing(4),
  },
  dividerLine: { flex: 1, height: 2, backgroundColor: tavernColors.goldEdge },
  dividerDiamond: {
    width: 8,
    height: 8,
    backgroundColor: tavernColors.rivet,
    transform: [{ rotate: '45deg' }],
  },
  passive: {
    ...theme.type.body,
    color: theme.colors.text,
    textAlign: 'center',
  },
  continueBtn: { width: '86%' },
  continueBtnPressed: { transform: [{ translateY: 2 }] },
  continueBody: {
    width: '100%',
    backgroundColor: tavernColors.gold,
    borderWidth: 2,
    borderColor: tavernColors.goldEdge,
    borderTopColor: tavernColors.goldLight,
    paddingVertical: theme.spacing(2.5),
    alignItems: 'center',
  },
  continueText: {
    ...theme.type.body,
    color: tavernColors.inkOnParchment,
    letterSpacing: 2,
  },
})
