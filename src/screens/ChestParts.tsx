import React from 'react'
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native'

import { DESIGN } from '../../assets/manifest'
import { PixelSprite } from '../ui/PixelSprite'
import { strings } from '../ui/strings'
import { theme } from '../ui/theme'

/** Copy from the chest mockups that has no strings.ts key yet (local only). */
export const chestCopy = {
  caption: 'One chest every week. One item inside.',
} as const

interface ClosedProps {
  lucky: boolean
  shakeX: Animated.Value
  triedEmpty: boolean
  onOpen: () => void
}

/**
 * Closed stage 1:1 with mockup 24 (26 when a Lucky Coin is active): title,
 * READY! plaque, chest flanked by candles, OPEN button, caption. The whole
 * stage stays the tap target, as before.
 */
export function ClosedStage({ lucky, shakeX, triedEmpty, onOpen }: ClosedProps) {
  const { width } = useWindowDimensions()
  const contentW = Math.min(width, 480)

  return (
    <Pressable style={styles.stage} onPress={onOpen}>
      <PixelSprite
        sprite={lucky ? DESIGN.chest_title_weekly_chest_gold : DESIGN.chest_title_weekly_chest}
        size={contentW * 0.92}
      />
      <PixelSprite sprite={DESIGN.chest_plaque_ready} size={contentW * 0.5} />
      <ChestBlock lucky={lucky} shakeX={shakeX} width={contentW} />
      <Text style={styles.caption}>{triedEmpty ? strings.chest_none : chestCopy.caption}</Text>
    </Pressable>
  )
}

function ChestBlock({
  lucky,
  shakeX,
  width,
}: {
  lucky: boolean
  shakeX: Animated.Value
  width: number
}) {
  const chestW = width * 0.6
  const candleW = width * 0.13
  return (
    <View style={styles.chestRow}>
      <View style={styles.candle}>
        <PixelSprite sprite={DESIGN.chest_candle_l} size={candleW} />
      </View>
      <Animated.View style={{ transform: [{ translateX: shakeX }] }}>
        <PixelSprite
          sprite={lucky ? DESIGN.chest_chest_gold : DESIGN.chest_chest_steel}
          size={chestW}
        />
        {lucky && (
          <View style={styles.luckyRibbon}>
            <PixelSprite sprite={DESIGN.chest_ribbon_lucky} size={chestW * 1.15} />
          </View>
        )}
      </Animated.View>
      <View style={styles.candle}>
        <PixelSprite sprite={DESIGN.chest_candle_r} size={candleW} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: theme.spacing(3),
  },
  chestRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing(2),
  },
  candle: {
    paddingBottom: theme.spacing(2),
  },
  luckyRibbon: {
    position: 'absolute',
    left: '-7.5%',
    bottom: '6%',
  },
  caption: {
    ...theme.type.body,
    color: theme.colors.textDim,
    textAlign: 'center',
  },
})
