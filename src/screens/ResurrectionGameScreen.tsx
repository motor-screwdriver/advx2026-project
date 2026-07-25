import React, { useState } from 'react'
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { playSfx } from '../systems/audio'
import { useScreenTransition } from '../ui/screenTransition'
import { SoulTether } from '../ui/SoulTether'
import { ROUND_COUNT } from '../ui/soulTetherLogic'
import { SoulTetherSheet } from '../ui/SoulTetherSheet'
import { strings } from '../ui/strings'
import { useGame } from '../ui/useGame'

type Phase = 'playing' | 'won' | 'lost'

/**
 * Soul Tether — a 1:1 rendition of the mockup sheet: frame, crest, wraith
 * scene, bar bezel, parchment and gold plate are the sprite itself; the
 * round text, pips, golden zone, sparkle cursor and labels are overlaid.
 *
 * After the last round the same sheet shows the verdict in the parchment
 * and the plate becomes CONTINUE / NEW HERO (tap anywhere to proceed).
 */
export function ResurrectionGameScreen() {
  const go = useScreenTransition()
  const { resurrect, startNewHero } = useGame()
  const { width, height } = useWindowDimensions()
  // Fit the whole sheet on screen so the plate is always visible.
  const sheetWidth = Math.min(width, (height * 1125) / 1999)
  const [phase, setPhase] = useState<Phase>('playing')
  const [results, setResults] = useState<boolean[]>([])

  const onResult = (success: boolean, finalResults: boolean[]) => {
    setPhase(success ? 'won' : 'lost')
    setResults(finalResults)
    if (success) {
      resurrect()
      playSfx('sfx_victory')
    }
  }

  const finish = () => {
    if (phase === 'won') {
      go.dismissTo('/')
      return
    }
    startNewHero()
    go.dismissTo('/hero-ceremony')
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.center}>
        {phase === 'playing' ? (
          <SoulTether width={sheetWidth} onResult={onResult} />
        ) : (
          <Pressable onPress={finish}>
            <SoulTetherSheet
              width={sheetWidth}
              round={ROUND_COUNT - 1}
              results={results}
              zone={null}
              cursor={null}
              feedback={phase === 'won' ? strings.soul_success : strings.soul_fail}
              feedbackDanger={phase === 'lost'}
              label={phase === 'won' ? strings.morning_continue : strings.death_new_hero}
            />
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#150d08' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
})
