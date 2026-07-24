import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { theme } from './theme'

export interface NavItem {
  key: string
  label: string
  /** Short glyph shown above the label (ASCII, renders in the pixel font). */
  glyph?: string
  onPress?: () => void
  active?: boolean
}

interface Props {
  items: NavItem[]
}

/** Wooden bottom bar of icon-buttons (MOSAIC / BAG / SETTINGS). */
export function BottomNav({ items }: Props) {
  return (
    <View style={styles.bar}>
      {items.map((item) => (
        <Pressable
          key={item.key}
          onPress={item.onPress}
          style={({ pressed }) => [styles.item, pressed && styles.pressed]}
        >
          {item.glyph ? (
            <Text style={[styles.glyph, item.active && styles.active]}>{item.glyph}</Text>
          ) : null}
          <Text style={[styles.label, item.active && styles.active]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: theme.colors.panel,
    borderTopWidth: theme.borderWidth,
    borderTopColor: theme.colors.bevelLight,
    borderRadius: theme.borderRadius,
    paddingVertical: theme.spacing(3),
    paddingHorizontal: theme.spacing(2),
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: theme.spacing(1),
    paddingVertical: theme.spacing(1),
  },
  pressed: { opacity: 0.6 },
  glyph: { ...theme.type.body, color: theme.colors.textDim },
  label: { ...theme.type.label, color: theme.colors.textDim },
  active: { color: theme.colors.gold },
})
