import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React from 'react'

import { useGameFonts } from '../src/ui/fonts'
import { TransitionProvider } from '../src/ui/screenTransition'
import { theme } from '../src/ui/theme'
import { GameProvider } from '../src/ui/useGame'

export default function RootLayout() {
  const fontsReady = useGameFonts()
  if (!fontsReady) {
    return null
  }
  return (
    <GameProvider>
      <TransitionProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            // Custom cloud wipe owns transitions; a Stack fade on top of it
            // double-composites and makes the curtain look like it's hitching.
            animation: 'none',
            contentStyle: { backgroundColor: theme.colors.bg },
          }}
        />
      </TransitionProvider>
    </GameProvider>
  )
}
