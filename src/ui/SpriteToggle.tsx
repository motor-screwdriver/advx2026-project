import React, { useEffect, useRef } from 'react'
import { Animated, Image, Pressable, StyleSheet, Text } from 'react-native'

import { DESIGN } from '../../assets/manifest'
import { spriteColors } from './settingsSprite'
import { theme } from './theme'
import { useReducedMotion } from './useReducedMotion'

/**
 * The sprite's gold ON/OFF toggle, rendered from the sliced pieces of
 * assets/settings/settings.png: the emptied dark pill track plus the blank
 * gold knob carrying a live ON/OFF caption. Scaled down from the sprite's
 * oversized toggle (SCALE) but kept centered on its original spot inside
 * the NOTIFICATIONS plank; the knob slides with a spring.
 */

/** Sprite coordinates, local to the row_notif slice (row box x66 y1296). */
const TRACK = { left: 1396, top: 143, width: 461, height: 216 }
const KNOB = { left: 188, top: -14 } // relative to the track
/** Knob x-shift from the baked ON position to the OFF position. */
const OFF_SHIFT = -203
/** The sprite's toggle is drawn oversized; shrink it to fit the plank. */
const SCALE = 0.72

/** Spring-follow value for the knob position (reduced-motion aware). */
function useKnobSpring(on: boolean): Animated.Value {
  const reduced = useReducedMotion()
  const anim = useRef(new Animated.Value(on ? 1 : 0)).current
  useEffect(() => {
    if (reduced) {
      anim.setValue(on ? 1 : 0)
      return
    }
    Animated.spring(anim, {
      toValue: on ? 1 : 0,
      friction: 6,
      tension: 140,
      useNativeDriver: true,
    }).start()
  }, [anim, on, reduced])
  return anim
}

export function SpriteToggle({
  on,
  onToggle,
  k,
}: {
  on: boolean
  onToggle: () => void
  k: number
}) {
  const anim = useKnobSpring(on)
  const ks = k * SCALE
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [OFF_SHIFT * ks, 0] })
  const track = DESIGN.settings_toggle_track
  const knob = DESIGN.settings_toggle_knob_blank
  // Keep the shrunk toggle centered where the sprite drew it.
  const left = (TRACK.left + TRACK.width / 2) * k - (track.width * ks) / 2
  const top = (TRACK.top + TRACK.height / 2) * k - (track.height * ks) / 2
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      onPress={onToggle}
      hitSlop={16}
      style={[styles.hit, { left, top }]}
    >
      <Image
        source={track.source}
        style={{ width: track.width * ks, height: track.height * ks }}
        resizeMode="stretch"
      />
      <Animated.View
        style={[
          styles.knob,
          {
            left: KNOB.left * ks,
            top: KNOB.top * ks,
            width: knob.width * ks,
            height: knob.height * ks,
            transform: [{ translateX }],
          },
        ]}
      >
        <Image source={knob.source} style={StyleSheet.absoluteFill} resizeMode="stretch" />
        <Text style={[styles.knobLabel, { fontSize: 82 * ks }]}>{on ? 'ON' : 'OFF'}</Text>
      </Animated.View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  hit: {
    position: 'absolute',
  },
  knob: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  knobLabel: {
    fontFamily: theme.fontFamily,
    letterSpacing: 1,
    color: spriteColors.inkOnGold,
  },
})
