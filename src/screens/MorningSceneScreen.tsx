import { useRouter } from 'expo-router'
import React, { useEffect, useMemo } from 'react'
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native'

import { ICONS, SCENES, type SpriteEntry } from '../../assets/manifest'
import type { NightEvaluation, NightOutcome } from '../contracts/types'
import { playSfx } from '../systems/audio'
import { PixelSprite } from '../ui/PixelSprite'
import { RewardRow } from '../ui/RewardRow'
import { strings } from '../ui/strings'
import { GoldButton, tavernColors, TavernFrame, tavernLayout, WoodPanel } from '../ui/tavern'
import { theme } from '../ui/theme'
import { useGame } from '../ui/useGame'

/** XP star — generated with PixelLab (transparent 64x64, matches heart icons).
 *  Declared locally because the asset manifest is generated and must not be
 *  edited by hand. */
const STAR_ICON: SpriteEntry = {
  source: require('../../assets/pixellab/icons/star_green.png'),
  width: 64,
  height: 64,
  frames: 1,
  frameWidth: 64,
  frameHeight: 64,
}

const LINE_KEYS: Record<NightOutcome, keyof typeof strings> = {
  PERFECT: 'morning_line_perfect',
  GOOD: 'morning_line_good',
  BAD: 'morning_line_bad',
  TERRIBLE: 'morning_line_terrible',
  MISSED: 'morning_missed',
}

const SCENE_KEYS: Record<NightOutcome, keyof typeof SCENES> = {
  PERFECT: 'scene_perfect',
  GOOD: 'scene_good',
  BAD: 'scene_bad',
  TERRIBLE: 'scene_terrible',
  MISSED: 'scene_bad',
}

type Tone = 'gold' | 'leaf' | 'coral'

const TONE_COLORS: Record<Tone, string> = {
  gold: tavernColors.gold,
  leaf: theme.colors.leaf,
  coral: theme.colors.heartFull,
}

function bannerFor(outcome: NightOutcome): { text: string; tone: Tone } {
  if (outcome === 'PERFECT') return { text: strings.banner_perfect_night, tone: 'gold' }
  if (outcome === 'TERRIBLE') return { text: strings.outcome_terrible, tone: 'coral' }
  return { text: strings[`outcome_${outcome.toLowerCase()}` as keyof typeof strings], tone: 'leaf' }
}

/** Small leaf-green diamond, echoing the mockup's leaf ornaments. */
function LeafOrnament() {
  return <View style={styles.leafOrnament} />
}

/** Full-bleed banner: one randomly-picked house illustration (chosen once,
 * held still — not cycled) spanning the full device width and closing off
 * the top of the screen, with the big outcome title over the sky. */
function SceneHero({
  outcome,
  title,
}: {
  outcome: NightOutcome
  title: { text: string; tone: Tone }
}) {
  const { width } = useWindowDimensions()
  const sprite = SCENES[SCENE_KEYS[outcome]]
  const frame = useMemo(() => Math.floor(Math.random() * sprite.frames), [sprite])
  return (
    <View style={styles.sceneFrame}>
      <PixelSprite sprite={sprite} size={width} frame={frame} />
      <View style={styles.titleOverlay} pointerEvents="none">
        <Text style={[styles.bigTitle, { color: TONE_COLORS[title.tone] }]}>{title.text}</Text>
      </View>
    </View>
  )
}

/** Dark streak strip with leaf ornaments, per the mockup's "STREAK 3" chip. */
function StreakStrip({ streak }: { streak: number }) {
  return (
    <WoodPanel style={styles.streakStrip} contentStyle={styles.streakWell}>
      <LeafOrnament />
      <Text style={styles.streakText}>
        {strings.stat_streak} {streak}
      </Text>
      <LeafOrnament />
    </WoodPanel>
  )
}

