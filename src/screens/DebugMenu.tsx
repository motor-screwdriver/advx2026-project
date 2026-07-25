import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { FLAGS } from '../contracts/flags'
import { useGameStore } from '../state/store'
import { demoCheckIns, type DemoNightKind } from '../systems/demoNights'
import { PixelButton } from '../ui/PixelButton'
import { useScreenTransition } from '../ui/screenTransition'
import { strings } from '../ui/strings'
import { theme } from '../ui/theme'
import { useGame, type DebugPreset } from '../ui/useGame'

interface DebugRoute {
  href: string
  label: string
}

const ROUTES: DebugRoute[] = [
  { href: '/onboarding', label: strings.onboarding_title },
  { href: '/hero-ceremony', label: strings.ceremony_begin },
  { href: '/morning-scene', label: strings.morning_title },
  { href: '/death', label: strings.death_title },
  { href: '/resurrection', label: strings.soul_title },
  { href: '/mosaic', label: strings.mosaic_title },
  { href: '/chest', label: strings.chest_title },
  { href: '/inventory', label: strings.inventory_title },
  { href: '/heroes', label: strings.heroes_title },
  { href: '/tutorial', label: strings.tutorial_title },
  { href: '/settings', label: strings.settings_title },
]

const PRESETS: { preset: DebugPreset; label: string }[] = [
  { preset: 'empty', label: strings.debug_empty },
  { preset: 'mid', label: strings.debug_mid },
  { preset: 'death', label: strings.debug_death },
]

const NIGHT_SIMS: { kind: DemoNightKind; label: string }[] = [
  { kind: 'bad', label: 'Bad Night (-1 HP)' },
  { kind: 'terrible', label: 'Terrible (-2 HP)' },
]

/** Temporary M0-M1 navigation + state presets. Removed before release. */
export function DebugMenu() {
  const go = useScreenTransition()
  const { loadDebugPreset } = useGame()
  const routes = FLAGS.artGallery
    ? [...ROUTES, { href: '/art-gallery', label: strings.gallery_title }]
    : ROUTES
  return (
    <View style={styles.menu}>
      <Text style={styles.heading}>{strings.debug_title}</Text>
      <View style={styles.grid}>
        {routes.map((route) => (
          <PixelButton
            key={route.href}
            compact
            label={route.label}
            onPress={() => go(route.href)}
          />
        ))}
      </View>
      <Text style={styles.heading}>{strings.debug_presets}</Text>
      <View style={styles.grid}>
        {PRESETS.map(({ preset, label }) => (
          <PixelButton key={preset} compact label={label} onPress={() => loadDebugPreset(preset)} />
        ))}
      </View>
      <Text style={styles.heading}>SIMULATE NIGHT</Text>
      <View style={styles.grid}>
        {NIGHT_SIMS.map(({ kind, label }) => (
          <PixelButton key={kind} compact label={label} onPress={() => simulateNight(kind)} />
        ))}
      </View>
    </View>
  )
}

/** Run a scripted night through the real engine — HP changes, streak breaks. */
function simulateNight(kind: DemoNightKind): void {
  const s = useGameStore.getState()
  if (!s.game.window) return
  const { bedTime, wakeTime } = demoCheckIns(s.game.window, kind)
  s.checkIn('bed', bedTime)
  s.checkIn('wake', wakeTime)
  s.evaluateCurrentNight()
}

const styles = StyleSheet.create({
  menu: { gap: theme.spacing(2) },
  heading: {
    ...theme.type.label,
    color: theme.colors.textDim,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing(2),
  },
})
