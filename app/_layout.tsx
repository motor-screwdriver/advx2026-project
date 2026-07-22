import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

import { useGameFonts } from '../src/ui/fonts';
import { theme } from '../src/ui/theme';
import { GameProvider } from '../src/ui/useGame';

export default function RootLayout() {
  const fontsReady = useGameFonts();
  if (!fontsReady) {
    return null;
  }
  return (
    <GameProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.bg },
        }}
      />
    </GameProvider>
  );
}
