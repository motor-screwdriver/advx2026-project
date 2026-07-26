import React, { useRef, useState } from 'react'
import { Animated, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import type { ChestLoot } from '../contracts/types'
import { playSfx } from '../systems/audio'
import { SFX_TRACKS } from '../systems/audioTracks'
import { makePop, makeShake } from '../ui/animations'
import { useScreenTransition } from '../ui/screenTransition'
import { useGame } from '../ui/useGame'
import { ClosedStage } from './ChestParts'
import { RevealStage } from './ChestReveal'

export function ChestScreen() {
  const go = useScreenTransition()
  const { state, openChest } = useGame()
  const [loot, setLoot] = useState<ChestLoot | null>(null)
  const [triedEmpty, setTriedEmpty] = useState(false)
  const shakeX = useRef(new Animated.Value(0)).current
  const pop = useRef(new Animated.Value(0)).current

  // A held Lucky Coin turns the closed stage gold (mockup 26).
  const lucky = state.artifacts.includes('lucky_coin')

  // The whole stage is the tap target — no tiny button to hunt for.
  const open = () => {
    playSfx(SFX_TRACKS.CHEST)
    makeShake(shakeX, 8).start(() => {
      const result = openChest()
      setLoot(result)
      setTriedEmpty(result === null)
      if (result) {
        makePop(pop).start()
      }
    })
  }

  return (
    <SafeAreaView style={styles.safe}>
      {!loot ? (
        <ClosedStage lucky={lucky} shakeX={shakeX} triedEmpty={triedEmpty} onOpen={open} />
      ) : (
        <RevealStage loot={loot} pop={pop} onTake={() => go.back()} />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#150d08' },
})
