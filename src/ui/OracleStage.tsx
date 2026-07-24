import React, { useEffect, useState } from 'react'
import { AccessibilityInfo, StyleSheet, View } from 'react-native'

import { ICONS, SPRITES } from '../../assets/manifest'
import { PixelSprite } from './PixelSprite'
import { theme } from './theme'

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduced)
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced)
    return () => subscription.remove()
  }, [])
  return reduced
}

export function OracleStage({
  thinking = false,
  compact = false,
}: {
  thinking?: boolean
  compact?: boolean
}) {
  const reducedMotion = useReducedMotion()
  return (
    <View style={[styles.stage, compact && styles.stageCompact]}>
      <View style={[styles.aura, compact && styles.auraCompact, thinking && styles.auraThinking]} />
      <View style={[styles.auraInner, compact && styles.auraInnerCompact]} />
      <View accessible accessibilityLabel="Luma, a friendly magical sleep oracle">
        <PixelSprite
          sprite={SPRITES.guide_luma}
          size={compact ? 150 : 210}
          animated={!reducedMotion}
          fps={1.5}
        />
      </View>
      <View style={[styles.spark, styles.sparkOne]} />
      <View style={[styles.spark, styles.sparkTwo]} />
      <View style={[styles.spark, styles.sparkThree]} />
      <View style={styles.book}>
        <PixelSprite sprite={ICONS.guide_sleep_book} size={compact ? 36 : 44} animated={false} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    minHeight: 210,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageCompact: { minHeight: 140 },
  aura: {
    position: 'absolute',
    width: 184,
    height: 184,
    borderRadius: 92,
    borderWidth: 2,
    borderColor: '#7d68b8',
    backgroundColor: '#28235f66',
  },
  auraThinking: {
    borderColor: theme.colors.gold,
    backgroundColor: '#4d3b6f77',
  },
  auraCompact: { width: 132, height: 132, borderRadius: 66 },
  auraInner: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: theme.borderWidth,
    borderColor: '#b49ada',
  },
  auraInnerCompact: { width: 108, height: 108, borderRadius: 54 },
  spark: {
    position: 'absolute',
    width: 5,
    height: 5,
    backgroundColor: theme.colors.gold,
    transform: [{ rotate: '45deg' }],
  },
  sparkOne: { top: '22%', left: '22%' },
  sparkTwo: { top: '34%', right: '18%', width: 8, height: 8 },
  sparkThree: { bottom: '24%', left: '17%', backgroundColor: '#b49ada' },
  book: {
    position: 'absolute',
    right: '11%',
    bottom: '9%',
    padding: theme.spacing(1),
    backgroundColor: theme.colors.inset,
    borderWidth: theme.borderWidth,
    borderColor: theme.colors.bevelLight,
    borderRadius: theme.borderRadius,
  },
})
