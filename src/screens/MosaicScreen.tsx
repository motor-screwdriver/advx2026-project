import React, { useRef } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import type { PixelColor } from '../contracts/types'
import { shareViewAsPng } from '../systems/share'
import { strings } from '../ui/strings'
import { ScreenTitle, TavernFrame, WoodPanel } from '../ui/tavern'
import { theme } from '../ui/theme'
import { useGame } from '../ui/useGame'
import { BadgesRow, ShareRow } from './MosaicParts'

const DAYS_IN_YEAR = 365

const PIXEL_COLORS: Record<PixelColor, string> = {
  GOLD: theme.colors.pixelGold,
  GRAY: theme.colors.pixelGray,
  BLACK: theme.colors.pixelBlack,
}

/** Copy from the mosaic mockup that has no strings.ts key yet (local only). */
const copy = {
  shareDialog: 'My 8bit Sleep year mosaic',
} as const

/** One legend entry: a mosaic cell swatch plus its outcome label. */
function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  )
}

export function MosaicScreen() {
  const { state } = useGame()
  const shareRef = useRef<View>(null)
  const perfectCount = state.nights.filter((night) => night.outcome === 'PERFECT').length
  const perfectPct = state.nights.length
    ? Math.round((perfectCount / state.nights.length) * 100)
    : 0

  const onShare = () => {
    void shareViewAsPng(shareRef, copy.shareDialog)
  }

  return (
    <SafeAreaView style={styles.safe}>
      <TavernFrame>
        <ScrollView contentContainerStyle={styles.stack} showsVerticalScrollIndicator={false}>
          <ScreenTitle title={strings.mosaic_title.toUpperCase()} />
          <BadgesRow
            level={state.hero?.level ?? 0}
            streak={state.perfectWeekStreak}
            perfectPct={perfectPct}
          />
          <View ref={shareRef} collapsable={false}>
            <WoodPanel contentStyle={styles.gridWell}>
              {state.nights.length === 0 ? (
                <Text style={styles.empty}>{strings.mosaic_empty}</Text>
              ) : (
                <>
                  <View style={styles.grid}>
                    {state.nights.map((night, index) => (
                      <View
                        key={`${night.date}-${index}`}
                        style={[styles.pixel, { backgroundColor: PIXEL_COLORS[night.pixel] }]}
                      />
                    ))}
                    {Array.from({ length: DAYS_IN_YEAR - state.nights.length }, (_, index) => (
                      <View key={`empty-${index}`} style={[styles.pixel, styles.pixelEmpty]} />
                    ))}
                  </View>
                  <View style={styles.legend}>
                    <LegendItem color={theme.colors.pixelGold} label={strings.outcome_perfect} />
                    <LegendItem color={theme.colors.pixelGray} label={strings.outcome_good} />
                    <LegendItem color={theme.colors.pixelBlack} label={strings.outcome_bad} />
                  </View>
                </>
              )}
            </WoodPanel>
          </View>
          <ShareRow onShare={onShare} />
        </ScrollView>
      </TavernFrame>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#150d08' },
  stack: { gap: theme.spacing(4) },
  gridWell: {
    gap: theme.spacing(4),
  },
  empty: {
    ...theme.type.body,
    color: theme.colors.textDim,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 2,
  },
  pixel: {
    width: 14,
    height: 14,
    borderRadius: 2,
  },
  pixelEmpty: {
    backgroundColor: theme.colors.inset,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing(4),
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(2),
  },
  legendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendLabel: {
    ...theme.type.label,
    color: theme.colors.textDim,
  },
})
