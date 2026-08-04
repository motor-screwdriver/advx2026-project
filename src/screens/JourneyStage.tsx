import React from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import type { HeroType } from '../contracts/types'
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
  hero,
  onWake,
}: {
  hp: number
  xp: number
  level: number
  hero: HeroType
  onWake: () => void
}) {
  const go = useScreenTransition()
  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.hud}>
          <JourneyTopHud hp={hp} xp={xp} level={level} rightAccessory={<HomeNav />} />
        </View>
        <View style={styles.carousel}>
          <JourneyCarousel hero={hero} />
        </View>
        <View style={styles.hud}>
          <JourneyDock
            onWake={onWake}
            onBag={() => go('/inventory')}
            onSettings={() => go('/settings')}
          />
        </View>
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
  },
  // The panels sit on top and the viewport runs a hair under both of them, so
  // the carousel is never separated from the HUD by a seam of background.
  hud: { zIndex: 1 },
  carousel: { flex: 1, marginVertical: -2 },
})
