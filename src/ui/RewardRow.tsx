import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

import type { SpriteEntry } from '../../assets/manifest'
import { PixelSprite } from './PixelSprite'
import { theme } from './theme'

interface Props {
  /** Optional pixel icon at the row's leading edge. */
  icon?: SpriteEntry
  label: string
  tone?: 'gold' | 'leaf' | 'text'
}

const TONES = {
  gold: theme.colors.gold,
  leaf: theme.colors.leaf,
  text: theme.colors.text,
} as const

/** Reward line: pixel icon + label (+1 HP, +100 XP, GOLD PIXEL EARNED). */
export function RewardRow({ icon, label, tone = 'text' }: Props) {
  return (
    <View style={styles.row}>
      {icon ? <PixelSprite sprite={icon} size={24} /> : <View style={styles.dot} />}
      <Text style={[styles.label, { color: TONES[tone] }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(3),
    backgroundColor: theme.colors.inset,
    borderWidth: theme.borderWidth,
    borderColor: theme.colors.outline,
    borderTopColor: theme.colors.bevelLight,
    borderRadius: theme.borderRadius,
    paddingVertical: theme.spacing(2),
    paddingHorizontal: theme.spacing(3),
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 1,
    backgroundColor: theme.colors.gold,
  },
  label: { ...theme.type.body, letterSpacing: 1 },
})
