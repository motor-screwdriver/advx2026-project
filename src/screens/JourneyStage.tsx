import React from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { JourneyCarousel } from '../ui/journey/JourneyCarousel'
import { JourneyDock } from '../ui/journey/JourneyDock'
import { JourneyTopHud } from '../ui/journey/JourneyTopHud'
import { useScreenTransition } from '../ui/screenTransition'
import { theme } from '../ui/theme'
import { HomeNav } from './HomeNav'

/**
 * The whole night-journey screen shown while the hero sleeps: HUD panel on
 * top (hearts, LV, XP), the scrolling forest carousel in the middle and the
 * dock (WAKE UP / BAG / gear) at the bottom. Navigation lives here so the
 * journey UI components stay pure.
 */
export function JourneyStage({
  hp,
  xp,
  level,
  onWake,
}: {
  hp: number
  xp: number
  level: number
  onWake: () => void
}) {
  const go = useScreenTransition()
  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <JourneyTopHud hp={hp} xp={xp} level={level} rightAccessory={<HomeNav />} />
        <JourneyCarousel />
        <JourneyDock
          onWake={onWake}
          onBag={() => go('/inventory')}
          onSettings={() => go('/settings')}
        />
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  // Near-black edge color of the journey art set, so the letterboxing around
  // the panels melts into the carousel viewport.
  root: { flex: 1, backgroundColor: '#030304' },
  safe: {
    flex: 1,
    padding: theme.screenPad,
    gap: theme.screenPad,
  },
})
