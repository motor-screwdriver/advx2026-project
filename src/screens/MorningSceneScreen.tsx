import { useRouter } from 'expo-router'
import React, { useEffect } from 'react'
import { StyleSheet, useWindowDimensions, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import type { NightOutcome } from '../contracts/types'
import { playSfx } from '../systems/audio'
import { useGame } from '../ui/useGame'
import { MorningSheet } from './MorningSheet'

/**
 * Morning result — a 1:1 rendition of the night_screens mockups: the whole
 * sheet (title, animated scene, baked rewards, CONTINUE) is the sprite
 * itself; only the streak value and the CONTINUE hotspot are dynamic.
 *
 * With a chest pending (level-up), CONTINUE detours to the chest first;
 * coming back here it proceeds to the morning chat as usual.
 */
export function MorningSceneScreen() {
  const router = useRouter()
  const { state, lastEvaluation, pendingChest } = useGame()
  const { width, height } = useWindowDimensions()
  // Fit the whole 9:16 sheet on screen so CONTINUE is always visible.
  const sheetWidth = Math.min(width, (height * 9) / 16)

  useEffect(() => {
    if (!lastEvaluation) return
    if (lastEvaluation.hpDelta < 0) playSfx('sfx_damage')
    else if (lastEvaluation.outcome === 'PERFECT') playSfx('sfx_victory')
  }, [lastEvaluation])

  const outcome: NightOutcome = lastEvaluation?.outcome ?? 'MISSED'

  const onContinue = () => {
    if (!lastEvaluation) {
      router.back()
      return
    }
    if (pendingChest) router.push('/chest')
    else router.replace('/morning-chat')
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.center}>
        <MorningSheet
          width={sheetWidth}
          outcome={outcome}
          streak={state.perfectWeekStreak}
          onContinue={onContinue}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1b120a' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
})
