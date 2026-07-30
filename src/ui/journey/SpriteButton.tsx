import { Image as ExpoImage } from 'expo-image'
import React from 'react'
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'

import type { SpriteEntry } from '../../../assets/manifest'

interface Props {
  sprite: SpriteEntry
  spritePressed: SpriteEntry
  onPress: () => void
  accessibilityLabel: string
  /** Positioning box (the HUD slot the button covers). */
  style?: StyleProp<ViewStyle>
  /** Extra content over the art, e.g. a text label on the blank plate. */
  children?: (pressed: boolean) => React.ReactNode
}

/**
 * A dock button drawn straight from its pixel sprite pair: the pressed art
 * swaps in while the finger is down. The two sprites share a canvas, so the
 * position box works for both.
 */
export function SpriteButton({
  sprite,
  spritePressed,
  onPress,
  accessibilityLabel,
  style,
  children,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={style}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {({ pressed }) => (
        <>
          <ExpoImage
            source={(pressed ? spritePressed : sprite).source}
            style={StyleSheet.absoluteFill}
            contentFit="fill"
            cachePolicy="memory-disk"
            transition={0}
          />
          {children?.(pressed)}
        </>
      )}
    </Pressable>
  )
}
