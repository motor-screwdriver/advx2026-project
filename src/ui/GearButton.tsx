import React from 'react'
import { Image, Pressable, StyleSheet } from 'react-native'

import { BUTTONS } from '../../assets/manifest'

/** Round wood settings button — hand-drawn gear sprite (home dock). */
export function GearButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.gearBtn} accessibilityRole="button">
      {({ pressed }) => (
        <Image
          source={pressed ? BUTTONS.btn_gear_pressed.source : BUTTONS.btn_gear.source}
          resizeMode="contain"
          fadeDuration={0}
          style={styles.gearImage}
        />
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  gearBtn: {
    width: 64,
    height: 64,
  },
  gearImage: {
    width: '100%',
    height: '100%',
  },
})
