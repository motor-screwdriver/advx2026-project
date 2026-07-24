import { useRouter } from 'expo-router'
import React, { useRef, useState } from 'react'
import { Animated, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import type { ChestLoot } from '../contracts/types'
import { playSfx } from '../systems/audio'
import { makePop, makeShake } from '../ui/animations'
import { TavernFrame } from '../ui/tavern'
import { useGame } from '../ui/useGame'
import { ClosedStage, RevealStage } from './ChestParts'

export function ChestScreen() {
  const router = useRouter()
  const { openChest } = useGame()
  const [loot, setLoot] = useState<ChestLoot | null>(null)
  const [triedEmpty, setTriedEmpty] = useState(false)
  const shakeX = useRef(new Animated.Value(0)).current
  const pop = useRef(new Animated.Value(0)).current

  // The whole stage is the tap target — no tiny button to hunt for.
  const open = () => {
    playSfx('sfx_chest')
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
      <TavernFrame>
        {!loot ? (
          <ClosedStage shakeX={shakeX} triedEmpty={triedEmpty} onOpen={open} />
        ) : (
          <RevealStage loot={loot} pop={pop} onTake={() => router.back()} />
        )}
      </TavernFrame>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#150d08' },
})
