import { PixelifySans_700Bold } from '@expo-google-fonts/pixelify-sans'
import { useFonts } from 'expo-font'

import { GAME_FONT } from './theme'

/**
 * Loads the single unified pixel font (Pixelify Sans Bold — a chunky bold
 * pixel face with Latin + Cyrillic coverage) used for every text in the app.
 * Returns true once loading finished OR failed — on failure the app
 * proceeds with the system font (graceful degradation, NFR-15).
 */
export function useGameFonts(): boolean {
  const [loaded, error] = useFonts({
    [GAME_FONT]: PixelifySans_700Bold,
  })
  return loaded || error !== null
}
