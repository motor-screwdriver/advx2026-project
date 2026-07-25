import React, { useEffect, useRef } from 'react'
import { Animated, Image, StyleSheet } from 'react-native'

import { DESIGN } from '../../assets/manifest'
import { useReducedMotion } from './useReducedMotion'

/**
 * "SETTINGS" header — the actual title slice from the reference sprite
 * (gold pixel lettering, crescent moons and star sparkles baked in),
 * entering with a spring-scale pop and a gentle idle glow pulse.
 */
export function SettingsHeader({ k }: { k: number }) {
  const reduced = useReducedMotion()
  const scale = useRef(new Animated.Value(reduced ? 1 : 0.85)).current
  const opacity = useRef(new Animated.Value(reduced ? 1 : 0)).current
  useEffect(() => {
    if (reduced) {
      return
    }
    const enter = Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 260, useNativeDriver: true }),
    ])
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.88, duration: 1600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 1600, useNativeDriver: true }),
      ]),
    )
    enter.start(() => glow.start())
    return () => {
      enter.stop()
      glow.stop()
    }
  }, [scale, opacity, reduced])

  const entry = DESIGN.settings_header
  return (
    <Animated.View style={[styles.box, { opacity, transform: [{ scale }] }]}>
      <Image
        source={entry.source}
        style={{ width: entry.width * k, height: entry.height * k }}
        resizeMode="stretch"
      />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
  },
})
