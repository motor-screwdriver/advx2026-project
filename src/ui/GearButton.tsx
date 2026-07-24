import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { tavernColors } from './tavern'

/** Round wood settings button with a gold pixel cog (home dock). */
export function GearButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.gearBtn, pressed && { transform: [{ translateY: 2 }] }]}
    >
      <View style={styles.gearInner}>
        <GearGlyph size={26} />
      </View>
    </Pressable>
  )
}

const GEAR_ROWS = [
  '.XX..XX.',
  'XXXXXXXX',
  'XXX..XXX',
  'XX....XX',
  'XX....XX',
  'XXX..XXX',
  'XXXXXXXX',
  '.XX..XX.',
]

function GearGlyph({ size }: { size: number }) {
  const cell = size / GEAR_ROWS.length
  return (
    <View style={{ width: size, height: size, flexDirection: 'row', flexWrap: 'wrap' }}>
      {GEAR_ROWS.join('')
        .split('')
        .map((pixel, i) => (
          <View
            key={i}
            style={{
              width: cell,
              height: cell,
              backgroundColor: pixel === 'X' ? tavernColors.gold : 'transparent',
            }}
          />
        ))}
    </View>
  )
}

const styles = StyleSheet.create({
  gearBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: tavernColors.edge,
    padding: 3,
  },
  gearInner: {
    flex: 1,
    borderRadius: 29,
    backgroundColor: tavernColors.mid,
    borderTopWidth: 3,
    borderTopColor: tavernColors.light,
    borderBottomWidth: 3,
    borderBottomColor: tavernColors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
