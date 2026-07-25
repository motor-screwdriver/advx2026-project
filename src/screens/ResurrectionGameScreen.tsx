import React, { useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { playSfx } from '../systems/audio'
import { useScreenTransition } from '../ui/screenTransition'
import { SoulTether } from '../ui/SoulTether'
import { TetherScene } from '../ui/SoulTetherParts'
import { strings } from '../ui/strings'
import {
  GoldButton,
  Parchment,
  ScreenTitle,
  TavernFrame,
  WoodButton,
  WoodPanel,
  tavernColors,
} from '../ui/tavern'
import { theme } from '../ui/theme'
import { useGame } from '../ui/useGame'

type Phase = 'playing' | 'won' | 'lost'

/** Header: riveted wood plaque with the title. */
function Header() {
  return (
    <WoodPanel style={styles.headerPanel} contentStyle={styles.headerWell}>
      <ScreenTitle title={strings.death_soul_tether} size={20} />
    </WoodPanel>
  )
}

/** Outcome: verdict on parchment plus the way out (revive or new hero). */
function ResultPhase({ phase, onFinish }: { phase: Phase; onFinish: () => void }) {
  return (
    <View style={styles.game}>
      <TetherScene />
      <Parchment>
        <Text style={[styles.resultText, phase === 'lost' && styles.resultLost]}>
          {phase === 'won' ? strings.soul_success : strings.soul_fail}
        </Text>
      </Parchment>
      {phase === 'won' ? (
        <GoldButton label={strings.morning_continue} onPress={onFinish} />
      ) : (
        <WoodButton label={strings.death_new_hero} onPress={onFinish} />
      )}
    </View>
  )
}

export function ResurrectionGameScreen() {
  const go = useScreenTransition()
  const { resurrect, startNewHero } = useGame()
  const [phase, setPhase] = useState<Phase>('playing')

  const onResult = (success: boolean) => {
    setPhase(success ? 'won' : 'lost')
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
    <SafeAreaView style={styles.safe}>
      <TavernFrame>
        <ScrollView contentContainerStyle={styles.stack} showsVerticalScrollIndicator={false}>
          <Header />
          {phase === 'playing' ? (
            <SoulTether onResult={onResult} />
          ) : (
            <ResultPhase phase={phase} onFinish={finish} />
          )}
        </ScrollView>
      </TavernFrame>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#150d08' },
  stack: { gap: theme.spacing(3) },
  headerPanel: { width: '100%' },
  headerWell: { alignItems: 'center' },
  game: { gap: theme.spacing(3) },
  resultText: {
    ...theme.type.body,
    color: tavernColors.inkOnParchment,
    textAlign: 'center',
  },
  resultLost: { color: tavernColors.danger },
})
