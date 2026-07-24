/**
 * Landing route for home-screen widget taps
 * (eightbitsleep://widget-action?action=sleep|wake). The 2x1 widget's halves
 * deep-link here; we perform the exact store actions the home dock button
 * would (single-writer store stays safe — headless taps never mutate state),
 * then replace to the screen that action reaches from Home. Renders a brief
 * splash while the persisted store rehydrates.
 */
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useRef } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { useGameStore } from '../state/store'
import { strings } from '../ui/strings'
import { theme } from '../ui/theme'

const MAX_HP = 7

export function WidgetActionScreen() {
  const router = useRouter()
  const { action } = useLocalSearchParams<{ action?: string }>()
  const hydrated = useGameStore((s) => s.hydrated)
  const handled = useRef(false)

  useEffect(() => {
    if (!hydrated || handled.current) {
      return
    }
    handled.current = true
    router.replace(resolveDestination(action))
  }, [hydrated, action, router])

  return (
    <View style={styles.root}>
      <Text style={styles.text}>{strings.appName}</Text>
    </View>
  )
}

/** Applies the tapped widget action; returns the route it lands on. */
function resolveDestination(action: string | undefined): string {
  const store = useGameStore.getState()
  const { game, pendingBedTime } = store
  if (!game.hero) {
    return '/' // no hero yet — home redirects into onboarding
  }
  if (action === 'sleep') {
    if (pendingBedTime === null) {
      store.checkIn('bed')
    }
    return '/'
  }
  if (action === 'wake') {
    if (pendingBedTime === null) {
      return '/' // not asleep — nothing to wake from
    }
    const hpBefore = game.hp
    store.checkIn('wake')
    const evaluation = store.evaluateCurrentNight()
    const hpAfter = Math.min(Math.max(hpBefore + evaluation.hpDelta, 0), MAX_HP)
    return hpAfter === 0 ? '/death' : '/morning-scene'
  }
  return '/'
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bg,
  },
  text: {
    ...theme.type.title,
    color: theme.colors.gold,
  },
})
