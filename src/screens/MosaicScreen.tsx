import React, { useRef } from 'react'
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { shareViewAsPng } from '../systems/share'
import { useScreenTransition } from '../ui/screenTransition'
import { useGame } from '../ui/useGame'
import { MosaicBackButton, MosaicSheet } from './MosaicParts'

const copy = {
  shareDialog: 'My 8bit Sleep year mosaic',
} as const

/**
 * Year Mosaic — a 1:1 rendition of the mockup sprite: the whole sheet
 * (title, plaques, 18x18 board, legend, SHARE) is the sprite itself,
 * dynamic values and tiles are overlaid at measured positions.
 */
export function MosaicScreen() {
  const go = useScreenTransition()
  const { state } = useGame()
  const { width } = useWindowDimensions()
  const shareRef = useRef<View>(null)

  const perfectCount = state.nights.filter((night) => night.outcome === 'PERFECT').length
  const perfectPct = state.nights.length
    ? Math.round((perfectCount / state.nights.length) * 100)
    : 0

  const onShare = () => {
    void shareViewAsPng(shareRef, copy.shareDialog)
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View ref={shareRef} collapsable={false}>
          <MosaicSheet
            width={width}
            level={state.hero?.level ?? 0}
            streak={state.perfectWeekStreak}
            perfectPct={perfectPct}
            nights={state.nights}
            onShare={onShare}
          />
        </View>
        <MosaicBackButton width={width} onPress={() => go.back()} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1b120a' },
  scroll: { alignItems: 'center', paddingTop: 24, paddingBottom: 24 },
})
