import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { theme } from './theme'

interface Props {
  name: string
}

/** Small brass-rimmed plaque for a hero's name (INNKEEPER-style). */
export function Nameplate({ name }: Props) {
  return (
    <View style={styles.frame}>
      <View style={styles.plate}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: theme.colors.gold,
    borderRadius: theme.borderRadius + 1,
    padding: 2,
    alignSelf: 'center',
  },
  plate: {
    backgroundColor: theme.colors.inset,
    borderRadius: theme.borderRadius,
    paddingVertical: theme.spacing(2),
    paddingHorizontal: theme.spacing(5),
  },
  name: {
    ...theme.type.body,
    color: theme.colors.gold,
    letterSpacing: 1,
    textAlign: 'center',
  },
})
