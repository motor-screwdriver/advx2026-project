import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { theme } from './theme'

interface Props {
  text: string
  tone?: 'gold' | 'leaf' | 'coral'
}

const TONES = {
  gold: theme.colors.gold,
  leaf: theme.colors.leaf,
  coral: theme.colors.heartFull,
} as const

/** Top title ribbon: gold text on wood with corner rivets. Result headlines. */
export function Banner({ text, tone = 'gold' }: Props) {
  const color = TONES[tone]
  return (
    <View style={styles.frame}>
      <View style={styles.ribbon}>
        <View style={[styles.rivet, styles.rivetLeft]} />
        <Text style={[styles.text, { color }]} numberOfLines={2}>
          {text}
        </Text>
        <View style={[styles.rivet, styles.rivetRight]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: theme.colors.outline,
    borderRadius: theme.borderRadius + 2,
    padding: theme.borderWidth,
  },
  ribbon: {
    backgroundColor: theme.colors.panel,
    borderRadius: theme.borderRadius,
    borderTopWidth: theme.borderWidth,
    borderTopColor: theme.colors.bevelLight,
    paddingVertical: theme.spacing(3),
    paddingHorizontal: theme.spacing(6),
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { ...theme.type.body, textAlign: 'center', letterSpacing: 1 },
  rivet: {
    position: 'absolute',
    top: theme.spacing(2),
    width: 4,
    height: 4,
    borderRadius: 1,
    backgroundColor: theme.colors.bevelLight,
  },
  rivetLeft: { left: theme.spacing(2) },
  rivetRight: { right: theme.spacing(2) },
})