export function MorningSceneScreen() {
  const router = useRouter()
  const { state, lastEvaluation, pendingChest } = useGame()

  useEffect(() => {
    if (!lastEvaluation) return
    if (lastEvaluation.hpDelta < 0) playSfx('sfx_damage')
    else if (lastEvaluation.outcome === 'PERFECT') playSfx('sfx_victory')
  }, [lastEvaluation])

  if (!lastEvaluation) {
    return (
      <TavernFrame>
        <View style={styles.empty}>
          <Text style={styles.dim}>{strings.morning_missed}</Text>
          <GoldButton
            label={strings.morning_continue.toUpperCase()}
            onPress={() => router.back()}
          />
        </View>
      </TavernFrame>
    )
  }

  return (
    <MorningResult
      evaluation={lastEvaluation}
      streak={state.perfectWeekStreak}
      pendingChest={pendingChest}
      onContinue={() => router.replace(lastEvaluation.outcome === 'MISSED' ? '/' : '/morning-chat')}
      onChest={() => router.push('/chest')}
    />
  )
}

function MorningResult({
  evaluation,
  streak,
  pendingChest,
  onContinue,
  onChest,
}: {
  evaluation: NightEvaluation
  streak: number
  pendingChest: boolean
  onContinue: () => void
  onChest: () => void
}) {
  const { outcome, hpDelta, xp } = evaluation
  return (
    <View style={styles.root}>
      <SceneHero outcome={outcome} title={bannerFor(outcome)} />
      <TavernFrame>
        <View style={styles.stack}>
          <WoodPanel>
            <View style={styles.panelBody}>
              <Text style={styles.line}>{strings[LINE_KEYS[outcome]]}</Text>
              <View style={styles.rewards}>
                {hpDelta > 0 && (
                  <RewardRow icon={ICONS.heart_full} label={`+${hpDelta} HP`} tone="leaf" />
                )}
                {hpDelta < 0 && (
                  <RewardRow icon={ICONS.heart_empty} label={`${hpDelta} HP`} tone="text" />
                )}
                {xp > 0 && <RewardRow icon={STAR_ICON} label={`+${xp} XP`} tone="gold" />}
                {outcome === 'PERFECT' && (
                  <RewardRow icon={ICONS.tile_gold} label={strings.reward_gold_pixel} tone="gold" />
                )}
              </View>
            </View>
          </WoodPanel>

          <StreakStrip streak={streak} />

          {pendingChest && (
            <GoldButton label={strings.chest_title.toUpperCase()} onPress={onChest} />
          )}

          <GoldButton label={strings.morning_continue.toUpperCase()} onPress={onContinue} />
        </View>
      </TavernFrame>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  stack: {
    flex: 1,
    gap: tavernLayout.sectionGap,
    justifyContent: 'center',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    gap: tavernLayout.sectionGap,
  },
  dim: {
    ...theme.type.body,
    color: theme.colors.textDim,
    textAlign: 'center',
  },
  sceneFrame: {
    alignSelf: 'stretch',
    backgroundColor: tavernColors.edge,
    overflow: 'hidden',
  },
  titleOverlay: {
    position: 'absolute',
    top: theme.spacing(3),
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: theme.spacing(2),
  },
  bigTitle: {
    fontFamily: theme.fontFamily,
    fontSize: 24,
    lineHeight: 34,
    letterSpacing: 2,
    textAlign: 'center',
    textShadowColor: tavernColors.edge,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  panelBody: { gap: theme.spacing(3) },
  line: { ...theme.type.label, color: theme.colors.textDim, textAlign: 'center' },
  rewards: { alignSelf: 'stretch', gap: theme.spacing(2) },
  streakStrip: { alignSelf: 'center' },
  streakWell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(3),
    paddingVertical: theme.spacing(2),
    paddingHorizontal: theme.spacing(4),
  },
  streakText: { ...theme.type.body, color: theme.colors.leaf, letterSpacing: 2 },
  leafOrnament: {
    width: 8,
    height: 8,
    backgroundColor: theme.colors.leaf,
    transform: [{ rotate: '45deg' }],
  },
})
