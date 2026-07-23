/**
 * Floating demo panel (P0). Mounted once by SystemsLayer; visible only while
 * `demoMode === true` (hidden 5-tap gesture in Settings — never accidental).
 * [PERFECT] [BAD] [DEATH] run real simulated nights through the store;
 * [RESET] restores the pre-demo snapshot. Booth judges see the true flow.
 */
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { useGameStore } from '../state/store'
import { PixelButton } from '../ui/PixelButton'
import { theme } from '../ui/theme'
import { resetDemo, runDemoNight } from './demoMode'

export function DemoPanel() {
  const demoMode = useGameStore((s) => s.game.demoMode)
  if (!demoMode) {
    return null
  }
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.panel}>
        <Text style={styles.caption}>DEMO</Text>
        <View style={styles.row}>
          <PixelButton compact label="PERFECT" onPress={() => runDemoNight('perfect')} />
          <PixelButton compact label="BAD" onPress={() => runDemoNight('bad')} />
          <PixelButton compact label="DEATH" onPress={() => runDemoNight('death')} />
          <PixelButton compact label="RESET" onPress={resetDemo} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: theme.spacing(6),
    alignItems: 'center',
    zIndex: 100,
    elevation: 10,
  },
  panel: {
    backgroundColor: theme.colors.panel,
    borderWidth: theme.borderWidth,
    borderColor: theme.colors.outline,
    borderTopColor: theme.colors.bevelLight,
    borderRadius: theme.borderRadius,
    padding: theme.spacing(2),
    gap: theme.spacing(1),
  },
  caption: {
    ...theme.type.label,
    color: theme.colors.heartFull,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing(2),
  },
})
