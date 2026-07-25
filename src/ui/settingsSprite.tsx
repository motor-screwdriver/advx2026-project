import React, { useEffect, useRef } from 'react'
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

import { DESIGN, type SpriteEntry } from '../../assets/manifest'
import { useReducedMotion } from './useReducedMotion'

/**
 * Settings screen kit that renders the reference sprite
 * assets/settings/settings.png 1:1 — each plank row is the actual slice
 * from the sprite (assets/design/settings/*), scaled uniformly; dynamic
 * content is overlaid at the slice's original sprite coordinates.
 */

/** Palette sampled from the sprite (source of truth for this screen). */
export const spriteColors = {
  bg: '#0e0903',
  outline: '#120b06',
  brass: '#8a6435',
  brassLight: '#b18b4a',
  inner: '#1b110a',
  plank: '#46301a',
  plankLight: '#5f4023',
  plankDark: '#33200f',
  cream: '#f2e2ba',
  tan: '#c9a877',
  red: '#d6503c',
  trackWell: '#221507',
  gold: '#efb33f',
  goldLight: '#ffd970',
  goldDark: '#9c6a1c',
  inkOnGold: '#3a2408',
} as const

/** Sprite sheet metrics: full sheet 2160 wide, plank rows span x 66..2092. */
export const SHEET_W = 2160
export const ROW_W = 2026
const DROPDOWN_TOP_H = 170
const DROPDOWN_MID_H = 100
const DROPDOWN_BOTTOM_H = 170

/**
 * Uniform sprite->screen scale. Rows keep the sprite's side margins
 * (66/2160 of the screen width), so every slice maps with a single factor.
 */
export function useSettingsScale(): { k: number; rowW: number; pad: number } {
  const { width } = useWindowDimensions()
  const pad = (width * 66) / SHEET_W
  const rowW = width - pad * 2
  return { k: rowW / ROW_W, rowW, pad }
}

/** Fade + slide-up entrance used by every plank row (stagger via delay). */
export function useRowEntrance(delay: number): {
  opacity: Animated.Value
  translateY: Animated.AnimatedInterpolation<number>
} {
  const reduced = useReducedMotion()
  const value = useRef(new Animated.Value(0)).current
  useEffect(() => {
    if (reduced) {
      value.setValue(1)
      return
    }
    const animation = Animated.timing(value, {
      toValue: 1,
      duration: 320,
      delay,
      useNativeDriver: true,
    })
    animation.start()
    return () => animation.stop()
  }, [value, delay, reduced])
  return {
    opacity: value,
    translateY: value.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }),
  }
}

interface SpriteRowProps {
  entry: SpriteEntry
  k: number
  onPress?: () => void
  /** Dynamic overlay, absolutely positioned over the plank slice. */
  children?: React.ReactNode
  /** Entrance stagger delay in ms. */
  delay?: number
}

interface SettingsDropdownPanelProps {
  k: number
  children: React.ReactNode
  contentStyle?: StyleProp<ViewStyle>
  delay?: number
}

function DropdownSpriteBackground({ k }: { k: number }) {
  const top = DESIGN.settings_dropdown_top
  const mid = DESIGN.settings_dropdown_mid
  const bottom = DESIGN.settings_dropdown_bottom
  const topH = top.height * k
  const bottomH = bottom.height * k
  return (
    <>
      <Image
        source={mid.source}
        style={[styles.dropdownMid, { top: topH, bottom: bottomH, width: mid.width * k }]}
        resizeMode="stretch"
      />
      <Image
        source={top.source}
        style={[styles.dropdownCap, { width: top.width * k, height: topH, top: 0 }]}
        resizeMode="stretch"
      />
      <Image
        source={bottom.source}
        style={[styles.dropdownCap, { width: bottom.width * k, height: bottomH, bottom: 0 }]}
        resizeMode="stretch"
      />
    </>
  )
}

/** One plank row rendered as its sprite slice, with press-sink feedback. */
export function SpriteRow({ entry, k, onPress, children, delay = 0 }: SpriteRowProps) {
  const { opacity, translateY } = useRowEntrance(delay)
  const size = { width: entry.width * k, height: entry.height * k }
  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <Pressable
        accessibilityRole={onPress ? 'button' : undefined}
        onPress={onPress}
        style={({ pressed }) => [size, pressed && onPress != null && styles.pressed]}
      >
        <Image source={entry.source} style={size} resizeMode="stretch" />
        {children != null && <View style={styles.overlay}>{children}</View>}
      </Pressable>
    </Animated.View>
  )
}

/** Expandable settings panel matching the wooden plank rows without stretching their bitmap. */
export function SettingsDropdownPanel({
  k,
  children,
  contentStyle,
  delay = 0,
}: SettingsDropdownPanelProps) {
  const { opacity, translateY } = useRowEntrance(delay)
  return (
    <Animated.View
      style={[
        styles.dropdownRoot,
        {
          width: ROW_W * k,
          minHeight: (DROPDOWN_TOP_H + DROPDOWN_MID_H + DROPDOWN_BOTTOM_H) * k,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <DropdownSpriteBackground k={k} />
      <View
        style={[
          styles.dropdownContent,
          {
            minHeight: 440 * k,
            paddingHorizontal: 96 * k,
            paddingVertical: 70 * k,
            gap: 34 * k,
          },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  pressed: {
    transform: [{ translateY: 3 }],
    opacity: 0.92,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  dropdownRoot: {
    position: 'relative',
    overflow: 'hidden',
  },
  dropdownCap: {
    position: 'absolute',
    left: 0,
  },
  dropdownMid: {
    position: 'absolute',
    left: 0,
  },
  dropdownContent: {
    position: 'relative',
  },
})
