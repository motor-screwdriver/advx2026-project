import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { theme } from './theme'

interface Props {
  label: string
  value: string | number
  tone?: 'gold' | 'leaf' | 'text'
}

const TONES = {
  gold: theme.colors.gold,
  leaf: theme.colors.leaf,
  text: theme.colors.text,
} as const

/** Rounded stat pill: dim label + bright value (LV 2, STREAK 3, PERFECT 68%). */
export function StatChip({ label, value, tone = 'gold' }: Props) {
  return (
    <View style={styles.chip}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: TONES[tone] }]}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(2),
    backgroundColor: theme.colors.inset,
    borderWidth: theme.borderWidth,
    borderColor: theme.colors.outline,
    borderTopColor: theme.colors.bevelLight,
    borderRadius: 999,
    paddingVertical: theme.spacing(2),
    paddingHorizontal: theme.spacing(3),
  },
  label: { ...theme.type.label, color: theme.colors.textDim },
  value: { ...theme.type.label },
})
